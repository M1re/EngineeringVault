---
title: "Multithreading"
summary: "Несколько потоков одного процесса работают над общей памятью: это даёт concurrency и parallelism, но требует защиты общего состояния от race conditions и deadlock-ов."
tags: [concurrency, multithreading, parallelism, thread-safety]
status: done
publish: false
created: 2026-11-12
---

> [!summary]
> Multithreading — несколько потоков внутри одного процесса, которые видят одну и ту же память. На нём стоят и concurrency (много задач «в работе» сразу), и parallelism (много задач выполняются в один момент на разных ядрах).
> Общая память — источник всех проблем: race conditions, deadlock-и, сломанные коллекции. Senior выбирает правильный инструмент (`async`, `Parallel`, `lock`, concurrent-коллекцию) и знает, что сломается без него.

## Concurrency vs Parallelism

**На одноядерной машине бывает concurrency? А parallelism?**

Concurrency — да, parallelism — нет. Rob Pike формулирует так: concurrency — это умение *иметь дело* со многими вещами сразу, parallelism — *делать* много вещей одновременно.

- **Concurrency** — несколько задач находятся «в работе» одновременно, а планировщик чередует их. На одном ядре они выполняются по очереди, кусочками.
- **Parallelism** — несколько задач выполняются в один и тот же момент на разных ядрах. Одновременно выполняется не больше потоков, чем в машине логических процессоров.

Аналогия: один повар, пока жарится яичница, режет хлеб для тоста, потом возвращается к сковороде. Это concurrency. Второй повар у второй плиты — parallelism.

Как это устроено на самом деле. ОС даёт потоку квант времени (time slice). Когда квант истёк, появился поток с более высоким приоритетом или поток сам ушёл ждать, ОС делает **context switch**: сохраняет контекст текущего потока (регистры процессора, включая указатель стека; сами стеки остаются в памяти), выбирает готовый поток с наивысшим приоритетом, восстанавливает его контекст и продолжает его. Так одно ядро создаёт эффект одновременной работы.

| | Concurrency | Parallelism |
|---|---|---|
| Нужно ядер | одно достаточно | минимум два |
| Решает | много ожиданий сразу (база, HTTP) | одно тяжёлое вычисление |
| Инструмент в .NET | `async` / `await` | `Parallel.For/ForEach`, PLINQ |
| Цена | координация доступа к общим данным | накладные расходы + последовательная часть работы |

**Multithreading** — механизм под обоими: несколько потоков в одном процессе. Все потоки процесса делят его адресное пространство и ресурсы. Два потока могут одновременно читать и писать одно поле — из-за этого существует вся остальная часть заметки.

Инструмент выбирают по одному вопросу: пока операция идёт, работает ли поток?
- **I/O-bound** (база, HTTP): поток просто ждёт. Нужна concurrency через `async`, подробно — в [[Async and Await|Asynchronous Execution]]. Так небольшой пул потоков обслуживает тысячи одновременных запросов к магазину.
- **CPU-bound** (расчёты, генерация отчёта): поток считает. Нужен parallelism — например, ночной пересчёт цен миллиона товаров раскладывают по ядрам.

## Threads and the Thread Pool

**Почему нельзя создать по потоку на каждый заказ — и чем `Task` отличается от `Thread`?**

Потому что поток ОС дорогой, а `Task` — это единица работы, которую выполнит уже готовый поток.

`new Thread(...)` создаёт поток ОС. У каждого потока свой стек: по умолчанию 1.5 MB на Windows и macOS и 8 MB на Linux. Создание потока дороже, чем выдача работы уже существующему, поэтому пул переиспользует потоки. А когда готовых к работе потоков больше, чем ядер, ОС тратит время на context switches между ними.

Поток из `new Thread` по умолчанию **foreground**, потоки пула — **background**. Процесс живёт, пока жив хотя бы один foreground-поток; когда они закончились, runtime останавливает background-потоки и завершает процесс.

**Thread Pool** — набор переиспользуемых потоков, один на процесс. Там выполняются `Task.Run`, задачи TPL, таймеры, завершения асинхронного I/O, а в ASP.NET Core — и продолжение метода после `await`. Пул создаёт потоки по требованию до минимума, дальше добавляет их постепенно; если все заняты, новая работа ждёт в очереди. Поэтому пачка блокирующих вызовов заставляет запросы стоять в очереди — это [[Thread Pool Starvation]].

