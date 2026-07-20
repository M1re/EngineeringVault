---
publish: true
title: Architecture
description: Distributed systems, patterns, and scalability.
created: 2026-07-09T21:15:52.697+03:00
modified: 2026-07-11T19:42:38.824+03:00
published: 2026-07-11T19:42:38.824+03:00
tags:
  - FolderNote
banner: attachments/banners/aurora.svg
icon: building-2
color: "#f59e0b"
banner_y: 0.175
---

Designing systems that stay correct, available, and affordable as they grow — the core of staff-level work.

> [!abstract] Scope
> Distributed systems, system design, scalability patterns, and the trade-offs behind every architectural decision.

## Contents

<div class="fd"><style>
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
</style><div class="fd-total" style="--fd-rgb: 63, 182, 168;"><div class="fd-cap"><span>1/1 done</span><span>100%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 100%;"></div></div></div><div class="fd-grid"><div class="fd-card" style="--fd-rgb: 245, 158, 11;"><div class="fd-card-head"><span class="fd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/></svg></span><span class="fd-name">Reliability</span></div><div class="fd-card-cap"><span>1/1 done</span><span>100%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 100%;"></div></div><span class="fd-link"><a class="internal-link" href="Architecture/Reliability/index.md" data-tooltip-position="top" aria-label="index">index</a></span></div></div></div>
