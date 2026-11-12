---
title: "Asynchronous Execution"
summary: "Асинхронный метод запускает медленную I/O-операцию и отпускает поток вместо ожидания: на await он встаёт на паузу и продолжается, когда результат готов."
tags: [async, concurrency, task, io-bound]
status: done
publish: false
created: 2026-07-11
---

> [!summary]
> Асинхронный метод запускает медленную операцию (запрос в базу, HTTP-вызов) и отпускает поток, вместо того чтобы ждать. На `await` метод встаёт на паузу и продолжается, когда результат готов.
> Так сервер обслуживает тысячи запросов на небольшом числе потоков. Это concurrency, а не parallelism: один вызов быстрее не становится, просто поток перестаёт стоять без дела.

## Blocking vs Async

**Зачем нужен `async`, если поток может синхронно дождаться ответа базы?**

Потому что ожидание занимает поток, а поток стоит дорого.

Заблокированный поток держит свой стек и место в Thread Pool. Документация `Thread` называет размер стека по умолчанию 1 MB, и потоки пула используют этот же размер. Запрос в базу идёт ~20 мс, и все 20 мс поток ничего не делает и не может взять другой запрос.

```csharp
// ❌ BAD: поток пула стоит все ~20 мс, пока база ищет заказ
public Order? GetOrder(int id) => _db.Orders.Find(id);

// ✅ GOOD: на время запроса поток возвращается в пул и обслуживает другие запросы
public async Task<Order?> GetOrderAsync(int id, CancellationToken ct)
    => await _db.Orders.FindAsync(new object[] { id }, ct);
```

Под нагрузкой каждый запрос блокирует свой поток на I/O. Свободные потоки в пуле кончаются, и новые запросы ждут в очереди. Это thread-pool starvation, подробно в [[Thread Pool Starvation]].

`async` даёт throughput и отзывчивость, а не скорость одного вызова: запрос всё так же идёт 20 мс, просто поток в это время работает на других. Async расползается по цепочке вызовов: стал асинхронным репозиторий — станут `async` и сервис, и контроллер, а если где-то в цепочке вернуться к синхронному коду через `.Result`, получится deadlock или starvation.

## I/O-bound vs CPU-bound

**Ускоряет ли `async` CPU-bound код, например расчёт скидки?**

Нет. Всё решает один вопрос: пока операция идёт, работает ли какой-то поток?

- **I/O-bound** (база, HTTP, диск). Работу делает устройство или удалённый сервер. Асинхронный I/O большую часть операции не привязан к потоку. ОС сообщает о завершении (на Windows для этого есть механизм I/O completion ports), и метод продолжается — в UI-приложении на UI-потоке, иначе обычно на потоке пула.
- **CPU-bound** (хеширование, генерация PDF, тяжёлый LINQ). Работу делает сам поток. Здесь `async` ничего не меняет.

Частый миф: «`async` запускает метод в другом потоке». Нет. Асинхронный метод выполняется синхронно, на вызывающем потоке, до первого `await` незавершённой задачи. В расчёте скидки нет ни одного `await`, и он целиком пройдёт синхронно.

```csharp
// ❌ BAD: async без await. Метод всё равно синхронный, плюс лишняя state machine
public async Task<decimal> CalculateDiscountAsync(Order order)
    => order.Lines.Sum(l => l.Price * l.Quantity * _rates.For(l.ProductId));

// ✅ GOOD: честный синхронный метод
public decimal CalculateDiscount(Order order)
    => order.Lines.Sum(l => l.Price * l.Quantity * _rates.For(l.ProductId));
```

`Task.Run` отдаёт CPU-работу потоку пула. В WPF-бэкофисе это полезно: `await Task.Run(() => _pricing.CalculateDiscount(order))` в обработчике кнопки уносит расчёт с UI-потока, и окно не замерзает. В ASP.NET Core `await Task.Run(...)` внутри запроса бесполезен: код и так работает на потоке пула, а `Task.Run` добавляет лишнее планирование и не спасает от блокировки.

## How await Works

**Что происходит с потоком, когда выполнение доходит до `await`?**

