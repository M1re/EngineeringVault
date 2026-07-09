---
title: Programming
icon: code-2
color: "#6366f1"
tags:
  - FolderNote
publish: true
---

# Programming

Languages, paradigms, and the craft of writing code that survives contact with production.

> [!abstract] Scope
> How languages actually run, how memory and concurrency work, the paradigms behind good design, and what separates clean, maintainable code from clever code.

## Notes in this section

```datacorejsx
return function SectionDashboard() {
  const cur = dc.useCurrentFile();
  const dir = (cur?.$path || "").split("/").slice(0, -1).join("/");
  const firstString = (v) =>
    Array.isArray(v) ? (v.length ? String(v[0]).trim() : "") : (v == null ? "" : String(v).trim());
  const hasTag = (p, t) => (p.$tags ?? []).some((x) => String(x).replace(/^#/, "") === t);

  const pages = dc.useQuery("@page").filter(
    (p) => dir && p.$path.startsWith(dir + "/") && !hasTag(p, "FolderNote") && !hasTag(p, "MetricsIgnore"),
  );
  const isDone = (p) => firstString(p.value("status")).toLowerCase() === "done";
  const done = pages.filter(isDone).length;
  const total = pages.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const CSS = `
.sec-dash { margin: 0.5rem 0 1rem; }
.sec-head { display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-muted, #9ca3af); margin-bottom: 6px; }
.sec-bar { height: 8px; background: var(--background-modifier-border, #e5e5e5); border-radius: 999px; overflow: hidden; }
.sec-fill { height: 100%; background: #3fb6a8; border-radius: 999px; }
.sec-list { list-style: none; margin: 0.8rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.sec-item { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 0.35rem 0.5rem; border-radius: 6px; }
.sec-item:hover { background: rgba(128, 128, 128, 0.08); }
.sec-pill { font-size: 0.68rem; padding: 0.12em 0.6em; border-radius: 999px; white-space: nowrap; }
.sec-pill.done { background: rgba(63, 182, 168, 0.18); color: #3fb6a8; }
.sec-pill.wip { background: rgba(128, 128, 128, 0.15); color: var(--text-muted, #9ca3af); }
.sec-empty { opacity: 0.6; font-size: 0.9rem; margin: 0.5rem 0; }
`;

  if (total === 0) {
    return (
      <div class="sec-dash">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div class="sec-empty">No notes here yet — add one to this section.</div>
      </div>
    );
  }

  const rows = [...pages].sort((a, b) => String(a.$name || "").localeCompare(String(b.$name || "")));

  return (
    <div class="sec-dash">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div class="sec-head"><span>{done}/{total} done</span><span>{pct}%</span></div>
      <div class="sec-bar"><div class="sec-fill" style={{ width: `${pct}%` }} /></div>
      <ul class="sec-list">
        {rows.map((p) => (
          <li class="sec-item">
            <dc.Link link={p.$link} />
            <span class={`sec-pill ${isDone(p) ? "done" : "wip"}`}>{isDone(p) ? "Done" : "In progress"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```
