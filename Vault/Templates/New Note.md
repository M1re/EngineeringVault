<%*
/* ── New Note ────────────────────────────────────────────────────────────────
   Create a concept note inside a sub-topic (notes live only under a sub-topic).
   Picks the sub-topic, the title, and tags (existing base tags + add new), then
   scaffolds the vault's concept-note format and links back to the sub-topic.
   Trigger via a hotkey or the palette ("Templater: Insert New Note").
   ────────────────────────────────────────────────────────────────────────── */

// 1. Collect sub-topic folder-notes: Section/Sub-topic/index.md (exactly 2 levels).
const isFolderNote = (f) => {
  const t = app.metadataCache.getFileCache(f)?.frontmatter?.tags ?? [];
  return (Array.isArray(t) ? t : [t]).some((x) => String(x).toLowerCase() === "foldernote");
};
const subTopics = app.vault.getMarkdownFiles()
  .filter((f) => f.name === "index.md" && f.path.split("/").length === 3 && isFolderNote(f))
  .map((f) => {
    const parts = f.path.split("/");
    const title = app.metadataCache.getFileCache(f)?.frontmatter?.title || parts[1];
    return { file: f, dir: `${parts[0]}/${parts[1]}`, section: parts[0], title, label: `${parts[0]}  ›  ${title}` };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

if (!subTopics.length) {
  new Notice("No sub-topics yet. Create a sub-topic first (New Sub-topic).");
  return;
}

// 2. Pick the sub-topic.
const sub = await tp.system.suggester((s) => s.label, subTopics, false, "Note goes into which sub-topic?");
if (!sub) return;

// 3. Title.
const title = (await tp.system.prompt("Note title (e.g. Reflection)"))?.trim();
if (!title) return;

const path = `${sub.dir}/${title}.md`;
if (app.vault.getAbstractFileByPath(path)) {
  new Notice(`A note "${title}" already exists in ${sub.title}.`);
  return;
}

// 4. Tags — pick from existing base tags (thematic, cross-cutting) or add new.
const STRUCTURAL = new Set(["foldernote", "metricsignore"]);
const baseTags = Object.keys(app.metadataCache.getTags())
  .map((t) => t.replace(/^#/, ""))
  .filter((t) => !STRUCTURAL.has(t.toLowerCase()))
  .sort((a, b) => a.localeCompare(b));

const chosen = [];
while (true) {
  const avail = baseTags.filter((t) => !chosen.includes(t));
  const DONE = `✓  done${chosen.length ? `  (${chosen.join(", ")})` : ""}`;
  const NEW = "＋  new tag…";
  const labels = [DONE, NEW, ...avail.map((t) => `#${t}`)];
  const values = ["__done__", "__new__", ...avail];
  const pick = await tp.system.suggester(labels, values, false, "Add a tag (thematic) or finish");
  if (pick == null || pick === "__done__") break;
  if (pick === "__new__") {
    const nt = (await tp.system.prompt("New tag (lowercase, kebab-case)"))?.trim()
      .toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
    if (nt && !chosen.includes(nt)) chosen.push(nt);
  } else if (!chosen.includes(pick)) {
    chosen.push(pick);
  }
}

const tagsYaml = chosen.length ? `\n${chosen.map((t) => `  - ${t}`).join("\n")}` : " []";
const today = tp.date.now("YYYY-MM-DD");

// 5. Scaffold — the vault's concept-note format, linked back to the sub-topic.
const body = `---
title: "${title}"
tags:${tagsYaml}
status: creation
publish: false
created: ${today}
---

> [!summary]
> <!-- The gist in 1–3 plain sentences a mid-level engineer gets immediately (+ one line on why it matters). -->

## How it works

<!-- The mechanism, under the hood. Go deep but keep it simple; ### subsections and a Mermaid diagram where it helps. -->

## Pitfalls & trade-offs

<!-- Real production failure modes and costs: "X buys you A at the cost of B" — not a feature list. -->

## In production

<!-- A concrete, real production situation — not a toy — with a real number or a small correct snippet. -->

## Questions

> [!question]- <a design- or review-level question>
> <the answer — concrete and correct>

## Related

- Part of [[${sub.dir}/index|${sub.title}]]

## References

<!-- Primary sources only: RFC, official docs, canonical book/paper. -->
-
`;

const file = await app.vault.create(path, body);
await app.workspace.getLeaf(false).openFile(file);
new Notice(`Created "${title}" in ${sub.title}`);
-%>
