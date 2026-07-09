---
description: Regenerate docs/repo-guide.html from the current repo and redeploy the same artifact
---

Bring the repository guide back in sync with the repo's actual state.

1. Re-scan the repo: folder structure under `Vault/`, the files in `.claude/`
   (commands, skills, hooks, settings), `quartz.config.ts`, `.github/workflows/`, `docs/`.
   Note anything that changed since the guide was last written.
2. Edit `docs/repo-guide.html` so every claim matches reality (file names, sections, counts,
   commands). Keep the existing design system, section structure, and Russian copy. Obey
   `.claude/feedback.md`. Do not invent files that don't exist.
3. Redeploy to the SAME artifact page by calling the Artifact tool with:
   - `file_path`: `docs/repo-guide.html`
   - `url`: `https://claude.ai/code/artifact/ce03401b-1126-4f79-a7f9-f97bc6b2f7ce`
   - `favicon`: `🌿`
   Passing `url` updates the existing page instead of minting a new one.
4. Commit `docs/repo-guide.html` and give a short summary of what changed.
