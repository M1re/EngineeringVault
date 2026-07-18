---
publish: true
title: Async/Await
created: 2026-07-11
modified: 2026-07-18T15:30:00.000+03:00
published: 2026-07-18T15:30:00.000+03:00
tags:
  - async
  - concurrency
  - task
  - io-bound
status: done
---

> [!summary]
> `async`/`await` lets one thread start a slow operation and then go do other work instead of waiting. The method pauses at `await`, the thread is freed, and the method continues when the result is ready. This is how a server handles thousands of requests on just a few threads. It is concurrency, not parallelism. Nothing runs faster. The thread just stops waiting.

## Blocking vs Async

A thread is expensive. Each one holds about 1 MB of stack memory and takes one slot in the thread pool.

The normal way to wait for an I/O operation is to block a thread. The thread calls something like `socket.Receive()` and then stops running. The OS parks that thread until the data arrives. A database call takes about 20 ms, and for all of that time the thread does no useful work. It still holds its 1 MB of stack and its pool slot the whole time.

Now picture a server handling many requests at once. Each request blocks its own thread on some I/O. The pool runs out of free threads. New requests have no thread to run on, so they wait in a queue. This is **thread-pool starvation**, and it is one of the most common ways a .NET service falls over under load.

`async`/`await` fixes this. While an I/O operation is in flight there is nothing for a thread to do, so the method does not keep one. It hands the operation to the OS, frees its thread back to the pool, and resumes only when the result is ready.

## I/O-bound & CPU-bound

The whole model turns on one question. While the work happens, is a thread doing anything?

**I/O-bound** work (network, disk, database) happens somewhere else. A network card, a disk, or another machine does it. No thread is needed while it runs. This is what `async` is built for.

**CPU-bound** work (a tight loop, hashing, parsing) is the thread burning cycles. Here `async` does nothing on its own. Wrapping a loop in an `async` method still pins the thread that runs it. To move it off that thread you have to say so with `await Task.Run(() => Work())`.

> [!tip] Quick test
> Ask "while this waits, is a thread doing something?" If no (I/O), `async` frees the thread for free. If yes (CPU), `async` changes nothing. You need `Task.Run` or real parallelism.

## State Machine

The runtime has no `async` keyword. The C# compiler does all the work.

Start from the problem the compiler has to solve. A normal method keeps its local variables on the thread's stack. That stack space is released the moment the method returns. An async method breaks this rule. It returns early at an `await`, then resumes later to finish the rest. If its locals stayed on the stack, they would already be gone when it came back.

So the compiler moves them into a **state machine**: a small value that holds the method's locals as fields, plus a marker for where the method stopped. While the method runs straight through, this value sits on the stack and costs nothing. The moment the method actually pauses at an `await`, it is copied to the heap. There it outlives the early return, so the method can pick up from it later. This is why the fast path is cheap: a method that finishes without ever pausing never copies its state machine to the heap. (It may still allocate a `Task` for its result, unless that result is one the runtime caches. More on that under Task & ValueTask.)

The state machine holds a few things:

- an `int` **state** field. It says which `await` the method is paused at. `-1` means not started or running, `-2` means done.
- a **builder** that owns the returned `Task` and completes it. It is `AsyncTaskMethodBuilder<T>` for `async Task<T>`, `AsyncValueTaskMethodBuilder<T>` for `ValueTask<T>`, and `AsyncVoidMethodBuilder` for `async void`.
- the **locals** that live across an `await`, lifted into fields so they survive the pause.
- the **awaiter** for the thing being awaited.

All the method's code moves into one `MoveNext()` method, split into pieces at each `await`. Take this method:

```csharp
public async Task<int> CountDotNetAsync(string url)
{
    string html = await _http.GetStringAsync(url);
    return Regex.Matches(html, @"\.NET").Count;
}
```

The compiler turns it into something like this. It is simplified, but true to the shape:

