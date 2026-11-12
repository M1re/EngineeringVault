---
title: "const vs readonly"
summary: "const — значение, которое компилятор записывает в код каждого места, где его читают; readonly — поле, которое читают при выполнении и не переприсваивают после конструктора."
tags: [constants, immutability, versioning]
status: done
publish: true
created: 2026-07-19
---

> [!summary]
> `const` — значение, которое компилятор записывает в код каждого места, где его читают. `readonly` — поле: его значение читают при выполнении, а после конструктора присвоить заново нельзя.
> Почему это важно: изменённый `public const` потребитель увидит только после своей пересборки. А `readonly` фиксирует ссылку в поле, но не объект, на который она указывает.

## const

**Что компилятор делает с `const`?** Он вычисляет значение при компиляции и записывает его в код каждого места, где константу читают, в том числе в других сборках. При выполнении никакое поле не читается.

Тип константы — число, `bool`, `char`, `string` или enum. Значение должно быть известно при компиляции, поэтому `DateTime.UtcNow` константой быть не может:

```csharp
public const string DefaultCurrency = "EUR";                // ✅ литерал известен компилятору
public const long OrderCutoffTicks = DateTime.UtcNow.Ticks; // ❌ ошибка компиляции: значение известно только при выполнении
```

`const` неявно static, поэтому его читают через имя типа: `OrderLimits.MaxPageSize`. `static const` не компилируется.

## readonly

