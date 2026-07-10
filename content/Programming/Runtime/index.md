---
publish: true
title: Runtime & Memory
created: 2026-07-09T21:15:52.719+03:00
modified: 2026-07-10T17:44:01.641+03:00
published: 2026-07-10T17:44:01.641+03:00
tags:
  - FolderNote
banner: attachments/banners/aurora.svg
color: "#14b8a6"
---

> [!abstract] Scope
> _Sub-topic of [[Programming/index|Programming]]. Overview coming._

## Contents

<div class="fd"><div style="--fd-rgb: 63, 182, 168;" class="fd-total"><div class="fd-cap"><span>0/5 done</span><span>0%</span></div><div class="fd-bar"><div style="width: 0%;" class="fd-fill"></div></div></div><ul class="fd-list"><li class="fd-item"><a class="internal-link" href="Programming/Runtime/CLR and JIT.md" data-tooltip-position="top" aria-label="CLR and JIT">CLR and JIT</a><span class="fd-pill wip">In progress</span></li><li class="fd-item"><a class="internal-link" href="Programming/Runtime/Garbage Collection.md" data-tooltip-position="top" aria-label="Garbage Collection">Garbage Collection</a><span class="fd-pill wip">In progress</span></li><li class="fd-item"><a class="internal-link" href="Programming/Runtime/Memory Leaks.md" data-tooltip-position="top" aria-label="Memory Leaks">Memory Leaks</a><span class="fd-pill wip">In progress</span></li><li class="fd-item"><a class="internal-link" href="Programming/Runtime/Stack vs Heap.md" data-tooltip-position="top" aria-label="Stack vs Heap">Stack vs Heap</a><span class="fd-pill wip">In progress</span></li><li class="fd-item"><a class="internal-link" href="Programming/Runtime/Value vs Reference Types.md" data-tooltip-position="top" aria-label="Value vs Reference Types">Value vs Reference Types</a><span class="fd-pill wip">In progress</span></li></ul><style>
.fd { margin: 0.5rem 0 1rem; }
.fd-total { margin-bottom: 1rem; }
.fd-cap { display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-muted, #9ca3af); margin-bottom: 6px; }
.fd-bar { height: 8px; background: rgba(128, 128, 128, 0.22); border-radius: 999px; overflow: hidden; }
.fd-fill { height: 100%; background: rgb(var(--fd-rgb, 63,182,168)); border-radius: 999px; }
.fd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; }
.fd-card { position: relative; border: 1px solid rgba(128, 128, 128, 0.22) !important; border-radius: 8px; padding: 0.8rem 0.9rem; background: transparent !important; transition: border-color 120ms, background-color 120ms; }
.fd-card:hover { border-color: rgba(var(--fd-rgb), 0.55) !important; background: rgba(var(--fd-rgb), 0.08) !important; }
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
</style></div>
