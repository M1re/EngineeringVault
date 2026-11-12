---
title: "Dependency Injection"
summary: "DI-контейнер создаёт объекты и передаёт им зависимости через конструктор, а lifetime (Transient, Scoped, Singleton) решает, сколько живёт каждый экземпляр; главная ошибка — короткоживущий сервис, захваченный долгоживущим."
tags: [dependency-injection, aspnet-core, service-lifetime]
status: done
publish: false
created: 2026-07-09
---

> [!summary]
> Dependency Injection — класс получает зависимости через конструктор и не создаёт их сам. Контейнер `Microsoft.Extensions.DependencyInjection` строит граф объектов и решает, сколько живёт каждый экземпляр: Transient, Scoped или Singleton.
> На собеседовании и в проде главное — lifetimes: singleton, который держит scoped `DbContext`, падает под нагрузкой или тихо отдаёт устаревшие данные. Часть хаба [[Application Hosting]].

## Container and Registration

**Зачем DI-контейнер, если `OrderService` может сам написать `new PaymentGatewayClient()`?**

Тогда `OrderService` намертво связан с конкретным классом. Чтобы заменить реализацию, придётся править сам `OrderService`, а в unit-тесте не подставить fake-шлюз.

**Dependency Injection** — класс объявляет зависимости параметрами конструктора, а создаёт их кто-то снаружи. Этот «кто-то» — **DI container**. При старте приложение складывает регистрации в `IServiceCollection`, а `BuildServiceProvider` превращает их в `IServiceProvider`, который создаёт объекты. Реализацию меняют в одной строке регистрации, временем жизни объектов управляет контейнер, а все зависимости класса видны в конструкторе. Место регистрации называют composition root; в ASP.NET Core это `Program.cs`.

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Shop")));   // Scoped
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddSingleton<PriceCache>();
builder.Services.AddHttpClient<PaymentGatewayClient>();                // typed client: Transient
builder.Services.AddHostedService<OutboxPublisher>();                  // Singleton

