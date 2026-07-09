---
description: Review a note for quality, format compliance, and privacy before publishing
argument-hint: <path or title of the note to review> (or "all" for recently changed)
---

Review this note before it goes public: **$ARGUMENTS**

Check and report on:

1. **Privacy (blocking):** any personal names, emails, employer/company names, internal
   project names, private URLs, tokens, keys, or author-identifying info. This repo is PUBLIC —
   flag every occurrence and propose a redaction. Nothing else matters if this fails.
2. **Format compliance:** frontmatter fields present and valid; all required sections in order
   per `CLAUDE.md`; code blocks have a language; callouts used well.
3. **Depth:** does it explain mechanics and trade-offs, or just define the term? Point out
   any section that reads like a textbook definition and suggest what's missing.
4. **Accuracy:** flag any claim that looks wrong or unverified.
5. **Links:** at least one `## Related` wikilink; note is linked from its section `index.md`.

Report findings as a short checklist (✅ / ⚠️ / ❌). Do not edit the file unless I ask —
just tell me what to fix. If the note is publish-ready, say so and remind me to set `status: done`
and `publish: true` (then publish via the Quartz Syncer Publication Center).