```csharp
private struct StateMachine : IAsyncStateMachine   // a struct in Release, a class in Debug
{
    public int state;
    public AsyncTaskMethodBuilder<int> builder;
    public HttpClient _http;
    public string url;
    private TaskAwaiter<string> awaiter;   // lifted so it survives the pause

    public void MoveNext()
    {
        int result;
        try
        {
            if (state == 0) goto RESUME;              // second entry: jump past the await

            var task = _http.GetStringAsync(url);
            awaiter = task.GetAwaiter();
            if (!awaiter.IsCompleted)                 // fast path: skip all this if already done
            {
                state = 0;
                builder.AwaitUnsafeOnCompleted(ref awaiter, ref this); // hook continuation, box to heap
                return;                               // method returns here; the caller's thread is freed
            }
        RESUME:
            state = -1;
            string html = awaiter.GetResult();        // re-throws here if the task faulted
            result = Regex.Matches(html, @"\.NET").Count;
        }
        catch (Exception ex) { state = -2; builder.SetException(ex); return; }

        state = -2;
        builder.SetResult(result);                    // completes the Task the caller holds
    }
    // SetStateMachine omitted
}
```

The trick is that `MoveNext` runs more than once, and the `state` field tells it where to continue each time. Follow the two runs.

1. **First run.** The method starts the download and gets its awaiter. If the download is not finished, it sets `state = 0` (the marker for "paused at the first `await`"), asks the builder to call `MoveNext` again once the awaiter completes, and returns. The caller receives a `Task` that is not done yet, and the caller's thread is now free.
2. **Second run.** When the download finishes, the runtime calls `MoveNext` again. This time `state` is `0`, so the `goto RESUME` at the top jumps straight past the `await`. The method reads the downloaded text with `GetResult()`, runs the rest of the body, and calls `builder.SetResult(...)`. That marks the returned `Task` as complete, which in turn runs whatever was awaiting it.

```mermaid
sequenceDiagram
    participant C as Caller thread
    participant M as MoveNext (state machine)
    participant OS as OS async I/O
    C->>M: 1st MoveNext, runs sync to await
    M->>OS: start I/O (no thread waits)
    M-->>C: return Task (state=0, paused)
    Note over C: thread returns to pool, serves other work
    OS-->>M: I/O done, schedule continuation
    Note over M: 2nd MoveNext on a pool thread, SetResult
```

## Awaiter Pattern

`await` does not need a `Task`. It works on anything that follows the **awaiter pattern**. This is why `ValueTask`, `Task.Yield()`, and even your own types can be awaited.

`await expr` compiles into calls on `expr.GetAwaiter()`. The awaiter it returns must provide three members.

- `bool IsCompleted { get; }` is the fast path. If the result is already there, the compiler skips the pause, calls `GetResult()` right away, and creates no `Task` and no continuation. A sync-completing `await` is cheap.
- `void OnCompleted(Action continuation)` comes from `INotifyCompletion`. It means "call this when you are done." The awaiter uses it to hook the continuation to the real signal, such as an IOCP callback or a timer.
- `TResult GetResult()` returns the value, or re-throws the stored exception with its original stack trace.

In the generated code the compiler actually calls `builder.AwaitUnsafeOnCompleted`, which routes through `ICriticalNotifyCompletion.UnsafeOnCompleted`. The builder flows `ExecutionContext` itself, so the awaiter does not have to. `OnCompleted` is the minimum contract. The "unsafe" version is the hot path.

So `await` is simple underneath. Is the result ready? If not, register a callback and return. When signalled, get the result and continue.

## Threads and I/O

For real async I/O the operation goes to the OS. Windows uses I/O completion ports. Linux uses epoll, and macOS and BSD use kqueue. From the moment the request starts until the data arrives, no managed thread is tied to it. The network card or disk does the work. The OS raises an event when it is done. Only then does the runtime take a [[Threads and the Thread Pool|thread-pool]] thread to run the continuation, which is just `MoveNext` again.

> [!warning] Remember this
> `await` does not create a thread, and for I/O it uses no thread while it waits. The old idea that "async runs my method on a background thread" is wrong and leads to bad code. For CPU work the opposite is true. `async` moves nothing off the thread by itself.