var app = builder.Build();   // здесь из IServiceCollection строится IServiceProvider
```

Чтобы создать `OrderService(AppDbContext db, PriceCache prices, PaymentGatewayClient payments)`, контейнер берёт конструктор и разрешает параметры по очереди. У каждого параметра свои зависимости, и контейнер разрешает их так же, рекурсивно, пока не соберёт весь граф. Запомнить готовый экземпляр или нет, решает lifetime.

Если один интерфейс зарегистрирован дважды, параметр конструктора получает **последнюю** регистрацию, а `IEnumerable<T>` — все, в порядке регистрации. `TryAdd*` из `Microsoft.Extensions.DependencyInjection.Extensions` добавляет регистрацию, только если для типа ещё ничего нет. Так библиотека ставит реализацию по умолчанию и не затирает регистрацию приложения. `TryAddEnumerable` добавляет реализацию в список `IEnumerable<T>`, только если такой же реализации там ещё нет. Так `AddHostedService` не регистрирует один `OutboxPublisher` дважды.

```csharp
services.AddSingleton<IOrderNotifier, EmailOrderNotifier>();
services.AddSingleton<IOrderNotifier, SmsOrderNotifier>();
services.TryAddSingleton<IOrderNotifier, PushOrderNotifier>();   // ничего не делает: тип уже зарегистрирован
// OrderService(IOrderNotifier notifier)               → SmsOrderNotifier
// OrderService(IEnumerable<IOrderNotifier> notifiers) → EmailOrderNotifier, SmsOrderNotifier
```

Две реализации, которые нужны одновременно, различают keyed services (.NET 8+): `AddKeyedScoped<IPaymentGateway, StripeGateway>("stripe")` и `[FromKeyedServices("stripe")]` на параметре конструктора.

## Service Lifetimes

**Чем отличаются Transient, Scoped и Singleton, и что в ASP.NET Core считается scope?**

**Scope** — отдельный `IServiceProvider`, созданный от root-провайдера. Singleton-ы у него общие с root, а экземпляры scoped-сервисов свои, и scope освобождает их, когда закрывается. Scope внутри scope ничего не наследует от внешнего. ASP.NET Core создаёт один scope на каждый HTTP-запрос и отдаёт его через `HttpContext.RequestServices`.

| Lifetime | Экземпляры | Создаётся | Освобождается | Пример |
|---|---|---|---|---|
| Transient | новый на каждое разрешение | при каждом разрешении | в конце scope, где разрешён | `OrderValidator` без состояния, `PaymentGatewayClient` |
| Scoped | один на scope, в вебе — на HTTP-запрос | при первом разрешении в scope | в конце запроса | `AppDbContext`, `OrderService` |
| Singleton | один на приложение | при первом разрешении или готовым экземпляром при регистрации | при остановке приложения | `PriceCache`, hosted service |

```csharp
public sealed class OrderService(AppDbContext db, InventoryService inventory) : IOrderService
{
    public async Task PlaceAsync(Order order, CancellationToken ct)
    {
        db.Orders.Add(order);
        await inventory.ReserveAsync(order.Lines, ct);   // InventoryService(AppDbContext db) меняет остатки
        await db.SaveChangesAsync(ct);                   // сохраняет и заказ, и резерв
    }
}
// запрос 1: scope A → OrderService#1 и InventoryService#1 получают один AppDbContext#1
// запрос 2: scope B → свои OrderService#2, InventoryService#2 и AppDbContext#2
```

Внутри запроса оба сервиса видят один `AppDbContext`, поэтому один `SaveChangesAsync` сохраняет оба изменения. Это следствие кода выше, а не гарантия контейнера. Разные запросы получают разные контексты.

От lifetime зависит и thread safety. Singleton одновременно используют все параллельные запросы, поэтому он обязан быть thread-safe. Контейнер гарантирует потокобезопасность только создания объектов, а не самих объектов. Scoped-сервис в ASP.NET Core обычно использует один поток запроса за раз, если код запроса сам не запускает параллельные операции: `Task.WhenAll` с двумя запросами к одному `AppDbContext` даёт ту же ошибку "A second operation was started on this context instance…", что и в разделе ниже.

Как выбрать:
- состояние на запрос или unit of work (`DbContext`) → Scoped;
- своё состояние, которое дорого создавать или нужно делить на всё приложение (кэш цен) → thread-safe Singleton;
- нет состояния → Transient или Scoped. Такие сервисы документация советует не делать singleton: singleton добавляет требования (thread safety, общая память на всё приложение, связь между запросами), а сервис без состояния дёшево создать заново.

## Captive Dependencies

**Singleton `PriceCache` принимает `AppDbContext` в конструкторе. Что пойдёт не так под нагрузкой?**

**Captive dependency** — долгоживущий сервис держит короткоживущий. Захваченный сервис живёт столько же, сколько владелец, и его lifetime перестаёт работать.

```csharp
// ❌ BAD: singleton навсегда держит AppDbContext, созданный для первого запроса
public sealed class PriceCache(AppDbContext db)
{
    public Task<decimal> GetPriceAsync(int productId, CancellationToken ct) =>
        db.Products.Where(p => p.Id == productId).Select(p => p.Price).SingleAsync(ct);
}
```

Что происходит по шагам:
1. Первый запрос разрешает `PriceCache`. Контейнер создаёт его один раз и для конструктора создаёт `AppDbContext`.
2. Singleton хранит этот контекст до остановки приложения: scoped-сервис ведёт себя как singleton.
3. Два параллельных запроса вызывают `GetPriceAsync` на одном контексте, а `DbContext` не thread-safe.
4. Если EF Core заметит гонку, он бросит `InvalidOperationException`: "A second operation was started on this context instance before a previous operation completed.". Если не заметит — undefined behaviour, падения и порча данных.
5. Контекст копит отслеживаемые сущности всех пользователей. Tracking-запрос возвращает уже отслеживаемый экземпляр и не перезаписывает его значениями из базы, поэтому цены устаревают.

```csharp
// ✅ GOOD: на каждый промах кэша — свой короткий scope и свой AppDbContext
public sealed class PriceCache(IServiceScopeFactory scopeFactory)
{
    // без expiration для краткости; в проде — IMemoryCache с TTL
    private readonly ConcurrentDictionary<int, decimal> _prices = new();

