---
title: "const vs readonly"
tags:
  - constants
  - immutability
  - versioning
status: done
publish: true
created: 2026-07-19
---

> [!summary]
> `const` and `readonly` both mark a value that is set once, but they differ in *when*. A `const` is set at **compile time**: the compiler copies its literal value into every place that reads it, including code in other assemblies. A `readonly` field is set at **runtime**, once, in its declaration or a constructor. This is why changing a public `const` in a library has no effect on a consumer until the consumer is recompiled, while a `readonly` value changes without a recompile.

## const

A `const` is a value the compiler knows at compile time. You can declare a `const` only of a type the compiler can write as a literal: the built-in numeric types, `bool`, `char`, `string`, an enum, or `null` for a reference type. You cannot make a `const` from a value computed at runtime.

```csharp
public const int MaxRetries = 3;
public const string ApiVersion = "v1";
```

A `const` is implicitly `static`. You read it through the type name (`Config.MaxRetries`), not through an instance. A `const` has no field in memory. Wherever the code reads `MaxRetries`, the compiler replaces that read with the literal `3`.

## readonly

A `readonly` field is a real field that is set once at runtime. You assign it in its declaration or in a constructor, and nowhere else. After the constructor finishes, the field cannot be reassigned.

```csharp
public readonly DateTime StartedAt = DateTime.UtcNow;    // a value computed at runtime
public static readonly int[] DefaultPorts = { 80, 443 };
```

Because the assignment happens at runtime, a `readonly` field can hold any type and any computed value. It can be an instance field, or a single shared field with `static readonly`. A `static readonly` field is set once, in the static constructor or field initializer, before the type is first used. Use `readonly` when `const` cannot express the value.

## Compile-Time vs Runtime

This is the difference that matters in practice. A `const` has no field at runtime. The compiler substitutes its literal value into the IL of every read, including reads in other assemblies that reference the library. A `readonly` field is read at runtime from the field itself.

The effect appears across assembly boundaries. Suppose a library declares `public const int PageSize = 20`, and a service is compiled against that library. The value `20` is now written into the service's own compiled code. If the library changes to `PageSize = 50` and only the library's DLL is redeployed, the service still uses `20`, because `20` is in the service's own IL, not in the library. The service uses `50` only after the service is recompiled against the new library.

A `public static readonly int PageSize = 20` does not have this problem. The service reads the field from the library at runtime, so redeploying only the library's DLL changes the value the service sees.

## readonly Is Not Immutable

`readonly` fixes the field, not the object the field points to. For a reference type, the reference cannot change, but the object it points to can still be mutated.

```csharp
public static readonly List<string> Regions = new() { "eu", "us" };

Regions.Add("ap");             // allowed: the list is mutated, the reference is unchanged
Regions = new List<string>();  // compile error: the field cannot be reassigned
```

To make the contents unchangeable too, use an immutable type such as `ImmutableArray<string>`, or expose the field as `IReadOnlyList<string>` so callers cannot call `Add`.

## Pitfalls & Trade-offs

**1. A public `const` is copied into every caller.** If a public value might ever change, do not declare it `const`. A consumer compiled against the `const` keeps the old value until the consumer is recompiled. Declare a value that could change as `public static readonly` instead.

```csharp
public const int DefaultPageSize = 20;           // the literal is copied into every consumer's IL
public static readonly int DefaultPageSize = 20; // read from this assembly at runtime
```

**2. `readonly` on a reference type does not make the object read-only.** The reference is fixed, but the object is still mutable.

```csharp
public static readonly Dictionary<string, int> Limits = new() { ["free"] = 10 };
Limits["free"] = 999;   // allowed: the dictionary is changed through the fixed reference
```

Use an immutable type, or expose a read-only view, if the contents must not change.

**3. `const` cannot hold a runtime value.** A `const` must be a compile-time literal, so a computed value does not compile.

```csharp
public const DateTime StartedAt = DateTime.UtcNow;   // compile error
public static readonly DateTime StartedAt = DateTime.UtcNow;   // correct
```

**4. `static readonly` cannot go where a compile-time constant is required.** Only a `const` is a compile-time constant expression. A `case` label, an attribute argument, and a default parameter value each require a compile-time constant, so they accept `const` but not `static readonly`.

```csharp
const int Max = 100;
static readonly int Limit = 100;

void M(int x = Max)   { }   // ok
void N(int x = Limit) { }   // compile error: a default value must be a constant
```

If a value has to be used in one of these places, it must be `const`, and you accept the versioning cost from Pitfall 1.

A shared library `Company.Common` exposes a page size:

```csharp
public const int DefaultPageSize = 20;
```

Twelve services reference the library. Product asks to raise the default to 50. You change the `const` to `50`, publish a new version of the library, and redeploy the library's DLL to every service. Nothing changes. Every service still returns 20 items per page, because the value `20` was written into each service's own compiled code when the service was built. Each service returns 50 only after the service is rebuilt against the new library and redeployed.

The fix is to make the value a runtime field:

```csharp
public static readonly int DefaultPageSize = 20;
```

Now each service reads `DefaultPageSize` from `Company.Common` at runtime. Publishing the library with the value changed to `50` and restarting the services is enough, with no rebuild of the services. As a rule, a value in a public API that might change across versions should be `static readonly`, not `const`, unless the value has to be used in a compile-time context such as a `case` label or a default parameter, which only `const` allows (Pitfall 4). Keep `const` for values that never change, such as `DaysPerWeek = 7`.

## Questions

> [!question]- `const` or `readonly` — which, and why?
> Use `const` only for a value that is fixed forever and known at compile time (`DaysPerWeek = 7`), and only for a primitive, `string`, `enum`, or `null`. Use `readonly` for everything else: a value computed at runtime, a value of any other type, or a public value that might change in a later version. The deciding factor is usually whether the value crosses an assembly boundary and might change — a `const` is baked into consumers, a `readonly` field is not.

> [!question]- You change a public `const` in a library and redeploy only the library's DLL. Why does nothing change in the consumer?
> The compiler substituted the `const`'s literal value into the consumer's own IL when the consumer was built. The consumer never reads the value from the library at runtime, so replacing the library's DLL does not change the value the consumer uses. The consumer picks up the new value only after it is recompiled against the new library. A `static readonly` field would be read from the library at runtime and would not need the recompile.

> [!question]- Is a `readonly` field immutable?
> Not necessarily. `readonly` stops the field from being reassigned after the constructor. For a reference type, that fixes the reference but not the object. A `readonly List<T>` can still have items added; only reassigning the list itself is blocked. For truly unchangeable contents, use an immutable type or expose a read-only view such as `IReadOnlyList<T>`.

> [!question]- Can a `const` hold `DateTime.UtcNow` or `new List<int>()`?
> No. A `const` must be a value the compiler can write as a literal at compile time, which rules out any computed value and any reference type other than `string` or `null`. `DateTime.UtcNow` and `new List<int>()` are computed at runtime, so they must be `static readonly`.

## Related

- [[Value vs Reference Types]]. `const` is limited to value-type literals and `string`; `readonly` on a reference type fixes the reference, not the object.
- [[Classes and Structs]]. `readonly` also applies to fields and to a `readonly struct`.
- [[Records]]. Another route to immutable data in C#.

## References

- [const (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/const). Compile-time constants, allowed types, and the versioning caveat.
- [readonly (C# reference)](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/readonly). Runtime `readonly` fields and `static readonly`.