| | `Thread` | `Task` |
|---|---|---|
| Что это | поток ОС | единица работы, обещание результата |
| Где выполняется | на своём потоке | по умолчанию на потоке пула |
| Результат и исключения | передавать вручную | `Task<T>` + `await`, исключение пробрасывается |
| Отмена | `Thread.Abort` на .NET 5+ бросает `PlatformNotSupportedException` | кооперативная, через `CancellationToken` (для `Thread` тоже работает) |
| Цена | свой стек и создание потока ОС | объект в куче, поток из пула |

В коде приложения работают с `Task`. Свой поток нужен, если работа надолго блокирует поток, нужен foreground-поток, особый приоритет, STA-поток (COM, UI) или стабильная identity потока. В TPL для этого есть `TaskCreationOptions.LongRunning`, но это только подсказка планировщику, что может понадобиться дополнительный поток.

```csharp
// ❌ BAD: 10 000 заказов = 10 000 потоков ОС, у каждого свой стек
foreach (Order order in pendingOrders)
    new Thread(() => _invoiceRenderer.RenderPdf(order)).Start();   // foreground: держит процесс живым

// ✅ GOOD: CPU-работа (рендер счетов в PDF) на переиспользуемых потоках пула
Parallel.ForEach(pendingOrders, order => _invoiceRenderer.RenderPdf(order));
```

Очереди пула, work-stealing и рост числа потоков — в [[Threads and the Thread Pool|Thread Pool]].

## Race Conditions

**Два потока одновременно резервируют последний товар на складе. Почему продаются оба?**

Потому что проверка остатка и списание — два отдельных шага, и между ними успевает влезть второй поток.

**Race condition** — результат зависит от того, в каком порядке потоки выполнили свои шаги. Возникает на **shared mutable state** — поле, которое читают и пишут несколько потоков. Две классические формы:
- **Read-modify-write.** `count++` — три шага: загрузить значение в регистр, увеличить, записать. Поток A прочитал и увеличил, но его вытеснили до записи. Поток B выполнил все три шага. A продолжил и перезаписал значение: увеличение от B потеряно.
- **Check-then-act.** «Если товар есть — списать». Оба потока проверили, оба увидели 1, оба списали.

```csharp
// ❌ BAD: проверка и списание не защищены
if (_stock[productId] > 0)   // Поток A прочитал 1. Поток B тоже прочитал 1.
{
    _stock[productId]--;     // A записал 0. B вычел из своей единицы и тоже записал 0.
    return true;             // Оба вернули true: один товар продан дважды.
}

// ✅ GOOD: проверка и списание — один неделимый шаг под lock (_sync — private readonly object)
lock (_sync)
{
    if (_stock[productId] == 0) return false;
    _stock[productId]--;
}
Interlocked.Increment(ref _processedOrders);   // один счётчик: хватает атомарной операции
return true;
```

`Interlocked.Increment` увеличивает и сохраняет значение одной атомарной операцией и возвращает новое значение. Для одной переменной это дешевле `lock`.

В тестах гонка почти не видна: окно между чтением и записью короткое, и потоки попадают в него редко. Под нагрузкой на многих ядрах — регулярно.

Вторая проблема — **visibility**, видимость записи из другого потока. Компилятор, runtime и процессор могут переставлять чтения и записи ради скорости. Если поток крутит `while (!_stopRequested)`, а другой ставит флаг в `true`, без синхронизации поведение непредсказуемо: доступ к полю может быть оптимизирован, и цикл будет читать устаревшее значение. `volatile` на поле флага запрещает такую оптимизацию: в примере Microsoft именно так останавливают рабочий поток. На этом его польза кончается. Он не делает `++` атомарным, не предотвращает гонки и не упорядочивает остальные операции с памятью. Поэтому Microsoft советует в большинстве случаев брать `Interlocked`, `lock` (взаимное исключение плюс memory barriers) или класс `Volatile`. В прикладном коде флаг остановки обычно заменяют на `CancellationToken`. Подробно — в [[Memory Model and volatile]] и [[Race Conditions]].