## Synchronization Context

First, what a `SynchronizationContext` is. It is an object that represents a place to run code. It has one key method, `Post`, which means "run this callback on the thread, or threads, that I stand for." Different kinds of app plug in different implementations.

The *continuation* is the rest of your method after the `await`. When the awaited operation finishes, that continuation has to run on some thread. By default, `await` remembers the `SynchronizationContext` that was active when it paused. It reads `SynchronizationContext.Current`, or `TaskScheduler.Current` if there is no context (unless that is the default scheduler). When the result is ready, it calls that context's `Post` to run the continuation back on it, instead of on a random pool thread.

Why this matters depends on the app.

- A UI app (WPF, WinForms) has one special thread, the UI thread, and only that thread may touch UI controls. Its `SynchronizationContext` stands for that single thread. So the code after your `await` resumes on the UI thread, and updating a control is safe.

```csharp
async void OnClick(object sender, EventArgs e)   // a WinForms event handler
{
    string data = await FetchAsync();   // the UI thread is freed, so the app stays responsive
    MyLabel.Text = data;                // runs back on the UI thread, so touching the control is legal
}
```

Without the captured context, `MyLabel.Text = data` would run on a pool thread and throw a cross-thread error.

- Classic ASP.NET had a per-request context. ASP.NET Core has none, so there is nothing to capture and the continuation just runs on any free pool thread. That is fine, because a request is not tied to one specific thread.

`await task.ConfigureAwait(false)` says "I do not need the original context. Any pool thread is fine." In library code this is the right default. It is a little faster, and it avoids a common deadlock (see the pitfalls). In UI code, where you do need the UI thread afterwards, leave it on.

Two things are easy to mix up.

- `SynchronizationContext` is *where* the continuation runs. This is what `ConfigureAwait` controls.
- `ExecutionContext` is *ambient state*, like `AsyncLocal<T>` values. This always flows across `await`. `ConfigureAwait(false)` does not stop it.

## Task & ValueTask

`Task<T>` is a class. When an `async` method really pauses, it allocates one on the heap, along with the boxed state machine. For most code this one allocation does not matter. But on a hot path that usually finishes right away, such as a cache hit or a buffered read, allocating a `Task<T>` every call just to say "already done" is waste.

`ValueTask<T>` is a struct. It wraps either a ready value, which costs no allocation, or a real `Task<T>` or `IValueTaskSource<T>` for the slow path. Return it when the method is usually synchronous.

```csharp
public ValueTask<int> ReadAsync()
{
    if (_buffer.TryDequeue(out int v))
        return new ValueTask<int>(v);          // hot path: no allocation
    return new ValueTask<int>(ReadSlowAsync()); // rare path: wraps a real Task
}
```

The cost is a set of strict rules, because the struct may be backed by a reused object.

- Await it at most once. Awaiting it twice is undefined behaviour.
- Do not await it twice at the same time, do not read `.Result` before it is done, and do not store it in a field. If you need any of that, call `.AsTask()` once and use that.

> [!tip] Rule of thumb
> Use `ValueTask<T>` for low-level, high-frequency methods that usually finish synchronously. For normal application code, plain `Task<T>` is simpler and safer. Reach for `ValueTask` when a profiler shows allocations hurt, not by default.

The runtime also lowers `Task`'s cost by itself. `AsyncTaskMethodBuilder` caches finished tasks for common results. It reuses the non-generic completed `Task`, `Task<bool>` for `true` and `false`, and small `int`s. So `return true;` from an `async Task<bool>` that finished synchronously allocates nothing. For `ValueTask`-returning methods you can also avoid the backing allocation with the opt-in `PoolingAsyncValueTaskMethodBuilder`, which reuses state-machine objects from a pool.

## Cancellation

Async work is cancelled cooperatively. You cannot safely stop a thread in the middle, so the method being called has to agree to stop. The tool is `CancellationToken`. You pass one in, and well-behaved async APIs check it.

