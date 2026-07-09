# Engineering Vault — Improvement Roadmap

Ideas for improving the vault, ordered by priority. Every item must render the **same in Obsidian
and on the deployed site** (see `.claude/feedback.md`).

## P1 — foundational / highest impact

1. **Align the note-creation workflow with the current model.** Update the note template,
   `/new-note`, the `note-writer` skill, `CLAUDE.md`, and the repo guide from the old `draft` field
   to `status` / `publish` + `Vault/` + Quartz Syncer. *Why:* adding a note is currently
   inconsistent and the docs are stale. This underpins everything else.
2. **Logical section order** (Programming → DevOps) instead of alphabetical — a custom Explorer
   `sortFn` (no folder renames) or numbered folders. *Why:* reads like a curriculum; matches the
   reference. Low effort.
3. **Per-section dashboards.** Each section folder-note gets a small `datacorejsx` block listing
   its notes with status pills and subtopic progress. *Why:* every section landing becomes a live
   index, consistent with the home page. Works in both.

## P2 — high-value dynamic / UX

4. **"Recently updated" block on the home page** — a Datacore list of the last N edited notes.
   *Why:* shows the garden is alive; easy re-entry point.
5. **Status badge on every note** — a coloured `status` pill at the top (Obsidian: pretty-properties;
   site: via Syncer frontmatter / inline Datacore). *Why:* at-a-glance state. Verify it renders in both.
6. **Subtopic nesting convention** — define how topics nest (a folder + folder-note per subtopic,
   like `Programming/Concurrency/...`), with a command/template to scaffold them. *Why:* makes the
   Explorer tree rich and scalable.
7. **Roadmap / "to write" page** — a Datacore table of planned or `not-started` topics across
   sections. *Why:* turns gaps into a visible backlog.

## P3 — polish / cosmetic

8. **Questions bank page** — aggregate every "Questions to test yourself" section into one
   Datacore-driven review page. *Why:* a spaced-repetition study surface.
9. **Site theme pass** — apply/tune a Quartz theme (e.g. saberzero1/quartz-themes) so the site's
   overall look matches your Obsidian. *Why:* cohesive brand. Cosmetic.
10. **Graph + search + meta polish** — tune the graph (local/depth), add a tags page, set a custom
    favicon, OG image, and site description. *Why:* discoverability and shareable link previews.
