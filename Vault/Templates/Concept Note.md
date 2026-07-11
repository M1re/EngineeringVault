<%* if ((tp.file.content || "").trim()) { new Notice("Internal skeleton — use the New Note command instead."); return; } -%>
---
title: "{{title}}"
tags: []
status: creation
publish: false
created: {{date:YYYY-MM-DD}}
---

> [!summary]
> <!-- The gist in 1–3 plain sentences a mid-level engineer gets immediately — plus one line on why it matters in real systems. -->

## How it works

<!-- The mechanism, under the hood: what happens, when, who does it, what happens on failure.
     Go deep, but keep sentences simple. Use ### subsections for the moving parts.
     Add a Mermaid diagram where a picture beats prose (```mermaid … ``` — renders in both
     Obsidian and the site). -->

## Pitfalls & trade-offs

<!-- Real production failure modes and costs. Frame trade-offs as trade-offs:
     "X buys you A at the cost of B" — not a feature list. -->

## In production

<!-- A concrete, real production situation — not an abstract toy. What it looks like at scale /
     under load / when it goes wrong, with a real number or a small, correct code snippet. -->

## Questions

<!-- Self-test: the question is visible, the answer is folded (`-`). The reader answers in their
     head, then expands to check. 2–5 design/review-level questions, not "what is X". -->
> [!question]- <a design- or review-level question>
> <the answer — concrete and correct>

## Related

<!-- At least one neighbour: [[Some Other Concept]] -->
-

## References

<!-- Primary sources only: RFC, official docs, the standard, the canonical book/paper. -->
-
