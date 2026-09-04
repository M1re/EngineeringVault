---
name: note-writer
description: Use when creating or editing technical concept notes in this Engineering Vault knowledge base (files under Vault/). Provides the methodology for writing notes at a staff-software-engineer depth — mechanics, trade-offs, and self-test questions — in the vault's required format. Trigger for tasks like "write a note on X", "expand this note", "document this concept", or any editing of Vault/*.md concept notes.
---

# Note Writer

You are writing durable reference notes for a **public** staff-engineer knowledge base. The bar: a
reader finishes the note actually *understanding* the concept and its trade-offs, not just able to
recognise the term.

**Audience:** a solid **mid-level** engineer levelling up toward staff. Explain the mechanism fully;
skip only the trivial 101. Simple words, deep content — the plain gist first, then under the hood.
Complex wording is not smartness.

**Reference notes** — match their depth, format, and register:
- `Vault/Programming/Concurrency/Async and Await.md` ([[Async/Await]]) — depth and structure.
- `Vault/Programming/Concurrency/Threads and the Thread Pool.md` ([[Threads and the Thread Pool]]) —
  the dry, concrete register.

Also follow the template in `Vault/Templates/Concept Note.md` and the rules in `CLAUDE.md`.

## Workflow

1. **Research first.** Verify the mechanism against primary sources and build a depth map. Never draft
   mechanism detail from memory. (Details in [Method](#method).)
2. **Draft** to the Structure and Writing standard below.
3. **Review.** Run the `reviewer` subagent — it runs three passes (accuracy, completeness & ordering,
   readability) against [`references/verification.md`](references/verification.md). Apply its must-fixes.
4. **Publish**, then let the author read the finished note and calibrate. Iterate on the live note —
   there is no depth-outline step; the author reviews the finished draft.

## Structure

The note has **no** generic `## How it works` header. After the `> [!summary]`, the body is a run of
**topical sections with strict, official noun-phrase headers** — `## State Machine`, not
"## The state machine: what the compiler actually generates". Order them so each builds on the last.
Then the fixed tail: `## Pitfalls & Trade-offs`, `## In Production`, `## Questions`, `## Related`,
`## References` (Title Case).

- **Pitfalls & Trade-offs** is a **numbered** list, most common / most dangerous first. Each item
  carries a short code snippet or concrete scenario that shows *why* it is wrong, or the narrow case
  where it is acceptable — never a bare assertion. Frame trade-offs as trade-offs: "X buys A at the
  cost of B".
- **In Production** shows **code** (typically the bad version and the fix side by side) plus a real
  number or symptom, not prose alone.

## Writing standard

Deep by default; the enemy is padding, not length. Write so a mid-level engineer *understands*, not
just recognises. Four rules do most of the work.

1. **Why before how.** Open each section with the problem, or the concrete question it answers, then
   the mechanism. Introduce a term only once the reader feels why it is needed — never definition-
   first. ("A `SynchronizationContext` decides which thread runs the rest of your method after an
   `await`" lands; "represents a place to run code" does not.) If a section leans on a concept the
   reader may not know (the UI thread, the CPU cache), explain that concept from scratch before
   building on it.

2. **Dry and concrete — say what actually happens.** This is the rule notes break most, and breaking
   it is what makes a note read as "заумно". Describe the literal mechanism with concrete verbs and
   nouns: "the GC freezes every thread and reads its stack for live objects", not "the thread takes
   part in runtime services". Cut, every time:
   - **Metaphors and flavour labels** ("thin skin", "standing crew", "context-switch tax",
     "starvation valve") and editorial asides ("here is the bind", "the cost is sneaky").
   - **Abstract-category filler** ("takes part in", "is responsible for", "a wrapper around it") and
     mid-sentence hedges ("in normal use", "generally", "effectively"). If a sentence could describe
     ten different systems, name the specific thing instead.
   - **Off-topic comparisons** to a language or tech the note is not about ("the thread a C program
     would get" in a .NET note).
   - **Vague pronouns and dropped nouns.** Write "the thread" / "the worker thread", not "it"; "runs
     two threads", not "runs two".

3. **One step per sentence.** Every sentence carries one concrete step of the explanation. Cut any
   sentence that only restates the previous one, decorates it, or just points forward ("the next
   section covers it"). Keep sentences short; prefer a period over a semicolon, a mid-sentence colon,
   or a stacked em-dash.

4. **Code where it explains better than prose.** Not only in Pitfalls and In Production, but inside a
   tricky mechanism section too — a generated-code sketch, a two-line before/after.

## The depth test

Before finishing a note, ask: *"Would this teach a mid-level engineer something a blog-post
definition wouldn't?"* If not, it isn't done. Every note must answer three questions:

1. **How does it actually work?** — the mechanism, step by step. Not "it uses a queue" but
   *what* is enqueued, *when*, *who* consumes it, and *what happens on failure*.
2. **What breaks in production?** — the failure modes, costs, and limits. This is the section
   that proves you understand the thing. Never skip or hand-wave it.
3. **What would a staff-level review ask?** — turn the hardest parts into self-test questions.

## Method

1. **Research first — never draft the mechanism from memory.** Before writing, research the topic
   against primary sources (official docs, the RFC/spec, the **runtime or reference source**, the
   canonical book). Build an internal **depth map**: the sections; each mechanism stated *fully and
   in the correct order* — verify orderings, precedence, and fallback sequences *as a whole* against
   the source, because an individually-true step can still be misplaced or have a step omitted before
   the next one; the nuances, numbers, and edge cases a **staff engineer** would know; and the real
   pitfalls. Draft only from that map. Memory is for structure and intuition, not for mechanism
   detail — surface-level or subtly-wrong text (which reads as "invented") is exactly what a real
   research pass prevents. When you genuinely can't verify a point, write a `> [!warning] Unverified`
   callout or omit it. Never fabricate numbers or APIs.
   Full protocol: [`references/verification.md`](references/verification.md).
2. **Lead with the one-sentence summary**, then widen: why it matters → mechanics → trade-offs.
3. **Be concrete.** Prefer a small code snippet, a numbered sequence, or a real number over prose.
   Every code block declares its language.
4. **Show trade-offs as trade-offs** — "X buys you A at the cost of B", not a list of features.
5. **Weave the graph.** Add `[[wikilinks]]` to related notes inline and in `## Related`; link the
   note from its section `index.md`. Unresolved links to not-yet-written notes are encouraged.
6. **Right-size it.** A tight, correct note beats a long vague one. Split genuinely separate
   concepts into separate notes and link them.

## Tags

Tags are **thematic and cross-cutting**, not a copy of the folder path. The tree already says
*where* a note lives (Programming → .NET → Reflection); tags say *what concepts it touches*, so
notes cluster across folders in the graph and on tag pages.

- Lowercase kebab-case (`garbage-collection`, `api-design`, `tls`).
- Tag by concept, not location — don't add `programming` / `dotnet` just because of the folder.
- Reuse existing tags where they fit (the **New Note** command lists them); coin new ones sparingly.
- 2–4 is usually right; a note with no shared concepts can have none. Structural tags
  (`FolderNote`, `MetricsIgnore`) are separate and not for concept notes.

## Before you commit — always review (automatic)

After writing or editing a note, **automatically** run the **`reviewer`** subagent on it — don't
wait to be asked. The flow is: **write → review → apply the must-fixes → commit the fixed note.**
The reviewer reads with fresh eyes, checks against
[`references/verification.md`](references/verification.md), and verifies shaky claims against primary
sources, then returns must-fixes. Apply them, then set `status: done` / `publish: true` and commit.
You wrote it, so you're the worst judge of it — never commit a note that hasn't passed the gate.
(`/review-note` triggers the same reviewer manually.)

## Style

- **Diagrams:** prefer **Mermaid** code blocks for flows, sequences, and architecture — they render
  in both Obsidian and the site and diff in git; use Excalidraw only for freeform sketches.
- **Questions** are collapsible self-test callouts: `> [!question]- <q>` with the answer folded inside;
  ask design/review-level questions, not "what is X".
- Use callouts to signal importance: `> [!summary]`, `> [!tip]`, `> [!warning]`.
- Neutral, technical, timeless voice. No "recently", no dates in prose, no first person.
- Status has three states: `new` (a stub, nothing written), `in-progress` (actively being written),
  `done` (written and validated). A new stub starts `new` / `publish: false`; set `in-progress` while
  drafting, then `done` once every section is complete and it passed the reviewer, then `publish: true`.

## Hard constraints (public repo)

- No personal names, employers, colleagues, internal project names, private URLs, or secrets.
- No unverified claims presented as fact.
