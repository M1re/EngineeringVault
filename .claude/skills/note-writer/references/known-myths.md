# Known Myths

Plausible claims that are wrong. Researchers, the fact-checker, and the auditor check against this
list; a note must never repeat one. The fact-checker still confirms the correct version against a
primary source every time it is used. Add a myth whenever a run or the author catches a new one.

| Myth | What is actually true |
|---|---|
| `ValueTask` lives on the stack. | `ValueTask` is a `struct`. A struct lives where its container lives: a local can stay on the stack, but a field of a class (or of an async state machine boxed to the heap) is on the heap. |
| `Thread.Abort` stops a thread. | On .NET Core and .NET 5+ `Thread.Abort` throws `PlatformNotSupportedException`. Use cooperative cancellation (`CancellationToken`). |
| Thread pool starvation means too many context switches. | Starvation means pool threads are blocked (for example sync over async: `.Result`, `.Wait()`), so queued work waits while the pool adds new threads only gradually. |
| `lock` with `await` releases the lock on the wrong thread. | `await` inside a `lock` block does not compile (error CS1996). Use `SemaphoreSlim.WaitAsync()` for async code. |
| 1000 `Task.Run` calls create 1000 threads. | `Task.Run` queues work items to the thread pool. The pool grows its thread count gradually; the extra work waits in the queue. |
| Static data lives "per application domain" in .NET. | .NET Core and .NET 5+ support only one application domain per process; creating more is not supported. |
| `UseCors` goes after authentication. | The documented middleware order puts `UseCors` before `UseAuthentication` and `UseAuthorization`. |
| `ConfigureAwait(false)` is never needed in ASP.NET Core. | ASP.NET Core app code has no `SynchronizationContext`, but general-purpose library code still uses `ConfigureAwait(false)` because it can run under one. |
| `async` runs the method on another thread. | `async` does not create a thread. The method runs synchronously until the first `await` of an incomplete task. |