## Locks and Synchronization

**`lock`, `Interlocked`, `SemaphoreSlim` — что выбрать для защиты общего состояния?**

Зависит от того, что защищаешь: одну переменную, блок кода или блок с `await` внутри.

`lock` пропускает в блок один поток, остальные блокируются и ждут. Поток-владелец может войти в тот же `lock` повторно (reentrancy). Компилятор превращает `lock (x)` в `Monitor.Enter(x, ref lockWasTaken)` внутри `try` и `Monitor.Exit` в `finally`, поэтому при исключении lock освобождается. С .NET 9 и C# 13 рекомендуют отдельный объект типа `System.Threading.Lock`; для него `lock` превращается в `using (x.EnterScope())`.

Правила и их причины:
1. Lock на приватный `readonly`-объект. Не на `this` (вызывающий код тоже может его заблокировать), не на `Type` (его достанет любой через `typeof`), не на строку (строки интернируются). Чужой код на том же объекте даёт неожиданное ожидание или deadlock.
2. Блок короткий, без I/O: все остальные потоки в это время стоят. Один lock-объект — на один ресурс.

**`await` внутри `lock` — ошибка компиляции CS1996**. Документация объясняет: пауза с удержанием lock грозит deadlock, lock остаётся захваченным при переходе на другие потоки. Причина на уровне `Monitor`: он привязан к потоку, отпустить его должен тот же поток, что захватил, а после `await` метод может продолжиться на другом. Асинхронный код берёт `SemaphoreSlim(1, 1)`:

```csharp
private readonly SemaphoreSlim _refreshGate = new(1, 1);   // в блоке не больше одного вызова

public async Task RefreshAsync(CancellationToken ct)
{
    await _refreshGate.WaitAsync(ct);   // асинхронно ждём входа, поток не блокируется
    try { _prices = await _priceRepository.LoadAllAsync(ct); }   // await внутри — можно
    finally { _refreshGate.Release(); } // в finally: иначе исключение навсегда закроет вход
}
```

`SemaphoreSlim` не проверяет, какой поток или задача вызывает `WaitAsync` и `Release`: парность вызовов — забота программиста.

| | Защищает | С `await` | Повторный вход | Типичное применение |
|---|---|---|---|---|
| `lock` | блок кода | нет, CS1996 | да, для владельца | проверить и обновить состояние |
| `Interlocked` | одну переменную | — (одна операция) | — | счётчик, сумма |
| `SemaphoreSlim` | блок или N слотов | да, `WaitAsync` | владельца нет: второй `WaitAsync` на (1, 1) просто ждёт | async-секция, лимит вызовов |
| `ReaderWriterLockSlim` | много читателей или один писатель | нет: привязан к потоку | по умолчанию нет | кэш, который часто читают |

Деталь уровня tech lead: все эти примитивы работают внутри одного процесса; `SemaphoreSlim`, например, локален для приложения. Два экземпляра сервиса за балансировщиком снова продадут последний товар дважды. Там решает база (условный `UPDATE ... WHERE stock > 0`, optimistic concurrency) или distributed lock. Остальные примитивы — в [[Locks and Synchronization]].

## Deadlocks

**Два перевода между одними и теми же счетами пошли навстречу друг другу, и оба зависли. Почему?**

**Deadlock** — каждый поток держит ресурс, нужный другому, и ждёт его. Ни один не продолжит.

1. Поток A переводит со счёта 1 на счёт 2 и берёт lock счёта 1.
2. Поток B переводит со счёта 2 на счёт 1 и берёт lock счёта 2.
3. A пытается взять счёт 2 и ждёт B.
4. B пытается взять счёт 1 и ждёт A. Оба ждут вечно.

Классические условия Коффмана (1971): deadlock возможен, только если одновременно выполнены все четыре. **Mutual exclusion** — ресурсом владеет один поток. **Hold and wait** — поток держит один ресурс и ждёт другой. **No preemption** — ресурс нельзя отнять. **Circular wait** — потоки ждут друг друга по кругу. Достаточно сломать одно. На практике ломают circular wait: все берут ресурсы в одном порядке, счета — по возрастанию `Id`.

