# Setup & Workflow

How to work on this vault locally. (This file is documentation, not published to the site.)

## 1. Open the vault in Obsidian

Open the **`content/`** folder as your Obsidian vault (not the repo root):
`Open folder as vault` → select `.../EngineeringVault/content`.

The repo root holds the site generator (Quartz) and automation (`.claude/`); `content/` holds
your actual notes. Keeping them separate is what makes publishing clean.

## 2. Recommended Obsidian community plugins

Install from Obsidian: **Settings → Community plugins → Browse**. Turn off *Restricted mode* first.
Search each by name, Install, then Enable.

| Plugin | Why | Priority |
| --- | --- | --- |
| **Obsidian Git** | Auto-commits and pushes your notes to GitHub on a schedule. This is your backup **and** what triggers the site to rebuild. | ⭐ Must-have |
| **Excalidraw** | Hand-drawn diagrams for architecture/network notes. Export as PNG/SVG into `attachments/` so they show on the site. | ⭐ Must-have |
| **Advanced Tables** | Makes editing Markdown tables painless (auto-alignment, navigation). | High |
| **Linter** | Formats notes consistently on save (frontmatter order, spacing). Pairs well with Claude-written notes. | High |
| **Dataview** | Query your notes (e.g. list every draft, or all notes in a section). ⚠️ Renders in Obsidian only — Quartz does **not** run Dataview, so don't rely on it for published pages. | Medium |
| **Templater** | More powerful than the core Templates plugin (dynamic dates, prompts). Optional upgrade later. | Medium |
| **Homepage** | Opens `index.md` as a dashboard when you launch Obsidian. | Nice-to-have |

The core **Templates** plugin is already enabled and pointed at the `Templates/` folder, so you can
start creating notes from a template right away (Command palette → *Insert template*).

## 3. Obsidian Git — quick config

After installing Obsidian Git:
- Set **Auto commit-and-sync** interval (e.g. every 10–30 min) if you want hands-off backups, or
  leave it manual and use the command *"Obsidian Git: Commit-and-sync"* when you're ready.
- The plugin finds the `.git` at the repo root automatically even though the vault is `content/`.
- Every push to `main` triggers the GitHub Pages rebuild (see `.github/workflows/`).

## 4. Working with Claude Code

Run `claude` from the repo root (`EngineeringVault/`). Available custom commands:

| Command | What it does |
| --- | --- |
| `/new-note Architecture — Load Balancing` | Creates a fully-formatted note in the section. |
| `/expand Idempotency` | Deepens an existing note to the staff-engineer bar. |
| `/review-note Idempotency` | Checks a note for privacy leaks, format, depth before publishing. |
| `/link Idempotency` | Weaves a note into the graph with wikilinks. |

Claude also auto-loads the **note-writer** skill and the rules in `CLAUDE.md`. A pre-write hook
(`.claude/hooks/check-secrets.js`) blocks accidental secrets/personal data — this repo is public.

## 5. Publishing

Notes with `draft: true` in their frontmatter stay hidden from the public site. Flip to
`draft: false` when a note is ready. Push to `main` and GitHub Pages rebuilds automatically.