**Где можно присвоить `readonly`-поле?** В объявлении или в конструкторе того же класса. После конструктора присваивание — ошибка компиляции. Исключение (C# 9+) — `init`-accessor того же типа, см. [[Records]].

**`readonly` без `static`** хранит своё значение в каждом объекте. Типичный случай — зависимость, которую DI-контейнер передаёт в конструктор: подменить её после создания сервиса нельзя.

```csharp
public class OrderService
{
    private readonly IOrderRepository _repository;
    public OrderService(IOrderRepository repository) => _repository = repository; // можно: конструктор
    public void SwitchRepository(IOrderRepository other) => _repository = other;  // ❌ ошибка компиляции: конструктор уже закончился
}
```

**`static readonly`** хранит одно значение на тип. Присвоить его можно в объявлении или в static-конструкторе, а значение может вычисляться при выполнении: `private static readonly long ServiceStartedTicks = DateTime.UtcNow.Ticks;` — такая же строка с `const` в примере выше не компилируется.

## Compile-Time vs Runtime

**Библиотека поменяла `public const`, сервису подложили новую DLL — почему сервис видит старое значение?**

```csharp
// Orders.Contracts (библиотека)
public static class OrderLimits { public const int MaxPageSize = 100; }
// OrdersApi (сервис), исходный код
if (pageSize > OrderLimits.MaxPageSize) throw new ArgumentOutOfRangeException(nameof(pageSize));
// что компилятор записал в сборку сервиса (показано как C#): вместо имени константы — само число
if (pageSize > 100) throw new ArgumentOutOfRangeException(nameof(pageSize));
```

В DLL сервиса уже лежит `100`, и за значением сервис в библиотеку не обращается. Поэтому новая DLL библиотеки с `MaxPageSize = 200` ничего не меняет, пока сервис не пересоберут.

Риск несёт `public const`, который читают другие сборки. Исправление: `public static readonly int MaxPageSize = 100;`. Это поле сервис читает из библиотеки при выполнении, поэтому новой DLL достаточно.

Но есть три типичных места, где значение нужно компилятору уже при компиляции (в спецификации — constant expression), и туда подходит только `const`. У `static readonly` значение появляется только при выполнении, поэтому с `static readonly MaxPageSize` каждая из этих строк — ошибка компиляции:

```csharp
[Range(1, OrderLimits.MaxPageSize)] public int PageSize { get; init; }        // 1. аргумент атрибута: валидация размера страницы
Task<Order[]> GetPageAsync(int page, int pageSize = OrderLimits.MaxPageSize); // 2. значение параметра по умолчанию
case OrderLimits.MaxPageSize:                                                 // 3. метка case внутри switch
```

## readonly Is Not Immutable

**Можно ли добавить элемент в `static readonly List<T>`?** Да: `readonly` запрещает заменить ссылку в поле, но не менять объект по этой ссылке.

```csharp
public static readonly List<string> SupportedCurrencies = new List<string> { "EUR", "USD" };
SupportedCurrencies.Add("BTC");            // ✅ компилируется: меняется объект, ссылка та же
SupportedCurrencies = new List<string>();  // ❌ ошибка компиляции: замена ссылки в поле
```

Если содержимое тоже должно быть неизменным — frozen-коллекции (новые в .NET 8, namespace `System.Collections.Frozen`): `FrozenSet<T>` и `FrozenDictionary<TKey,TValue>` нельзя изменить после создания. `ToFrozenSet()` / `ToFrozenDictionary()` строят их из готовых значений: `public static readonly FrozenSet<string> SupportedCurrencies = new[] { "EUR", "USD" }.ToFrozenSet();`.

## Pitfalls & Trade-offs

1. **Изменяемое значение как `public const` в общей библиотеке.** Плюс `const` — его можно использовать в трёх местах из примера выше: в атрибуте, как значение параметра по умолчанию и в `case`. Минус — значение записано в код каждого потребителя, и новое значение потребитель увидит только после своей пересборки. Поэтому публичное значение, которое может измениться между версиями, объявляют `static readonly`, а `const` оставляют для того, что не меняется никогда (`HoursPerDay = 24`). Значения enum ведут себя так же, как `const`: они тоже записываются в код потребителя.
2. **`IReadOnlyList<T>` как защита.** Интерфейс прячет `Add`, но объект за ним остаётся `List<T>`. Приведение `(List<string>)` возвращает тот же список, и его можно изменить. Исправление — `FrozenSet<T>` из раздела выше.
   ```csharp
   public static IReadOnlyList<string> SupportedCurrencies => _currencies; // внутри List<string>
   ((List<string>)CurrencyCatalog.SupportedCurrencies).Add("BTC");          // ❌ меняет общий список
   ```

## In Production

`PaymentService` хранит комиссию по валютам в `static readonly Dictionary`. Такой словарь один на всё приложение: все запросы читают один и тот же объект. Обработчик промо-заказа хочет посчитать заказ без комиссии и пишет ноль прямо в этот словарь. С этого момента без комиссии проходят все EUR-платежи, а не только промо-заказ.

Ошибок нет, запросы не падают: проблему видно только по упавшему доходу от комиссий в дневном отчёте. Держится она до перезапуска сервиса, когда словарь создаётся заново.

```csharp
// ❌ BAD: запрос меняет общую таблицу
private static readonly Dictionary<string, decimal> FeeByCurrency = new Dictionary<string, decimal> { ["EUR"] = 0.5m, ["USD"] = 0.4m };
if (order.IsPromo) FeeByCurrency["EUR"] = 0m; // комиссия EUR теперь 0 для всех платежей
// ✅ GOOD: таблицу изменить нельзя, промо-цена — в локальной переменной
private static readonly FrozenDictionary<string, decimal> FeeByCurrency = new Dictionary<string, decimal> { ["EUR"] = 0.5m, ["USD"] = 0.4m }.ToFrozenDictionary();
decimal fee = order.IsPromo ? 0m : FeeByCurrency[order.Currency];
```

## Questions

> [!qard]- `const` или `readonly` — что выбрать и почему?
> `const` — для значения, которое известно при компиляции и не изменится никогда. Остальное — `readonly` или `static readonly`.
> `const` записывается в код каждого потребителя, поэтому публичный `const` меняется только с пересборкой потребителей. Зато только `const` работает в атрибутах, `case` и параметрах по умолчанию.

> [!qard]- В библиотеке поменяли `public const`, а потребитель видит старое значение. Почему?
> Компилятор записал значение в код потребителя, когда собирал потребителя. За значением потребитель в библиотеку не обращается, поэтому новая DLL ничего не меняет.
> Нужна пересборка потребителя. `public static readonly` потребитель читает из библиотеки при выполнении, ему хватает новой DLL.

> [!qard]- Является ли `readonly`-поле immutable?
> Нет. `readonly` запрещает заменить ссылку в поле, но объект по ссылке менять можно: `Add` в `static readonly List<T>` компилируется.
> `IReadOnlyList<T>` не спасает: его приводят обратно к `List<T>`. Неизменяемое содержимое даёт `FrozenSet<T>` или `FrozenDictionary<TKey,TValue>`.

> [!qard]- Почему `static readonly` нельзя использовать в атрибуте, `case` или как значение параметра по умолчанию?
> Там нужен constant expression — выражение, которое компилятор полностью вычисляет при компиляции. `static readonly` получает значение при выполнении, поэтому constant expression не является.
> Если значение нужно в атрибуте, его объявляют `const` и принимают цену: пересборку потребителей при каждом изменении.

## Related

- [[C# Type System]] — хаб: типы C# и их модификаторы.
- [[Value vs Reference Types]] — почему `readonly` на reference type фиксирует ссылку, а не объект.
- [[Classes and Structs]] — `readonly struct`, `readonly`-члены, `ref readonly` и `in`.
- [[Records]] — `init`-accessors и неизменяемые данные.

## References

- [const (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/const). Constant expressions, запрет `static`, пересборка потребителей.
- [readonly (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/readonly). Где присваивают `readonly`-поле, ссылка против объекта.
- [C# specification: Classes](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/classes). Типы констант, `readonly`-поля.
- [C# specification: Expressions](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions). Constant expressions и где они обязательны.
- [Init-only setters (C# 9 proposal)](https://github.com/dotnet/csharplang/blob/main/proposals/csharp-9.0/init.md). `init` присваивает `readonly`-поля того же типа.
- [FrozenSet<T>](https://learn.microsoft.com/en-us/dotnet/api/system.collections.frozen.frozenset-1). Неизменяемое множество и `ToFrozenSet`.
- [What's new in .NET 8 runtime](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-8/runtime). Frozen collections.
- [IReadOnlyList<T>](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.ireadonlylist-1) и [C# specification: Conversions](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/conversions). Приведение интерфейса обратно к классу.