```csharp
// ❌ BAD: порядок lock зависит от направления перевода
lock (from.Sync)      // A (1 → 2) взял счёт 1, B (2 → 1) взял счёт 2
lock (to.Sync)        // A ждёт счёт 2, B ждёт счёт 1: круг замкнулся
    _ledger.Move(from, to, amount);

// ✅ GOOD: всегда сначала счёт с меньшим Id — круга не бывает
(Account first, Account second) = from.Id < to.Id ? (from, to) : (to, from);
lock (first.Sync)     // Sync — internal readonly object внутри Account
lock (second.Sync)
    _ledger.Move(from, to, amount);
```

Другие средства:
- `Monitor.TryEnter(account.Sync, TimeSpan.FromSeconds(2))` возвращает `false`, если lock не взят за это время: можно записать в лог, откатить и повторить.
- Не вызывать чужой код (события, callbacks) под lock: неизвестно, какие lock он возьмёт. Так делает и `ConcurrentDictionary`: свои фабрики он вызывает вне внутренних lock.

Асинхронный вариант — `.Result` под `SynchronizationContext` — разобран в [[Async and Await|Asynchronous Execution]]. Livelock и поиск deadlock в дампе — в [[Deadlocks]].

## Concurrent Collections and Channels

**Почему `Dictionary` в singleton-сервисе ломается под нагрузкой, и чем его заменить?**

`List<T>` и `Dictionary<TKey,TValue>` сами потоки не синхронизируют: при записи из нескольких потоков это делает ваш код. `Dictionary` выдерживает нескольких читателей, только пока его никто не меняет. Параллельная запись портит его внутреннее состояние (история — в In Production).

**`ConcurrentDictionary`** — каждый отдельный вызов (`TryAdd`, `TryRemove`, `GetOrAdd`, `AddOrUpdate`) потокобезопасен: запись идёт под мелкими внутренними lock, чтение без lock. Но два вызова подряд — снова check-then-act: оба потока проверили `ContainsKey`, оба не нашли, оба пошли в базу.

`GetOrAdd(key, factory)` тоже атомарен не целиком. Фабрика вызывается вне внутренних lock, и при одновременных вызовах может выполниться несколько раз. Добавится одна пара ключ–значение, и все получат её значение. У `AddOrUpdate` фабрики тоже вызываются вне внутренних lock и могут выполниться несколько раз. Если фабрика ходит в базу или списывает деньги, двойной вызов — реальная проблема. Тогда в словарь кладут `Lazy<T>`: `Lazy<T>(Func<T>)` полностью потокобезопасен, значение создаёт ровно один поток.

```csharp
// ❌ BAD: две операции — check-then-act, оба потока загрузят цену
if (!_prices.ContainsKey(productId))
    _prices[productId] = _priceRepository.Load(productId);

// ✅ GOOD: лишний Lazy может создаться, но Value выполнит загрузку один раз
// (здесь _prices: ConcurrentDictionary<int, Lazy<decimal>>)
decimal price = _prices.GetOrAdd(productId, id => new Lazy<decimal>(() => _priceRepository.Load(id))).Value;
```

Цена `Lazy<T>`: исключение фабрики кэшируется. Один сбой базы — и ключ отдаёт ошибку, пока его не удалят.

Ещё три коллекции: `ConcurrentQueue<T>` — FIFO-очередь, `ConcurrentBag<T>` — набор без порядка, `BlockingCollection<T>` — ограничение размера и блокирующее ожидание поверх других коллекций.

**Channels.** Термин: **producer/consumer** — одни участники кладут работу в очередь, другие её разбирают. `System.Threading.Channels` реализует эту модель асинхронно через FIFO-очередь и входит в shared framework с .NET Core 3.0. Когда bounded-канал полон, `WriteAsync` по умолчанию асинхронно ждёт свободного места. Это **back-pressure**: быстрый producer притормаживает до скорости consumer-а. В отличие от `BlockingCollection`, ожидание не блокирует поток.

