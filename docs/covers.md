# Cover images & GIFs (Notion-style banners)

How to put a cover on a topic or sub-topic — the wide image/GIF header at the top
of the page, like a Notion cover. (Documentation — not published to the site.)

> [!note] Covers are for **folder-notes only**
> Only topics and sub-topics (the `index.md` folder-notes, `tags: [FolderNote]`) can
> have a cover. Regular concept notes can't — the "Set Cover" command refuses them.

## 1. Put the image / GIF in the vault

Drop the file into **`Vault/attachments/banners/`** (any of `.gif .png .jpg .webp .svg`).
Keep GIFs reasonably small — they ship to the public repo and the site.

## 2. Set it as the cover

1. Open the topic or sub-topic note (its `index.md`).
2. Run **Set Cover** — via the hotkey you bound to it, or the command palette:
   `Templater: Insert Set Cover`.
3. Pick your file from the list (it shows everything under `attachments/`), or choose
   **🔗 Paste external URL…** to use a remote GIF, or **✕ Remove cover** to clear it.

That writes one line to the note's frontmatter, e.g.:

```yaml
banner: "attachments/banners/my-cover.gif"
```

The **Banners** plugin renders it immediately in Obsidian. (You can also just type that
`banner:` line by hand — the command is only a convenience.)

## 3. Publish it to the site

The site reads the same `banner` field, but two things need to be true first:

1. **Quartz Syncer → "Include all properties" = ON.** Otherwise Syncer strips
   `banner` (and `color`/`status`/`icon`) out of the published note. One-time toggle.
2. **Mirror the image into `content/`.** Covers are referenced only in frontmatter, so
   Syncer doesn't copy the image itself. Run this before publishing:

   ```bash
   node scripts/sync-banners.mjs
   ```

   It copies `Vault/attachments/` → `content/attachments/` so the file reaches the build.

Then publish (Quartz Syncer Publication Center, or the CLI). After GitHub Pages rebuilds,
the cover shows on the site too.

> [!tip] Where GIFs render
> Animated GIFs (and animated SVGs) play in both Obsidian and the browser — no extra
> setup. The demo `attachments/banners/aurora.svg` is a self-made animated example.

## Troubleshooting

- **Cover shows in Obsidian but not on the site** — you skipped step 3: enable
  "Include all properties" and run `node scripts/sync-banners.mjs`, then republish.
- **"Set Cover" says covers are folder-notes only** — you're on a concept note, not a
  topic/sub-topic `index.md`. That's by design.
- **Broken image on the site** — the file isn't in `content/attachments/`; re-run
  `node scripts/sync-banners.mjs`.
