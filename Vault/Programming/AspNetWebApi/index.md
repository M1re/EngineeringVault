---
title: "ASP.NET Web API"
color: "#10b981"
tags:
  - FolderNote
publish: true
---

> [!abstract] Scope
> _Sub-topic of [[Programming/index|Programming]]. Overview coming._

## Contents

```datacorejsx
return function FolderDashboard() {
  const cur = dc.useCurrentFile();
  const dir = (cur?.$path || "").split("/").slice(0, -1).join("/");
  const prefix = dir ? dir + "/" : "";

  const firstString = (v) =>
    Array.isArray(v) ? (v.length ? String(v[0]).trim() : "") : (v == null ? "" : String(v).trim());
  const hasTag = (p, t) => (p.$tags ?? []).some((x) => String(x).replace(/^#/, "") === t);
  const isMeta = (p) => hasTag(p, "MetricsIgnore");
  const isDone = (p) => firstString(p.value("status")).toLowerCase() === "done";
  const hexToRgbTriple = (v) => {
    let h = firstString(v).replace(/^#/, "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    const n = parseInt(h, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  };
  const ICONS = {
    "code-2": `<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>`,
    "brain-circuit": `<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M12 13h4"/><path d="M12 18h6a2 2 0 0 1 2 2v1"/><path d="M12 8h8"/><path d="M16 8V5a2 2 0 0 1 2-2"/>`,
    network: `<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>`,
    "flask-round": `<path d="M10 2v6.292a7 7 0 1 0 4 0V2"/><path d="M5 15h14"/><path d="M8.5 2h7"/>`,
    folder: `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`,
  };
  const wrapSvg = (inner) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  const all = dc.useQuery("@page");
  const under = all.filter((p) => prefix && p.$path.startsWith(prefix) && p.$path !== cur?.$path && !isMeta(p));

  const progress = (base) => {
    let total = 0, done = 0;
    for (const p of under) {
      if (!p.$path.startsWith(base + "/") || hasTag(p, "FolderNote")) continue;
      total++;
      if (isDone(p)) done++;
    }
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const childFolders = [];
  const directNotes = [];
  for (const p of under) {
    const parts = p.$path.slice(prefix.length).split("/");
    if (hasTag(p, "FolderNote") && parts.length === 2 && /^index\.md$/i.test(parts[1])) {
      childFolders.push(p);
    } else if (!hasTag(p, "FolderNote") && parts.length === 1) {
      directNotes.push(p);
    }
  }

  const cards = childFolders
    .map((fn) => {
      const childDir = prefix + fn.$path.slice(prefix.length).split("/")[0];
      return {
        fn,
        title: firstString(fn.value("title")) || childDir.split("/").pop(),
        rgb: hexToRgbTriple(fn.value("color")) || "125, 125, 125",
        iconSvg: wrapSvg(ICONS[firstString(fn.value("icon"))] ?? ICONS.folder),
        ...progress(childDir),
      };
    })
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));

  const notes = [...directNotes].sort((a, b) => String(a.$name || "").localeCompare(String(b.$name || "")));

  let oTotal = 0, oDone = 0;
  for (const p of under) {
    if (hasTag(p, "FolderNote")) continue;
    oTotal++;
    if (isDone(p)) oDone++;
  }
  const oPct = oTotal ? Math.round((oDone / oTotal) * 100) : 0;

  const CSS = `
.fd { margin: 0.5rem 0 1rem; }
.fd-total { margin-bottom: 1rem; }
.fd-cap { display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-muted, #9ca3af); margin-bottom: 6px; }
.fd-bar { height: 8px; background: rgba(128, 128, 128, 0.22); border-radius: 999px; overflow: hidden; }
.fd-fill { height: 100%; background: rgb(var(--fd-rgb, 63,182,168)); border-radius: 999px; }
.fd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; }
.fd-card { position: relative; border: 1px solid rgba(128, 128, 128, 0.22); border-radius: 8px; padding: 0.8rem 0.9rem; transition: border-color 120ms, background-color 120ms; }
.fd-card:hover { border-color: rgba(var(--fd-rgb), 0.5); background: rgba(var(--fd-rgb), 0.08); }
.fd-card-head { display: flex; align-items: center; gap: 0.5rem; }
.fd-icon { display: flex; color: rgb(var(--fd-rgb)); }
.fd-icon svg { width: 20px; height: 20px; }
.fd-name { font-weight: 600; font-size: 0.92rem; color: rgb(var(--fd-rgb)); }
.fd-card-cap { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted, #9ca3af); margin: 0.55rem 0 0.3rem; }
.fd-card .fd-fill { background: rgb(var(--fd-rgb)); }
.fd-link { position: absolute; inset: 0; }
.fd-link a { position: absolute; inset: 0; font-size: 0; background: none !important; }
.fd-list { list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.fd-item { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 0.35rem 0.5rem; border-radius: 6px; }
.fd-item:hover { background: rgba(128, 128, 128, 0.08); }
.fd-pill { font-size: 0.68rem; padding: 0.12em 0.6em; border-radius: 999px; white-space: nowrap; }
.fd-pill.done { background: rgba(63, 182, 168, 0.18); color: #3fb6a8; }
.fd-pill.wip { background: rgba(128, 128, 128, 0.15); color: var(--text-muted, #9ca3af); }
.fd-empty { opacity: 0.6; font-size: 0.9rem; }
`;

  return (
    <div class="fd">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {oTotal > 0 ? (
        <div class="fd-total" style={{ "--fd-rgb": "63, 182, 168" }}>
          <div class="fd-cap"><span>{oDone}/{oTotal} done</span><span>{oPct}%</span></div>
          <div class="fd-bar"><div class="fd-fill" style={{ width: `${oPct}%` }} /></div>
        </div>
      ) : null}
      {cards.length ? (
        <div class="fd-grid">
          {cards.map((c) => (
            <div class="fd-card" style={{ "--fd-rgb": c.rgb }}>
              <div class="fd-card-head">
                <span class="fd-icon" dangerouslySetInnerHTML={{ __html: c.iconSvg }} />
                <span class="fd-name">{c.title}</span>
              </div>
              <div class="fd-card-cap"><span>{c.done}/{c.total} done</span><span>{c.pct}%</span></div>
              <div class="fd-bar"><div class="fd-fill" style={{ width: `${c.pct}%` }} /></div>
              <span class="fd-link"><dc.Link link={c.fn.$link} /></span>
            </div>
          ))}
        </div>
      ) : null}
      {notes.length ? (
        <ul class="fd-list">
          {notes.map((p) => (
            <li class="fd-item">
              <dc.Link link={p.$link} />
              <span class={`fd-pill ${isDone(p) ? "done" : "wip"}`}>{isDone(p) ? "Done" : "In progress"}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!cards.length && !notes.length ? <div class="fd-empty">Empty — add notes or sub-topics here.</div> : null}
    </div>
  );
}
```