Если задача ещё не готова, поток возвращается вызывающему коду. Метод встаёт на паузу и продолжится позже, возможно, на другом потоке.

Три термина. **Continuation** — остаток метода после `await`, который надо вызвать, когда задача завершится. **Awaiter** — объект-посредник, который `await` получает от задачи через `GetAwaiter()`; у него три члена: `IsCompleted` (готово ли), `OnCompleted` (оставить делегат на потом) и `GetResult()` (забрать результат или исключение). **State machine** — то, во что компилятор превращает async-метод: параметры и локальные переменные, которые нужны после `await`, становятся полями, тело переезжает в `MoveNext()`, а поле `state` помнит, на каком `await` метод остановился.

1. Метод выполняется синхронно до первого `await`.
2. `await` берёт у задачи awaiter (`GetAwaiter()`) и читает `IsCompleted`.
3. `IsCompleted == true`: паузы нет. `GetResult()` сразу отдаёт значение, метод идёт дальше на том же потоке.
4. `IsCompleted == false`: метод записывает в `state`, на каком `await` остановился, и через `OnCompleted` отдаёт задаче делегат «когда завершишься — вызови мой `MoveNext()`». Задача хранит этот делегат у себя. При первой паузе метод возвращает вызывающему незавершённый `Task`; при следующих `MoveNext()` просто выходит. Поток свободен.
5. **Кто будит метод.** У задачи есть «хозяин» — код, который её создал и обязан её завершить. Для HTTP-запроса это `HttpClient` и сетевой слой .NET под ним: ОС сообщает .NET о завершении I/O (на Windows — механизмом I/O completion ports), и .NET кладёт результат в задачу. Если задачу вернул другой async-метод, её хозяин — этот метод: дойдя до `return`, он завершает свою задачу, и это будит того, кто её ждёт. Так пробуждение идёт по цепочке снизу вверх, от `HttpClient` до контроллера. Завершаясь, задача запускает сохранённый делегат. Если при паузе был `SynchronizationContext` (UI), делегат не выполняется сразу, а отправляется через `Post` на UI-поток. Иначе он выполняется сразу, обычно на том потоке, где завершилась операция. Никто не опрашивает задачу в цикле «готово или нет».
6. `MoveNext()` читает `state` и прыгает сразу за `await`. `GetResult()` отдаёт значение или пробрасывает исключение задачи.

```csharp
public async Task<decimal> GetOrderTotalAsync(int orderId)
{
    Order order = await _orders.GetAsync(orderId);
    return order.Lines.Sum(l => l.Price * l.Quantity);
}

// Упрощённо: что компилятор делает из метода выше (builder и SetResult опущены)
private struct GetOrderTotalStateMachine
{
    public int state;                       // -1: метод выполняется, 0: стоит на паузе у await заказа
    public int orderId;                     // параметр стал полем
    public OrderService self;               // this стал полем: через него доступен _orders
    private TaskAwaiter<Order> awaiter;     // поле, чтобы пережить паузу
    public void MoveNext()
    {
        if (state == 0) goto Resume;
        // Первый вызов: идём синхронно до await.
        awaiter = self._orders.GetAsync(orderId).GetAwaiter();
        if (!awaiter.IsCompleted)
        {
            state = 0;   // при пробуждении сразу перейти к Resume
            // подписываемся на завершение: «вызови MoveNext ещё раз»
            return;      // поток свободен, у вызывающего незавершённый Task
        }
    Resume:
        // Пробуждение (или задача была готова сразу).
        Order order = awaiter.GetResult();   // заказ или исключение задачи
        // ...считаем сумму и кладём её в Task, который держит вызывающий
    }
}
```

**Key points**
- State machine — `struct` в Release и `class` в Debug. Если метод завершился без паузы, она не покидает стек; при первой настоящей паузе переезжает в кучу.
- Builders и полный awaiter pattern — в [[Async State Machine]].

## Return Types

**Какой тип возвращать из async-метода: `Task`, `ValueTask` или `void`?**

По умолчанию `Task` или `Task<T>`, остальное — для особых случаев. `Task<T>` — обещание результата. Задача заканчивается одним из трёх финальных состояний, подробно — в [[Task and TaskScheduler]]:
- `RanToCompletion` — метод дошёл до `return` или до конца тела;
- `Faulted` — из метода вылетело необработанное исключение;
- `Canceled` — необработанным исключением было `OperationCanceledException` (или наследник).

