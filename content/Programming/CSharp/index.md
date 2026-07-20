---
publish: true
title: C#
created: 2026-07-09T23:01:25.061+03:00
modified: 2026-07-11T19:42:38.828+03:00
published: 2026-07-11T19:42:38.828+03:00
tags:
  - FolderNote
banner: https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTQxdTBib2JiZm05dWoxNnBiZzdsZnkyaW5pN3dvc3Uza3NoYjRmZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wkXjVGhDMLMRkFmd6E/giphy.gif
color: "#8b5cf6"
banner_y: 0.48
---

> [!abstract] Scope
> _Sub-topic of [[Programming/index|Programming]]. Overview coming._

## Contents

<div class="fd"><div style="--fd-rgb: 63, 182, 168;" class="fd-total"><div class="fd-cap"><span>1/10 done</span><span>10%</span></div><div class="fd-bar"><div style="width: 10%;" class="fd-fill"></div><div style="width: 0%;" class="fd-fill-wip"></div></div><div class="fd-legend"><span class="fd-lg done">Done · 1</span><span class="fd-lg wip">In progress · 0</span><span class="fd-lg new">New · 9</span></div></div><ul class="fd-list"><li class="fd-item"><a class="internal-link" href="Programming/CSharp/Classes and Structs.md" data-tooltip-position="top" aria-label="Classes and Structs">Classes and Structs</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/CSharp/Const vs Readonly.md" data-tooltip-position="top" aria-label="const vs readonly">const vs readonly</a><span class="fd-pill done">Done</span></li><li class="fd-item"><a class="internal-link" href="Programming/CSharp/Delegates and Events.md" data-tooltip-position="top" aria-label="Delegates and Events">Delegates and Events</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/CSharp/Exceptions.md" data-tooltip-position="top" aria-label="Exceptions">Exceptions</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/CSharp/Generics.md" data-tooltip-position="top" aria-label="Generics">Generics</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/CSharp/LINQ.md" data-tooltip-position="top" aria-label="LINQ">LINQ</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/CSharp/Nullable Reference Types.md" data-tooltip-position="top" aria-label="Nullable Reference Types">Nullable Reference Types</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/CSharp/Pattern Matching.md" data-tooltip-position="top" aria-label="Pattern Matching">Pattern Matching</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/CSharp/Records.md" data-tooltip-position="top" aria-label="Records">Records</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/CSharp/Spans.md" data-tooltip-position="top" aria-label="Spans">Spans</a><span class="fd-pill new">New</span></li></ul><style>
.fd { margin: 0.5rem 0 1rem; }
.fd-total { margin-bottom: 1rem; }
.fd-cap { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.76rem; color: var(--text-muted, #9ca3af); margin-bottom: 6px; }
.fd-bar { height: 8px; background: rgba(128, 128, 128, 0.2); border-radius: 999px; overflow: hidden; display: flex; }
.fd-fill { height: 100%; background: rgb(var(--fd-rgb, 63,182,168)); }
.fd-fill-wip { height: 100%; background: rgba(var(--fd-rgb, 63,182,168), 0.4); background: color-mix(in srgb, rgb(var(--fd-rgb, 63,182,168)) 40%, #fff); }
.fd-legend { display: flex; justify-content: center; gap: 1.2rem; flex-wrap: wrap; margin-top: 8px; font-size: 0.72rem; color: var(--text-muted, #9ca3af); }
.fd-lg { display: inline-flex; align-items: center; gap: 6px; }
.fd-lg::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: rgba(128, 128, 128, 0.5); }
.fd-lg.done::before { background: rgb(var(--fd-rgb, 63,182,168)); }
.fd-lg.wip::before { background: rgba(var(--fd-rgb, 63,182,168), 0.4); background: color-mix(in srgb, rgb(var(--fd-rgb, 63,182,168)) 40%, #fff); }
.fd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; }
.fd-card { position: relative; border: 1px solid rgba(128, 128, 128, 0.22) !important; border-radius: 8px; padding: 0.8rem 0.9rem; background: transparent !important; transition: border-color 120ms, background-color 120ms; }
.fd-card:hover { border-color: rgba(var(--fd-rgb), 0.55) !important; background: rgba(var(--fd-rgb), 0.08) !important; }
.fd-card-head { display: flex; align-items: center; gap: 0.5rem; }
.fd-icon { display: flex; color: rgb(var(--fd-rgb)); }
.fd-icon svg { width: 20px; height: 20px; }
.fd-name { font-weight: 600; font-size: 0.92rem; color: rgb(var(--fd-rgb)); }
.fd-card-cap { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted, #9ca3af); margin: 0.55rem 0 0.3rem; }
.fd-card .fd-fill { background: rgb(var(--fd-rgb)); }
.fd-card .fd-fill-wip { background: rgba(var(--fd-rgb), 0.4); background: color-mix(in srgb, rgb(var(--fd-rgb)) 40%, #fff); }
.fd-link { position: absolute; inset: 0; }
.fd-link a { position: absolute; inset: 0; font-size: 0; background: none !important; }
.fd-list { list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.fd-item { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 0.35rem 0.5rem; border-radius: 6px; }
.fd-item:hover { background: rgba(128, 128, 128, 0.08); }
.fd-pill { font-size: 0.68rem; padding: 0.12em 0.6em; border-radius: 999px; white-space: nowrap; }
.fd-pill.done { background: rgba(63, 182, 168, 0.2); color: #3fb6a8; }
.fd-pill.wip { background: rgba(63, 182, 168, 0.1); color: #7fd0c6; }
.fd-pill.new { background: rgba(128, 128, 128, 0.15); color: var(--text-muted, #9ca3af); }
.fd-empty { opacity: 0.6; font-size: 0.9rem; }
</style></div>
