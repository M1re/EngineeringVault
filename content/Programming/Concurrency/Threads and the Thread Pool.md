---
publish: true
title: Threads and the Thread Pool
created: 2026-07-09
modified: 2026-07-19T13:15:00.000+03:00
published: 2026-07-19T13:15:00.000+03:00
tags:
  - threads
  - thread-pool
  - concurrency
  - scheduling
status: done
---

> [!summary]
> A **thread** is the unit the operating system schedules onto a CPU core. Each one is expensive: about 1 MB of stack, a real cost to create, and a context-switch cost every time the OS swaps it on or off a core. The **thread pool** is a shared set of reusable worker threads that the runtime hands out for short jobs, so you never pay to create a thread per task. Almost all concurrent work in .NET — `Task.Run`, async continuations, timer callbacks — runs on the pool, which is why understanding it explains both throughput and starvation.

## The Thread

Your code has to run on something. That something is a thread.

A thread is a single sequence of instructions that a CPU core executes one after another. To run it, the operating system gives it three things: a **stack** (its own memory for local variables and call frames), a set of **registers** (including the instruction pointer, which marks the next instruction to run), and an entry in the OS **scheduler**.

A machine has only a few cores but far more threads than cores. The scheduler shares the cores between them by running one thread for a short slice of time, then swapping in another. That swap is a context switch, and it has its own section below because its cost drives almost everything else here.

## Managed Threads vs OS Threads

You create threads in C# with the `Thread` class, but the CLR does not run threads. The OS does. So what exactly is a "managed thread"?

A managed `Thread` maps, in normal use, **one-to-one to a real OS thread**. When you start it, the CLR asks the OS to create an OS thread, and the OS scheduler runs it. A managed thread is therefore **not cheaper** than an OS thread. It is one, with a wrapper around it.

The CLR wraps it because a managed thread has to take part in runtime services that a raw OS thread knows nothing about:

- **Garbage collection.** To collect, the GC must stop every other managed thread and walk its stack to find live object references (the roots). It can only stop a thread at a **safe point** — a spot where the runtime knows exactly what the stack holds. So the CLR must know about every managed thread and be able to bring it to a safe point and suspend it. A thread the runtime never created could not be stopped and scanned this way. This is the core reason managed threads are not just OS threads.
- **Managed identity and flowing state.** Each managed thread has a `ManagedThreadId` assigned by the CLR. It is stable and is **not** the OS thread id, which the CLR does not promise to keep fixed. The thread also carries the `ExecutionContext`, so `AsyncLocal<T>` and the security context travel with it.
- **Foreground vs background.** This is a CLR concept, not an OS one. A **foreground** thread keeps the process alive: the process exits only after the last foreground thread finishes. A **background** thread does not — once the foreground threads are done, the runtime abandons the background ones and shuts down. `new Thread(...)` is foreground by default. Every thread-pool thread is background.

```csharp
var t = new Thread(Work);       // foreground by default: keeps the process alive
t.IsBackground = true;          // now it will not hold the process open on its own
t.Start();
Console.WriteLine(t.ManagedThreadId);   // a CLR id, not the OS thread id
```

The one-to-one mapping holds in practice, but the CLR does not guarantee it — the abstraction leaves room for a host to schedule managed threads onto fibers or move one across OS threads. Treat a managed thread as a **logical thread the runtime owns**, which normally sits on exactly one OS thread.

## The Cost of a Thread

You cannot make a thread per unit of work. Two costs get in the way here, and a third (context switching) gets its own section next.

- **Memory.** Each thread reserves a stack, 1 MB by default on Windows. A thousand threads reserve about a gigabyte of address space before running a line of your code. The reservation is address space, not committed physical memory, but it still bounds how many threads you can have.
- **Creation.** Making a thread is a system call: the OS allocates the stack, sets up kernel bookkeeping, and registers the thread with the scheduler. That is slow relative to the microsecond-scale jobs you often want to run.

Because both costs are real, you reuse threads instead of creating one per job. That is what the thread pool is for.

## Context Switching

A core runs one thread at a time, but there are always more runnable threads than cores. Sharing the cores means repeatedly swapping threads on and off them. That swap is a **context switch**, and it is the cost that caps how many threads are useful.

A switch happens for one of two reasons:

- **Voluntary.** The thread blocks — it waits on I/O, a lock, or `Thread.Sleep` — and gives up the core because it has nothing to do.
- **Involuntary (preemption).** The OS interrupts a thread whose time slice has expired (on the order of tens of milliseconds) so another thread gets a turn.

The mechanism is the same either way. The kernel saves the running thread's CPU state — the general registers, the instruction pointer (where it was in the code), and the stack pointer — into that thread's kernel structure. This runs in kernel mode. The scheduler then picks the next ready thread, loads its saved state back into the registers, and the core resumes it exactly where it had stopped.