```csharp
// Program.cs: builder.Services.AddSingleton(Channel.CreateBounded<OrderPlaced>(1000));
//             builder.Services.AddHostedService<EmailWorker>();
// В endpoint-е POST /orders, после сохранения заказа:
await emails.Writer.WriteAsync(placed, ct);   // канал полон → запрос ждёт (back-pressure)

public sealed class EmailWorker(Channel<OrderPlaced> emails, IEmailSender sender) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (OrderPlaced order in emails.Reader.ReadAllAsync(stoppingToken))
            await sender.SendOrderConfirmationAsync(order, stoppingToken);
    }
}
```

`ReadAllAsync` заканчивает перебор, когда данных нет и больше не будет. Сигнал даёт `Writer.Complete()`: после него consumer дочитывает оставшееся и выходит из цикла. При нескольких producer-ах `Complete()` вызывают, когда закончили все. Подробно — в [[Concurrent Collections]] и [[Channels]].

## Parallel Programming

**Как пересчитать цены миллиона товаров на всех ядрах — и почему 16 ядер не дадут ускорения в 16 раз?**

**Data parallelism** — одна операция над каждым элементом. TPL делит коллекцию на части, и несколько потоков обрабатывают разные части одновременно; создавать потоки не нужно. `Parallel.For` / `Parallel.ForEach` блокируют вызывающий поток, пока не завершатся все итерации. Лимита по умолчанию нет (`MaxDegreeOfParallelism = -1`): цикл берёт столько потоков, сколько даст планировщик. PLINQ — то же для LINQ: `.AsParallel()`. Порядок по умолчанию не сохраняется; `.AsOrdered()` его включает, но запрос медленнее.

```csharp
// PriceRecalculationJob: миллион товаров, чистая CPU-работа
Parallel.ForEach(products, product =>
    product.Price = _pricing.Recalculate(product));   // каждая итерация меняет только свой товар

// ❌ BAD: общая переменная из всех потоков — read-modify-write, слагаемые теряются
decimal catalogValue = 0;
Parallel.ForEach(products, p => catalogValue += p.Price);

// ✅ GOOD: PLINQ считает частичные суммы по частям и складывает их сам
decimal catalogTotal = products.AsParallel().Sum(p => p.Price);
```

Запись в общее состояние из цикла ведёт к гонкам, а `lock` вокруг неё съедает выигрыш. Для своих агрегатов есть перегрузка с partition-local состоянием: `localInit` — один раз на часть, `body` копит результат локально, `localFinally` сливает его в итог. `localFinally` разных частей идут одновременно, поэтому там `Interlocked.Add`.

**Исключения.** Необработанное исключение останавливает цикл, как только доработают уже запущенные итерации. Затем метод бросает одно `AggregateException` со всеми исключениями со всех потоков.

Какой инструмент:
- CPU-bound по коллекции — `Parallel.For/ForEach` или PLINQ.
- I/O-bound с лимитом одновременных вызовов — `Parallel.ForEachAsync` (.NET 6+), по умолчанию не больше `ProcessorCount` операций; разбор — в [[Async and Await|Asynchronous Execution]].
- Несколько независимых async-вызовов — `Task.WhenAll`.

**Закон Амдала.** Ускорение S = 1 / ((1 − p) + p / s), где p — доля работы, которую можно распараллелить, s — ускорение этой доли. Пусть 20% работы последовательны (чтение из базы, запись результата), p = 0.8. На 16 ядрах: 1 / (0.2 + 0.8 / 16) = 4×. На бесконечном числе ядер — не больше 1 / 0.2 = 5×.

Сверху — накладные расходы: разбить данные, распланировать, собрать результат. Цикл с малым числом итераций и быстрым телом почти не ускорится, поэтому всегда измеряют до и после. Во вложенных циклах распараллеливают только внешний. Подробно — в [[Parallel Programming]].

## Pitfalls & Trade-offs

1. **Shared mutable state в singleton или `static`.** Каждый запрос выполняется на своём потоке, а объект у них общий:
   ```csharp
   builder.Services.AddSingleton<PriceCache>();   // внутри Dictionary<int, decimal> и int _hits
   ```
   `_hits++` теряет обновления, а `Dictionary` не выдерживает параллельной записи. Исправление — убрать общее состояние, взять concurrent-тип или `lock`.
