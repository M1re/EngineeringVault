---
description: Record a correction/preference into the binding feedback ledger so it sticks
argument-hint: <what was wrong, or what you want done differently>
---

The author is giving feedback: **$ARGUMENTS**

(Note: recording feedback is normally automatic per `CLAUDE.md` — this command is just a manual
shortcut to force the same action.)

Do this:

1. Distill the feedback into 1–3 **general, reusable rules** — something to apply next time,
   not a comment about one specific sentence.
2. Append to `.claude/feedback.md`:
   - Always add a dated entry under `## Log` (newest first).
   - If it's a durable style/behaviour rule, also add a concise bullet under the matching
     `## Writing — do` / `## Writing — don't` section.
   - Keep it short and imperative. No personal data (public repo — the secret-scan hook will
     block emails/keys anyway).
3. If it's a significant cross-session behaviour rule, also save it to Claude's memory as a
   `feedback` entry so it survives even before `CLAUDE.md` loads.
4. Show me the exact rule(s) you added, then immediately apply the correction to whatever we
   were working on.
