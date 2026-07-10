<%*
/* ── New Sub-topic ───────────────────────────────────────────────────────────
   Create a sub-topic under a main topic: a folder + its folder-note (banner,
   colour, icon, recursive dashboard), with a Scope callout linking the parent.
   Trigger via a hotkey or the palette ("Templater: Insert New Sub-topic").
   ────────────────────────────────────────────────────────────────────────── */

const isFolderNote = (f) => {
  const t = app.metadataCache.getFileCache(f)?.frontmatter?.tags ?? [];
  return (Array.isArray(t) ? t : [t]).some((x) => String(x).toLowerCase() === "foldernote");
};

// 1. Pick the parent topic (a top-level section: Section/index.md).
const topics = app.vault.getMarkdownFiles()
  .filter((f) => f.name === "index.md" && f.path.split("/").length === 2 && isFolderNote(f))
  .map((f) => {
    const section = f.path.split("/")[0];
    const title = app.metadataCache.getFileCache(f)?.frontmatter?.title || section;
    return { section, title, label: title };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

if (!topics.length) { new Notice("No topics yet. Create a topic first (New Topic)."); return; }
const topic = await tp.system.suggester((t) => t.label, topics, false, "Sub-topic under which topic?");
if (!topic) return;

// 2. Pretty title + URL-safe folder name.
const title = (await tp.system.prompt("Sub-topic title (e.g. Entity Framework)"))?.trim();
if (!title) return;
const suggested = title.replace(/[^A-Za-z0-9]+/g, "");
const folderName = (await tp.system.prompt("Folder name (URL-safe, no spaces/#)", suggested))?.trim();
if (!folderName) return;

const dir = `${topic.section}/${folderName}`;
if (app.vault.getAbstractFileByPath(dir)) { new Notice(`"${dir}" already exists.`); return; }

// 3. Colour.
const COLORS = [
  ["Indigo", "#6366f1"], ["Violet", "#8b5cf6"], ["Purple", "#a855f7"], ["Blue", "#4a9eda"],
  ["Sky", "#0ea5e9"], ["Teal", "#14b8a6"], ["Emerald", "#10b981"], ["Amber", "#f59e0b"],
  ["Orange", "#f97316"], ["Rose", "#f43f5e"], ["Red", "#ef4444"], ["Slate", "#64748b"],
];
const cLabels = ["🎨  custom hex…", ...COLORS.map((c) => `${c[0]}   ${c[1]}`)];
const cValues = ["__custom__", ...COLORS.map((c) => c[1])];
let color = await tp.system.suggester(cLabels, cValues, false, "Card colour");
if (color == null) return;
if (color === "__custom__") {
  color = (await tp.system.prompt("Colour hex (e.g. #8b5cf6)", "#4a9eda"))?.trim();
  if (!color) return;
}

// 4. Icon (must be one the dashboard renders).
const ICONS = ["code-2", "brain-circuit", "network", "flask-round", "database",
  "building-2", "lock", "cloud", "area-chart", "folder"];
const icon = await tp.system.suggester(ICONS, ICONS, false, "Icon (lucide)");
if (icon == null) return;

// 5. Build the folder-note: reuse the dashboard block from the Folder Note template.
const tplFile = app.vault.getAbstractFileByPath("Templates/Folder Note.md");
const tpl = tplFile ? await app.vault.read(tplFile) : "";
const block = tpl.slice(tpl.indexOf("## Contents")).trimEnd() || "## Contents";

const content = `---
banner: "attachments/banners/aurora.svg"
title: "${title}"
color: "${color}"
icon: ${icon}
tags:
  - FolderNote
publish: true
---

> [!abstract] Scope
> _Sub-topic of [[${topic.section}/index|${topic.title}]]. Overview coming._

${block}
`;

await app.vault.createFolder(dir);
const file = await app.vault.create(`${dir}/index.md`, content);
await app.workspace.getLeaf(false).openFile(file);
new Notice(`Created sub-topic "${title}" under ${topic.title}`);
-%>