```csharp
public async Task<string> FetchAsync(string url, CancellationToken ct)
{
    using var resp = await _http.GetAsync(url, ct);   // honours ct: aborts the request
    ct.ThrowIfCancellationRequested();                // your own checkpoints between awaits
    return await resp.Content.ReadAsStringAsync(ct);
}
```

A cancelled operation throws `OperationCanceledException`. In an `async` method, throwing any `OperationCanceledException` completes the returned `Task` as `Canceled`, not `Faulted`, no matter which token it carries. (The token-matching rule, where the task is `Canceled` only if the exception's token matches the task's own token and `Faulted` otherwise, applies to delegate tasks like `Task.Run(action, token)`, not to async methods.) `TaskCanceledException` is a subclass of it. You create tokens with `CancellationTokenSource`, which also has `CancelAfter(timeout)` for deadlines. See [[CancellationToken]] for the full model.

## Composition

Starting independent operations together, instead of one after another, is where async saves real time.

```csharp
var a = FetchAsync(url1, ct);          // start both, do not await yet
var b = FetchAsync(url2, ct);
string[] results = await Task.WhenAll(a, b);   // about max(a, b), not a + b
```

- `Task.WhenAll` returns a `Task` you await. It finishes when all of them finish. If several fail, awaiting it throws only the first exception, but its `Task.Exception` holds them all in an `AggregateException`.
- `Task.WhenAny` finishes at the first one to complete. Use it for timeouts, like `await Task.WhenAny(work, Task.Delay(t))`, or fastest-of-N.
- `Task.WaitAll` and `Task.WaitAny` block the calling thread. Prefer the `When*` versions inside async code. The `Wait*` versions bring back the blocking you are trying to avoid.

## Pitfalls & Trade-offs

**1. Blocking on an async call can deadlock.** This is the classic one.

```csharp
// In a UI event handler or a classic ASP.NET action:
public IActionResult Get()
{
    var data = FetchAsync().Result;   // blocks this thread
    return Ok(data);
}
```

The thread holds a single-threaded `SynchronizationContext` and blocks on `.Result`. The continuation inside `FetchAsync` needs that same context to run, but the context is blocked. Neither side moves and the app hangs. The fix is to await all the way down.

```csharp
public async Task<IActionResult> Get()
{
    var data = await FetchAsync();
    return Ok(data);
}
```

`GetAwaiter().GetResult()` is not a fix. It deadlocks the same way. It only changes how the exception is unwrapped, with no `AggregateException` wrapper.

**2. `async void` loses its errors.**

```csharp
async void SaveButton_Click(object sender, EventArgs e)
{
    await SaveAsync();   // if this throws, the caller cannot catch it
}
```

There is no `Task`, so the caller cannot await the method and cannot catch its exception. The exception is raised on the `SynchronizationContext` that was active at the start, which usually crashes the process. Use `async void` only for event handlers, where the signature forces it. Everywhere else return `Task`.

**3. `async` is not "faster".**

```csharp
async Task<long> SumAsync(int[] data)
{
    long total = 0;
    foreach (var x in data) total += Work(x);  // pure CPU, no await
    return total;
}
```

This awaits nothing, so it runs fully synchronously and pins the caller's thread. You added state-machine overhead for no gain. `async` improves throughput and responsiveness by not blocking. It does not speed up computation. For CPU work, use `Task.Run` or real parallelism.

**4. Suspending costs allocations.** When an `await` actually pauses, the state machine is boxed onto the heap and a `Task` is allocated. A call that finishes synchronously boxes nothing. So on a hot, usually-synchronous path, prefer a shape that avoids the `Task`.

```csharp
// allocates a Task<byte[]> even on a cache hit:
async Task<byte[]> GetAsync(string k)
    => _cache.TryGetValue(k, out var v) ? v : await LoadAsync(k);

// no allocation on the cache hit:
ValueTask<byte[]> GetAsync(string k)
    => _cache.TryGetValue(k, out var v) ? new(v) : new(LoadAsync(k));
```

