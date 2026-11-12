---
publish: true
title: const vs readonly
created: 2026-07-19
modified: 2026-11-12T10:06:43.948Z
published: 2026-11-12T10:06:43.948Z
tags:
  - constants
  - immutability
  - versioning
summary: const вычисляется при компиляции и копируется в код каждого потребителя, а readonly-поле получает значение при выполнении и после конструктора не меняется.
status: done
---

> [!summary]
> `const` и `readonly` задают значение один раз, но в разное время. `const` вычисляет компилятор, и значение попадает в код каждого, кто его читает, даже в другой сборке. `readonly`-поле получает значение при выполнении, в объявлении или в конструкторе.
> Поэтому изменённый `public const` в библиотеке потребитель не увидит до своей пересборки, а `static readonly` увидит сразу.

## const

**Что компилятор делает с `const` и какие типы можно объявить константой?**

`const` — значение, которое компилятор полностью вычисляет при компиляции. Компилятор подставляет это значение в скомпилированный код каждого места, где константу читают, в том числе в других сборках.

Тип константы: `sbyte`, `byte`, `short`, `ushort`, `int`, `uint`, `nint`, `nuint`, `long`, `ulong`, `char`, `float`, `double`, `decimal`, `bool`, `string`, enum или другой reference type, но тогда только со значением `null`. Значение, вычисленное при выполнении, константой быть не может: ни `DateTime.UtcNow`, ни `new List<int>()`.

```csharp
public static class OrderLimits
{
    public const int MaxPageSize = 100;     // значение попадёт в код каждого потребителя
    public const string ApiVersion = "v2";
}
```

`const` неявно static, его читают через имя типа: `OrderLimits.MaxPageSize`. Писать `static const` нельзя, это ошибка компиляции. Члены enum — тоже константы: их значение так же фиксируется при компиляции потребителя. `const` можно объявить и локально, внутри метода.

## readonly

**Где можно присвоить `readonly`-поле и чем `static readonly` отличается от обычного `readonly`?**

`readonly`-поле — настоящее поле. Значение ему присваивают при выполнении: в объявлении или в конструкторе того же класса. Внутри конструктора поле можно присвоить несколько раз. Ещё одно место с C# 9 — `init`-accessor того же типа, подробно в [[Records]]. Присваивание в обычном методе — ошибка компиляции.

Тип и значение любые, в том числе вычисленные при запуске, например `DateTime.UtcNow`. Обычный `readonly` хранит своё значение в каждом объекте: типичный пример — зависимость из DI в `private readonly`-поле. `static readonly` хранит одно значение на тип. Его задаёт инициализатор поля или static constructor. Static constructor вызывается автоматически, не больше одного раза, до создания первого объекта или обращения к static-членам. Если static constructor нет, инициализаторы выполняются в какой-то момент до первого обращения к static-полю, точный момент зависит от реализации.

```csharp
public class OrderService
{
    private static readonly TimeSpan PaymentTimeout = TimeSpan.FromSeconds(30); // одно на тип
    private readonly IOrderRepository _repository;                              // своё у объекта

    public OrderService(IOrderRepository repository) => _repository = repository; // можно: конструктор
}
```

## Compile-Time vs Runtime

**Библиотека поменяла `public const`, сервис подложил новую DLL — почему сервис видит старое значение?**

Потому что сервис не читает константу из библиотеки. Значение лежит в его собственном скомпилированном коде. По шагам:

1. Библиотека `Orders.Contracts` объявляет `public const int MaxPageSize = 100`.
2. Сервис компилируется против неё. Компилятор вычисляет `OrderLimits.MaxPageSize` и записывает `100` в код самого сервиса.
3. В библиотеке меняют значение на `200` и заменяют только её DLL. Сервис работает со `100`: за значением он в библиотеку не обращается.
4. `200` сервис увидит только после пересборки против новой версии.

`public static readonly int MaxPageSize` сервис читает из поля библиотеки при выполнении, поэтому новой DLL достаточно.

Но есть места, где работает только `const`: аргументы атрибутов, `case`-метки и constant patterns, значения параметров по умолчанию. Там нужен constant expression. `static readonly` им не является и там не компилируется.

```csharp
// ✅ const подходит; будь MaxPageSize static readonly, здесь была бы ошибка компиляции
Task<IReadOnlyList<Order>> GetPageAsync(int page, int pageSize = OrderLimits.MaxPageSize);
```

Не медленнее ли `static readonly`, чем `const`? В .NET метод сначала компилируется быстро и без оптимизаций (tier 0). Если метод вызывают часто, JIT перекомпилирует его с оптимизациями (tier 1). К этому моменту метод уже выполнялся, поэтому `static readonly`-поля, которые он читает, уже инициализированы. JIT может прочитать их значения и, например, с `static readonly bool` обращаться как с `const bool`.

