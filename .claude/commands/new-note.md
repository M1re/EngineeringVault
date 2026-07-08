---
description: Create a new concept note in a section, following the vault format
argument-hint: <Section> — <Topic title>
---

Create a new knowledge-base note for the topic: **$ARGUMENTS**

Follow these steps:

1. Parse the section and topic from the input. The section must be one of:
   Programming, Computer Science, Data Persistence, Networks, Architecture,
   AI and ML, Security, Cloud, DevOps. If the section is ambiguous or missing,
   pick the best fit and say which you chose.
2. Create the file at `content/<Section>/<Topic Title>.md`.
3. Fill it out using the exact format in `content/Templates/Concept Note.md` and the
   writing rules in `CLAUDE.md`: mechanics + trade-offs + self-test questions, staff-engineer depth.
4. Write accurate content only. If any part is uncertain, mark it with a
   `> [!warning] Unverified` callout rather than guessing.
5. Add `## Related` wikilinks to existing notes where relevant, and add a link to this
   new note from the section's `index.md` (under "Planned topics" or a new list).
6. Set `draft: false` only if all sections are genuinely complete; otherwise leave `draft: true`.
7. Absolutely no personal or private data (this repo is public).

After writing, give me a one-paragraph summary of what you covered and which links you added.
