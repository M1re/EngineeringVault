# Verification protocol (zero fabrication)

Read this whenever writing or reviewing a concept note. The bar: **a reader can trust every
sentence.** A confident-sounding wrong fact is worse than an admitted gap.

## The one rule

Every **specific factual claim** must be either (a) traceable to a primary source, or
(b) explicitly marked unverified. No exceptions, no "probably", no confident guessing.

Specific factual claims include: numbers and thresholds, default values, API/method/flag names and
signatures, config keys, protocol/standard behaviour, version-specific behaviour, complexity
figures, benchmark results, historical dates, "X was introduced in version Y".

## Sources, in order of trust

1. The **primary source**: the RFC, language/runtime spec, official library/API docs, the standard,
   or the canonical paper/book.
2. Well-established, uncontroversial knowledge you are certain of (e.g. "TCP is connection-oriented").
3. Nothing else. Blog posts, memory of a blog post, or "I think it's around…" are **not** sources.

If a claim is version-specific, niche, or you feel the faintest doubt → go to level 1 (fetch/read
the actual doc) or mark it unverified. Never upgrade a level-2 hunch into a stated fact.

## Never invent

- API signatures, method names, flags, config keys, or enum values you have not confirmed exist.
- Numbers: latencies, sizes, limits, percentages, Big-O, "N× faster".
- Version/date claims ("added in .NET 8", "since HTTP/2").
- Quotes, citations, or references to docs/sections that may not exist.

## When you can't verify

Prefer **omit** over guess. If the point matters, write it honestly:

```md
> [!warning] Unverified
> The exact default here is uncertain — confirm against <primary source> before relying on it.
```

## Pre-publish checklist (the `reviewer` subagent runs this)

Accuracy
- [ ] Every number / API / flag / version claim is traceable to a primary source, or flagged `Unverified`.
- [ ] No invented signatures, enum values, or config keys.
- [ ] Version-specific claims name the version and match the source.

Depth & honesty
- [ ] "How it works" explains the **mechanism** (what/when/who/on-failure), not a restated summary.
- [ ] "Trade-offs & pitfalls" states real **costs and failure modes**, not benefits only.
- [ ] "Questions to test yourself" are design/review-level, not "what is X".

Form
- [ ] Every code fence declares a language; snippets are correct and minimal.
- [ ] Reads simply despite depth — no jargon used to sound smart; a mid-level engineer could follow.
- [ ] Required sections present and in order (see `Vault/Templates/Concept Note.md`).

Repo hygiene
- [ ] No personal/private data (names, employers, emails, internal URLs, secrets).
- [ ] Tags are thematic (concepts, not the folder path); ≥1 `[[wikilink]]` to a neighbour.