| | `const` | `static readonly` |
|---|---|---|
| Когда задаётся | при компиляции | при выполнении, один раз |
| Типы | числа, `bool`, `char`, `string`, enum; другие reference types — только `null` | любые |
| Где значение | в коде каждого потребителя | в поле библиотеки |
| Атрибуты, `case`, параметры по умолчанию | да | нет |
| Новое значение без пересборки потребителя | нет | да |

## readonly Is Not Immutable

**Можно ли добавить элемент в `static readonly List<T>`?**

Да. `readonly` запрещает заменить ссылку в поле, но не менять объект, на который она указывает.

```csharp
// ❌ BAD: поле readonly, а список внутри — нет
public static readonly List<string> SupportedCurrencies = new() { "EUR", "USD" };
SupportedCurrencies.Add("BTC");            // компилируется: меняется объект
SupportedCurrencies = new List<string>();  // ошибка компиляции: меняется поле

// ✅ GOOD: содержимое тоже нельзя изменить
public static readonly FrozenSet<string> SupportedCurrencies = new[] { "EUR", "USD" }.ToFrozenSet();
```

`ImmutableArray<T>` из `System.Collections.Immutable` нельзя изменить после создания. `FrozenSet<T>` и `FrozenDictionary<TKey,TValue>` появились в .NET 8: они тоже не меняются после создания, зато быстрее на чтение.

Отдать `List<T>` как `IReadOnlyList<T>` — значит только спрятать `Add`: вызывающий код приведёт ссылку обратно к `List<T>` и изменит тот же список. `AsReadOnly()` возвращает обёртку `ReadOnlyCollection<T>` без методов изменения, но обёртка показывает изменения исходного списка, поэтому сам список наружу не отдают.

На сервере `static`-коллекция одна на всё приложение. Один запрос добавил `"BTC"`, и валюту видят все остальные.

## Pitfalls & Trade-offs

1. **Изменяемое значение как `public const` в общей библиотеке.** Потребители работают со старым значением, пока их не пересоберут; сценарий — в In Production. `const` покупает использование в атрибутах, `case` и параметрах по умолчанию ценой того, что значение зашито в каждого потребителя.
2. **Изменяемая коллекция в `static readonly`.** Один запрос меняет коллекцию, все остальные видят изменение. `List<T>` и `Dictionary<TKey,TValue>` не синхронизируют потоки: одновременные записи должен синхронизировать ваш код. Исправление — `FrozenDictionary<TKey,TValue>` или другая неизменяемая коллекция.
   ```csharp
   public static readonly Dictionary<string, decimal> FeeByCurrency = new() { ["EUR"] = 0.5m };
   FeeByCurrency["EUR"] = 0m;   // ❌ компилируется: комиссия обнулилась для всех запросов
   ```
3. **`IReadOnlyList<T>` как защита.** Приведение обратно к `List<T>` меняет исходный список. Исправление — `ImmutableArray<T>` или обёртка `AsReadOnly()` над списком, который больше никто не держит.
   ```csharp
   private static readonly List<string> _currencies = new() { "EUR", "USD" };
   public static IReadOnlyList<string> SupportedCurrencies => _currencies;
   ((List<string>)CurrencyCatalog.SupportedCurrencies).Add("BTC");   // ❌ меняет общий список
   ```
4. **Значения, которые зависят от окружения.** Таймаут платёжного шлюза или лимит для клиента в `const` или `static readonly` меняются только новой сборкой и деплоем. Совет: такие значения держать в конфигурации.

## In Production

`Orders.Contracts` объявляет лимит страницы константой. NuGet-пакет `Orders.Client` ограничивает запрошенный размер страницы этим лимитом и собран против Contracts 1.0. Сервис отчётов использует оба пакета.

```csharp
// ❌ BAD: Orders.Contracts 1.0 — значение уходит в код Orders.Client
public const int MaxPageSize = 100;
// Orders.Client, собран против Contracts 1.0: здесь уже записано 100
int size = Math.Min(requestedSize, OrderLimits.MaxPageSize);
// ✅ GOOD: потребители читают поле при выполнении
public static readonly int MaxPageSize = 200;
```

Команда поднимает лимит до `200` в Contracts 1.1. Сервис отчётов ссылается на Contracts 1.1 напрямую и пересобирается. NuGet берёт прямую зависимость, 1.1, а версию 1.0 из `Orders.Client` игнорирует. Но `Orders.Client` никто не пересобрал, и в его коде осталось `100`. Симптом: валидация сервиса принимает `200`, а каждая страница отчёта приходит со 100 заказами. Ничего не падает, просто цифры неправильные.

Исправление — `public static readonly int MaxPageSize` и одна пересборка `Orders.Client`. Дальше новые значения доходят до клиента без его пересборки. Правило: публичное значение, которое может поменяться между версиями, — `static readonly`. `const` оставляют для настоящих констант (`HoursPerDay = 24`) и для значений в атрибутах, `case` и параметрах по умолчанию.

