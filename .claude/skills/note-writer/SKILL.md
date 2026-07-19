---
name: note-writer
description: Use when creating or editing technical concept notes in this Engineering Vault knowledge base (files under Vault/). Provides the methodology for writing notes at a staff-software-engineer depth — mechanics, trade-offs, and self-test questions — in the vault's required format. Trigger for tasks like "write a note on X", "expand this note", "document this concept", or any editing of Vault/*.md concept notes.
---

# Note Writer

You are writing durable reference notes for a **public** staff-engineer knowledge base.
The bar is: a reader finishes the note actually *understanding* the concept and its trade-offs,
not just able to recognise the term.

**Audience:** a solid **mid-level** engineer levelling up toward staff — so explain the mechanism
fully and don't hand-wave "you already know this"; skip only the trivial 101. **Simple words, deep
content:** layer it — the plain gist first, then under the hood. Complex wording is not smartness.

Follow the structure in `Vault/Templates/Concept Note.md` and the rules in `CLAUDE.md`. The
**reference note** for both structure and writing calibre is `Vault/Programming/Concurrency/Async and Await.md`
([[Async/Await]]) — match it.

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

## Writing standard (the bar, calibrated on the reference note)

Deep by default, but the enemy is padding, not length. Write so a mid-level engineer *understands*,
not just recognises.

- **Why before how.** Open each section with the problem, or the concrete question it answers, then
  the mechanism. Introduce a term only once the reader feels why it is needed. Never definition-first
  — "A `SynchronizationContext` decides which thread runs the rest of your method after an `await`"
  lands; "A `SynchronizationContext` represents a place to run code" does not.
- **Ground unfamiliar supporting concepts.** If a section leans on something the reader may not know
  (e.g. the UI thread), explain that thing from scratch — what it is and why its rule exists — before
  you build on it.
- **Strictly technical, but slow.** Explain in small steps. No metaphors, no analogy-as-crutch, no
  water, no restating the summary.
- **Concrete phrasings.** Name the object of the action: "block a thread", not "block"; "frees its
  thread back to the pool", not "frees it".
- **Whiteboard register, not corporate abstraction — this is the most common way notes read as
  "заумно".** Explain by *what actually happens*, with concrete verbs and nouns: "the GC freezes
  every thread and reads its stack to see which objects are still used", not "the thread takes part
  in runtime services the OS knows nothing about". Ban abstract-category filler ("takes part in",
  "is responsible for", "participates in", "leverages", "a wrapper around it") and mid-sentence
  hedges ("in normal use", "generally", "effectively"). If a sentence could describe ten different
  systems, it is too abstract — name the specific thing that happens.
- **Dry, not colourful.** No metaphors or "flavour" labels for a mechanism ("thin skin", "standing
  crew", "context-switch tax", "starvation valve"), no editorial asides ("here is the bind", "the
  cost is sneaky"), and no comparisons to a language or tech the note is not about ("the same thread
  a C program would get" in a .NET note). Every sentence carries one concrete step of the
  explanation. If a sentence only restates the last one or decorates it, cut it.
- **Short sentences, simple punctuation.** One idea per sentence. Prefer a period over a semicolon, a
  mid-sentence colon, or a stacked-clause em-dash.
- **Code where it explains better than prose** — not only in Pitfalls and In Production, but inside a
  tricky mechanism section too (a generated-code sketch, a two-line before/after).

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

- Write for a mid-level engineer levelling up: explain the mechanism fully; skip only trivial 101.
- **Diagrams:** prefer **Mermaid** code blocks for flows, sequences, and architecture — they render
  in both Obsidian and the site and diff in git; use Excalidraw only for freeform sketches.
- **Questions** are collapsible self-test callouts: `> [!question]- <q>` with the answer folded inside.
- Use callouts to signal importance: `> [!summary]`, `> [!tip]`, `> [!warning]`.
- Neutral, technical, timeless voice. No "recently", no dates in prose, no first person.
- New notes start `status: creation` and `publish: false`; set `status: done` when every section is
  complete (and it passed the reviewer), then `publish: true` when ready for the site.

## Hard constraints (public repo)

- No personal names, employers, colleagues, internal project names, private URLs, or secrets.
- No unverified claims presented as fact.

## Anti-patterns to avoid

- A generic `## How it works` umbrella header, or a mechanism section that only restates the summary.
- Definition-first openings that name a term before the reader feels why it is needed.
- A "Trade-offs" section that lists benefits only, with no costs; pitfalls stated without a code
  snippet or scenario showing why.
- Generic self-test questions ("What is X?") instead of design-level ones.
- Metaphors, padding, stacked-clause sentences, or walls of prose where a code block, a before/after,
  or a numbered list would be clearer.
