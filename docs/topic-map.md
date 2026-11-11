# Topic Map

The study roadmap for a **senior / tech lead .NET backend engineer** and the queue for the note
pipeline (#21). Each **hub** note covers a whole topic, from the basics to advanced, with a short
overview of every sub-topic. Each sub-topic that needs depth gets its own **sub-note**, linked from
the hub. Hub notes live in the sub-topic folder next to their sub-notes.

Markers: **NEW** — no file yet · **STUB** — an empty `new` stub exists · **REWRITE** — a written
note exists and is rewritten by the pipeline · **MERGE** — folded into the hub, the file is deleted
· **MOVE** — the file moves to another folder.

Priority: **P1** first (the core of .NET backend interviews), then **P2**, then **P3**.

## Programming

### Concurrency — P1
- **Hub: Asynchronous Execution** — REWRITE of `Async and Await`
  - Async State Machine — NEW
  - Task and TaskScheduler — NEW
  - ValueTask — NEW
  - CancellationToken — NEW
  - SynchronizationContext and ConfigureAwait — NEW
  - Async Streams (`IAsyncEnumerable`) — NEW
  - Thread Pool Starvation (sync over async) — NEW
- **Hub: Multithreading** — NEW; absorbs `Concurrency vs Parallelism` (MERGE: deleted when this hub is written)
  - Thread Pool — REWRITE of `Threads and the Thread Pool`
  - Locks and Synchronization (`lock`/`Monitor`, `SemaphoreSlim`, `Interlocked`, `ReaderWriterLockSlim`) — STUB
  - Race Conditions — STUB
  - Deadlocks — STUB
  - Concurrent Collections — NEW
  - Parallel Programming (`Parallel`, PLINQ, `Parallel.ForEachAsync`) — NEW
  - Channels (producer / consumer) — NEW
  - Memory Model and `volatile` — NEW (advanced)

### Runtime — P1
- **Hub: Memory Management** — NEW
  - Stack vs Heap — STUB
  - Value vs Reference Types (incl. boxing) — REWRITE
  - Garbage Collection (generations, LOH, workstation vs server GC) — STUB
  - IDisposable and Finalizers — NEW
  - Memory Leaks — STUB
  - Span and Memory — STUB (file `Runtime/Spans.md`, renamed when written)
- **Hub: CLR Execution** — NEW
  - CLR and JIT (tiered compilation, ReadyToRun, Native AOT) — STUB
  - Assemblies and Loading — STUB (file `Runtime/Assemblies.md`, renamed when written)
  - Reflection — STUB
  - Static Members and Type Initialization — NEW

### C# — P1
- **Hub: C# Fundamentals** — NEW
  - Variables and Built-in Types (`var`, numeric types, `decimal` vs `double`, `checked`) — NEW
  - Strings and StringBuilder (immutability, interning, comparison, `StringBuilder`) — NEW
  - Equality and Hashing (`==` vs `Equals`, `GetHashCode`, `IEquatable<T>`) — NEW
  - Type Conversions (implicit / explicit casts, `is` / `as`, boxing) — NEW
  - Parameters (`ref`, `out`, `in`, `params`) — NEW
  - Properties and Access Modifiers — NEW
  - Enums (including `[Flags]`) — NEW
  - Arrays and Iterators (`yield`) — NEW
  - Extension Methods — NEW
- **Hub: C# Type System** — NEW
  - Classes and Structs — STUB
  - Inheritance and Polymorphism (`virtual`, `override`, `new`, `sealed`) — NEW
  - Interfaces vs Abstract Classes (incl. default interface methods) — NEW
  - Records — STUB
  - Const vs Readonly — REWRITE
  - Generics (constraints, variance) — STUB
  - Nullable Reference Types — STUB
- **Hub: C# Language Features** — NEW
  - Delegates and Events — STUB
  - LINQ (deferred execution, `IEnumerable` vs `IQueryable`) — STUB
  - Pattern Matching — STUB
  - Exceptions — STUB
  - Collections Internals (`List`, `Dictionary`, `HashSet`) — NEW

### .NET Hosting — P1
- **Hub: Application Hosting** — NEW (folder `DotNet`)
  - Generic Host — STUB
  - Dependency Injection (lifetimes, captive dependencies) — STUB
  - Configuration and Options — STUB
  - Logging — NEW
  - Background Services (`IHostedService`, `BackgroundService`) — NEW

### ASP.NET Core — P1
- **Hub: ASP.NET Core Request Pipeline** — NEW (folder `AspNetWebApi`)
  - Middleware Pipeline — STUB
  - Routing — NEW
  - Model Binding and Validation — STUB
  - Filters — STUB
  - Minimal APIs vs Controllers — STUB
  - Error Handling (`ProblemDetails`) — NEW
  - Authentication — STUB
  - Authorization — STUB
  - CORS — STUB

### Testing — P2
- **Hub: Testing Strategy** — NEW
  - Unit Testing — STUB
  - Integration Testing — STUB
  - Test Doubles — STUB
  - Test-Driven Development — STUB

### Design — P2
- **Hub: Object-Oriented Design** — NEW (folder `Paradigms`)
  - Object-Oriented Programming — STUB
  - SOLID Principles — STUB
  - Design Patterns — STUB
  - Functional Programming — STUB
- **Hub: Code Quality** — NEW (folder `CleanCode`)
  - Naming — STUB
  - Code Smells — STUB
  - Refactoring — STUB

## Data Persistence — P1
- **Hub: Relational Databases** — NEW
  - Indexes (B-tree, covering, composite) — NEW
  - Transactions and Isolation Levels — NEW
  - Locking and MVCC — NEW
  - Query Plans — NEW
  - Normalization — NEW
- **Hub: Entity Framework Core** — NEW
  - Change Tracking — NEW
  - Loading Strategies and N+1 — NEW
  - Migrations — NEW
  - EF Core Performance — NEW
- **Hub: Caching** — NEW
  - Cache Strategies (cache-aside, write-through) and Invalidation — NEW
  - Distributed Cache (Redis) — NEW
- **Hub: NoSQL** — NEW (P2)

## Networks — P2
- **Hub: HTTP** — NEW
  - HTTP Versions (1.1, 2, 3) — NEW
  - HTTP Caching — NEW
  - TLS Handshake — STUB
- **Hub: Network Fundamentals** — NEW
  - TCP vs UDP — NEW
  - DNS — NEW
- **Hub: API Styles** — NEW
  - REST vs gRPC vs GraphQL — NEW
  - Real-Time (WebSockets, SignalR) — NEW

## Architecture — P1
- **Hub: Distributed Systems** — NEW
  - CAP and Consistency Models — NEW
  - Idempotency — REWRITE (folder `Reliability`)
  - Retries, Timeouts and Circuit Breakers — NEW
  - Distributed Transactions (Saga, Outbox) — NEW
- **Hub: Messaging** — NEW
  - Queues vs Topics — NEW
  - Delivery Guarantees — NEW
- **Hub: Architecture Styles** — NEW
  - Monolith, Modular Monolith, Microservices — NEW
  - Clean Architecture — NEW
  - Domain-Driven Design — NEW
  - CQRS and Event Sourcing — NEW
- **Hub: System Design** — NEW
  - Scaling and Load Balancing — NEW
  - Sharding and Replication — NEW
  - Rate Limiting — NEW
- **Hub: Technical Leadership** — NEW (placement to confirm)
  - Architecture Decision Records — NEW
  - Code Review — NEW
  - Technical Debt — NEW
  - Estimation and Planning — NEW
  - Incident Management and Postmortems — NEW

## Security — P2
- **Hub: Web Application Security** — NEW
  - OWASP Top 10 — NEW
  - OAuth 2.0 and OpenID Connect — NEW
  - JWT — NEW
  - Password Hashing and Secrets Management — NEW

## DevOps — P2
- **Hub: Containers** — NEW
  - Docker — NEW
  - Kubernetes Basics — NEW
- **Hub: CI/CD** — NEW
- **Hub: Observability** — NEW
  - Logs, Metrics, Traces (OpenTelemetry) — NEW

## Cloud — P3
- **Hub: Cloud Fundamentals** — NEW
  - Core Services (compute, storage, queues) — NEW
  - Serverless — NEW

## Computer Science — P2
- **Hub: Data Structures and Algorithms** — NEW
  - Big-O — NEW
  - Hash Tables — NEW
  - Trees and Graphs — NEW
  - Sorting — NEW

## AI and ML — P3
- **Hub: LLMs for Engineers** — NEW (scope to define later)

## Pipeline order

1. Asynchronous Execution (calibration run — compare with the author's own note)
2. Multithreading
3. Memory Management
4. C# Fundamentals, C# Type System
5. Application Hosting
6. ASP.NET Core Request Pipeline
7. Relational Databases, Entity Framework Core
8. Distributed Systems, Architecture Styles
9. The rest by priority
