#!/usr/bin/env node
// Validate the Obsidian vault against the conventions in CLAUDE.md and Templates/Concept Note.md.
// Runs in CI (.github/workflows/validate.yml) and locally:  npm run validate
//
// Concept notes (every .md except folder-notes and Templates/):
//   - frontmatter: title, tags (list), status (new | in-progress | done), publish (bool), created (YYYY-MM-DD)
//   - summary: required on `done` notes (one plain line; feeds the site's description/link previews)
//   - body: no top-level `# Title` (Quartz renders the title), every code fence names a language,
//     self-test questions are `> [!qard]-` cards (Qard spaced repetition), not `[!question]`
//   - `done` notes: required sections present, in order; References hold no images
//   - no `banner` (covers belong to folder-notes)
// Folder-notes (index.md): tags include FolderNote, title, publish: true, banner. Vault/index.md (home) is exempt.
//
// Exit code 1 on any error. Warnings never fail the run.

import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const VAULT = path.join(ROOT, "Vault")
const SKIP_DIRS = new Set([".obsidian", ".trash", "attachments", "Templates"])
const STATUSES = new Set(["new", "in-progress", "done"])
// Required `done` sections, in order (matched case-insensitively).
const DONE_SECTIONS = [
  { label: "> [!summary]", re: /^>\s*\[!summary\]/i },
  { label: "## Pitfalls & Trade-offs", re: /^##\s+pitfalls\s*&\s*trade-offs\s*$/i },
  { label: "## In Production", re: /^##\s+in production\s*$/i },
  { label: "## Questions", re: /^##\s+questions\s*$/i },
  { label: "## Related", re: /^##\s+related\s*$/i },
  { label: "## References", re: /^##\s+references\s*$/i },
]

const problems = []
const report = (level, file, line, msg) =>
  problems.push({ level, where: `${path.relative(ROOT, file)}${line ? `:${line}` : ""}`, msg })

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name))
    } else if (entry.name.endsWith(".md")) yield path.join(dir, entry.name)
  }
}

const isDate = (v) =>
  (v instanceof Date && !isNaN(v)) || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))

// Body lines outside fenced code, with 1-based line numbers in the original file.
function scanBody(text, bodyStart, file) {
  const lines = text.split(/\r?\n/)
  const out = []
  let fence = null
  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/)
    if (m) {
      if (!fence) {
        fence = m[1]
        if (!m[2].trim())
          report("error", file, i + 1, "code fence without a language (use `text` if nothing fits)")
        continue
      }
      if (m[1][0] === fence[0] && m[1].length >= fence.length && !m[2].trim()) {
        fence = null
        continue
      }
    }
    if (!fence) out.push({ n: i + 1, line })
  }
  if (fence) report("error", file, null, "unclosed code fence")
  return out
}

function checkConcept(file, fm, body) {
  if (typeof fm.title !== "string" || !fm.title.trim())
    report("error", file, null, "frontmatter `title` missing")
  if (!Array.isArray(fm.tags)) report("error", file, null, "frontmatter `tags` must be a list")
  if (!STATUSES.has(fm.status))
    report(
      "error",
      file,
      null,
      `status must be new | in-progress | done (got ${JSON.stringify(fm.status)})`,
    )
  if (typeof fm.publish !== "boolean")
    report("error", file, null, "frontmatter `publish` must be true or false")
  if (!isDate(fm.created)) report("error", file, null, "frontmatter `created` must be YYYY-MM-DD")
  if (fm.banner) report("error", file, null, "`banner` belongs to folder-notes only")
  if (fm.summary !== undefined && (typeof fm.summary !== "string" || !fm.summary.trim()))
    report("error", file, null, "`summary` must be a non-empty string")

  for (const { n, line } of body) {
    if (/^#\s/.test(line))
      report("error", file, n, "no top-level `# Title` in the body (Quartz renders `title`)")
    if (/^>\s*\[!question\]/i.test(line))
      report("error", file, n, "self-test questions are Qard cards: use `> [!qard]-`")
  }

  if (fm.status !== "done") return
  if (typeof fm.summary !== "string" || !fm.summary.trim())
    report("error", file, null, "`done` notes need a one-line `summary` in frontmatter")

  let from = 0
  let refsAt = -1
  for (const section of DONE_SECTIONS) {
    const idx = body.findIndex((b, i) => i >= from && section.re.test(b.line))
    if (idx === -1) {
      const anywhere = body.some((b) => section.re.test(b.line))
      report(
        "error",
        file,
        null,
        anywhere
          ? `section "${section.label}" is out of order`
          : `missing section "${section.label}"`,
      )
      continue
    }
    from = idx + 1
    if (section.label === "## References") refsAt = idx
  }
  if (refsAt >= 0) {
    for (const { n, line } of body.slice(refsAt + 1)) {
      if (/^##\s/.test(line)) break
      if (/!\[|\.(png|jpe?g|gif|svg|webp)(\)|\s|$)/i.test(line))
        report("error", file, n, "References must not contain images")
    }
  }
}

function checkFolderNote(file, fm) {
  const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : []
  if (!tags.includes("FolderNote"))
    report("error", file, null, "folder-note needs `tags: [FolderNote]`")
  if (typeof fm.title !== "string" || !fm.title.trim())
    report("error", file, null, "folder-note needs a `title`")
  if (fm.publish !== true) report("error", file, null, "folder-note needs `publish: true`")
  if (!fm.banner) report("warn", file, null, "folder-note has no `banner` cover")
}

let count = 0
for (const file of walk(VAULT)) {
  count++
  const text = readFileSync(file, "utf8")
  if (!text.startsWith("---")) {
    report("error", file, 1, "missing YAML frontmatter")
    continue
  }
  let parsed
  try {
    parsed = matter(text)
  } catch (e) {
    report("error", file, null, `frontmatter does not parse: ${e.message.split("\n")[0]}`)
    continue
  }
  const fm = parsed.data ?? {}
  const bodyStart = text.slice(0, text.length - parsed.content.length).split(/\r?\n/).length - 1
  const body = scanBody(text, bodyStart, file)
  if (file === path.join(VAULT, "index.md")) continue // home page: dashboard, own contract
  if (path.basename(file) === "index.md") checkFolderNote(file, fm)
  else checkConcept(file, fm, body)
}

const errors = problems.filter((p) => p.level === "error")
for (const p of problems)
  console.log(`${p.level === "error" ? "ERROR" : "warn "} ${p.where}  ${p.msg}`)
console.log(
  `\nvalidate-vault: ${count} notes, ${errors.length} error(s), ${problems.length - errors.length} warning(s).`,
)
process.exit(errors.length ? 1 : 0)
