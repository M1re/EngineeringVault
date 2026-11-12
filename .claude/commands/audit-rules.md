---
description: Audit the rules — one home per rule, no duplicates or conflicts — and check notes against them
argument-hint: "[rules | notes <note paths…>]  (empty = both)"
---

Audit: **$ARGUMENTS** (empty means both modes).

You are the orchestrator. The `rules-auditor` agent does the reading; you show the author the
result and apply only what they approve.

## When to run
On demand, after a batch of new notes, or when the ledger size tripwire
(`.claude/hooks/check-ledger-size.js`) fires. Do not run it while the pipeline is mid-change: change
one thing at a time so a bad result can be traced back.

## Steps
1. **Audit** — run `rules-auditor` with the mode(s) and the report path
   `.notes-work/_audit/<YYYY-MM-DD>.md` (gitignored).
2. **Show the author** a short summary in Russian, by class:
   - duplicates with the proposed single home;
   - conflicts that need their decision;
   - stale, narrow and template-trap rules;
   - for notes: violations per note, and any rule gaps.

   Wait for an OK on each group. Conflicts are always the author's call.
3. **Apply** the approved changes:
   - Keep each rule in one place. Elsewhere, replace it with a pointer or remove it.
   - When a ledger rule moves into structure, delete it from the Active rules.
   - Keep the Archive. You may summarise very old entries, but never invent history.
   - Add one dated Archive line saying what the audit changed.
4. **Never edit notes here.** A note fix goes through `/expand` or `/write-note` and the reviewer
   gate.
5. **Report** before/after counts (active rules, archive entries, `AGENTS.md` lines, rule lines per
   home) and what changed. Run `npm run validate`.

## Rules
- Prefer removing or merging over adding. A new rule needs the problem seen in at least two notes.
- Keep files LF.
