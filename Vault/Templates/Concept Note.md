<%* if ((tp.file.content || "").trim()) { new Notice("Internal skeleton — use the New Note command instead."); return; } -%>
---
title: "{{title}}"
tags: []
status: new
publish: false
created: {{date:YYYY-MM-DD}}
---

> [!summary]
> <!-- The gist in 1–3 plain sentences a mid-level engineer gets immediately, plus one line on why
>      it matters in real systems. Plain words. Keep the internals for the body. -->

<!-- MECHANISM SECTIONS — the body of the note.
     Do NOT use a generic "## How it works" header. Break the mechanism into topical sections with
     strict, official noun-phrase headers (e.g. "## State Machine", "## Awaiter Pattern"), ordered
     so each one builds on the last. For every section:
       - Explain from WHY to HOW: the problem or question first, then the mechanism. Introduce a
         term only once the reader feels why it is needed — never definition-first.
       - If the section leans on an unfamiliar supporting concept, explain that concept from scratch
         before you use it.
       - Strictly technical, but slow. No metaphors, no padding, no restating the summary.
       - Concrete phrasings: name the object of the action ("block a thread", not "block").
       - Short sentences, simple punctuation.
       - Use a code snippet or a Mermaid diagram wherever it explains better than prose. -->

## <First Mechanism>

## <Second Mechanism>

## Pitfalls & Trade-offs

<!-- A numbered list (1, 2, 3 …), most common / most dangerous first. EACH pitfall carries a short
     code snippet or concrete scenario that shows WHY it is wrong, or the narrow case where it is
     acceptable. Frame trade-offs as trade-offs: "X buys A at the cost of B", not a feature list. -->

## In Production

<!-- A concrete, real production situation — not an abstract toy. Show CODE (for example the bad
     version and the fix side by side) plus a real number or symptom. -->

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