    public async Task<decimal> GetPriceAsync(int productId, CancellationToken ct)
    {
        if (_prices.TryGetValue(productId, out decimal cached)) return cached;
        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return _prices[productId] = await db.Products
            .Where(p => p.Id == productId).Select(p => p.Price).SingleAsync(ct);
    }
}
```

Правило зависимостей: singleton принимает в конструкторе только singleton, а scoped получает лишь через явный scope из `IServiceScopeFactory`. Scoped и transient могут зависеть от любого lifetime. Transient внутри singleton формально разрешён, но фактически становится singleton, и ему может понадобиться thread safety, если singleton вызывает его из параллельных запросов.

**Scope validation** ловит часть таких ошибок. `ValidateScopes` проверяет, что scoped-сервис не разрешается из root-провайдера и не внедряется в singleton, прямо или через цепочку. `ValidateOnBuild` ещё при построении провайдера проверяет, что каждый сервис можно создать; open generics он не проверяет. Для примера выше ошибка такая: "Cannot consume scoped service 'Shop.Data.AppDbContext' from singleton 'Shop.Pricing.PriceCache'.".

`WebApplication.CreateBuilder` и `Host.CreateApplicationBuilder` включают обе проверки только в environment `Development`. Голый `services.BuildServiceProvider()` не проверяет ничего: оба свойства по умолчанию `false`. Проверка **не** поймает transient внутри singleton: валидатор следит только за scoped-сервисами. И она не работает нигде, кроме `Development`, если её не включить явно.

Та же ловушка в middleware. Conventional middleware (класс с `InvokeAsync`) создаётся один раз на всё приложение, и scoped-сервис из его конструктора не принадлежит ни одному запросу. С включённой scope validation это исключение; без неё сервис тихо становится singleton. Поэтому scoped и transient сервисы conventional middleware получает параметрами `InvokeAsync`.

```csharp
// ❌ BAD: AuditMiddleware создан один раз, его AppDbContext живёт до остановки приложения
public sealed class AuditMiddleware(RequestDelegate next, AppDbContext db) { /* ... */ }

// ✅ GOOD: AppDbContext приходит в InvokeAsync из scope текущего запроса
public sealed class AuditMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        await next(context);
        db.AuditEntries.Add(new AuditEntry(context.Request.Path.Value, context.Response.StatusCode));
        await db.SaveChangesAsync(context.RequestAborted);
    }
}
```

Factory-based middleware (`IMiddleware`) активируется на каждый запрос, поэтому ему scoped-сервисы можно передавать через конструктор. `IOptionsSnapshot<T>` зарегистрирован как Scoped, и в singleton его внедрять нельзя — это тот же captive; singleton-у нужен `IOptionsMonitor<T>`. Подробно — в [[Configuration and Options]].

## Manual Scopes

**Как работать с `DbContext` из `BackgroundService`, который сам по себе singleton?**

`AddHostedService` регистрирует сервис как Singleton, поэтому `AppDbContext` в конструктор `OutboxPublisher` брать нельзя. Вместо этого внедряют `IServiceScopeFactory` (он всегда singleton) и создают scope на каждую единицу работы. `CreateAsyncScope()` возвращает `AsyncServiceScope`, который освобождают через `await using`.

```csharp
public sealed class OutboxPublisher(IServiceScopeFactory scopeFactory, IMessageBus bus) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await using (AsyncServiceScope scope = scopeFactory.CreateAsyncScope())   // один batch = один scope
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                List<OutboxMessage> batch = await db.OutboxMessages
                    .Where(m => m.PublishedAt == null).OrderBy(m => m.Id).Take(100)
                    .ToListAsync(stoppingToken);
                foreach (OutboxMessage message in batch)
                {
                    await bus.PublishAsync(new OrderPlaced(message.OrderId), stoppingToken);
                    message.PublishedAt = DateTimeOffset.UtcNow;
                }
                await db.SaveChangesAsync(stoppingToken);
            }   // scope закрыт: AppDbContext освобождён вместе с отслеживаемыми сущностями
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}
```

Почему scope на batch, а не один на весь `ExecuteAsync`: один scope на всё время жизни сервиса — тот же captive `DbContext`, только спрятанный. `DbContext` рассчитан на одну короткую unit of work.

Разрешать сервисы из `IServiceProvider` внутри бизнес-кода — **service locator**. Зависимостей не видно в конструкторе, и тесту приходится собирать контейнер. Внедрённая фабрика, которая разрешает зависимости во время работы, — тот же service locator. Допустим он только на границе инфраструктуры: в hosted service и в singleton, которому нужен scoped-сервис. Fire-and-forget внутри запроса решают так же, в собственном scope (Pitfall 3 в [[Async and Await]]).

Не разрешай scoped-сервисы из root-провайдера `app.Services`. Без проверки такой экземпляр живёт до остановки приложения, то есть становится singleton. С проверкой — "Cannot resolve scoped service '…' from root provider.". Для работы при старте создают явный scope: `using var scope = app.Services.CreateScope();`.

## Disposal

**Кто вызывает `Dispose` у сервисов, и почему transient `IDisposable` из root-провайдера течёт?**

Контейнер освобождает объекты, которые **сам создал**: вызывает `Dispose` у `IDisposable` или `DisposeAsync` у `IAsyncDisposable`. Transient и scoped освобождаются в конце своего scope, singleton — когда освобождается контейнер, обычно при остановке приложения. Экземпляр, переданный готовым в `AddSingleton(new PaymentGatewayClient(...))`, контейнер **не** освобождает. Сам вызывать `Dispose` у внедрённого сервиса тоже нельзя: им владеет контейнер.

Утечка по шагам. `ReportExporter` зарегистрирован как Transient и реализует `IDisposable`. Код в цикле берёт его из `app.Services`. Контейнер запоминает каждый transient `IDisposable`, чтобы освободить его в конце scope, а у root-провайдера этот конец — остановка приложения. Каждый вызов оставляет объект, который GC не соберёт, и память растёт до перезапуска. Внутри request scope та же регистрация безопасна: scope закрывается в конце запроса. Правило — не разрешать transient и scoped `IDisposable` из root.

```csharp
// ❌ BAD: каждый ReportExporter остаётся в памяти до остановки приложения
foreach (int orderId in orderIds)
    app.Services.GetRequiredService<ReportExporter>().Export(orderId);