**5. A `Task` you never await can swallow its error.**

```csharp
DoWorkAsync();   // no await: fire and forget
```

A faulted `Task` stores its exception and only re-throws it when you await it or read `.Result`. If nothing ever observes it, the failure is silent. No crash, no log. Always await your tasks, or attach a continuation that handles the error on purpose.

**6. Misusing `ValueTask` corrupts results silently.**

```csharp
ValueTask<int> vt = ReadAsync();
int a = await vt;
int b = await vt;   // wrong: awaiting the same ValueTask twice
```

This is undefined behaviour. It can return wrong or torn values, and it throws no exception to warn you. Await a `ValueTask` once. If you need more, call `.AsTask()` first, or just use `Task<T>`.

**7. Go async all the way, or not at all.** Mixing the two is where deadlocks and starvation start. A sync method deep in the tree that calls `.Result` on an async one is the usual culprit. One async leaf tends to make the whole call chain async. That is expected. Follow it through instead of blocking to bridge back to sync.

## In Production

Take one ASP.NET Core endpoint that reads from a database. The query takes about 20 ms. Here are the two versions side by side.

```csharp
// Blocking version. It holds one pool thread for the whole 20 ms query.
[HttpGet("orders")]
public IActionResult GetOrders()
{
    var orders = _db.QueryOrdersAsync().Result;   // this thread is stuck here for 20 ms
    return Ok(orders);
}

// Async version. The thread is freed during the query and serves other requests.
[HttpGet("orders")]
public async Task<IActionResult> GetOrders()
{
    var orders = await _db.QueryOrdersAsync();     // thread returns to the pool while the DB works
    return Ok(orders);
}
```

The difference does not show up with one user. It shows up under load. Say 200 requests arrive at once. The async version parks all 200 queries in the OS and hands their threads back, so a handful of threads serve everyone. The blocking version needs one thread stuck per in-flight request, so it wants 200 threads at once.

The pool does not have 200 threads ready, and it grows slowly. It adds new threads very roughly one every 500 ms while work is not draining. (A separate hill-climbing algorithm then tunes the steady-state count for throughput.) So requests pile up in the queue, latency spikes, and the service tips over. This is **thread-pool starvation**.

The usual trigger is a single blocking call buried on a hot path. Some helper deep in the stack does `httpClient.GetStringAsync(u).Result`. Now each request holds a thread and blocks it, waiting for a continuation that itself needs a pool thread to run. The problem feeds on itself. In practice, "our API falls over at N users" is very often traced to, and fixed by, "stop calling `.Result`, go async end to end." The same hardware then serves far more users, because it stopped paying a whole thread to stand and wait.

## Questions

> [!question]- Does `await` block the thread? What actually happens to it?
> No. At an incomplete `await`, `MoveNext` saves the state and returns to the caller, and the thread is released to the pool or the UI message loop. For I/O, no thread is used at all while waiting. The OS (IOCP or epoll) signals completion and the continuation is queued onto a pool thread, or onto the captured context. If the awaited thing was already complete, there is no pause. `IsCompleted` is true and execution continues inline on the same thread.

> [!question]- Walk me through what the compiler generates for an `async` method.
> A state-machine type (`IAsyncStateMachine`) with an `int` state, a builder that owns the returned `Task`, lifted locals, and an awaiter field. The body becomes `MoveNext()`, split at each `await`. `MoveNext` runs to the first incomplete `await` and checks `awaiter.IsCompleted`. If it is false, it saves the state, calls `builder.AwaitUnsafeOnCompleted` (which boxes the struct to the heap and hooks the continuation), and returns. When the awaiter completes, `MoveNext` runs again, jumps past the `await`, calls `GetResult()`, and finally `builder.SetResult()` to complete the task.

> [!question]- What does `await` actually require of the thing you await?
> The awaiter pattern, not `Task` in particular. `expr.GetAwaiter()` must return an awaiter with `bool IsCompleted`, `void OnCompleted(Action)` from `INotifyCompletion`, and `T GetResult()`. The compiler matches it by shape, which is why `ValueTask`, `Task.Yield()`, and custom awaitables all work.

