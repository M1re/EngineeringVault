---
description: Compact the feedback ledger — merge duplicates, drop one-offs, promote mature rules
---

Consolidate `.claude/feedback.md` so it stays small and high-signal.

1. Read `.claude/feedback.md`, and skim what already enforces rules structurally:
   `CLAUDE.md`, `.claude/skills/note-writer/SKILL.md`, `Vault/Templates/Concept Note.md`,
   and `.claude/hooks/`.
2. Rewrite the **Active rules** into a minimal, non-overlapping set:
   - Merge duplicates and near-duplicates into one clear rule.
   - Remove one-off nitpicks that aren't general.
   - Resolve contradictions; if a real conflict needs a decision, ask the author.
3. **Promote mature rules into structure**, then delete them from the ledger: a writing rule →
   the note-writer skill or the note template; a hard constraint → a hook; formatting → Linter.
   Tell the author which rules you promoted and where.
4. Keep the **Archive**; you may summarise very old entries, but never invent history.
5. Report before/after counts (active rules, archive entries, `CLAUDE.md` lines) and what changed.