// ✅ GOOD: экспортёр живёт в своём scope и освобождается вместе с ним
foreach (int orderId in orderIds)
{
    using IServiceScope scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<ReportExporter>().Export(orderId);
}
```

Если сервис реализует только `IAsyncDisposable`, scope освобождают асинхронно: `CreateAsyncScope` и `await using`. Синхронный `Dispose()` такого scope бросит `InvalidOperationException`: "'…' type only implements IAsyncDisposable. Use DisposeAsync to dispose the container.".

## Pitfalls & Trade-offs

1. **Scoped внутри singleton.** `PriceCache(AppDbContext db)` — один контекст на все запросы: "A second operation was started on this context instance…" под нагрузкой и устаревшие данные. Ловит только scope validation, а она по умолчанию включена лишь в Development.
2. **Transient внутри singleton никто не ловит**. Singleton `FraudCheckService(PaymentGatewayClient payments)` держит typed client всё время жизни процесса, и клиент может перестать замечать смену DNS платёжного шлюза. Исправление: сделать `FraudCheckService` scoped или transient, внедрить `IHttpClientFactory` и создавать клиента по необходимости, либо дать typed client-у `SocketsHttpHandler` с `PooledConnectionLifetime`. Подробно — в [[HttpClient and IHttpClientFactory]].
3. **Разрешение из root-провайдера** (`app.Services`). Scoped тихо становится singleton, а transient `IDisposable` копятся до остановки. Исправление — `CreateScope()`.
4. **Scoped-сервис в конструкторе middleware.** Middleware создан один раз: с проверкой — исключение, без неё — один `AppDbContext` на всё приложение. Исправление — параметр `InvokeAsync`.
5. **Service locator в бизнес-коде.** `OrderService(IServiceProvider services)` достаёт `AppDbContext` внутри метода. Зависимостей не видно в конструкторе, а unit-тест должен собирать контейнер.
6. **Trade-offs.**
   - Singleton покупает один экземпляр и общий кэш ценой thread safety и риска captive dependency.
   - Scoped покупает unit of work на запрос ценой того, что вне scope им пользоваться нельзя.
   - Transient покупает изоляцию ценой нового объекта на каждое разрешение и отслеживания `IDisposable` до конца scope.
   - Scope validation покупает падение на старте вместо бага в проде, но host builders включают её только в Development.

## In Production

`OutboxPublisher` публикует события `OrderPlaced` из outbox-таблицы. Разработчик взял `AppDbContext` прямо в конструктор:

```csharp
// ❌ BAD: hosted service — singleton, его AppDbContext живёт до остановки процесса
public sealed class OutboxPublisher(AppDbContext db, IMessageBus bus) : BackgroundService
// ExecuteAsync: тот же цикл, что в Manual Scopes, но каждый batch читает через один и тот же db

