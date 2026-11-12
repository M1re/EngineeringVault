---
description: Write one note with the lean pipeline — plan (author OK), research, fact-check, draft, review
argument-hint: <topic from docs/topic-map.md>
---

Write the note for: **$ARGUMENTS**

You are the orchestrator. You do not research or draft the note yourself. You run the agents in
order, pass them paths, and check their short replies. Each agent writes its own file in the work
folder, so keep their outputs out of your context: read a file only when a step needs it.

## Setup
1. Find the topic in `docs/topic-map.md`: hub or sub-note, its sub-topics, its folder. If it is not
   on the map, stop and ask the author.
2. Work folder: `.notes-work/<topic-slug>/` (gitignored). If it already has files from an earlier
   run, ask whether to continue or start over.

## Steps
1. **Plan** — `note-planner` writes `plan.md`. Show the author the plan's short summary (the
   sections with their opening questions, and what is left out) and **wait for an OK**. Apply the
   author's edits to `plan.md` yourself, or re-run the planner with them.
2. **Research** — one `note-researcher` collects sources for the plan's `## Verify` list only →
   `facts-raw.md`.
3. **Fact-check** — `note-fact-checker` → `facts.md` and `unverified.md`.
4. **Draft** — `note-drafter` writes `draft.md` from the plan and the facts, within the plan's
   length budget.
5. **Place** — `node scripts/strip-fact-tags.mjs .notes-work/<slug>/draft.md "Vault/<path>.md"`,
   then `npm run validate`. If the note replaces an existing note or stub, overwrite that file and
   keep its `created` and `publish` values. Link the note from its folder `index.md` if it is not
   already listed.
6. **Review** — run the `reviewer` subagent on the placed note. Apply its must-fixes yourself
   without leaving the plan's budget: an addition replaces text, it does not pile on. Then run
   `npm run validate` again, and record the receipt (`node .claude/hooks/review-receipt.js
   --verdict … "<note>"`). Then set `status: done`. Never change `publish`.

## Report to the author
In Russian, short: the note path, its length, fact counts (confirmed / unverified), what the
reviewer caught, what is left unverified. Then ask the author to read the note. Their remarks go
into `.claude/feedback.md` and, if general, into the reader profile.

## Rules
- One note per run. A hub's sub-notes are separate runs.
- Never skip the plan OK, the fact-check, or the reviewer. Never let the drafter use the web.
  Never invent a fact to fill a gap.
- Length is cut by choosing fewer topics in the plan, never by squeezing an explanation.