2. **Ложное чувство безопасности.** Атомарный вызов не делает атомарной последовательность вызовов; `lock` защищает один процесс, а не кластер; lock-объект должен быть приватным, а блок — без I/O.
3. **Больше потоков ≠ быстрее.** `Parallel.ForEach` поверх HTTP-вызовов держит потоки на ожидании; вложенные параллельные циклы дают over-parallelization; при долгих итерациях пул может добавить слишком много потоков. `Parallel.ForEach` внутри запроса ASP.NET Core берёт потоки из того же пула, что обслуживает запросы: каждый поток цикла — минус один поток для других запросов. Microsoft советует выносить долгую CPU-работу в background services или из процесса.
4. **Trade-offs.**
   - `lock` покупает простоту и защиту блока любого размера ценой заблокированных потоков.
   - `Interlocked` покупает атомарность без блокировки ценой того, что покрывает одну переменную.
   - Concurrent-коллекции покупают атомарность каждого вызова ценой памяти и отсутствия атомарности между вызовами.
   - Bounded `Channel` покупает back-pressure ценой замедления producer-ов.

## In Production

Распродажа. `PriceCache` — singleton, который лениво заполняет обычный `Dictionary<int, decimal>` из потоков запросов:

```csharp
// ❌ BAD: несколько потоков одновременно пишут в обычный Dictionary
public decimal GetPrice(int productId)
{
    if (!_prices.TryGetValue(productId, out decimal price))
        _prices[productId] = price = _priceRepository.Load(productId);   // параллельная вставка портит структуру
    return price;
}

// ✅ GOOD: потокобезопасный словарь, загрузка из базы — один раз на ключ
private readonly ConcurrentDictionary<int, Lazy<decimal>> _prices = new();

public decimal GetPrice(int productId) =>
    _prices.GetOrAdd(productId, id => new Lazy<decimal>(() => _priceRepository.Load(id))).Value;
```

Без синхронизации параллельная вставка может замкнуть внутреннюю цепочку элементов в кольцо. Текущий `Dictionary` в .NET находит такое кольцо и бросает `InvalidOperationException` («Operations that change non-concurrent collections must have exclusive access.») вместо бесконечного цикла — на тех путях, которые прошли по кольцу.

Симптом в текущем .NET: под нагрузкой распродажи `GetPrice` начинает бросать `InvalidOperationException`, и часть запросов к каталогу падает с ошибкой.

> [!warning] Unverified
> Классический симптом без этой проверки — бесконечный цикл: 100% CPU, висящие запросы, потоки внутри методов `Dictionary` в дампе. Документация этого не описывает.

Исправление — `ConcurrentDictionary` с `GetOrAdd`; `Lazy<T>` нужен, чтобы при гонке одну цену не загрузили из базы несколько раз.

## Questions

> [!qard]- Чем concurrency отличается от parallelism? Возможны ли они на одном ядре?
> Concurrency — много задач в работе одновременно, parallelism — много задач выполняются в один момент. На одном ядре concurrency есть, parallelism нет.
> ОС даёт потокам кванты времени и переключает контекст, поэтому на одном ядре задачи чередуются; одновременно выполняется не больше потоков, чем логических процессоров.
> В .NET: I/O-bound — `async`, CPU-bound — `Parallel`/PLINQ. Перепутать — значит держать потоки на ожидании или не ускорить вычисление.

> [!qard]- Чем `Task` отличается от `Thread`? Когда всё-таки нужен отдельный поток?
> `Thread` — поток ОС со своим стеком (по умолчанию 1.5 MB на Windows, 8 MB на Linux). `Task` — единица работы с результатом, исключением и отменой, по умолчанию на потоке пула.
> Пул переиспользует потоки и не платит за создание на каждую задачу. Поток из `new Thread` по умолчанию foreground и держит процесс живым.
> Свой поток — если работа надолго блокирует поток, нужен foreground-поток, особый приоритет, STA (COM, UI) или стабильная identity потока. `LongRunning` — только подсказка планировщику.

> [!qard]- Почему `_count++` из нескольких потоков теряет обновления, и как это исправить?
> `++` — три шага: прочитать, увеличить, записать. A прочитал и увеличил, его вытеснили; B выполнил все три шага; A записал своё значение поверх, и увеличение от B пропало.
> Для одной переменной — `Interlocked.Increment(ref _count)`: атомарно и без блокировки. Если надо согласованно менять несколько полей — `lock`.
> `volatile` не помогает: он не делает `++` атомарным.