The **direct** cost of that save-and-restore is small: on the order of 1 to 2 microseconds, roughly 5,000 to 10,000 CPU cycles, including the kernel crossing.

The **indirect** cost is the one that hurts. The outgoing thread had filled the CPU caches (L1/L2/L3), the TLB (the virtual-to-physical address map), and the branch predictor with its own data. The incoming thread evicts much of that as it runs. When the first thread comes back, its data is no longer cached, so it stalls waiting on memory — an L3 miss costs about 50 to 100 ns, a TLB miss hundreds of cycles. Across a real working set this indirect cost can reach **tens to hundreds of microseconds**, dwarfing the direct cost.

This is the real reason more threads do not mean more throughput. Once the number of runnable threads passes the number of cores, the cores spend a growing share of their time switching and refilling caches instead of doing work.

## The Thread Pool

Most work items are short. A request handler, a `Task.Run` callback, or an async continuation each run for microseconds to a few milliseconds. Creating a fresh thread for each one and destroying it after would spend more time managing threads than doing the work, and would pay the creation and context-switch costs above for nothing.

The **thread pool** solves this with reuse. The runtime keeps a set of long-lived worker threads. You hand it a work item, it runs that item on a free worker, and when the item finishes the worker goes back to the pool for the next one. The threads are created once and live for the process.

You rarely talk to the pool directly. You use it through APIs that queue onto it:

```csharp
Task.Run(() => Work());                        // queues Work onto the pool
ThreadPool.QueueUserWorkItem(_ => Work());      // the low-level version
// async continuations queue here too, when there is no SynchronizationContext
```

The trade-off: you do not own the thread. So you must not block it for long, and you must not store state on it and expect that state to still be there later. Both are in the pitfalls.

## Work Queues and Work-Stealing

The pool needs somewhere to hold work items waiting for a free thread. A single shared queue would work, but every worker would contend on one lock to take the next item, and under load that lock becomes the bottleneck.

So the pool keeps two kinds of queue: one **global queue**, and a **local queue per worker thread**. Work submitted from outside the pool (your top-level `Task.Run`) goes on the global queue. Work a pool thread creates itself (a `Task` started from inside another pool task) goes on that worker's own local queue.

When a worker looks for its next item, it checks in a **fixed order**:

1. **Its own local queue, newest-first (LIFO).** No shared lock, and the newest task's data is the most likely to still be warm in cache.
2. **If the local queue is empty, the global queue, oldest-first (FIFO).** This is where externally submitted work lives.
3. **Only if the global queue is also empty does it steal** from another worker's local queue, taking from the far (oldest) end (FIFO) to avoid fighting the owner, which takes from the near (newest) end.

Work-stealing is the **last** step, not the step right after the local queue. A worker reaches into another's queue only when both its own local queue and the global queue are empty. Getting this order wrong — jumping straight from an empty local queue to stealing — is a common misconception.

```mermaid
flowchart TD
    W[Worker needs next item] --> L{Own local queue?}
    L -- yes, LIFO --> R[Run it]
    L -- empty --> G{Global queue?}
    G -- yes, FIFO --> R
    G -- empty --> S{Steal from another local?}
    S -- yes, FIFO --> R
    S -- nothing --> I[Idle / wait]
```

## Thread Injection and Hill Climbing

How many worker threads should the pool have? Too few and work waits while cores sit idle. Too many and the machine drowns in context switches. The pool tunes the number itself.

The pool actually keeps **two kinds of thread**: **worker threads** for queued work, and **I/O completion threads** for async I/O completions. `ThreadPool.GetMinThreads` / `SetMinThreads` and their `Max` counterparts control both, each with a `(workerThreads, completionPortThreads)` pair. (The `completionPortThreads` name is Windows I/O-completion-port heritage, but the API stays on every platform; the async-I/O engine underneath just differs off Windows.) The pool starts near a floor on the order of the CPU count, and grows and shrinks the worker count from there with two separate mechanisms:

- **Starvation-avoidance injection.** If work is queued but the queue is not draining, the pool assumes its threads are stuck and adds one more. It does this slowly, at most about one new thread every 500 ms. It is a safety valve, not a fast response.
- **Hill climbing.** In parallel, the pool measures its own throughput — completed work items per second. It nudges the thread count up or down and keeps the change if throughput improved, climbing toward the peak. This finds a good steady-state count for the current load with no human tuning.

The 500 ms figure matters in practice. It is why a burst of blocking work causes a latency spike: the pool cannot conjure threads instantly, only about two per second. Modern .NET (since .NET 6) detects some blocking `Task` calls and ramps the worker count up faster than this, so real starvation episodes can be briefer than the 500 ms math implies. Do not rely on it — the cure is still to stop blocking pool threads.

## Where Async Continuations Run