| Тип | Когда | Цена | Риск |
|---|---|---|---|
| `Task<T>` | по умолчанию | объект в куче почти на каждый вызов, даже без паузы (готовые задачи кэшируются лишь для немногих значений: `true`/`false`, несколько малых `int`) | почти никакого |
| `ValueTask<T>` | горячий путь (код, который вызывается очень часто), обычно завершается синхронно (cache hit) | `struct`, готовый результат без `Task`; копирует больше данных, чем одна ссылка на `Task` | строгие правила использования |
| `async void` | только обработчики событий | — | не дождаться, не поймать исключение |
| `IAsyncEnumerable<T>` | элементы приходят порциями со временем | async iterator | — |

**`ValueTask<T>`** — `readonly struct`. Если цена товара уже в кэше, метод кладёт её прямо в struct, и `Task` в куче не создаётся:

```csharp
public ValueTask<decimal> GetPriceAsync(int productId, CancellationToken ct)
    => _prices.TryGetValue(productId, out decimal price)
        ? new ValueTask<decimal>(price)                          // cache hit: без Task
        : new ValueTask<decimal>(LoadPriceAsync(productId, ct)); // промах: обычный Task
```

Как `ValueTask` ломается. Кроме готового значения и `Task`, внутри `ValueTask` может лежать третий вариант — переиспользуемый объект-результат (`IValueTaskSource<T>`). Его используют высокопроизводительные API, чтобы не создавать новый объект на каждый вызов. Так устроен, например, `Socket`: у него один такой объект на приём и один на отправку. Что будет, если нарушить контракт:
1. Ты вызвал `socket.ReceiveAsync`, получил `ValueTask<int>`, сделал `await` и прочитал 100 байт.
2. Как только `await` забрал результат (`GetResult()`), сокет считает объект свободным, и следующий `ReceiveAsync` пишет в этот же объект свой результат.
3. Ты делаешь `await` на старом `ValueTask` ещё раз и читаешь результат чужого вызова — или получаешь исключение.

С `Task` такого нет: задачу не переиспользуют под другую операцию, и завершённая задача навсегда хранит свой результат.

```csharp
// ❌ BAD: ValueTask сохранили и ждём дважды. После первого await объект уже обслуживает следующий ReceiveAsync
ValueTask<int> pending = _socket.ReceiveAsync(buffer, SocketFlags.None, ct);
int read = await pending;
int again = await pending;   // результат не определён

// ✅ GOOD: await сразу в месте вызова, ValueTask в переменной не храним
int received = await _socket.ReceiveAsync(buffer, SocketFlags.None, ct);
```

| С `ValueTask` можно | Нельзя (результат не определён) |
|---|---|
| один раз `await` | второй `await` или два `await` из разных мест одновременно |
| один раз `.AsTask()` — например, чтобы передать в `Task.WhenAll` (перегрузок для `ValueTask` у него нет) | смешивать способы: `await`, а потом `.AsTask()` или `.Result` |
| один раз прочитать `.Result`, если `IsCompleted == true`, — вместо `await` | читать `.Result` или `GetAwaiter().GetResult()` до завершения: в отличие от `Task`, `ValueTask` не обязан уметь блокировать поток до завершения операции |

Для метода без результата по умолчанию берут `Task`: синхронное завершение и так обходится без аллокации (`Task.CompletedTask`), поэтому `ValueTask` выигрывает только с переиспользуемым объектом и только если профилирование это оправдало. Подробно — в [[ValueTask]].

**`async void`** — только для обработчиков событий, где сигнатуру диктует событие. У такого метода нет `Task`: вызывающий не может его дождаться и не поймает его исключение. Исключение поднимается прямо в `SynchronizationContext`, активный на старте метода, и приложение, скорее всего, упадёт. Поэтому `await` внутри такого обработчика оборачивают в `try/catch`.

