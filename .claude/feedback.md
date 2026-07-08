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
- Don't add AI-attribution / "made or maintained with Claude Code"-style credit lines to content.
- Keep UI honest and minimal: don't show static elements that look like live data (e.g. a legend
  implying statuses that don't exist), and match the existing theme's accent colours rather than
  inventing new ones.
- Keep this ledger lean: record proactively, merge duplicates, promote mature rules into structure.

## Archive (log)

<!-- Dated history. Newest first. Not required reading; kept for provenance. -->

### 2026-07-08

- Progress model is simple **done/total** (not the 4-status spaced-repetition ramp). The dashboard
  must not show a legend/segments implying statuses that don't exist; the overall bar uses the
  theme's teal accent (matches the tip callout), not grey.
- Remove AI-attribution / credit lines from content (e.g. "maintained with the help of Claude Code").
- Guard against bloat: keep "Active rules" small and `CLAUDE.md` principle-level; promote mature
  rules into structure; use a size-tripwire hook + `/consolidate-feedback` to stay compact.
- Maintain this ledger proactively/automatically during conversation (no `/feedback` needed).
- Seed: the author dislikes AI-slop phrasing, invented/unreal facts, and confusing writing —
  optimise for correct, concrete, clear.