// ✅ GOOD: свой scope и свой AppDbContext на каждый batch
public sealed class OutboxPublisher(IServiceScopeFactory scopeFactory, IMessageBus bus) : BackgroundService
// ExecuteAsync: await using (AsyncServiceScope scope = scopeFactory.CreateAsyncScope()) { ... }
```

Локально в Development хост упал бы на старте с "Cannot consume scoped service …". Но в Staging и Production environment не `Development`, проверка выключена, и сервис стартует.

Симптом. Один `AppDbContext` живёт неделями, хотя рассчитан на одну unit of work, и копит в change tracker каждую загруженную строку outbox. Если строку, которую контекст уже отслеживает, поменял другой процесс (второй экземпляр сервиса или ручной retry), повторное чтение этой строки вернёт старые значения из памяти, а не из базы.

Исправление — scope на batch, как выше. Проверку включают и вне Development или хотя бы в тестах: на Generic Host через `UseDefaultServiceProvider`, на голом контейнере через опции `BuildServiceProvider`.

```csharp
hostBuilder.UseDefaultServiceProvider(o => { o.ValidateScopes = true; o.ValidateOnBuild = true; });

// integration test: те же регистрации, что в Program.cs, но с проверкой
using ServiceProvider provider = services.BuildServiceProvider(
    new ServiceProviderOptions { ValidateScopes = true, ValidateOnBuild = true });
