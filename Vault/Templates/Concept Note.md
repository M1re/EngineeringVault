<%* if ((tp.file.content || "").trim()) { new Notice("Internal skeleton — use the New Note command instead."); return; } -%>
---
title: "{{title}}"
summary: ""
tags: []
status: new
publish: false
created: {{date:YYYY-MM-DD}}
---

> [!summary]
> <!-- The gist in 1–3 plain sentences (Russian, terms in English), plus one line on why it matters
>      in real systems. Keep the internals for the body. -->

<!-- TOPIC SECTIONS — the body of the note, ordered from the basics to advanced.
     Short English noun-phrase headers (e.g. "## Thread Pool", "### Context Switching").
     A deep sub-topic gets its own note; the hub gives a short overview and links to it.
     Each sub-topic:
       1. Definition in plain words (1–2 sentences).
       2. Why it matters: the problem it solves.
       3. Mechanism step by step: who does what, in what order, what happens on failure.
       4. Example code from a real domain (orders, payments), comments tracing the steps;
          a ❌ BAD / ✅ GOOD pair for a common mistake.
       5. Key points as a short list.
     One sentence = one thought. At most one short analogy per sub-topic, then the exact mechanism.
     Version notes as text: "(.NET 8+)". -->

## <First Topic>

## <Second Topic>

## Pitfalls & Trade-offs

<!-- A numbered list, most common / most dangerous first. Each item carries a short code snippet or a
     concrete scenario that shows WHY it breaks. A trade-off says plainly what you gain and what you pay. -->

## In Production

<!-- A working example from a real system: real domain code (the bad version and the fix side by
     side) plus the symptom — latency, error, outage. Never foo/bar. -->

## Questions

<!-- Interview cards: the question is visible, the answer is folded (`-`). The answer is how a senior
     answers: the direct answer, the mechanism behind it, and the trade-off. 4–8 cards per hub note. -->
> [!qard]- <an interview question>
> <how a senior answers it>

## Related

<!-- At least one neighbour: [[Some Other Concept]] -->
-

## References

<!-- Primary sources only: RFC, official docs, the standard, the canonical book/paper. -->
-