This is the link back to [[Async and Await|async]]. When an `await` suspends on I/O, no thread waits. The OS signals completion, and the runtime queues the continuation — the rest of your method — as a work item onto the thread pool. A free worker picks it up and runs `MoveNext` again. (In a UI or legacy-ASP.NET app the continuation instead posts back to the captured `SynchronizationContext`, unless the code used `ConfigureAwait(false)` to opt out and stay on the pool; see [[Async and Await]].)

So the pool is the engine under async. "Async frees the thread" means the thread returns to this pool and runs other queued work. "Thread-pool starvation" means every pool worker is blocked, so the queued continuations have nothing to run them and the whole system stalls. The two topics are the same machine seen from two sides.

## Pitfalls & Trade-offs

**1. Blocking a pool thread starves the pool.** The pool is sized for short work. Block its threads and it runs dry.

```csharp
// Runs on a pool thread. Blocking here holds a scarce worker hostage.
Task.Run(() =>
{
    var data = FetchAsync().Result;   // blocks this pool thread until the I/O completes
    Thread.Sleep(5000);               // holds it for another 5 seconds
});
```

Every worker doing this is one fewer worker for real work. Because the pool adds threads only about twice a second, a burst of blocking calls stalls everything queued behind them. Fix: never block on async inside pool work — `await` instead, so the thread is freed while the I/O runs.

**2. Long or blocking work does not belong on the pool.** Even without async, a task that runs for minutes, or blocks on a file or a lock, ties up a pool thread the whole time. For genuinely long-running work, ask for a dedicated thread instead of borrowing a pool one:

```csharp
// A dedicated thread, created outside the pool, for long-lived work:
Task.Factory.StartNew(() => ConsumeQueueForever(),
    TaskCreationOptions.LongRunning);
```

This buys a thread you fully occupy at the cost of one extra OS thread, which is the right trade when the work never returns quickly.

**3. Creating a thread per work item wastes the pool's whole point.**

```csharp
foreach (var item in items)
    new Thread(() => Process(item)).Start();   // 10 000 items -> 10 000 OS threads
```

At scale this reserves gigabytes of stacks and drowns the cores in context switches. Use `Task.Run(() => Process(item))` so the pool runs them on a bounded set of reused threads.

**4. The pool ramps up slowly, so bursts spike latency.** A service that is idle, then suddenly gets 200 concurrent CPU-bound tasks, has only its floor of threads at first. The rest queue while the pool adds threads at roughly one per 500 ms. If your load is genuinely this bursty, raise the floor:

```csharp
ThreadPool.SetMinThreads(workerThreads: 100, completionPortThreads: 100);
```

The cost: a high floor keeps more threads alive and adds context switching at low load, so raise it only with evidence, not by default.

**5. Pool threads run concurrently, so shared state races.** Many work items run on many threads at once. Any mutable state they share is a [[Race Conditions|race]] waiting to happen and needs a [[Synchronization Primitives|lock or other primitive]].

```csharp
int total = 0;
Parallel.ForEach(orders, o => total += o.Amount);   // lost updates: += is not atomic
```

**6. Do not assume thread affinity on the pool.** A pool thread is not yours and is not stable across an `await`. Code after an `await` may resume on a different pool thread, so anything stored in `[ThreadStatic]` state before the `await` may be gone after it.

```csharp
[ThreadStatic] static string _tenant;

_tenant = "acme";
await LoadAsync();
Use(_tenant);            // may be null: the continuation can resume on a different pool thread
```

Use `AsyncLocal<T>` instead. It flows with the logical call across `await`, not with the thread.

## In Production

A web API is fast in testing but times out in bursts. The cause is almost always a blocking call on a hot path, which turns the thread pool from an asset into the bottleneck.

```csharp
// The problem: a sync controller that blocks a pool thread per request.
[HttpGet("report")]
public IActionResult GetReport()
{
    var rows = _db.QueryAsync().Result;   // one pool thread blocked for the whole query
    return Ok(Render(rows));
}
```

Under 500 concurrent requests, the pool needs 500 blocked threads. It has its floor, then grows by only about one thread every 500 ms, so most requests sit in the queue. Latency climbs from milliseconds to seconds, and health checks start failing. This is thread-pool starvation.

```csharp
// The fix: go async, so the thread is freed during the query.
[HttpGet("report")]
public async Task<IActionResult> GetReport()
{
    var rows = await _db.QueryAsync();    // thread returns to the pool while the DB works
    return Ok(Render(rows));
}
```

Now a handful of pool threads serve all 500 requests, because each thread is busy only for the microseconds of actual CPU work, not the 20 ms of waiting. `ThreadPool.SetMinThreads` is sometimes raised as a stopgap to survive bursts while the real blocking call is hunted down, but it treats the symptom. The cure is to stop blocking pool threads.

## Questions

