---
description: Deepen an existing note — more mechanics, trade-offs, and rigor
argument-hint: <path or title of the note to expand>
---

Expand and deepen this note: **$ARGUMENTS**

1. Read the note. If only a title was given, find the matching file under `Vault/`.
2. Raise it to the standard in the **`note-writer`** skill (calibrated on `Vault/Programming/Concurrency/Async and Await.md`):
   - Strengthen the **mechanism sections** (topical, official noun-phrase headers — no `## How it
     works` umbrella): explain why-before-how, ground unfamiliar supporting concepts, add a
     generated-code sketch or Mermaid diagram where it explains better than prose.
   - Make **Pitfalls & Trade-offs** a numbered list where each item has a code snippet or scenario
     showing why it is wrong; give **In Production** real code (bad version and fix) plus a number.
   - Ensure the self-test questions are substantive (design-review / staff-interview level).
3. Add or fix `## Related` wikilinks to other notes in the vault.
4. Verify technical accuracy. Flag anything uncertain with a `> [!warning] Unverified` callout
   instead of inventing details. Prefer primary sources in `## References`.
5. Keep the existing format and frontmatter. Do not add personal/private data.

Show me a short diff-style summary of what you strengthened.
