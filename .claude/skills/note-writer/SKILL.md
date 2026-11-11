---
name: note-writer
description: Use when creating or editing technical concept notes in this Engineering Vault knowledge base (files under Vault/). Provides the methodology for writing notes at senior / tech lead depth — from the basics to advanced topics, mechanics, trade-offs, and interview questions — in the vault's required format. Trigger for tasks like "write a note on X", "expand this note", "document this concept", or any editing of Vault/*.md concept notes.
---

# Note Writer

## Purpose and reader

The vault is the author's study guide. A note must let the reader **think at senior / tech lead
level** about the topic and **pass an interview** on it. The reader finishes the note understanding
how the thing works, where it breaks, and how to answer questions about it.

- **Reader:** an engineer moving to senior / tech lead. Cover the topic **from the basics to
  advanced**. Skip nothing a senior is expected to know.
- **Stack:** C# / .NET by default. Use another language only when the topic is not about .NET.
- **Language:** the note body and `summary` are in **Russian**. Technical terms stay in **English**
  (`Thread Pool`, `state machine`, `deadlock`, `ConfigureAwait`). Frontmatter `title`, all `##`/`###`
  headings, code, and code comments for identifiers stay in English. Explanatory code comments are
  in Russian.
- **How this reader learns** — the patterns, examples, and anti-patterns in
  [`references/reader-profile.md`](references/reader-profile.md). Read it before drafting.

## Note shape: hub + sub-notes

- A **hub note** covers a whole topic: the basics and an overview of every sub-topic, so the reader
  sees the full picture in one place (for example "Asynchronous Execution").
- A sub-topic that needs real depth (`ValueTask`, `ConfigureAwait`) gets **its own note**. The hub
  gives a short overview of it and links to it; the sub-note links back to the hub.
- Every note follows `Vault/Templates/Concept Note.md`.

## Section pattern

After the `> [!summary]`, the body is a run of topical sections with short English noun-phrase
headers (`## Thread Pool`, `### Context Switching`), ordered from the basics to advanced. Each
sub-topic follows this pattern:

1. **Definition in plain words** — one or two sentences: what it is.
2. **Why it matters** — the problem it solves, or what goes wrong without it.
3. **Mechanism, step by step** — what actually happens: who does what, in what order, what happens
   on failure. If it leans on a concept the reader may not know, explain that concept first.
4. **Example code** — real domain code (orders, payments, accounts, requests), never `foo`/`bar`.
   Comments trace the execution step by step where the flow is not obvious. Show a `// ❌ BAD` /
   `// ✅ GOOD` pair when there is a common mistake.
5. **Key points** — a short bullet list of what to remember.

Use, where they fit:
- **One short analogy per sub-topic** to anchor the idea, followed immediately by the exact mechanism.
- **A comparison table** for "X vs Y".
- **Numbered rules** ("ValueTask: rules of use").
- **A real-life scenario** ("the user reloads the page 5 times").
- **Senior-level details** — the facts that separate a senior from a junior (`const` is inlined into
  the calling assembly, so changing it needs a rebuild of the caller).
- **Mermaid** diagrams for flows and sequences.
- **Version notes as text** — "(.NET 8+)", never emoji markers.

## Writing standard

- **One sentence = one thought.** Short sentences, simple words, deep detail.
- **Say what actually happens.** Concrete verbs and nouns: "the GC freezes every thread and reads
  its stack", not "the thread takes part in runtime services". If a sentence could describe ten
  different systems, name the specific thing instead.
- **Name the object.** "the worker thread", not "it"; "runs two threads", not "runs two".
- **Cut:** filler, hedges ("generally", "in normal use"), decorative labels ("context-switch tax"),
  sentences that only restate the previous one, forward pointers ("more on this later").

## Fixed tail sections

- **Pitfalls & Trade-offs** — a numbered list, most common or most dangerous first. Each item has a
  short code snippet or a concrete scenario that shows why it breaks. Trade-offs read "X buys A at
  the cost of B".
- **In Production** — a working example from a real system: real domain code, the bad version and
  the fix, plus the symptom (latency, error, outage) that shows the difference.
- **Questions** — interview cards: `> [!qard]- <the interview question>` with the answer folded
  inside. The answer is how a senior answers: the direct answer, the mechanism behind it, and the
  trade-off or "it depends" a senior would add. 4–8 cards per hub note.
- **Related** — wikilinks to the hub, sub-notes, and neighbouring notes.
- **References** — primary sources.

## Facts: research first

Never draft a mechanism from memory. Research the topic in primary sources first (official docs,
the spec, the runtime source, the canonical book). Verify multi-step orders (lookup, fallback,
precedence) **as a whole**, not one step at a time. Draft only from what you verified. If a point
cannot be verified, write a `> [!warning] Unverified` callout or leave it out. Full protocol:
[`references/verification.md`](references/verification.md).

## Workflow

1. **Research** the topic in primary sources.
2. **Plan** the hub and sub-notes, ordered from the basics to advanced.
3. **Draft** to the section pattern and the writing standard.
4. **Review** with the `reviewer` subagent, apply every must-fix, record the receipt (see the
   reviewer gate in `AGENTS.md`).
5. The author rereads the finished note and gives feedback.

A multi-agent pipeline (`/write-note`) will replace this single-agent workflow (issue #21).

## Tags

Tags are thematic and cross-cutting, not a copy of the folder path: lowercase kebab-case
(`garbage-collection`, `api-design`), 2–4 per note, reuse existing tags where they fit. Structural
tags (`FolderNote`, `MetricsIgnore`) are not for concept notes.

## Status

`new` (a stub, nothing written) → `in-progress` (being written) → `done` (written and passed the
reviewer gate), then `publish: true`.

## Hard constraints (public repo)

- No personal names, employers, colleagues, internal project names, private URLs, or secrets.
- No unverified claims presented as fact.
