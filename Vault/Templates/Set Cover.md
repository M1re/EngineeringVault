<%*
/* ── Set Cover ───────────────────────────────────────────────────────────────
   Notion-style "add cover" for topics & sub-topics. Pick an image / GIF from the
   vault's attachments (or paste an external URL) and it's written to the `banner`
   frontmatter field — the same field the site's Banner component and the Obsidian
   Banners plugin read, so it shows up in both places.
   Trigger it with a hotkey or the command palette ("Templater: Insert Set Cover").
   ────────────────────────────────────────────────────────────────────────── */
const file = app.workspace.getActiveFile();
if (!file) { new Notice("No active note."); return; }

// Covers belong to topics & sub-topics only (folder-notes).
const tags = app.metadataCache.getFileCache(file)?.frontmatter?.tags ?? [];
const isFolderNote = (Array.isArray(tags) ? tags : [tags])
  .some((t) => String(t).toLowerCase() === "foldernote");
if (!isFolderNote) {
  new Notice("Covers are for topics & sub-topics (folder-notes) only.");
  return;
}

// Collect image / GIF attachments.
const IMG = ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "bmp"];
const files = app.vault.getFiles()
  .filter((f) => f.path.toLowerCase().startsWith("attachments/") &&
                 IMG.includes(f.extension.toLowerCase()))
  .sort((a, b) => a.path.localeCompare(b.path));

const PASTE = "🔗  Paste external URL…";
const REMOVE = "✕  Remove cover";
const labels = [PASTE, REMOVE, ...files.map((f) => "🖼  " + f.path.replace(/^attachments\//, ""))];
const values = [PASTE, REMOVE, ...files.map((f) => f.path)];

const choice = await tp.system.suggester(labels, values, false, "Set cover — pick an image / GIF");
if (choice === undefined || choice === null) return; // cancelled

let banner;
if (choice === PASTE) {
  const url = await tp.system.prompt("Paste an image or GIF URL");
  if (!url) return;
  banner = url.trim();
} else if (choice === REMOVE) {
  banner = null;
} else {
  banner = choice; // vault-relative path, e.g. attachments/banners/foo.gif
}

await app.fileManager.processFrontMatter(file, (fm) => {
  if (banner === null) delete fm.banner;
  else fm.banner = banner;
});
new Notice(banner === null ? "Cover removed." : "Cover set ✓");
-%>