**`IAsyncEnumerable<T>`** — async stream: элементы приходят порциями, вызывающий перебирает их через `await foreach`. В EF Core его возвращает `AsAsyncEnumerable()`. Подробно — в [[Async Streams]].

## Composition

**Как выполнить три независимых запроса по 100 мс за ~100 мс, а не за 300?**

Сначала запустить все задачи, потом ждать. `Task.WhenAll` завершается, когда завершились все переданные задачи. Итог — примерно самый долгий запрос, а не сумма. Ждать только через `await`: `Task.WaitAll`, `.Result` и `.Wait()` блокируют поток.

```csharp
// ❌ BAD: три await подряд, ~100 + ~100 + ~100 мс
bool fraudOk = await _fraud.CheckAsync(order, ct);
bool inStock = await _inventory.CheckStockAsync(order, ct);
decimal shipping = await _shipping.QuoteAsync(order, ct);

// ✅ GOOD: все три запроса уже в полёте, ждём самый долгий
Task<bool> fraud = _fraud.CheckAsync(order, ct);
Task<bool> stock = _inventory.CheckStockAsync(order, ct);
Task<decimal> quote = _shipping.QuoteAsync(order, ct);
Task all = Task.WhenAll(fraud, stock, quote);
try { await all; }
catch { _logger.LogError(all.Exception, "Checkout checks failed for {OrderId}", order.Id); throw; }
bool fraudOk = await fraud;   // уже завершена: не блокирует, берёт результат
```

Если упали две задачи, `await` бросит только одно исключение — первое из `InnerExceptions`. Все они лежат в `all.Exception` в виде `AggregateException`. Поэтому задачу от `WhenAll` сохраняют в переменную.

`Task.WhenAny` возвращает `Task<Task>`, который завершается вместе с первой готовой задачей. Сам он не бросает: его задача всегда `RanToCompletion`, даже если первая упала. Чтобы получить результат или исключение, await-ят саму победившую задачу. Остальные задачи продолжают работать, и отменить их нужно самому, через `CancellationToken`.

Обратная крайность — неограниченный fan-out, то есть запуск сразу всех задач без лимита. Письма 10 000 покупателям через один `WhenAll` — это 10 000 одновременных запросов к почтовому сервису. Ограничь параллелизм: `Parallel.ForEachAsync` (.NET 6+) с `MaxDegreeOfParallelism` или `SemaphoreSlim`. `Parallel.ForEachAsync` без `ParallelOptions` выполняет не больше `Environment.ProcessorCount` операций одновременно.

```csharp
var options = new ParallelOptions { MaxDegreeOfParallelism = 10 };   // не больше 10 писем сразу
await Parallel.ForEachAsync(customers, options, async (customer, token) =>
    await _emailSender.SendOrderConfirmationAsync(customer, token));
```

EF Core не поддерживает параллельные операции на одном `DbContext`, включая параллельные async-запросы. Если EF Core это заметит, бросит `InvalidOperationException` («A second operation started on this context...»). Если не заметит — undefined behaviour, падения и порча данных. Два параллельных запроса к базе — это два разных `DbContext`.

## Cancellation

**Что происходит с запросом на сервере, если клиент закрыл вкладку?**

Если отмену никто не передал, запрос продолжает работать до конца. Пользователь пять раз перезагрузил страницу отчёта по заказам. Без отмены сервер пять раз строит один и тот же тяжёлый отчёт, и четыре из них никто не увидит.

Отмена в .NET кооперативная. Убить работающий метод снаружи нельзя: `Thread.Abort` на .NET Core и .NET 5+ бросает `PlatformNotSupportedException`. Метод сам соглашается остановиться: он принимает `CancellationToken` и передаёт его дальше, в EF Core и `HttpClient`.

Сам токен ничего не прерывает. I/O-методы проверяют его внутри, а в CPU-цикле метод проверяет его сам:

```csharp
foreach (Order order in orders)
{
    ct.ThrowIfCancellationRequested();   // бросит OperationCanceledException, если клиент ушёл
    report.Add(Summarize(order));
}
```

В ASP.NET Core токен запроса — `HttpContext.RequestAborted`. Он срабатывает, когда обрывается соединение, по которому пришёл запрос. Параметр `CancellationToken` привязывается к нему сам — и в minimal API, и у action контроллера.

