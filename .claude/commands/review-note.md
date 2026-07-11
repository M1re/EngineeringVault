---
description: Independent quality/accuracy review of a note (via the reviewer subagent) before publishing
argument-hint: <path or title of the note to review>
---

Run an independent review of **$ARGUMENTS** before it goes public.

Delegate to the **`reviewer`** subagent (Agent tool, `subagent_type: "reviewer"`): give it the note's
path and ask for a full pass against `.claude/skills/note-writer/references/verification.md`. It reads
with fresh eyes, verifies shaky or version-specific claims against primary sources, and returns a
findings list (must-fix vs nice-to-have) ending in a **PUBLISH-READY** / **NEEDS WORK** verdict.

Then:

- Relay the reviewer's findings to me, most-severe first.
- Offer to apply the **must-fix** items (the reviewer only suggests — you make the edits, on my go).
- If it comes back publish-ready, remind me to set `status: done` / `publish: true` and publish via
  the Quartz Syncer Publication Center.

Privacy is still blocking: if the reviewer flags any personal/private data (names, emails, employers,
internal URLs, secrets), nothing else matters until it's redacted — this repo is PUBLIC.
