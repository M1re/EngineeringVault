---
publish: true
title: Programming
description: Languages, paradigms, and runtime internals.
created: 2026-07-10T08:06:28.614+03:00
modified: 2026-07-11T19:42:38.829+03:00
published: 2026-07-11T19:42:38.829+03:00
tags:
  - FolderNote
banner: attachments/banners/aurora.svg
icon: code-2
color: "#6366f1"
banner_y: 0.5
---

Languages, paradigms, and the craft of writing code that survives contact with production.

> [!abstract] Scope
> How languages actually run, how memory and concurrency work, the paradigms behind good design, and what separates clean, maintainable code from clever code.

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
</style><div class="fd-total" style="--fd-rgb: 63, 182, 168;"><div class="fd-cap"><span>5/44 done</span><span>11%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 11%;"></div></div></div><div class="fd-grid"><div class="fd-card" style="--fd-rgb: 168, 85, 247;"><div class="fd-card-head"><span class="fd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span><span class="fd-name">.NET</span></div><div class="fd-card-cap"><span>0/5 done</span><span>0%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 0%;"></div></div><span class="fd-link"><a class="internal-link" href="Programming/DotNet/index.md" data-tooltip-position="top" aria-label="index">index</a></span></div><div class="fd-card" style="--fd-rgb: 16, 185, 129;"><div class="fd-card-head"><span class="fd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span><span class="fd-name">ASP.NET Web API</span></div><div class="fd-card-cap"><span>0/7 done</span><span>0%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 0%;"></div></div><span class="fd-link"><a class="internal-link" href="Programming/AspNetWebApi/index.md" data-tooltip-position="top" aria-label="index">index</a></span></div><div class="fd-card" style="--fd-rgb: 139, 92, 246;"><div class="fd-card-head"><span class="fd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span><span class="fd-name">C#</span></div><div class="fd-card-cap"><span>1/10 done</span><span>10%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 10%;"></div></div><span class="fd-link"><a class="internal-link" href="Programming/CSharp/index.md" data-tooltip-position="top" aria-label="index">index</a></span></div><div class="fd-card" style="--fd-rgb: 245, 158, 11;"><div class="fd-card-head"><span class="fd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span><span class="fd-name">Clean Code</span></div><div class="fd-card-cap"><span>0/3 done</span><span>0%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 0%;"></div></div><span class="fd-link"><a class="internal-link" href="Programming/CleanCode/index.md" data-tooltip-position="top" aria-label="index">index</a></span></div><div class="fd-card" style="--fd-rgb: 14, 165, 233;"><div class="fd-card-head"><span class="fd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span><span class="fd-name">Concurrency & Parallelism</span></div><div class="fd-card-cap"><span>3/6 done</span><span>50%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 50%;"></div></div><span class="fd-link"><a class="internal-link" href="Programming/Concurrency/index.md" data-tooltip-position="top" aria-label="index">index</a></span></div><div class="fd-card" style="--fd-rgb: 99, 102, 241;"><div class="fd-card-head"><span class="fd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span><span class="fd-name">Paradigms</span></div><div class="fd-card-cap"><span>0/4 done</span><span>0%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 0%;"></div></div><span class="fd-link"><a class="internal-link" href="Programming/Paradigms/index.md" data-tooltip-position="top" aria-label="index">index</a></span></div><div class="fd-card" style="--fd-rgb: 20, 184, 166;"><div class="fd-card-head"><span class="fd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span><span class="fd-name">Runtime & Memory</span></div><div class="fd-card-cap"><span>1/5 done</span><span>20%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 20%;"></div></div><span class="fd-link"><a class="internal-link" href="Programming/Runtime/index.md" data-tooltip-position="top" aria-label="index">index</a></span></div><div class="fd-card" style="--fd-rgb: 239, 68, 68;"><div class="fd-card-head"><span class="fd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span><span class="fd-name">Testing</span></div><div class="fd-card-cap"><span>0/4 done</span><span>0%</span></div><div class="fd-bar"><div class="fd-fill" style="width: 0%;"></div></div><span class="fd-link"><a class="internal-link" href="Programming/Testing/index.md" data-tooltip-position="top" aria-label="index">index</a></span></div></div></div>
