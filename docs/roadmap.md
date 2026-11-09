# Engineering Vault — Roadmap

Every item must render the **same in Obsidian and on the deployed site**. Ideas borrowed from other
vaults are rebuilt here, not copied.

## Next

1. **Question bank page** — one page that collects every `> [!qard]-` card by section, in Obsidian
   (Datacore) and on the site (our own Quartz component/transformer). Qard already drives spaced
   repetition in Obsidian; this adds the browsable overview.
2. **Algorithm traces** — an interactive step-by-step trace for Computer Science notes (array state per
   step), authored once as a fenced block and rendered in both surfaces.
3. **Complexity charts** — a fenced block that plots O(1)…O(n!) curves for a note's operations.
4. **"Recently updated" on the home page** — the last N edited notes (Datacore).
5. **Status badge on every note** — a coloured `status` pill at the top of each note.
6. **"To write" page** — a table of `new` notes across sections, as a visible backlog.
7. **Graph + meta polish** — tune the graph, favicon, OG image, site description.

## Done

- `status` / `publish` model (`new` / `in-progress` / `done`) with the segmented progress bar.
- Curriculum order in the Explorer; Section → sub-topic → note nesting with folder-note dashboards.
- Notion theme + covers in both surfaces ([covers.md](covers.md)); covers mirrored by the commit hook.
- Commit = publish: Syncer local mode + pre-commit export; one-command `npm run setup`.
- Quartz v5; plugins updated; Omnisearch, Attachment Management, Advanced Rename/Delete, Qard.
- `summary` frontmatter → site description; `npm run validate` in CI; reviewer gate with receipts.