> [!question]- Why does `.Result` deadlock in a UI or classic-ASP.NET app but not in ASP.NET Core?
> Those hosts install a single-threaded `SynchronizationContext`. `.Result` blocks that one thread. The continuation is posted back to the same context to resume, but the context is blocked, so neither can proceed. ASP.NET Core has no `SynchronizationContext`, so the continuation resumes on a free pool thread and there is no cycle. You still should not block, because it wastes threads and invites starvation. `ConfigureAwait(false)` also breaks the cycle, because the continuation no longer needs the context.

> [!question]- You wrap a CPU-heavy loop in an `async` method and `await` it. Is the caller unblocked?
> No. `async` does not move work off the thread by itself. Code runs synchronously until it awaits something that is not yet complete, and a compute loop never does. Offload it on purpose with `await Task.Run(() => Work())`, which runs it on a pool thread and gives you a `Task` to await.

> [!question]- When would you return `ValueTask<T>` instead of `Task<T>`, and what is the risk?
> When the method usually completes synchronously on a hot path, such as a cache hit or a buffered read. `ValueTask<T>` avoids the `Task` allocation on that path. The risk is its rules. You must await it at most once, never await it twice at the same time, never read `.Result` before it is done, and never cache it in a field. Break those and you can get silent wrong results. For ordinary code, prefer `Task<T>`.

> [!question]- `Task.WhenAll` vs `Task.WaitAll`. Which and why?
> `WhenAll` returns a `Task` you await. It does not block, it composes into other async code, and on await it throws the first exception while `Task.Exception` holds them all in an `AggregateException`. `WaitAll` blocks the calling thread until everything finishes. Inside async code prefer `await Task.WhenAll(...)`. `WaitAll` brings back the blocking that async exists to avoid.

> [!question]- What flows across an `await`, and does `ConfigureAwait(false)` stop it?
> `ExecutionContext`, which carries `AsyncLocal<T>` values, always flows across `await`. `SynchronizationContext` decides where the continuation resumes, and that is what `ConfigureAwait(false)` opts out of. So `ConfigureAwait(false)` changes the resume thread, but it does not stop `AsyncLocal` from flowing.

## Related

- [[Concurrency vs Parallelism]]. Async is a concurrency tool. It does not make anything run in parallel.
- [[Threads and the Thread Pool]]. Where continuations actually run, and how pool starvation happens.
- [[Synchronization Primitives]]. `lock`, `SemaphoreSlim`, and `Interlocked` for guarding shared state that async code touches. `SemaphoreSlim.WaitAsync` is the async-friendly one.
- [[CancellationToken]]. Cooperative cancellation, timeouts, and registrations.
- [[Race Conditions]] and [[Deadlocks]]. The hazards that blocking on async and shared mutable state create.

## References

- [Asynchronous programming (C#)](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/). The TAP model, `await` semantics, `async void`, and `ValueTask`.
- [Asynchronous programming scenarios (C#)](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-scenarios). I/O- vs CPU-bound, the state machine, `ConfigureAwait`, and `WhenAll`/`WhenAny`.
- [Async in depth (.NET)](https://learn.microsoft.com/en-us/dotnet/standard/async-in-depth). Why I/O-bound async uses no thread while waiting.
- [How Async/Await Really Works in C# (.NET blog)](https://devblogs.microsoft.com/dotnet/how-async-await-really-works-in-csharp/). The generated state machine, builders, and awaiter pattern in depth.
- [Understanding the Whys, Whats, and Whens of ValueTask](https://devblogs.microsoft.com/dotnet/understanding-the-whys-whats-and-whens-of-valuetask/). When to use it and the usage rules.
- [ConfigureAwait FAQ (.NET blog)](https://devblogs.microsoft.com/dotnet/configureawait-faq/). Context capture, and `ExecutionContext` vs `SynchronizationContext`.
