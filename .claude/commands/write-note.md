---
description: Write one note with the multi-agent pipeline — research, fact-check, plan, draft, audit, learner test, cut, review
argument-hint: <topic from docs/topic-map.md> [--review-plan]
---

Write the note for: **$ARGUMENTS**

You are the orchestrator. You do not research or write the note yourself; you run the agents in
order, pass them paths, and check their one-line replies. Each agent writes its own file in the
work folder, so keep their outputs out of your context: read a file only when a step needs it.

## Setup
1. Find the topic in `docs/topic-map.md`: hub or sub-note, its sub-topics, its folder. If it is not
   on the map, stop and ask the author.
2. Work folder: `.notes-work/<topic-slug>/` (gitignored). If it already has files from an earlier
   run, ask whether to continue or start over.

## Steps
1. **Research** — three `note-researcher` agents **in parallel**, angles `docs`, `internals`,
   `practice`. Each writes `facts-<angle>.md`.
2. **Fact-check** — `note-fact-checker` writes `facts.md` and `unverified.md`.
3. **Plan** — `note-methodologist` writes `plan.md`. If it reports missing facts, run one
   `note-researcher` for exactly those facts, then the fact-checker on that file, then re-plan.
   With `--review-plan`, show the author the plan's section list and wait for an OK.
4. **Draft** — `note-drafter` writes `draft.md`.
5. **Review, in parallel** — `note-auditor` → `audit.md`, `note-learner` → `learner.md`,
   `note-cutter` → `cuts.md`.
6. **Revise** — `note-drafter` revision pass with the three reports. If the audit had must-fixes,
   run `note-auditor` once more on the revised draft; repeat the revision until `VERDICT: CLEAN`
   (at most two rounds, then stop and report to the author).
7. **Place** — `node scripts/strip-fact-tags.mjs .notes-work/<slug>/draft.md "Vault/<path>.md"`,
   then `npm run validate`. If the note replaces an existing note or stub, overwrite that file and
   keep its `created` date. Link the note from its folder `index.md` if it is not already listed.
8. **Reviewer gate** — run the `reviewer` subagent on the placed note, apply its must-fixes, and
   record the receipt (`node .claude/hooks/review-receipt.js --verdict … "<note>"`). Then set
   `status: done`; leave `publish: false` until the author approves the note.

## Report to the author
In Russian, short: the note path, fact counts (confirmed / unverified), what the auditor and the
learner caught, any myth the fact-checker caught, what is left unverified. Then ask the author to
read the note. Their remarks go into `.claude/feedback.md` and, if general, into the reader profile.

## Rules
- One note per run. A hub's sub-notes are separate runs.
- Never skip the fact-check or the auditor, never let the drafter use the web, never invent a fact
  to fill a gap.
