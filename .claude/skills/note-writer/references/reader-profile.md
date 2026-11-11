# Reader Profile

Who reads the notes and how they learn. The writer follows it; the reviewer checks against it. It was extracted from the author's own hand-written notes (Async, Multithreading,
Middleware, Static, Const vs Readonly). Only the patterns are kept here, not the notes.

## The reader

- A .NET backend engineer (C#) moving to **senior / tech lead**.
- Reads to **understand and remember**, and to **pass interviews**: after the note the reader can
  explain the topic out loud and answer follow-up questions.
- Native language: **Russian**. Technical terms are read and spoken in **English** (`Thread Pool`,
  `state machine`, `deadlock`), never translated ("пул потоков" only as a one-time gloss).
- Knows everyday C# and ASP.NET Core. Gaps are in internals, edge cases, and "why it works this way".

## What makes a note clear for this reader

1. **One sentence = one thought.** Short sentences. A paragraph is 1–3 sentences.
2. **Plain definition first**, then why it matters:
   > `Deadlock` — взаимная блокировка: два потока ждут друг друга и оба зависают навсегда.
3. **Simple words, deep detail.** The words are plain; the content goes down to the runtime: what the
   compiler generates, where the object lives, which thread runs the continuation.
4. **Code that traces execution.** The strongest pattern. Comments walk through the flow step by
   step and mark which pass of the code they describe:
   ```csharp
   if (!awaiter.IsCompleted)
   {
       // Первый вызов: задача ещё не завершена.
       // Сохраняем состояние, чтобы при пробуждении сразу перейти к результату.
       _state = 0;
       _builder.AwaitUnsafeOnCompleted(ref awaiter, ref this);
       return; // Поток возвращается вызывающему коду.
   }
   // Пробуждение: задача завершена, MoveNext вызван ещё раз с _state == 0.
   ```
5. **BAD / GOOD pairs** for every common mistake, explained in comments:
   ```csharp
   // ❌ BAD: 1000 задач одновременно, все конкурируют за потоки пула
   // ✅ GOOD: SemaphoreSlim(10) — не больше 10 запросов одновременно
   ```
6. **Real domain code:** `OrderService`, `PaymentService`, `AccountService.Withdraw`. Never `Foo`,
   `Bar`, `DoWork`.
7. **A real-life scenario** that shows why the feature exists:
   > Пользователь пять раз перезагрузил страницу. Без отмены сервер пять раз делает одну и ту же
   > тяжёлую работу.
8. **Lists for classifications** (CPU-bound vs I/O-bound; the three ways a `Task` completes).
9. **Comparison tables** for "X vs Y" (Task vs ValueTask, multithreading vs parallelism).
10. **Numbered rules** for "how to use it correctly" (ValueTask: await once, no `WhenAll` without
    `AsTask()`, …).
11. **Key points** after each sub-topic: 3–5 bullets to remember.
12. **One short analogy at most**, only to anchor the idea, immediately followed by the mechanism.
13. **Senior-level details** that a junior misses: `const` is inlined into the calling assembly, so
    changing it needs a rebuild of the caller; a `Release` build generates the async state machine
    as a `struct`.

## What loses this reader

- A note too long to learn for an interview in one sitting.
- Textbook register: grey, university-style delivery, the same "definition → why → mechanism"
  labels in every section.
- Under-the-hood details that few tech leads know (spec sections, builder internals, OS I/O
  plumbing) — they belong in a deep sub-note, if anywhere.
- Long paragraphs that mix three ideas.
- Abstract wording that could describe any system ("отвечает за", "участвует в").
- Explaining a term with another term that was never explained.
- Text without code for a mechanism that is easier to show in code.
- Toy examples (`foo`, `bar`) and examples that do not compile.
- Confident but wrong facts. The author's own notes contained myths that were believed for years;
  the notes must not repeat them.

## Interview cards

`> [!qard]- <question>` exactly as an interviewer asks it. The folded answer:
1. the direct answer in one or two sentences;
2. the mechanism behind it;
3. the trade-off or the "it depends" a senior adds.

```md
> [!qard]- Почему `lock` нельзя использовать вместе с `await`?
> Компилятор запрещает `await` внутри `lock` (ошибка CS1996).
> `lock` держит `Monitor`, привязанный к потоку, а после `await` метод может продолжиться на другом потоке.
> Для асинхронного кода используют `SemaphoreSlim.WaitAsync()`. Его цена: нет reentrancy, а `Release` нужно вызывать в `finally`.
```
