# Feedback & Corrections Ledger

The author's feedback that shapes how I write and work in this repo.

**Binding = only the "Active rules" below.** Read and obey them before writing or editing anything.
The "Archive" is dated history for provenance and is NOT required reading.

How this stays healthy (so it never bloats and drags down quality):

- Record feedback proactively — append/refine the same turn the author gives it, no command needed.
- Prefer to **refine an existing active rule** over adding a near-duplicate.
- When a rule matures, move it into structure (the `note-writer` skill, the note template, a hook,
  or the Linter plugin) and **delete it from here** — structure costs no attention and is more reliable.
- A size tripwire hook (`.claude/hooks/check-ledger-size.js`) nudges you to run
  `/consolidate-feedback` when this file or `CLAUDE.md` grows past its soft limit.

---

## Active rules

- Be concrete: real mechanics, numbers, failure modes, small code snippets — not textbook definitions.
- Clear and tight beats long and vague; if a point needs a re-read to parse, rewrite it.
- For the author's own explanations: simple language, still detailed and technically honest.
- No AI slop: no filler, no hype, no restating the obvious, no padding to look thorough.
- Never fabricate facts, APIs, numbers, or features. If unsure → `> [!warning] Unverified`, or omit.
- Concept notes pass the **reviewer gate automatically before committing**: write → run the `reviewer`
  subagent → apply its must-fixes → commit. Never commit an un-reviewed note.
- Don't add AI-attribution / "made or maintained with Claude Code"-style credit lines — not to note
  content, and not to git commits (no `Co-Authored-By` trailer).
- Keep UI honest and minimal: show only states/data that really exist, and match the existing
  theme's accent colours rather than inventing new ones. (Progress now tracks three real statuses —
  `new`, `in-progress`, `done` — so its segmented bar + legend are honest.)
- Anything we build (dashboards, UI, dynamic elements, layout) must render the **same in Obsidian
  and on the deployed site**. Use tech that works in both — Datacore precompiled by Quartz Syncer,
  or plain Markdown/HTML — and never ship a feature that only works in one of the two.
- Default to **full automation** and **path-agnostic, no-personal-data** solutions: prefer writing/
  committing a config file over asking for manual GUI clicks; never hardcode absolute paths or
  machine/user-specific data — derive them — so future installs and machine moves are trivial.
- Keep this ledger lean: record proactively, merge duplicates, promote mature rules into structure.

## Archive (log)

<!-- Dated history. Newest first. Not required reading; kept for provenance. -->

### 2026-09-04

- **Supersedes the 2026-07-08 "done/total only, no legend/segments" decision.** The progress model is
  now **three real statuses** — `new` (nothing written), `in-progress` (being written), `done` (written
  and validated). The bar is segmented (done solid + in-progress lighter accent; the rest reads as new)
  with a legend showing all three counts; % stays the `done` share. This is honest because all three
  states now exist. Migrated legacy `creation`/`created` → `new`. Kept in sync across the regen script
  (`scripts/regen-dashboards.mjs`), the home `TopicDashboard`, all folder `FolderDashboard` blocks, and
  the Folder Note template so Obsidian and the site render identically.
- Fixed `regen-dashboards.mjs`: its old end-marker (`</style></div>`) never matched the compiled HTML,
  so the CI regen step was a silent no-op. It now finds the dashboard block by balanced `<div>` matching.

### 2026-07-19

- Calibrated the note-writing standard on the Async/Await note (the new **reference note**). Promoted
  all of it into structure (the `note-writer` skill + `Concept Note.md` template + `/expand` +
  `verification.md`), so it is not repeated here. In short: notes are deep-by-default and
  interview-grade; no generic `## How it works` header — the body is topical sections with strict,
  official noun-phrase headers; explain **why before how** and never definition-first; ground an
  unfamiliar supporting concept from scratch before using it; strictly technical but slow, no
  metaphors and no padding; concrete phrasings (name the object of the action); short sentences and
  simple punctuation; `Pitfalls & Trade-offs` is numbered with a code snippet/scenario per item;
  `In Production` carries real before/after code.
- **Process (from the Threads note calibration), also promoted into structure:**
  - **Research-first (skill `Method` step 1).** Never draft the mechanism from memory. Research
    against primary sources (docs, the RFC/spec, the runtime/reference source) and verify orderings
    and precedence/fallback sequences *as a whole*, not step by step — an individually-true step can
    be misplaced or have a step omitted before the next (this is how the work-stealing order was
    wrong: it is local LIFO → global FIFO → steal FIFO, steal last, not "empty local → steal").
  - **Reviewer + `verification.md` now run three passes, not just accuracy:** completeness/depth
    (missing staff-level mechanisms/nuances, misordered or omitted steps → must-fix), reads-as-
    invented, and **readability** (ungrounded jargon like L1/L2/L3/TLB, number-dumping, water).
  - **Whiteboard register (the recurring "заумно" failure).** Say what actually happens with concrete
    verbs and nouns ("the GC freezes every thread and reads its stack"), not abstract categories
    ("takes part in runtime services", "a wrapper around it", "is responsible for"). Ban mid-sentence
    hedges ("in normal use", "generally") and never drop the noun ("runs two threads", not "runs
    two"). If a sentence could describe ten different systems, it is too abstract.
  - Workflow that produced the reference note: **research → draft to the standard → `reviewer`
    subagent (accuracy + completeness + readability) → apply must-fixes → publish**. Author reviews
    the finished draft (no depth-outline step); iterate on the live note.
- The **Threads and the Thread Pool** note itself was deleted at the author's request after it kept
  reading as watery/over-clever despite many passes. The *process and these remarks are kept*; the
  article is not. Rewrite it fresh later, from research, in the whiteboard register above.

### 2026-07-09

- Bias to full automation, path-agnostic, no personal/machine-specific data: prefer committing a
  config that travels via git over manual GUI steps; derive paths, never hardcode absolute ones.
  Update the new-machine setup guide whenever the setup changes.

### 2026-07-08

- Rule: everything we build must look the same in Obsidian **and** in the deployed version — pick
  tech that renders in both (Datacore + Quartz Syncer, or plain Markdown/HTML).
- Progress model is simple **done/total** (not the 4-status spaced-repetition ramp). The dashboard
  must not show a legend/segments implying statuses that don't exist; the overall bar uses the
  theme's teal accent (matches the tip callout), not grey.
- Remove AI-attribution / credit lines from content (e.g. "maintained with the help of Claude Code").
- Guard against bloat: keep "Active rules" small and `CLAUDE.md` principle-level; promote mature
  rules into structure; use a size-tripwire hook + `/consolidate-feedback` to stay compact.
- Maintain this ledger proactively/automatically during conversation (no `/feedback` needed).
- Seed: the author dislikes AI-slop phrasing, invented/unreal facts, and confusing writing —
  optimise for correct, concrete, clear.