> [!question]- Is a managed `Thread` the same as an OS thread? What does the CLR add?
> In normal use a managed thread maps one-to-one to a real OS thread, so it is not cheaper — starting one creates an OS thread that the OS schedules. The CLR wraps it so it can take part in runtime services: the GC must be able to suspend every managed thread at a safe point and walk its stack for roots, so the runtime tracks them all; each has a CLR-assigned `ManagedThreadId` (not the OS id) and carries the flowing `ExecutionContext`; and each is foreground or background, a CLR concept that decides whether it keeps the process alive. The mapping is not guaranteed one-to-one — a host could use fibers — so a managed thread is best seen as a logical thread the runtime owns.

> [!question]- What actually happens during a context switch, and where does the real cost come from?
> The kernel saves the running thread's registers, instruction pointer, and stack pointer into its thread structure (in kernel mode), the scheduler picks the next ready thread, and its saved state is loaded back so the core resumes it where it stopped. The direct save/restore is cheap, about 1–2 microseconds or 5,000–10,000 cycles. The real cost is indirect: the new thread evicts the old thread's caches, TLB, and branch-predictor state, so when the old thread resumes it stalls on memory. For memory-heavy work that indirect cost can reach tens to hundreds of microseconds, which is why adding threads past the core count lowers throughput.

> [!question]- A pool worker's local queue is empty. Where does it look next?
> The global queue, not another worker's queue. The order is: own local queue newest-first (LIFO), then the global queue oldest-first (FIFO), and only if the global queue is also empty does it steal from another worker's local queue (FIFO, from the far end). Work-stealing is the last resort, after the global queue — jumping from an empty local queue straight to stealing is the common misconception.

> [!question]- Why is `new Thread()` per request a bad idea at scale?
> A thread is an OS resource, not a cheap object. Each reserves about 1 MB of stack and costs a system call to create. Thousands of them reserve gigabytes and force so many context switches that the cores spend their time switching and refilling caches instead of working. Throughput drops as you add threads past the core count. The pool exists so you reuse a bounded set of threads instead of creating one per job.

> [!question]- The pool has "hill climbing" and "starvation-avoidance injection." What is the difference?
> Starvation-avoidance injection is a safety valve: if work is queued but not draining, the pool adds at most about one thread every 500 ms, assuming its threads are stuck. Hill climbing is an optimiser: it measures completed-work throughput, nudges the thread count up or down, and keeps changes that improve throughput, converging on a good steady-state count. One reacts to blockage slowly; the other tunes for performance continuously.

> [!question]- Why does one blocking `.Result` deep in a request handler take down a whole service under load?
> It holds a pool thread for the entire wait instead of the microseconds of real work. Under load every request does the same, so all pool threads end up blocked. New requests, and the async continuations that would complete the blocked ones, have no thread to run on. The pool adds threads only about twice a second, far slower than requests arrive, so the queue grows without bound and latency explodes. This is thread-pool starvation.

> [!question]- You store a value in `[ThreadStatic]` before an `await` and read it after. Safe?
> No. The continuation after the `await` can resume on a different pool thread, so the `[ThreadStatic]` value set on the first thread is not visible on the second. Thread-local state does not follow the logical flow of async code. Use `AsyncLocal<T>`, which flows across `await` with the `ExecutionContext`.

## Related

- [[Async and Await]]. Async continuations and I/O completions run on this pool; starvation is the pool running dry.
- [[Concurrency vs Parallelism]]. The pool gives parallelism across cores; async gives concurrency without threads.
- [[Synchronization Primitives]]. `lock`, `SemaphoreSlim`, `Interlocked` for the shared state pool threads touch.
- [[Race Conditions]] and [[Deadlocks]]. The hazards of many pool threads running at once.

## References

- [Managed and unmanaged threading in Windows (.NET)](https://learn.microsoft.com/en-us/dotnet/standard/threading/managed-and-unmanaged-threading-in-windows). The managed-to-OS-thread relationship and `ManagedThreadId`.
- [Foreground and background threads (.NET)](https://learn.microsoft.com/en-us/dotnet/standard/threading/foreground-and-background-threads). Which threads keep the process alive.
- [Thread suspension, GC, and safe points (.NET)](https://learn.microsoft.com/en-us/dotnet/standard/threading/). Why the runtime must be able to suspend managed threads for collection.
- [The managed thread pool (.NET)](https://learn.microsoft.com/en-us/dotnet/standard/threading/the-managed-thread-pool). Queuing work, worker vs completion-port threads, min/max.
- [Debug thread pool starvation (.NET)](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/debug-threadpool-starvation). The starvation symptom and the ~500 ms injection.
- [.NET ThreadPool starvation, and how queuing makes it worse (Criteo)](https://medium.com/criteo-engineering/net-threadpool-starvation-and-how-queuing-makes-it-worse-512c8d570527). Local/global queues and the work-stealing order.
