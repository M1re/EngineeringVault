---
title: "Value vs Reference Types"
tags:
  - value-types
  - reference-types
  - boxing
status: done
publish: true
created: 2026-07-09
---

> [!summary]
> The defining difference is **copy semantics**, not where the value is stored. A **value type** (a `struct`, an `enum`, or a primitive like `int`) holds its value directly, so assigning it or passing it to a method copies the whole value. A **reference type** (a `class`, an array, `string`, or a delegate) holds a reference to an object, so copying the variable copies the reference and both variables point to the same object. This is why changing a `struct` through one variable does not affect another, while changing an object through one reference is visible through every reference to it.

## Copy Semantics

The one property that defines a value type is that it is copied by value. When you assign a value type, or pass it to a method, the runtime copies every field into the destination. The copy and the original are then independent.

```csharp
struct Point { public int X, Y; }

var a = new Point { X = 1, Y = 2 };
var b = a;     // b is a full copy of a
b.X = 99;      // changes b only; a.X is still 1
```

A reference type is copied by reference. The variable holds a reference to an object on the heap. Copying the variable copies the reference, not the object, so both variables point to the same object.

```csharp
class Box { public int X; }

var a = new Box { X = 1 };
var b = a;     // b holds the same reference as a
b.X = 99;      // changes the one object; a.X is now 99 too
```

The same rule applies to method arguments. Passing a value type gives the method its own copy. Passing a reference type gives the method a copy of the reference, so the method can change the caller's object through it.

## Where They Live

A common rule says "value types live on the stack, reference types on the heap". This is a simplification, and it is often wrong. Where a value lives depends on where it is declared, not only on whether it is a value type.

- A value type that is a **local variable** usually lives on the stack.
- A value type that is a **field of a class** lives inside that object, on the heap.
- A value type in an **array** lives inside the array, on the heap.
- A reference type's **object** always lives on the heap. The reference to it is itself a small value that follows the rules above, so a local reference usually lives on the stack.

So a value type is stored inline wherever it is declared, and a reference type's object is always on the heap. Stack versus heap is an implementation detail of the runtime. The property that always holds, and the one to reason about, is copy semantics.

## Equality and Defaults

By default, value types compare by value and reference types compare by identity. Two `struct` values are equal when their fields are equal; `Equals` compares them field by field, and `==` works only if the `struct` defines it. The default `struct` `Equals` and `GetHashCode` do this comparison by reflection and box each field, which is slow, so override them or use a `record struct` for value equality on a hot path. Two reference-type variables are equal with `==` only when they point to the same object, unless the type overrides equality. `string` and `record` types override it to compare by value.

The default value differs too. `default(T)` for a value type sets every field to zero (`0`, `false`, `'\0'`). `default(T)` for a reference type is `null`. A value type cannot hold `null` unless you wrap it as `Nullable<T>`, written `int?`.

## Boxing

Assigning a value type to a variable of type `object`, or to an interface it implements, **boxes** it. The runtime allocates an object on the heap and copies the value into that object. Reading the value back out with a cast **unboxes** it and copies the value out again.

```csharp
int n = 42;
object o = n;     // boxing: allocates a heap object that holds 42
int m = (int)o;   // unboxing: copies 42 back out
```

Boxing turns a cheap value into a heap allocation, which matters on a hot path. See [[Boxing and Unboxing]].

## Pitfalls & Trade-offs

**1. Modifying a value type through a copy changes nothing.** A property or a collection indexer returns a *copy* of a value type, so modifying that result modifies the copy, not the original.

```csharp
struct Point { public int X; public void Shift(int dx) => X += dx; }

var points = new List<Point> { new() { X = 1 } };
points[0].Shift(10);   // compiles, but Shift runs on a copy; points[0].X is still 1
```

This is the main reason to keep a `struct` immutable (a `readonly struct`). To change an element, replace the whole value: `points[0] = new Point { X = 11 };`.

**2. Copying a reference shares the object.** Two variables that hold the same reference see each other's changes, and this includes passing an object to a method.

```csharp
void AddTax(Invoice inv) => inv.Total *= 1.2m;   // mutates the caller's object

var invoice = new Invoice { Total = 100m };
AddTax(invoice);   // invoice.Total is now 120: the method changed the same object
```

If the method must not change the caller's object, copy it first or use an immutable type.

**3. Value types box when used as `object` or an interface.** Each box is a heap allocation, and on a hot path the allocations add up.

