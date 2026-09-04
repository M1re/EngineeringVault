#!/usr/bin/env node
// Regenerate the static folder-dashboard HTML inside content/**/index.md.
//
// Why this exists: the vault's folder dashboards are Datacore (datacorejsx) that
// Quartz Syncer precompiles to static HTML on the author's machine. Publishing from
// mobile (copy Vault -> content, then `npx quartz build`) does not run Datacore, so
// new/finished notes never update those static dashboards. This script ports the
// current Datacore logic (from the Vault index.md components) and rewrites the static
// dashboards in content/ so counts, cards, and note lists stay correct.
//
// It reads note frontmatter from content/ (the published set) and rewrites only the
// dashboard block in each index.md, matching the current Vault dashboard format.
//
// Status model (three states, tracked in the progress bar):
//   done        -> written and validated for reading (fills the bar, solid accent)
//   in-progress -> actively being written           (lighter accent segment)
//   new         -> nothing written yet, a stub       (empty track)
// Legacy tokens `creation` / `created` are treated as `new`.
//
// Run from the repo root: node scripts/regen-dashboards.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const CONTENT = "content";

// ---- tiny frontmatter reader (only the fields we need) -------------------------
function readFrontmatter(text) {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end === -1) return {};
  const fm = text.slice(3, end).split("\n");
  const out = { tags: [] };
  let inTags = false;
  for (const raw of fm) {
    const line = raw.replace(/\s+$/, "");
    if (/^tags:\s*\[/.test(line)) {
      out.tags = line.replace(/^tags:\s*\[/, "").replace(/\].*$/, "")
        .split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      inTags = false; continue;
    }
    if (/^tags:\s*$/.test(line)) { inTags = true; continue; }
    if (inTags) {
      const m = line.match(/^\s*-\s*(.+)$/);
      if (m) { out.tags.push(m[1].trim().replace(/^["']|["']$/g, "")); continue; }
      inTags = false;
    }
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (m) {
      let v = m[2].trim().replace(/^["']|["']$/g, "");
      out[m[1]] = v;
    }
  }
  return out;
}

// ---- gather pages --------------------------------------------------------------
function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith(".md")) acc.push(p);
  }
  return acc;
}

const files = walk(CONTENT, []);
const pages = files.map((abs) => {
  const text = readFileSync(abs, "utf8");
  const fm = readFrontmatter(text);
  const path = relative(CONTENT, abs).split("\\").join("/"); // vault-relative, forward slashes
  const name = path.split("/").pop().replace(/\.md$/, "");
  return {
    abs, text, path, name,
    tags: fm.tags || [],
    status: (fm.status || "").toString(),
    title: (fm.title || "").toString(),
    color: (fm.color || "").toString(),
    icon: (fm.icon || "").toString(),
    description: (fm.description || "").toString(),
  };
});

const hasTag = (p, t) => p.tags.some((x) => String(x).replace(/^#/, "") === t);
const isFolderNote = (p) => hasTag(p, "FolderNote");
const isMeta = (p) => hasTag(p, "MetricsIgnore");
// Three-state status. Legacy `creation`/`created` and anything unknown fall back to "new".
const statusOf = (p) => {
  const s = p.status.trim().toLowerCase();
  if (s === "done") return "done";
  if (s === "in-progress" || s === "in progress" || s === "wip") return "in-progress";
  return "new";
};
const isDone = (p) => statusOf(p) === "done";
const displayOf = (p) => p.title || p.name;

function hexToRgbTriple(v) {
  let h = (v || "").replace(/^#/, "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

const ICONS = {
  "code-2": `<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>`,
  "brain-circuit": `<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M12 13h4"/><path d="M12 18h6a2 2 0 0 1 2 2v1"/><path d="M12 8h8"/><path d="M16 8V5a2 2 0 0 1 2-2"/>`,
  network: `<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>`,
  "flask-round": `<path d="M10 2v6.292a7 7 0 1 0 4 0V2"/><path d="M5 15h14"/><path d="M8.5 2h7"/>`,
  database: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>`,
  "building-2": `<path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>`,
  lock: `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  cloud: `<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>`,
  "area-chart": `<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/>`,
  folder: `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`,
};
const wrapSvg = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const iconFor = (name) => wrapSvg(ICONS[name] || ICONS.folder);

const link = (href, text) =>
  `<a class="internal-link" href="${href}" data-tooltip-position="top" aria-label="${text}">${text}</a>`;

// segmented bar (done solid + in-progress lighter; the rest of the track reads as "new")
const barHtml = (donePct, wipPct) =>
  `<div class="fd-bar"><div class="fd-fill" style="width: ${donePct}%;"></div>`
  + `<div class="fd-fill-wip" style="width: ${wipPct}%;"></div></div>`;
const legendHtml = (done, wip, neu) =>
  `<div class="fd-legend"><span class="fd-lg done">${done} done</span>`
  + `<span class="fd-lg wip">${wip} in progress</span>`
  + `<span class="fd-lg new">${neu} new</span></div>`;

// ---- FolderDashboard CSS (must match Vault/**/index.md FolderDashboard) ---------
const FD_CSS = `
.fd { margin: 0.5rem 0 1rem; }
.fd-total { margin-bottom: 1rem; }
.fd-cap { display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-muted, #9ca3af); margin-bottom: 6px; }
.fd-bar { height: 8px; background: rgba(128, 128, 128, 0.22); border-radius: 999px; overflow: hidden; display: flex; }
.fd-fill { height: 100%; background: rgb(var(--fd-rgb, 63,182,168)); }
.fd-fill-wip { height: 100%; background: rgba(var(--fd-rgb, 63,182,168), 0.4); }
.fd-legend { display: flex; flex-wrap: wrap; gap: 0.9rem; margin-top: 6px; font-size: 0.72rem; color: var(--text-muted, #9ca3af); }
.fd-lg { display: inline-flex; align-items: center; gap: 0.4em; }
.fd-lg::before { content: ""; width: 8px; height: 8px; border-radius: 999px; background: var(--dot, currentColor); }
.fd-lg.done { --dot: rgb(63, 182, 168); }
.fd-lg.wip { --dot: rgba(63, 182, 168, 0.45); }
.fd-lg.new { --dot: rgba(128, 128, 128, 0.5); }
.fd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; }
.fd-card { position: relative; border: 1px solid rgba(128, 128, 128, 0.22) !important; border-radius: 8px; padding: 0.8rem 0.9rem; background: transparent !important; transition: border-color 120ms, background-color 120ms; }
.fd-card:hover { border-color: rgba(var(--fd-rgb), 0.55) !important; background: rgba(var(--fd-rgb), 0.08) !important; }
.fd-card-head { display: flex; align-items: center; gap: 0.5rem; }
.fd-icon { display: flex; color: rgb(var(--fd-rgb)); }
.fd-icon svg { width: 20px; height: 20px; }
.fd-name { font-weight: 600; font-size: 0.92rem; color: rgb(var(--fd-rgb)); }
.fd-card-cap { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted, #9ca3af); margin: 0.55rem 0 0.3rem; }
.fd-card .fd-fill { background: rgb(var(--fd-rgb)); }
.fd-card .fd-fill-wip { background: rgba(var(--fd-rgb), 0.4); }
.fd-link { position: absolute; inset: 0; }
.fd-link a { position: absolute; inset: 0; font-size: 0; background: none !important; }
.fd-list { list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.fd-item { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 0.35rem 0.5rem; border-radius: 6px; }
.fd-item:hover { background: rgba(128, 128, 128, 0.08); }
.fd-pill { font-size: 0.68rem; padding: 0.12em 0.6em; border-radius: 999px; white-space: nowrap; }
.fd-pill.done { background: rgba(63, 182, 168, 0.18); color: #3fb6a8; }
.fd-pill.wip { background: rgba(63, 182, 168, 0.10); color: #7fd0c6; }
.fd-pill.new { background: rgba(128, 128, 128, 0.15); color: var(--text-muted, #9ca3af); }
.fd-empty { opacity: 0.6; font-size: 0.9rem; }
`;

// recursive progress under a folder path (excluding folder-notes)
function progressUnder(base) {
  let total = 0, done = 0, wip = 0;
  for (const p of pages) {
    if (!p.path.startsWith(base + "/") || isFolderNote(p) || isMeta(p)) continue;
    total++;
    const st = statusOf(p);
    if (st === "done") done++;
    else if (st === "in-progress") wip++;
  }
  const neu = total - done - wip;
  const r2 = (n) => Math.round(n * 100) / 100;
  return {
    total, done, wip, neu,
    pct: total ? Math.round((done / total) * 100) : 0,
    donePct: total ? r2((done / total) * 100) : 0,
    wipPct: total ? r2((wip / total) * 100) : 0,
  };
}

const PILL = { done: ["done", "Done"], "in-progress": ["wip", "In progress"], new: ["new", "New"] };

function renderFolderDashboard(self) {
  const dir = self.path.split("/").slice(0, -1).join("/");
  const prefix = dir + "/";
  const under = pages.filter((p) => p.path.startsWith(prefix) && p.path !== self.path && !isMeta(p));

  const childFolders = [], directNotes = [];
  for (const p of under) {
    const parts = p.path.slice(prefix.length).split("/");
    if (isFolderNote(p) && parts.length === 2 && /^index\.md$/i.test(parts[1])) childFolders.push(p);
    else if (!isFolderNote(p) && parts.length === 1) directNotes.push(p);
  }

  const cards = childFolders.map((fn) => {
    const childDir = prefix + fn.path.slice(prefix.length).split("/")[0];
    return {
      title: fn.title || childDir.split("/").pop(),
      rgb: hexToRgbTriple(fn.color) || "125, 125, 125",
      iconSvg: iconFor(fn.icon),
      href: fn.path,
      ...progressUnder(childDir),
    };
  }).sort((a, b) => String(a.title).localeCompare(String(b.title)));

  const notes = [...directNotes].sort((a, b) => String(a.name).localeCompare(String(b.name)));

  let oTotal = 0, oDone = 0, oWip = 0;
  for (const p of under) {
    if (isFolderNote(p)) continue;
    oTotal++;
    const st = statusOf(p);
    if (st === "done") oDone++;
    else if (st === "in-progress") oWip++;
  }
  const oNeu = oTotal - oDone - oWip;
  const oPct = oTotal ? Math.round((oDone / oTotal) * 100) : 0;
  const r2 = (n) => Math.round(n * 100) / 100;
  const oDonePct = oTotal ? r2((oDone / oTotal) * 100) : 0;
  const oWipPct = oTotal ? r2((oWip / oTotal) * 100) : 0;

  let html = `<div class="fd"><style>${FD_CSS}</style>`;
  if (oTotal > 0) {
    html += `<div class="fd-total" style="--fd-rgb: 63, 182, 168;">`
      + `<div class="fd-cap"><span>${oDone}/${oTotal} done</span><span>${oPct}%</span></div>`
      + barHtml(oDonePct, oWipPct)
      + legendHtml(oDone, oWip, oNeu)
      + `</div>`;
  }
  if (cards.length) {
    html += `<div class="fd-grid">`;
    for (const c of cards) {
      html += `<div class="fd-card" style="--fd-rgb: ${c.rgb};">`
        + `<div class="fd-card-head"><span class="fd-icon">${c.iconSvg}</span><span class="fd-name">${c.title}</span></div>`
        + `<div class="fd-card-cap"><span>${c.done}/${c.total} done</span><span>${c.pct}%</span></div>`
        + barHtml(c.donePct, c.wipPct)
        + `<span class="fd-link">${link(c.href, "index")}</span></div>`;
    }
    html += `</div>`;
  }
  if (notes.length) {
    html += `<ul class="fd-list">`;
    for (const p of notes) {
      const [cls, label] = PILL[statusOf(p)];
      html += `<li class="fd-item">${link(p.path, displayOf(p))}`
        + `<span class="fd-pill ${cls}">${label}</span></li>`;
    }
    html += `</ul>`;
  }
  if (!cards.length && !notes.length) html += `<div class="fd-empty">Empty — add notes or sub-topics here.</div>`;
  html += `</div>`;
  return html;
}

// ---- home TopicDashboard -------------------------------------------------------
const ORDER = ["Programming", "Computer Science", "Data Persistence", "Networks", "Architecture", "AI and ML", "Security", "Cloud", "DevOps"];
const spanRules = (cls) =>
  Array.from({ length: 12 }, (_, i) => `.dc-topic-card.${cls}-${i + 1} { grid-column: span ${i + 1}; }`).join(" ");
const TOPIC_CSS = `
.dc-topic-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 0.75rem; width: 100%; }
.dc-topic-card { position: relative; cursor: pointer; min-width: 0; min-height: 7rem; box-sizing: border-box; margin: 0; display: flex; flex-direction: column; background: transparent; border: 1px solid rgba(128, 128, 128, 0.22); border-radius: var(--radius-m, 8px); box-shadow: none; padding: 0.9rem 1rem 1rem; transition: border-color 120ms, background-color 120ms; }
.dc-topic-card:hover { border-color: rgba(var(--topic-rgb), 0.5); background: rgba(var(--topic-rgb), 0.1); }
.dc-topic-title { display: flex; gap: 0.55rem; align-items: center; line-height: 1.3; }
.dc-topic-icon { display: flex; align-self: center; color: rgb(var(--topic-rgb)); }
.dc-topic-icon svg { width: 22px; height: 22px; }
.dc-topic-name { font-weight: 600; font-size: 0.95rem; color: rgb(var(--topic-rgb)); }
.dc-topic-body { display: flex; flex-direction: column; flex: 1 0 auto; margin-top: 0.4em; }
.dc-topic-desc { margin: 0; color: var(--text-muted, var(--gray, #9ca3af)); font-size: 0.78rem; line-height: 1.3; }
.dc-topic-spacer { flex: 1 0 auto; min-height: 0.55em; }
.dc-topic-foot { display: flex; flex-direction: column; gap: 4px; }
.dc-topic-cap { font-size: 0.72rem; display: flex; justify-content: space-between; align-items: baseline; color: var(--text-muted, var(--gray, #9ca3af)); }
.dc-topic-bar { width: 100%; height: 6px; border-radius: 4px; margin-top: 0.15rem; overflow: hidden; background: rgba(128, 128, 128, 0.22); display: flex; }
.dc-topic-fill { height: 100%; background: rgb(var(--topic-rgb)); transition: width 200ms ease; }
.dc-topic-fill-wip { height: 100%; background: rgba(var(--topic-rgb), 0.4); transition: width 200ms ease; }
.dc-topic-legend { display: flex; flex-wrap: wrap; gap: 0.9rem; margin-top: 6px; font-size: 0.72rem; color: var(--text-muted, var(--gray, #9ca3af)); }
.dc-topic-lg { display: inline-flex; align-items: center; gap: 0.4em; }
.dc-topic-lg::before { content: ""; width: 8px; height: 8px; border-radius: 999px; background: var(--dot, currentColor); }
.dc-topic-lg.done { --dot: rgb(63, 182, 168); }
.dc-topic-lg.wip { --dot: rgba(63, 182, 168, 0.45); }
.dc-topic-lg.new { --dot: rgba(128, 128, 128, 0.5); }
.dc-topic-link { position: absolute; inset: 0; z-index: 1; }
.dc-topic-link a { position: absolute; inset: 0; font-size: 0; background: none !important; }
.dc-topic-total { margin-top: 0.75rem; padding: 0.75em; border-radius: var(--radius-m, 8px); border: 1px solid rgba(var(--topic-rgb), 0.4); background: rgba(var(--topic-rgb), 0.08); }
${spanRules("dsk")}
@media (max-width: 1600px) { ${spanRules("med")} }
@media (max-width: 760px) { ${spanRules("nar")} }
@media (max-width: 430px) { .dc-topic-grid { grid-template-columns: 1fr; } .dc-topic-grid .dc-topic-card { grid-column: span 1; } }
`;

function renderHomeDashboard() {
  const orderIdx = (folder) => { const i = ORDER.indexOf(folder); return i === -1 ? ORDER.length : i; };
  const sections = pages
    .filter((p) => isFolderNote(p) && p.path.split("/").length === 2 && /^index\.md$/i.test(p.path.split("/")[1]))
    .map((fn) => ({ fn, folder: fn.path.split("/")[0] }))
    .sort((a, b) => orderIdx(a.folder) - orderIdx(b.folder) || a.folder.localeCompare(b.folder));

  const cards = sections.map((s, index) => {
    const fn = s.fn;
    return {
      title: fn.title || s.folder,
      desc: fn.description || "",
      rgb: hexToRgbTriple(fn.color) || "125, 125, 125",
      iconSvg: iconFor(fn.icon),
      href: fn.path,
      ...progressUnder(s.folder),
      spanDesktop: index < 3 ? 4 : 3,
      spanMedium: index < 2 ? 6 : 4,
      spanNarrow: index === 0 ? 12 : 6,
    };
  });

  let oDone = 0, oWip = 0, oTotal = 0;
  for (const c of cards) { oDone += c.done; oWip += c.wip; oTotal += c.total; }
  const oNeu = oTotal - oDone - oWip;
  const oPct = oTotal ? Math.round((oDone / oTotal) * 100) : 0;
  const r2 = (n) => Math.round(n * 100) / 100;
  const oDonePct = oTotal ? r2((oDone / oTotal) * 100) : 0;
  const oWipPct = oTotal ? r2((oWip / oTotal) * 100) : 0;

  let html = `<div style="margin-top: 1.5rem;"><style>${TOPIC_CSS}</style><div class="dc-topic-grid">`;
  for (const c of cards) {
    html += `<div class="dc-topic-card dsk-${c.spanDesktop} med-${c.spanMedium} nar-${c.spanNarrow}" style="--topic-rgb: ${c.rgb};">`
      + `<div class="dc-topic-title"><span class="dc-topic-icon">${c.iconSvg}</span><span class="dc-topic-name">${c.title}</span></div>`
      + `<div class="dc-topic-body"><p class="dc-topic-desc">${c.desc}</p><div class="dc-topic-spacer"></div>`
      + `<div class="dc-topic-foot"><div class="dc-topic-cap"><span>${c.done}/${c.total} done</span><span>${c.pct}%</span></div>`
      + `<div class="dc-topic-bar"><div class="dc-topic-fill" style="width: ${c.donePct}%;"></div>`
      + `<div class="dc-topic-fill-wip" style="width: ${c.wipPct}%;"></div></div></div></div>`
      + `<span class="dc-topic-link">${link(c.href, "index")}</span></div>`;
  }
  html += `</div><div class="dc-topic-total" style="--topic-rgb: 63, 182, 168;"><div class="dc-topic-foot">`
    + `<div class="dc-topic-cap"><span style="opacity: 0.75;">${oDone}/${oTotal} done</span><span>${oPct}%</span></div>`
    + `<div class="dc-topic-bar" style="height: 0.7em;"><div class="dc-topic-fill" style="width: ${oDonePct}%;"></div>`
    + `<div class="dc-topic-fill-wip" style="width: ${oWipPct}%;"></div></div>`
    + `<div class="dc-topic-legend"><span class="dc-topic-lg done">${oDone} done</span>`
    + `<span class="dc-topic-lg wip">${oWip} in progress</span>`
    + `<span class="dc-topic-lg new">${oNeu} new</span></div>`
    + `</div></div></div>`;
  return html;
}

// ---- rewrite one index.md's dashboard block ------------------------------------
// The dashboard is a balanced <div>...</div>. Scan from the start marker counting
// <div>/</div> to find its matching close (CSS selectors and inline SVGs never
// contain the literal "<div"/"</div>", so the count stays correct).
function replaceBlock(text, startMarker, html) {
  const start = text.indexOf(startMarker);
  if (start === -1) return null;
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = start;
  let m, depth = 0, end = -1;
  while ((m = re.exec(text))) {
    if (m[0].startsWith("</")) {
      depth--;
      if (depth === 0) { end = m.index + m[0].length; break; }
    } else {
      depth++;
    }
  }
  if (end === -1) return null;
  return text.slice(0, start) + html + text.slice(end);
}

let changed = 0;
for (const p of pages) {
  if (!/(^|\/)index\.md$/.test(p.path)) continue;
  let html, marker;
  if (p.path === "index.md") { html = renderHomeDashboard(); marker = '<div style="margin-top: 1.5rem;">'; }
  else if (isFolderNote(p)) { html = renderFolderDashboard(p); marker = '<div class="fd">'; }
  else continue;
  const next = replaceBlock(p.text, marker, html);
  if (next && next !== p.text) { writeFileSync(p.abs, next); changed++; console.log("updated", p.path); }
  else if (!next) console.log("SKIP (no dashboard block found)", p.path);
}
console.log(`\nDone. Rewrote ${changed} dashboard(s).`);