```csharp
app.MapGet("/reports/orders", async (DateOnly from, OrderReportService reports, CancellationToken ct) =>
    Results.Ok(await reports.BuildAsync(from, ct)));   // ct — это HttpContext.RequestAborted

// Таймаут 5 с на платёж поверх токена запроса
public async Task<PaymentResult> ChargeAsync(Payment payment, CancellationToken requestCt)
{
    using var cts = CancellationTokenSource.CreateLinkedTokenSource(requestCt);
    cts.CancelAfter(TimeSpan.FromSeconds(5));
    return await _paymentGateway.ChargeAsync(payment, cts.Token);
}
```

Связанный источник отменяется, когда отменён любой из исходных токенов. `CancelAfter` запускает отсчёт прямо в момент вызова. `CancellationTokenSource` — `IDisposable`, отсюда `using`. У самого `HttpClient.Timeout` по умолчанию 100 секунд, и из двух таймаутов срабатывает меньший.

Чем заканчивается отмена:
- Код, который ждал отменённую задачу, получает `OperationCanceledException` или его наследника (`TaskCanceledException`), поэтому ловят базовый тип. Задача метода, из которого оно вылетело, становится `Canceled`, а не `Faulted`.
- `HttpClient` и при отмене токена, и по таймауту бросает `OperationCanceledException`; на .NET 5+ при таймауте внутри лежит `TimeoutException`.
- Причину различают по токену: `catch (OperationCanceledException) when (requestCt.IsCancellationRequested)` — ушёл клиент, это не error. Иначе сработал свой таймаут 5 с: шлюз не ответил, и это настоящий сбой.

Подробно — в [[CancellationToken]].

## Context and ConfigureAwait

**Почему `.Result` приводит к deadlock в WPF, но не в ASP.NET Core?**

Сначала два термина. **UI thread** — единственный поток GUI-приложения, которому можно трогать контролы. **`SynchronizationContext`** — объект, который умеет отправить кусок кода обратно в «свой» поток; в GUI-приложении он пропускает только один кусок кода за раз. У WPF и WinForms свой `SynchronizationContext`: его `Post` отправляет делегат на UI-поток.

`await` по умолчанию смотрит на `SynchronizationContext.Current` и `TaskScheduler.Current`. Если контекст был, метод продолжится в нём, через `Post`. Поэтому после `await` в обработчике кнопки можно обновить `TextBlock`: код вернулся на UI-поток.

Deadlock по шагам:
1. `RefundButton_Click` на UI-потоке вызывает `RefundAsync(...)`. Метод доходит до `await` HTTP-запроса, запоминает UI-контекст и возвращает незавершённый `Task`.
2. Обработчик вызывает `.Result` и блокирует UI-поток.
3. HTTP-запрос завершается. Continuation ставится в очередь контекста, то есть на UI-поток.
4. UI-поток ждёт `.Result`, continuation ждёт UI-поток. Оба ждут друг друга вечно.

```csharp
// ❌ BAD: UI-поток заблокирован, а continuation внутри RefundAsync ждёт именно его
private void RefundButton_Click(object sender, RoutedEventArgs e)
    => StatusText.Text = _paymentClient.RefundAsync(_orderId).Result.Message;

// ✅ GOOD: async void допустим в обработчике; после await мы снова на UI-потоке
private async void RefundButton_Click(object sender, RoutedEventArgs e)
    => StatusText.Text = (await _paymentClient.RefundAsync(_orderId)).Message;
```

`GetAwaiter().GetResult()` не спасает. `.Result` заворачивает исключение в `AggregateException`, `GetAwaiter().GetResult()` бросает исходное. Но оба блокируют поток и оба дают тот же deadlock.

В классическом ASP.NET на .NET Framework свой `SynchronizationContext` был, в ASP.NET Core его нет. Continuation идёт на любой свободный поток пула, и deadlock-а нет. Но заблокированный поток пула под нагрузкой ведёт к starvation (см. In Production).