У исправления есть цена. Переход с `const` на `static readonly` ломает сборку потребителей, которые используют значение в атрибуте, в `case` или как значение параметра по умолчанию: `GetPageAsync(..., int pageSize = OrderLimits.MaxPageSize)` из раздела выше перестанет компилироваться. И значение параметра по умолчанию версионируется так же, как `const`: правила совместимости .NET считают смену такого значения breaking change. Поэтому в публичном API вместо него делают перегрузку или `int? pageSize = null`, а лимит подставляют внутри метода.

## Questions

> [!qard]- `const` или `readonly` — что выбрать и почему?
> `const` — для значения, которое известно при компиляции и не изменится никогда: `HoursPerDay = 24`. Всё остальное — `readonly` или `static readonly`.
> `const` копируется в код каждого потребителя, поэтому публичный `const` в библиотеке меняется только с пересборкой потребителей. Зато `const` работает в атрибутах, `case` и параметрах по умолчанию, а `static readonly` — нет.

> [!qard]- В библиотеке поменяли `public const`, а потребитель видит старое значение. Почему?
> Компилятор записал значение константы в код потребителя, когда собирал потребителя. За значением потребитель в библиотеку не обращается, поэтому новая DLL ничего не меняет.
> Новое значение появится только после пересборки потребителя. `static readonly` потребитель читает из библиотеки при выполнении, ему пересборка не нужна.

> [!qard]- Является ли `readonly`-поле immutable?
> Нет. `readonly` запрещает заменить ссылку в поле, но объект по этой ссылке можно менять: в `static readonly List<T>` работает `Add`.
> Для неизменяемого содержимого нужен `ImmutableArray<T>` или `FrozenSet<T>`. `IReadOnlyList<T>` не защищает: его приводят обратно к `List<T>`.

> [!qard]- Почему `static readonly` нельзя передать в атрибут или использовать как значение параметра по умолчанию?
> Там нужен constant expression, который компилятор полностью вычисляет при компиляции. `static readonly` получает значение при выполнении, поэтому в constant expression его использовать нельзя.
> Если значение нужно в атрибуте, оно должно быть `const`, и тогда приходится принять цену пересборки потребителей.

> [!qard]- Можно ли объявить `const` со значением `DateTime.UtcNow` или `new List<int>()`?
> Нет. Инициализатор `const` — constant expression, а чтение свойства и `new` в нём запрещены. Кроме того, `DateTime` нет в списке типов констант, а reference type, кроме `string`, может быть константой только со значением `null`.
> Оба значения объявляют `static readonly`: оно вычисляется при выполнении, один раз.

## Related

- [[C# Type System]] — хаб: типы C# и их модификаторы.
- [[Value vs Reference Types]] — почему `readonly` на reference type фиксирует ссылку, а не объект.
- [[Classes and Structs]] — `readonly struct`, `readonly`-члены, `ref readonly` и `in`.
- [[Records]] — `init`-accessors и неизменяемые данные.

## References

- [const (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/const). Constant expressions, запрет `static`, пересборка потребителей.
- [readonly (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/readonly). Где присваивают `readonly`-поле, ссылка против объекта.
- [C# specification: Classes](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/classes). Типы констант, `readonly`-поля, инициализация static-полей, auto-properties.
- [C# specification: Expressions](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions). Constant expressions и где они обязательны.
- [Init-only setters (C# 9 proposal)](https://github.com/dotnet/csharplang/blob/main/proposals/csharp-9.0/init.md). `init` присваивает `readonly`-поля того же типа.
- [Static constructors (C# guide)](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-constructors). Когда вызывается static constructor.
- [Performance Improvements in .NET 8 (.NET blog)](https://devblogs.microsoft.com/dotnet/performance-improvements-in-net-8/). `static readonly` как константа в tier-1 коде.
- [List<T>.AsReadOnly](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.asreadonly), [ImmutableArray<T>](https://learn.microsoft.com/en-us/dotnet/api/system.collections.immutable.immutablearray-1), [FrozenSet<T>](https://learn.microsoft.com/en-us/dotnet/api/system.collections.frozen.frozenset-1). Обёртки и неизменяемые коллекции.
- [What's new in .NET 8 runtime](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-8/runtime). Frozen collections.
- [Thread-safe collections (.NET)](https://learn.microsoft.com/en-us/dotnet/standard/collections/thread-safe/). `System.Collections.Generic` без синхронизации.
- [.NET breaking change rules](https://github.com/dotnet/runtime/blob/main/docs/coding-guidelines/breaking-change-rules.md). Смена значения параметра по умолчанию — breaking change.
- [NuGet dependency resolution](https://learn.microsoft.com/en-us/nuget/concepts/dependency-resolution). Прямая зависимость побеждает транзитивную.
- [IReadOnlyList<T>](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.ireadonlylist-1) и [C# specification: Conversions](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/conversions). Приведение интерфейса обратно к классу.
