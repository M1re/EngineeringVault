<%*
/* ── New Topic ───────────────────────────────────────────────────────────────
   Create a main topic (section): a folder + its folder-note (banner, colour, icon,
   recursive dashboard), and register it on the home dashboard so it shows up as a
   card. Trigger via a hotkey or the palette ("Templater: Insert New Topic").
   ────────────────────────────────────────────────────────────────────────── */

// 1. Title + URL-safe folder name (sections may contain spaces, e.g. "Computer Science").
const title = (await tp.system.prompt("Topic title (e.g. Machine Learning)"))?.trim();
if (!title) return;
const suggested = title.replace(/[#.]/g, "").replace(/\s+/g, " ").trim();
const folder = (await tp.system.prompt("Folder name (no # or leading dot)", suggested))?.trim();
if (!folder) return;
if (app.vault.getAbstractFileByPath(folder)) { new Notice(`"${folder}" already exists.`); return; }

// 2. Short description — shown on the home card and atop the topic page.
const desc = (await tp.system.prompt("One-line description (for the home card)"))?.trim() || "Overview coming.";

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
  color = (await tp.system.prompt("Colour hex (e.g. #6366f1)", "#4a9eda"))?.trim();
  if (!color) return;
}

// 4. Icon — must be one the HOME dashboard renders.
const ICONS = ["code-2", "brain-circuit", "network", "flask-round", "database",
  "building-2", "lock", "cloud", "area-chart", "folder"];
const icon = await tp.system.suggester(ICONS, ICONS, false, "Icon (lucide)");
if (icon == null) return;

// 5. Create the folder-note (reuse the dashboard block from the Folder Note skeleton).
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

${desc}

${block}
`;
await app.vault.createFolder(folder);
const file = await app.vault.create(`${folder}/index.md`, content);

// 6. Register on the home dashboard (append to the hardcoded TOPICS array).
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const home = app.vault.getAbstractFileByPath("index.md");
if (home) {
  let ht = await app.vault.read(home);
  const start = ht.indexOf("const TOPICS = [");
  const close = start === -1 ? -1 : ht.indexOf("\n  ];", start);
  if (close !== -1) {
    const entry = `    { folder: "${esc(folder)}", title: "${esc(title)}", desc: "${esc(desc)}" },\n`;
    ht = ht.slice(0, close + 1) + entry + ht.slice(close + 1);
    await app.vault.modify(home, ht);
  } else {
    new Notice("Topic created, but couldn't find the home TOPICS list — add it there by hand.");
  }
}

await app.workspace.getLeaf(false).openFile(file);
new Notice(`Created topic "${title}"`);
-%>