`ConfigureAwait(false)` значит «не возвращайся в захваченный контекст». Он гарантирует только, что continuation не поставят в очередь исходного контекста; если задача уже была готова, код после него останется на том же потоке. Правило: в коде приложения его не пишут, в библиотеке общего назначения пишут. Поэтому общая библиотека `PaymentClient`, которую зовут и из WPF, и из ASP.NET Core, пишет `await _http.PostAsync("refunds", content, ct).ConfigureAwait(false)`. Deadlock из примера выше `ConfigureAwait(false)` убирает, только если стоит на каждом `await` по цепочке: любой `await` без него снова вернёт continuation в UI-контекст. Это смягчение, а лечится deadlock отказом от `.Result`.

После `ConfigureAwait(false)` в UI-коде контролы трогать нельзя: метод может оказаться не на UI-потоке. А `ExecutionContext` (контейнер ambient-данных, например значений `AsyncLocal<T>`, который едет вместе с continuation) течёт через `await` всегда, с `ConfigureAwait(false)` или без. Подробно — в [[SynchronizationContext and ConfigureAwait]].

## Pitfalls & Trade-offs

1. **Sync over async** — синхронное ожидание асинхронного метода через `.Result`, `.Wait()` или `GetAwaiter().GetResult()`. В WPF и классическом ASP.NET это deadlock: заблокированный поток нужен continuation-у, чтобы продолжить метод (разбор — в Context and ConfigureAwait). В ASP.NET Core deadlock-а нет, но каждый такой вызов держит поток пула, и под нагрузкой свободные потоки кончаются. Это starvation, пример — в In Production. Исправление — сделать асинхронной всю цепочку вызовов, до контроллера.
2. **`async void` вне обработчиков событий.** Вызывающий не может дождаться такого метода и не поймает его исключение, поэтому приложение, скорее всего, упадёт. Исправление — возвращать `Task`.
   ```csharp
   public async void SendConfirmation(Order order) => await _emailSender.SendAsync(order);   // ❌
   ```
3. **Fire-and-forget в запросе.**
   ```csharp
   _ = SendConfirmationAsync(order.Id);   // ❌ внутри читает заказ через scoped _db
   return Ok(order.Id);
   ```
   Ответ уходит клиенту, request scope закрывается, и DI уничтожает scoped `DbContext`. Когда `SendConfirmationAsync` после своего `await` снова обратится к базе, он получит `ObjectDisposedException`. `HttpContext` к этому времени тоже переиспользован. Эту задачу никто не ждёт, поэтому исключение никто не поймает. Runtime сообщит о нём через событие `TaskScheduler.UnobservedTaskException`, но при финализации, то есть недетерминированно и слишком поздно. Исправление — дождаться задачи через `await` или положить работу в очередь, которую разбирает `BackgroundService` в собственном scope.
4. **Неограниченный `WhenAll` и один `DbContext` на параллельные запросы.** Тысячи одновременных задач перегружают внешний сервис, а общий `DbContext` может испортить данные. Исправление — ограничить параллелизм через `Parallel.ForEachAsync` и дать каждой параллельной операции свой `DbContext`.
5. **Fake async.** `await Task.Run(() => _db.Orders.Find(id))` в ASP.NET Core только меняет один поток пула на другой: синхронный `Find` всё так же блокирует поток. Исправление — настоящий асинхронный `FindAsync`.
6. **Trade-offs.**
   - Async покупает throughput ценой state machine и аллокации `Task` на вызов.
   - `ValueTask` покупает готовый результат без `Task` ценой строгих правил.
   - `ConfigureAwait(false)` покупает библиотеке защиту от deadlock, когда вызывающий блокирует поток через `.Result`, ценой доступа к UI после `await`.

## In Production

Распродажа, checkout на ASP.NET Core. Глубоко внутри `OrderService` сидит синхронный платёжный клиент:

```csharp
// ❌ BAD: каждый checkout держит поток пула, пока платёжный шлюз отвечает
public PaymentResult Charge(Payment payment)
{
    HttpResponseMessage response = _http.PostAsync("charges", ToJson(payment)).Result;
    return response.IsSuccessStatusCode ? PaymentResult.Approved : PaymentResult.Declined;
}

// ✅ GOOD: async до самого контроллера, токен запроса передан до HttpClient
public async Task<PaymentResult> ChargeAsync(Payment payment, CancellationToken ct)
{
    using HttpResponseMessage response = await _http.PostAsync("charges", ToJson(payment), ct);
    return response.IsSuccessStatusCode ? PaymentResult.Approved : PaymentResult.Declined;
}
// OrdersController: await _orderService.PlaceOrderAsync(request, HttpContext.RequestAborted);
```

