@AGENTS.md

## Claude Code specifics

- `AGENTS.md` above is binding; this file only adds what is Claude-specific.
- Slash commands in `.claude/commands/`: `/write-note` (the multi-agent pipeline), `/new-note`, `/expand`, `/review-note`, `/link`,
  `/feedback`, `/consolidate-feedback`, `/update-guide`.
- Hooks in `.claude/settings.json`: a pre-write secrets/personal-data block, the ledger size
  tripwire, and the reviewer gate (`track-note-edits.js` + the Stop hook `enforce-review.js`).