> [!qard]- Что такое deadlock, какие условия для него нужны и как его предотвратить в коде?
> Каждый поток держит ресурс, нужный другому, и ждёт его. Классические условия Коффмана: mutual exclusion, hold and wait, no preemption, circular wait — нужны все четыре.
> Достаточно сломать одно. На практике ломают circular wait: брать lock в одном глобальном порядке, например счета по возрастанию `Id`.
> Плюс `Monitor.TryEnter` с таймаутом вместо вечного ожидания и никакого чужого кода (событий, callbacks) под lock.

> [!qard]- Делает ли `ConcurrentDictionary` код потокобезопасным? Что не так с `GetOrAdd`?
> Каждый отдельный вызов потокобезопасен, последовательность вызовов — нет: `ContainsKey` + индексатор остаётся check-then-act.
> `GetOrAdd(key, factory)` вызывает фабрику вне внутренних lock, и при гонке она может выполниться несколько раз. Сохранится одно значение, но побочный эффект случится дважды.
> Если фабрика дорогая или с побочным эффектом — хранить `Lazy<T>`. Цена: `Lazy` кэширует исключение фабрики.

> [!qard]- `Parallel.ForEach`, `Task.WhenAll` или `Parallel.ForEachAsync` — что выбрать для какой работы?
> `Parallel.ForEach` — CPU-работа по большой коллекции; блокирует вызывающий поток до конца. `Task.WhenAll` — несколько независимых async-вызовов. `Parallel.ForEachAsync` — много I/O-вызовов с лимитом одновременности (по умолчанию `ProcessorCount`).
> `Parallel.ForEach` поверх I/O держит потоки на ожидании, а `WhenAll` по десяти тысячам элементов без лимита перегрузит внешний сервис.
> Ускорение CPU-работы ограничено законом Амдала: при 20% последовательной работы потолок — 5× на любом числе ядер.

## Related

- [[Async and Await|Asynchronous Execution]] — concurrency для I/O-bound работы: `async`/`await`, deadlock на `.Result`, starvation.
- [[Threads and the Thread Pool|Thread Pool]] — потоки пула, очереди, work-stealing, рост пула.
- [[Race Conditions]] — lost updates и check-then-act: как их увидеть и исправить.
- [[Locks and Synchronization]] — `lock`/`Monitor`, `System.Threading.Lock`, `Interlocked`, `SemaphoreSlim`, `ReaderWriterLockSlim`.
- [[Deadlocks]] — условия, порядок блокировок, таймауты, поиск deadlock в дампе.
- [[Concurrent Collections]] — `ConcurrentDictionary`, `ConcurrentQueue`, `BlockingCollection`: что атомарно, а что нет.
- [[Channels]] — асинхронная очередь producer/consumer с back-pressure.
- [[Parallel Programming]] — `Parallel.For/ForEach`, PLINQ, `Parallel.ForEachAsync`.
- [[Memory Model and volatile]] — перестановки, видимость, `volatile`, `Volatile.Read/Write`.
- [[Thread Pool Starvation]] — блокирующие вызовы под нагрузкой.

## References