Симптом (цифры условные): при ~20 запросах в секунду (RPS) всё хорошо, а при ~300 RPS p99 растёт с ~100 мс до нескольких секунд. **p99** — время ответа, в которое укладываются 99% запросов; оставшийся 1% медленнее. CPU при этом низкий. `dotnet-counters monitor` показывает рост `dotnet.thread_pool.queue.length` и `dotnet.thread_pool.thread.count`; на .NET 8 и ниже — `threadpool-queue-length` и `threadpool-thread-count`. Медленный рост числа потоков при CPU намного ниже 100% — главный признак starvation. Почему пул не спасает себя сам, добавив потоки, — в [[Thread Pool Starvation]].

## Questions

> [!qard]- Блокирует ли `await` поток? Что с ним происходит?
> Нет. Если задача не готова, метод сохраняет `state`, отдаёт задаче continuation через `OnCompleted` и возвращает вызывающему незавершённый `Task`. Поток возвращается вызывающему коду — в пул или на UI-поток.
> Когда операция завершится, задача сама вызовет continuation, и `MoveNext` продолжит метод: в захваченном `SynchronizationContext`, если он был, иначе обычно на потоке пула. Если задача уже готова, паузы нет вообще.

> [!qard]- Почему `.Result` вешает WPF или классический ASP.NET, но не ASP.NET Core — и почему в Core его всё равно нельзя?
> В GUI и классическом ASP.NET есть `SynchronizationContext`, который пропускает один кусок кода за раз. `.Result` блокирует этот поток, а continuation стоит в очереди того же контекста, и они ждут друг друга. В ASP.NET Core контекста нет, continuation идёт на свободный поток пула.
> Но заблокированный поток пула под нагрузкой ведёт к starvation и росту времени ответа. `GetAwaiter().GetResult()` блокирует так же, меняется только форма исключения.

> [!qard]- Метод пересчитывает цены в цикле. Поможет ли `async`? Когда нужен `Task.Run`?
> Нет. Метод без `await` выполняется синхронно на вызывающем потоке, `async` добавит только state machine.
> `Task.Run` переносит CPU-работу на поток пула: в WPF это спасает UI-поток от зависания. В ASP.NET Core `await Task.Run(...)` в запросе ничего не даёт, код уже на потоке пула.

> [!qard]- Почему `async void` опасен и где он допустим?
> У него нет `Task`: вызывающий не может его дождаться и не поймает исключение. Исключение поднимается в `SynchronizationContext`, активный на старте метода, и приложение, скорее всего, упадёт.
> Допустим только в обработчиках событий, где сигнатуру задаёт событие. Внутри такого обработчика `await` оборачивают в `try/catch`.

> [!qard]- `Task<T>` или `ValueTask<T>` — как выбрать и чем рискуешь?
> По умолчанию `Task<T>`. `ValueTask<T>` — struct, он выгоден на горячем пути, который обычно завершается синхронно: cache hit не создаёт `Task` в куче, а `Task<decimal>` создал бы объект даже при синхронном завершении.
> Цена — правила, потому что внутри `ValueTask` может быть переиспользуемый объект: await один раз, не читать результат до завершения, для остального один раз вызвать `.AsTask()`. Нарушение даёт неопределённый результат. И struct с несколькими полями копирует больше данных, чем одна ссылка на `Task`.

> [!qard]- Две задачи в `Task.WhenAll` упали. Какое исключение увидит `await`, и как получить все?
> `await` пробросит одно исключение — первое из `InnerExceptions`. `WhenAll` не прерывается на первой ошибке: он ждёт все задачи.
> Все исключения лежат в `Exception` его задачи как `AggregateException`. Поэтому задачу от `WhenAll` сохраняют в переменную и в `catch` читают `all.Exception.InnerExceptions`.

