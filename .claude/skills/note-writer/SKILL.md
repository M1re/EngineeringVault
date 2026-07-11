---
name: note-writer
description: Use when creating or editing technical concept notes in this Engineering Vault knowledge base (files under Vault/). Provides the methodology for writing notes at a staff-software-engineer depth — mechanics, trade-offs, and self-test questions — in the vault's required format. Trigger for tasks like "write a note on X", "expand this note", "document this concept", or any editing of Vault/*.md concept notes.
---

# Note Writer

You are writing durable reference notes for a **public** staff-engineer knowledge base.
The bar is: a reader finishes the note actually *understanding* the concept and its trade-offs,
not just able to recognise the term. Follow the format in `Vault/Templates/Concept Note.md`
and the rules in `CLAUDE.md`.

## The depth test

Before finishing a note, ask: *"Would this teach a mid-level engineer something a blog-post
definition wouldn't?"* If not, it isn't done. Every note must answer three questions:

1. **How does it actually work?** — the mechanism, step by step. Not "it uses a queue" but
   *what* is enqueued, *when*, *who* consumes it, and *what happens on failure*.
2. **What breaks in production?** — the failure modes, costs, and limits. This is the section
   that proves you understand the thing. Never skip or hand-wave it.
3. **What would a staff-level review ask?** — turn the hardest parts into self-test questions.

## Method

1. **Establish accuracy first.** Rely on well-established knowledge; for anything version-specific,
   niche, or that you're unsure about, verify against primary sources (RFCs, official docs, papers,
   the canonical book) rather than guessing. When you genuinely can't verify, write a
   `> [!warning] Unverified` callout instead of inventing detail. Never fabricate numbers or APIs.
   Follow the full protocol in [`references/verification.md`](references/verification.md).
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

## Before you call it done

Run an **independent accuracy pass** before setting `status: done` / `publish: true`: hand the note
to the **`reviewer`** subagent (the user can trigger it with `/review-note`). It reads with fresh
eyes, checks against [`references/verification.md`](references/verification.md), and confirms shaky
claims against primary sources — then returns must-fixes to apply. You wrote it, so you're the worst
judge of it; let the reviewer be the gate.

## Style

- Assume a smart reader; skip the 101-level throat-clearing.
- Use callouts to signal importance: `> [!summary]`, `> [!tip]`, `> [!warning]`.
- Neutral, technical, timeless voice. No "recently", no dates in prose, no first person.
- New notes start `status: creation` and `publish: false`; set `status: done` when every section is
  complete, and `publish: true` when it's ready for the public site (published via Quartz Syncer).

## Hard constraints (public repo)

- No personal names, employers, colleagues, internal project names, private URLs, or secrets.
- No unverified claims presented as fact.

## Anti-patterns to avoid

- A "How it works" section that only restates the summary.
- A "Trade-offs" section that lists benefits only, with no costs.
- Generic self-test questions ("What is X?") instead of design-level ones.
- Walls of prose where a code block, table, or numbered list would be clearer.