- [Rob Pike — Concurrency is not Parallelism (slides)](https://go.dev/talks/2012/waza.slide) и [Go blog: the talk](https://go.dev/blog/waza-talk). Различие concurrency и parallelism.
- [Asynchronous programming scenarios (C#)](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-scenarios). Выбор между I/O-bound и CPU-bound.
- [Task Parallel Library (TPL)](https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/task-parallel-library-tpl). Data и task parallelism в .NET.
- [About processes and threads (Win32)](https://learn.microsoft.com/en-us/windows/win32/procthread/about-processes-and-threads) и [Context switches](https://learn.microsoft.com/en-us/windows/win32/procthread/context-switches). Поток, его контекст, переключение контекста.
- [Runtime configuration: threading](https://learn.microsoft.com/en-us/dotnet/core/runtime-config/threading). Размер стека по умолчанию.
- [Managed and unmanaged threading in Windows](https://learn.microsoft.com/en-us/dotnet/standard/threading/managed-and-unmanaged-threading-in-windows) и [Foreground and background threads](https://learn.microsoft.com/en-us/dotnet/standard/threading/foreground-and-background-threads). `Thread.Abort`, foreground и background.
- [The managed thread pool](https://learn.microsoft.com/en-us/dotnet/standard/threading/the-managed-thread-pool) и [Debug ThreadPool starvation](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/debug-threadpool-starvation). Что выполняется в пуле, как он растёт, когда нужен свой поток.
- [Task.Run](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.run) и [TaskCreationOptions](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.taskcreationoptions). Очередь пула и `LongRunning`.
- [Interlocked](https://learn.microsoft.com/en-us/dotnet/api/system.threading.interlocked) и [volatile (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/volatile). Неатомарный инкремент, видимость и пределы `volatile`.
- [lock statement (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/lock), [Monitor](https://learn.microsoft.com/en-us/dotnet/api/system.threading.monitor) и [Monitor.TryEnter](https://learn.microsoft.com/en-us/dotnet/api/system.threading.monitor.tryenter). Во что компилируется `lock`, `System.Threading.Lock`, на чём не блокировать.
- [Async/await compiler errors: CS1996](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-messages/async-await-errors). `await` внутри `lock`.
- [SemaphoreSlim](https://learn.microsoft.com/en-us/dotnet/api/system.threading.semaphoreslim) и [ReaderWriterLockSlim](https://learn.microsoft.com/en-us/dotnet/api/system.threading.readerwriterlockslim). Сигнатуры, привязка к потоку, рекурсия.
- [Deadlock (computer science), Wikipedia](https://en.wikipedia.org/wiki/Deadlock_(computer_science)), со ссылкой на Coffman, Elphick, Shoshani, "System Deadlocks", ACM Computing Surveys, 1971. Условия Коффмана и порядок ресурсов.
- [Thread-safe collections](https://learn.microsoft.com/en-us/dotnet/standard/collections/thread-safe/), [Dictionary<TKey,TValue>](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.dictionary-2) и [исходник Dictionary.cs (dotnet/runtime)](https://github.com/dotnet/runtime/blob/main/src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Dictionary.cs). Потокобезопасность коллекций и защита от кольца в цепочке.
- [ConcurrentDictionary.GetOrAdd](https://learn.microsoft.com/en-us/dotnet/api/system.collections.concurrent.concurrentdictionary-2.getoradd), [AddOrUpdate](https://learn.microsoft.com/en-us/dotnet/api/system.collections.concurrent.concurrentdictionary-2.addorupdate) и [Lazy<T>](https://learn.microsoft.com/en-us/dotnet/api/system.lazy-1). Фабрики вне lock, однократная инициализация.
- [Channels (.NET)](https://learn.microsoft.com/en-us/dotnet/core/extensions/channels) и [ChannelReader.ReadAllAsync](https://learn.microsoft.com/en-us/dotnet/api/system.threading.channels.channelreader-1.readallasync). Bounded-каналы, back-pressure, завершение.
- [Data parallelism (TPL)](https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/data-parallelism-task-parallel-library), [Potential pitfalls in data and task parallelism](https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/potential-pitfalls-in-data-and-task-parallelism), [Handle exceptions in parallel loops](https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/how-to-handle-exceptions-in-parallel-loops) и [Partition-local variables](https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/how-to-write-a-parallel-foreach-loop-with-partition-local-variables). Как работают и ломаются параллельные циклы.
- [ParallelOptions.MaxDegreeOfParallelism](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.paralleloptions.maxdegreeofparallelism) и [Parallel.ForEachAsync](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallel.foreachasync). Лимиты параллелизма по умолчанию.
- [Order preservation in PLINQ](https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/order-preservation-in-plinq) и [Understanding speedup in PLINQ](https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/understanding-speedup-in-plinq). Порядок и накладные расходы.
- [Amdahl's law, Wikipedia](https://en.wikipedia.org/wiki/Amdahl%27s_law). Формула ускорения.
- [ASP.NET Core best practices](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/best-practices). Пул потоков в ASP.NET Core, блокирующие вызовы, долгая CPU-работа.