## Related

- [[Async State Machine]] — что генерирует компилятор: `MoveNext`, поле `state`, builders, awaiter pattern.
- [[Task and TaskScheduler]] — `Task` как обещание, его состояния, `TaskCompletionSource`, `Task.Run` и schedulers.
- [[ValueTask]] — результат без аллокации для обычно синхронных методов и правила использования.
- [[CancellationToken]] — кооперативная отмена: источники, связанные токены, таймауты.
- [[SynchronizationContext and ConfigureAwait]] — где продолжается метод, `ConfigureAwait(false)`, `ExecutionContext` и `AsyncLocal`.
- [[Async Streams]] — `IAsyncEnumerable<T>` и `await foreach`.
- [[Thread Pool Starvation]] — sync over async под нагрузкой: симптомы, диагностика, рост пула.
- [[Concurrency vs Parallelism]] — async это concurrency, а не parallelism.
- [[Threads and the Thread Pool]] — где на самом деле выполняются continuations.
- [[Locks and Synchronization]] — `await` внутри `lock` и `SemaphoreSlim` как асинхронный lock.
- [[Deadlocks]] — общая картина взаимных блокировок.

## References

- [Consuming the Task-based Asynchronous Pattern (.NET)](https://learn.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/consuming-the-task-based-asynchronous-pattern). Синхронный старт метода, где он продолжается, финальные состояния задачи, `WhenAll`.
- [Task-based Asynchronous Pattern (.NET)](https://learn.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap). Асинхронный I/O без потока, отмена.
- [Task exception handling (.NET)](https://learn.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-exception-handling). `.Result` против `GetAwaiter().GetResult()`, unobserved exceptions.
- [await operator (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/await) и [C# standard: await expressions](https://github.com/dotnet/csharpstandard/blob/standard-v7/standard/expressions.md). Порядок `GetAwaiter` → `IsCompleted` → `OnCompleted` → `GetResult`.
- [Async return types (C#)](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-return-types). `Task`, `ValueTask`, `async void`, async streams.
- [Understanding the Whys, Whats, and Whens of ValueTask (.NET blog)](https://devblogs.microsoft.com/dotnet/understanding-the-whys-whats-and-whens-of-valuetask/). Аллокация `Task<T>` при синхронном завершении и кэш готовых задач.
- [ValueTask API](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.valuetask) и [CA2012](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca2012). Правила использования `ValueTask`.
- [How Async/Await Really Works in C# (.NET blog)](https://devblogs.microsoft.com/dotnet/how-async-await-really-works/). State machine: struct в Release, class в Debug, аллокация при паузе.
- [ConfigureAwait FAQ (.NET blog)](https://devblogs.microsoft.com/dotnet/configureawait-faq/). Захват контекста, deadlock, `ExecutionContext`.
- [ASP.NET Core best practices](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/best-practices). Блокирующие вызовы, `Task.Run`, fire-and-forget и scoped-сервисы.
- [DbContext configuration (EF Core)](https://learn.microsoft.com/en-us/ef/core/dbcontext-configuration/). Параллельные операции на одном `DbContext`.
- [Efficient querying: buffering and streaming (EF Core)](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying#buffering-and-streaming). Построчная выдача `AsAsyncEnumerable()`.
- [Model binding: CancellationToken (ASP.NET Core)](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/model-binding). Привязка параметра action к `RequestAborted`.
- [HttpClient.SendAsync](https://learn.microsoft.com/en-us/dotnet/api/system.net.http.httpclient.sendasync) и [HttpClient.Timeout](https://learn.microsoft.com/en-us/dotnet/api/system.net.http.httpclient.timeout). Исключения при отмене и таймауте.
- [Debug ThreadPool starvation (.NET)](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/debug-threadpool-starvation) и [The managed thread pool](https://learn.microsoft.com/en-us/dotnet/standard/threading/the-managed-thread-pool). Симптомы starvation и рост пула.
- [dotnet-counters](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-counters). Счётчики Thread Pool.
- [Async/Await — Best Practices in Asynchronous Programming (MSDN Magazine, 2013)](https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming). Deadlock под GUI-контекстом и исключения `async void`.
