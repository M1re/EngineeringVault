---
publish: true
title: Concurrency & Parallelism
created: 2026-07-09T21:15:52.712+03:00
modified: 2026-07-11T19:42:38.828+03:00
published: 2026-07-11T19:42:38.828+03:00
tags:
  - FolderNote
banner: attachments/banners/aurora.svg
color: "#0ea5e9"
---

> [!abstract] Scope
> _Sub-topic of [[Programming/index|Programming]]. Overview coming._

## Contents

<div class="fd"><style>
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
</style><div class="fd-total" style="--fd-rgb: 63, 182, 168;"><div class="fd-cap"><span>3/6 done</span><span>50%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 50%;"></div><div class="fd-fill-wip" style="width: 0%;"></div></div><div class="fd-legend"><span class="fd-lg done">3 done</span><span class="fd-lg wip">0 in progress</span><span class="fd-lg new">3 new</span></div></div><ul class="fd-list"><li class="fd-item"><a class="internal-link" href="Programming/Concurrency/Async and Await.md" data-tooltip-position="top" aria-label="Async/Await">Async/Await</a><span class="fd-pill done">Done</span></li><li class="fd-item"><a class="internal-link" href="Programming/Concurrency/Concurrency vs Parallelism.md" data-tooltip-position="top" aria-label="Concurrency vs Parallelism">Concurrency vs Parallelism</a><span class="fd-pill done">Done</span></li><li class="fd-item"><a class="internal-link" href="Programming/Concurrency/Deadlocks.md" data-tooltip-position="top" aria-label="Deadlocks">Deadlocks</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/Concurrency/Locks and Synchronization.md" data-tooltip-position="top" aria-label="Locks and Synchronization">Locks and Synchronization</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/Concurrency/Race Conditions.md" data-tooltip-position="top" aria-label="Race Conditions">Race Conditions</a><span class="fd-pill new">New</span></li><li class="fd-item"><a class="internal-link" href="Programming/Concurrency/Threads and the Thread Pool.md" data-tooltip-position="top" aria-label="Threads and the Thread Pool">Threads and the Thread Pool</a><span class="fd-pill done">Done</span></li></ul></div>
