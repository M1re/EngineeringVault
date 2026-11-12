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
  `/consolidate-feedback` when this file or `AGENTS.md` grows past its soft limit.

---

## Active rules

- Be concrete: real mechanics, numbers, failure modes, small code snippets — not textbook definitions.
  Every code example shows one idea and makes the key moment visible (e.g. what the compiler
  actually wrote into the caller). An API used in an example is explained in one sentence or not used.
- Length follows the topic: an easy topic is short. A detail stays only if an interviewer would ask
  it — this filter applies to reviewer suggestions and to fixes the orchestrator applies.
- **Interview-ready, not a textbook.** A note must be learnable for an interview in one sitting. Keep
  only what a typical senior / tech lead actually knows, uses or gets asked; deep runtime internals
  (spec sections, builder/box details, OS I/O plumbing) go to a sub-note or are dropped. A hub is
  short. Lively, colleague-to-colleague delivery like the author's own notes — not a grey,
  university-style "definition → Зачем → Механизм" march in every section.
- The note pipeline must be cheap and fast: few agents, no work that does not change the note.
- **Explain the trigger, not just the steps.** When a mechanism says "X happens later", say who makes
  it happen and how ("the OS signals the I/O is done → the code that owns the task completes it →
  the task calls the registered continuation"). Every rule carries its reason ("why"), and every
  term or metric (p99, RPS) is explained on first use. No telegraphic shorthand ("Под GUI —
  deadlock. Фикс один: …"); write full sentences.
- Usage rules ("await only once", "don't read .Result early") are taught by first showing how it
  breaks — a short step-by-step failure story plus BAD/GOOD code — then a plain can / can't list.
  A bare rule list with abstract reasons ("reusable object", "race") is not understandable.
- Section openers are neutral, interview-style questions ("Зачем нужен async, если поток может
  просто дождаться ответа?"), not chatty or childish ones ("Зачем вообще…", "просто").
- Clear and tight beats long and vague; if a point needs a re-read to parse, rewrite it.
  Chewed ≠ wordy: explain a point in more detail by splitting it into steps and showing it in
  code, not by adding sentences. One paragraph — one idea. No hollow contrasts (a term "defined"
  only against something left unsaid, like "a readonly field is a real field").
- Replies to the author (chat, summaries of work): short and plain — what was done, why, what to
  do next. No jargon, no wall of caveats; still technically honest.
- No AI slop: no filler, no hype, no restating the obvious, no padding to look thorough.
- Never fabricate facts, APIs, numbers, or features. If unsure → `> [!warning] Unverified`, or omit.
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
- Keep the repo self-contained: everything here is built from scratch and described on its own
  terms, without outside project references or copied code.
- Don't multiply docs: fold short how-tos (setup, workflow) into an existing file — machine setup
  lives as a concise README section, not its own note. How-tos are minimal: every command spelled
  out in a code block (incl. obvious ones like `git clone`), almost no prose. GUI steps: one
  plain sentence naming the setting — no click-by-click hand-holding.
- Keep this ledger lean: record proactively, merge duplicates, promote mature rules into structure.

## Archive (log)

<!-- Dated history. Newest first. Not required reading; kept for provenance. -->

### 2026-11-12

- Const vs Readonly (easy format test): too wordy, hollow and tangled phrasing, unclear examples;
  reviewer-driven additions (JIT tiers, static init timing, default-parameter versioning) made it
  longer, not clearer. → Rules above refined; planner/drafter/reviewer got the checks as structure.

- Asynchronous Execution hub accepted ("в остальном всё супер"), except the ValueTask rules, which
  were still hard to read. Added the "show how it breaks before the rules" active rule. Next: test
  the format on three more notes — one hard, one medium, one easy.

### 2026-11-11

- Lean-pipeline rewrite of the Asynchronous Execution hub: the author's remarks were that the `await`
  steps don't say how the code learns the result is ready, the openers read childish, the ValueTask
  rules lack context, the Pitfalls line is telegraphic, and p99 is unexplained. Added the "explain
  the trigger" and "neutral openers" active rules.
- Tidied older archive entries so the repo stays self-contained.
- Calibration run of `/write-note` (Asynchronous Execution hub, ~940 lines, 14 agent runs) rated
  **4/10**: "too bookish, nobody can learn it in this form", "too much text to prep for an interview",
  "grey, university-like delivery", "a pile of under-the-hood details maybe 1 in 10 tech leads
  knows". The pipeline also ate the usage limit and took too long for one note. Added the
  "interview-ready, not a textbook" and "cheap pipeline" active rules.
- Removed the Chisle and oh-my-claudecode plugins at the author's request; only the Obsidian skills
  plugin stays.
- New note strategy (epic #24): the vault is the author's **study guide** for reading and thinking at
  **senior / tech lead** level and passing interviews, not a public staff-level reference. Complaints
  that drove it: notes too complex, too much water, invented facts. Decided and promoted into
  structure (`note-writer` skill, template, reviewer, `verification.md`, `AGENTS.md`), so not repeated
  in Active rules:
  - hub note (basics + overview) + deep sub-topics as separate linked notes; basics to advanced;
  - body in Russian, technical terms / headings / code in English (EN translation later, #22);
  - one sentence = one thought, simple words, deep detail;
  - plain definition first, then why — **supersedes** the 2026-07-19 "never definition-first";
  - one short analogy per sub-topic, then the exact mechanism — **supersedes** "no metaphors";
  - In Production stays, with real domain code, never foo/bar; Questions are interview cards;
  - C# / .NET by default; version notes as text "(.NET 8+)", no emoji markers.
- Calibration source: the author's own hand-written notes (style patterns go into the reader profile,
  #20). Rollout: one note at a time with the author rereading, then batch.

### 2026-11-09

- Algorithm traces, complexity charts, and a site question bank are deferred and will be built
  in-house.

- "Too much water, I don't get what happened" on a long work summary: chat replies to the author
  must be short, plain and chewed — refined the explanations rule.
- Author wanted to try Chisle and oh-my-claudecode. Moved the rules into an agent-agnostic `AGENTS.md` (`CLAUDE.md` now
  imports it), enabled Chisle, oh-my-claudecode and the Obsidian skills as project plugins, and
  **promoted the "reviewer gate before committing" active rule into structure**: a Stop hook blocks
  finishing while an edited concept note lacks a hash-bound review receipt (`AGENTS.md` → Reviewer gate).

- Machine setup must not be a separate doc: folded `docs/machine-setup.md` into a short README
  section ("don't multiply notes"). Then: "too much water, missing commands (no clone)" —
  cut it to commands + a few lines.

- Author works on **Windows** now and wants a simple local workflow: one setup command, Quartz Syncer in local mode, and **commit =
  publish** via a pre-commit export hook. Implemented cross-platform in Node (`npm run setup`,
  `scripts/sync-quartz.mjs`, `.githooks/pre-commit`) so it runs on every OS. Removed the disabled auto-publish watcher (issue #1). Covered by the existing
  full-automation rule; no new active rule.

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