```csharp
void Log(object value) { }   // Log(42) boxes the int into a new heap object
```

Generic APIs (`List<int>`, `IComparable<T>`) keep the value unboxed; non-generic `object`-based ones do not.

**4. A large struct is copied on every assignment and call.** A value type with many fields is copied in full each time it is passed. For a big `struct` on a hot path, pass it by reference with `in`, or use a `class`.

```csharp
struct Matrix4x4 { /* 16 floats */ }
void Transform(in Matrix4x4 m) { }   // in: passed by reference, not copied
```

`ref` and `out` also pass a value type by reference; `in` adds that the method will not change it. The trade-off: a `struct` avoids a heap allocation but costs a copy; a `class` costs an allocation but is passed by reference.

## In Production

A service keeps a live counter per tenant in a mutable `struct`, held in a list:

```csharp
struct Counter { public int Value; public void Increment() => Value++; }

var counters = new List<Counter> { new(), new() };
foreach (var c in counters)
    c.Increment();   // c is a copy of each element; the list is never changed
```

Each `Increment` runs on `c`, the copy the `foreach` made from the list element. The list still holds the original zeroed counters. There is no error and no warning. The counters are simply always zero, which shows up as wrong metrics in production, not as a crash. The bug is a mutable `struct` combined with the copy the loop makes.

The fix is either to make `Counter` a `class`, so the loop variable refers to the same object, or to keep the `struct` and write the whole value back:

```csharp
for (int i = 0; i < counters.Count; i++)
{
    var c = counters[i];
    c.Increment();
    counters[i] = c;   // write the modified copy back into the list
}
```

A `readonly struct` would have turned this silent bug into a compile error, which is why a value type is usually best kept immutable.

## Questions

> [!question]- What actually distinguishes a value type from a reference type?
> Copy semantics. A value type is copied by value: assigning it or passing it copies every field, and the copy is independent. A reference type is copied by reference: the variable holds a reference to a heap object, so copying the variable makes both point to the same object. Storage location (stack or heap) is a consequence and an implementation detail, not the defining property.

> [!question]- Is "value types live on the stack" true?
> Not as a rule. A value type lives where it is declared. A local value type usually lives on the stack, but a value type that is a field of a class lives on the heap inside that object, and a value type in an array lives on the heap inside the array. A reference type's object is always on the heap. Reason about copy semantics, not about the stack.

> [!question]- You put a mutable `struct` in a `List<T>` and call a method that changes it, but nothing changes. Why?
> The list indexer and `foreach` return a *copy* of the value-type element, so the method runs on the copy and leaves the list element untouched. To change the element, replace the whole value (`list[i] = newValue`) or make the type a `class`. Keeping structs immutable (`readonly struct`) turns this silent bug into a compile error.

> [!question]- A profiler shows unexpected heap allocations on a hot path built from value types. What causes them, and how do you remove them?
> Boxing. A value type is boxed — wrapped in a new heap object — whenever it is used as `object` or a non-generic interface: assigned to an `object` variable, passed to an `object` parameter, or compared through a non-generic interface. Each box is a heap allocation and adds GC pressure. Remove it by keeping the value in generic APIs (`List<int>`, `IComparable<T>`), which never box, and by avoiding `object`-typed parameters and default `struct` `Equals` on the hot path.

> [!question]- How do value and reference types differ in equality and default value?
> A value type compares by value: `Equals` checks its fields one by one, though the default does this by reflection and boxes each field, so override it or use a `record struct` on a hot path. A reference type compares by identity: `==` is true only when both variables point to the same object, unless the type overrides equality (as `string` and records do). The default of a value type is all fields zeroed; the default of a reference type is `null`, and a value type cannot be `null` unless wrapped as `Nullable<T>`.

## Related

- [[Stack vs Heap]]. Where objects and locals are stored, and how each is reclaimed.
- [[Boxing and Unboxing]]. The heap allocation a value type pays when used as `object` or an interface.
- [[Classes and Structs]]. Declaring reference types and value types, and `readonly struct`.
- [[Garbage Collection]]. Reference-type objects live on the heap the GC manages.
- [[const vs readonly]]. `const` is limited to value-type literals and `string`.

## References

- [Value types (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-types). Structs, enums, and value semantics.
- [Reference types (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/reference-types). Classes, arrays, delegates, and reference semantics.
- [The Truth About Value Types (Eric Lippert)](https://ericlippert.com/2010/09/30/the-truth-about-value-types/). Why copy semantics, not the stack, is the defining property.
