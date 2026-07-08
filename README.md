# Engineering Vault

A public knowledge base about what a **staff software engineer** is expected to understand
deeply — written to *understand* the stack, not just memorize it for interviews.

Notes are authored in [Obsidian](https://obsidian.md) and published as a website with
[Quartz](https://quartz.jzhao.xyz) via GitHub Pages.

## Sections

Programming · Computer Science · Data Persistence · Networks · Architecture ·
AI & ML · Security · Cloud · DevOps

## Repository layout

```
content/     Obsidian vault — all notes (this is what gets published)
.claude/     Claude Code automation: commands, skills, hooks
docs/        local setup & workflow notes (not published)
quartz/      static-site generator (Quartz v4)
```

## Local development

Requires Node.js ≥ 22.

```bash
npm install                 # once
npx quartz build --serve    # preview at http://localhost:8080
```

Open the **`content/`** folder as your vault in Obsidian. See [`docs/setup.md`](docs/setup.md)
for the recommended plugins and workflow.

## License

Content: © the author. Site generator: [Quartz](https://github.com/jackyzha0/quartz) (MIT,
see `LICENSE.txt`).