```

## Questions

> [!qard]- Чем отличаются Transient, Scoped и Singleton? Какой lifetime у `DbContext`, `HttpClient`-клиента и in-memory кэша?
> Transient — новый экземпляр на каждое разрешение, Scoped — один на scope (в ASP.NET Core — на HTTP-запрос), Singleton — один на приложение. `AddDbContext` регистрирует контекст как Scoped, `AddHttpClient<T>` — typed client как Transient, in-memory кэш — Singleton.
> Цена singleton — thread safety: его одновременно используют все запросы. Сервис без состояния singleton делать не советуют: он получил бы эти требования, а создать его заново дёшево.

> [!qard]- Что такое captive dependency и как .NET её ловит? Что проверка не поймает?
> Долгоживущий сервис держит короткоживущий, и тот живёт столько же, сколько владелец. Классика — `AppDbContext` в singleton: гонки на одном контексте и устаревшие данные.
> `ValidateScopes` бросает "Cannot consume scoped service '…' from singleton '…'.". Host builders включают её только в Development, голый `BuildServiceProvider()` не проверяет ничего. Transient внутри singleton она не поймает никогда.

> [!qard]- Как использовать scoped-сервис (`DbContext`) из `BackgroundService` или singleton?
> Внедрить `IServiceScopeFactory`, на каждую единицу работы создавать scope через `CreateAsyncScope()` и брать `AppDbContext` из `scope.ServiceProvider`. Конец scope освобождает контекст.
> Scope на batch, а не на весь сервис, иначе это тот же captive контекст. Это service locator, но на границе инфраструктуры он допустим; в бизнес-коде зависимости берут через конструктор.

> [!qard]- Как получить scoped-сервис в middleware и почему не через конструктор?
> Conventional middleware создаётся один раз на приложение, и scoped-сервис из конструктора не принадлежит запросу. Его берут параметром `InvokeAsync(HttpContext context, AppDbContext db)`, и DI подставляет экземпляр из scope запроса.
> С включённой scope validation конструктор даст исключение, без неё — тихий singleton. Альтернатива — `IMiddleware`: он активируется на каждый запрос.

> [!qard]- Кто вызывает `Dispose` у сервисов из DI? Почему transient `IDisposable` из root-провайдера — утечка?
> Контейнер освобождает объекты, которые создал сам, в конце их scope; singleton — при остановке приложения. Экземпляр из `AddSingleton(new ...)` он не освобождает.
> Transient `IDisposable` контейнер держит до конца scope. У root-провайдера это остановка приложения, поэтому каждое разрешение из `app.Services` оставляет объект в памяти. Исправление — разрешать такие сервисы в созданном scope.

> [!qard]- Один интерфейс зарегистрирован дважды. Что получит конструктор, а что `IEnumerable<T>`? Зачем библиотеки используют `TryAdd`?
> Конструктор получит последнюю регистрацию, `IEnumerable<T>` — все, в порядке регистрации.
> `TryAdd*` регистрирует сервис, только если для типа ещё ничего нет: библиотека ставит реализацию по умолчанию и не затирает ту, что выбрало приложение. `TryAddEnumerable` защищает от двух копий одной реализации в списке.

## Related

- [[Application Hosting]] — хаб: как хост собирает приложение.
- [[Generic Host]] — построение хоста, environment и порядок старта.
- [[Background Services]] — `BackgroundService` и hosted services.
- [[Configuration and Options]] — `IOptions`, `IOptionsSnapshot`, `IOptionsMonitor` и их lifetimes.
- [[HttpClient and IHttpClientFactory]] — handlers, DNS и typed clients.
- [[Middleware Pipeline]] — conventional middleware и `IMiddleware`.
- [[Async and Await]] — fire-and-forget в запросе и scoped `DbContext`.
- [[SOLID Principles]] — Dependency Inversion Principle.
- [[Test Doubles]] — fake-реализации, которые подставляют через DI.

## References

- [Dependency injection in .NET (overview)](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/overview). Регистрация, scope validation, scopes в hosted services.
- [Service lifetimes (.NET)](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/service-lifetimes). Transient, Scoped, Singleton и правила зависимостей.
- [Service registration (.NET)](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/service-registration). Несколько регистраций, `TryAdd*`, автоматическое освобождение.
- [Dependency injection guidelines (.NET)](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines). Captive dependency, disposal, service locator.
- [Dependency injection in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection). Scope на запрос, middleware, keyed services.
- [Write custom ASP.NET Core middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/write). Lifetime middleware и параметры `InvokeAsync`.
- [ServiceProviderOptions.ValidateOnBuild](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.dependencyinjection.serviceprovideroptions.validateonbuild) и [ValidateScopes](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.dependencyinjection.serviceprovideroptions.validatescopes).
- dotnet/runtime source: [ServiceProviderOptions.cs](https://github.com/dotnet/runtime/blob/main/src/libraries/Microsoft.Extensions.DependencyInjection/src/ServiceProviderOptions.cs), [HostingHostBuilderExtensions.cs](https://github.com/dotnet/runtime/blob/main/src/libraries/Microsoft.Extensions.Hosting/src/HostingHostBuilderExtensions.cs), [CallSiteValidator.cs](https://github.com/dotnet/runtime/blob/main/src/libraries/Microsoft.Extensions.DependencyInjection/src/ServiceLookup/CallSiteValidator.cs), [Strings.resx](https://github.com/dotnet/runtime/blob/main/src/libraries/Microsoft.Extensions.DependencyInjection/src/Resources/Strings.resx). Значения по умолчанию и тексты ошибок.
- [DbContext lifetime, configuration, and initialization (EF Core)](https://learn.microsoft.com/en-us/ef/core/dbcontext-configuration/). Scoped по умолчанию, thread safety.
- [Tracking vs. No-Tracking Queries (EF Core)](https://learn.microsoft.com/en-us/ef/core/querying/tracking). Отслеживаемые сущности не перезаписываются.
- [IHttpClientFactory with .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/httpclient-factory). Typed client — Transient, DNS и singleton.
- [Options pattern (.NET)](https://learn.microsoft.com/en-us/dotnet/core/extensions/options). Lifetimes `IOptionsSnapshot` и `IOptionsMonitor`.
