# Engineering Vault — Project Guide for Claude

This repository is a **public** Obsidian knowledge base about what a **staff software engineer**
should understand deeply. Notes live in `content/` and are published as a website with **Quartz**
(GitHub Pages). When you help here, you are writing and organising durable technical notes.

## 🚨 Non-negotiable rules

1. **This repo is PUBLIC. Never write personal or private information.** No real names, emails,
   employers, colleagues, internal project names, private URLs, tokens, API keys, passwords,
   or anything identifying the author or their company. If a source has such data, strip it.
2. **Never invent facts.** Technical accuracy matters more than volume. If unsure, say so in the
   note (a `> [!warning] Unverified` callout) or leave it out. Prefer primary sources.
3. **English only** for note content (frontmatter, headings, body). This is the audience's language.

## Repository layout

```
content/            ← the Obsidian vault + all notes (this is what gets published)
  index.md          ← site home page (Map of Content)
  <Section>/index.md← each section's landing page
  Templates/        ← note templates (not published as real content)
  attachments/      ← images and binaries
  .obsidian/        ← Obsidian config (travels with the vault)
.claude/            ← automation: commands, skills, hooks, settings
CLAUDE.md           ← this file
quartz.*, package.json, quartz/  ← the static-site generator (do not edit unless asked)
```

The 9 sections: Programming, Computer Science, Data Persistence, Networks, Architecture,
AI and ML, Security, Cloud, DevOps. Put every note in exactly one section folder.

## Note format

Every concept note follows `content/Templates/Concept Note.md`. Frontmatter:

```yaml
---
title: "Human Readable Title"
tags: [lowercase-kebab-tags]
draft: true        # true = hidden from the published site; flip to false when ready
created: YYYY-MM-DD
---
```

Required body sections, in order:
- `# Title`
- `> [!summary] In one sentence` — a crisp definition
- `## Why it matters` — when it shows up in real systems
- `## How it works` — the mechanics, deep enough to *understand* not just recognise
- `## Trade-offs & pitfalls` — production reality; this is the most important section
- `## Questions to test yourself` — 2–5 substantive staff-level questions
- `## Related` — wikilinks to neighbouring notes
- `## References` — primary sources

## Writing style (staff-engineer bar)

- Explain **mechanics and trade-offs**, not textbook definitions. Assume a smart reader.
- Be concrete: real numbers, real failure modes, small code snippets, sequence of steps.
- Prefer clarity over completeness. A short accurate note beats a long vague one.
- Use Obsidian callouts (`> [!note]`, `> [!warning]`, `> [!tip]`) to highlight key points.
- Fenced code blocks must declare a language.

## Linking conventions

- Link liberally with `[[wikilinks]]`. A link to a note that doesn't exist yet is fine — it's a
  roadmap marker. Use folder-qualified links when titles could collide: `[[Networks/index|Networks]]`.
- Every new note should link to at least one existing note and be linked from its section `index.md`.
- Section landing pages are always `<Section>/index.md` with `tags: [moc]`.

## Quartz / publishing notes

- `draft: true` keeps a note out of the built site. New notes start as drafts.
- Folder `index.md` becomes the folder's landing page on the site.
- Do not rename or restructure `content/` folders without updating links and section indexes.

## Automation available in this repo

- Slash commands in `.claude/commands/` (e.g. `/new-note`, `/expand`, `/review-note`).
- A skill in `.claude/skills/` for writing notes at the right depth and format.
- A pre-write hook that blocks obvious secrets/personal data (see `.claude/settings.json`).
