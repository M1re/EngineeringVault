import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FilePath, FullSlug, resolveRelative, slugifyFilePath } from "../util/path"
import { readdirSync, readFileSync, existsSync } from "fs"
import { join } from "path"

// Home-page dashboard: a card per top-level section with a "done / total" progress bar,
// plus an overall bar. Counts are read straight from the content folder at build time, so
// drafts (which Quartz removes from the built site) still count toward "total" while staying
// hidden. Adding a note updates the numbers on the next build — no manual bookkeeping.

const CONTENT_DIR = "content"
const SKIP = new Set(["Templates", "attachments"])

type Section = {
  title: string
  icon: string
  blurb: string
  order: number
  total: number
  done: number
  slug: FullSlug
}

function frontmatterBlock(text: string): string | null {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return m ? m[1] : null
}

function parseMeta(text: string): Record<string, string> {
  const block = frontmatterBlock(text)
  const out: Record<string, string> = {}
  if (!block) return out
  for (const line of block.split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (mm) out[mm[1]] = mm[2].trim().replace(/^["']|["']$/g, "")
  }
  return out
}

function isDraft(text: string): boolean {
  const block = frontmatterBlock(text)
  return block ? /(^|\n)\s*draft:\s*true\b/i.test(block) : false
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkMarkdown(p))
    else if (entry.name.endsWith(".md") && entry.name !== "index.md") out.push(p)
  }
  return out
}

function collectSections(): Section[] {
  const root = join(process.cwd(), CONTENT_DIR)
  if (!existsSync(root)) return []
  const sections: Section[] = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".") || SKIP.has(entry.name)) continue
    const abs = join(root, entry.name)
    const indexPath = join(abs, "index.md")
    const meta = existsSync(indexPath) ? parseMeta(readFileSync(indexPath, "utf8")) : {}
    const notes = walkMarkdown(abs)
    let done = 0
    for (const f of notes) {
      if (!isDraft(readFileSync(f, "utf8"))) done++
    }
    sections.push({
      title: meta.title || entry.name,
      icon: meta.icon || "📄",
      blurb: meta.blurb || "",
      order: Number(meta.order) || 999,
      total: notes.length,
      done,
      slug: slugifyFilePath(`${entry.name}/index.md` as FilePath),
    })
  }
  return sections.sort((a, b) => a.order - b.order)
}

const SectionProgress: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  if (fileData.slug !== "index") return null
  const sections = collectSections()
  if (sections.length === 0) return null

  const totalAll = sections.reduce((s, x) => s + x.total, 0)
  const totalDone = sections.reduce((s, x) => s + x.done, 0)
  const overall = totalAll === 0 ? 0 : Math.round((totalDone / totalAll) * 100)

  return (
    <div class="section-progress">
      <div class="sp-grid">
        {sections.map((s) => {
          const pct = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100)
          const href = resolveRelative(fileData.slug!, s.slug)
          return (
            <a class="sp-card" href={href}>
              <div class="sp-head">
                <span class="sp-icon">{s.icon}</span>
                <span class="sp-title">{s.title}</span>
              </div>
              {s.blurb ? <p class="sp-blurb">{s.blurb}</p> : null}
              <div class="sp-meter">
                <div class="sp-meter-top">
                  <span>
                    {s.done}/{s.total} done
                  </span>
                  <span class="sp-pct">{pct}%</span>
                </div>
                <div class="sp-bar">
                  <div class="sp-fill" style={`width:${pct}%`}></div>
                </div>
              </div>
            </a>
          )
        })}
      </div>
      <div class="sp-overall">
        <div class="sp-bar sp-bar-lg">
          <div class="sp-fill" style={`width:${overall}%`}></div>
        </div>
        <div class="sp-legend">
          <span>
            {totalDone}/{totalAll} done
          </span>
          <span class="sp-legend-item">
            <i class="sp-dot done"></i>Done
          </span>
          <span class="sp-legend-item">
            <i class="sp-dot todo"></i>In progress
          </span>
          <span class="sp-pct sp-pct-lg">{overall}%</span>
        </div>
      </div>
    </div>
  )
}

SectionProgress.css = `
.section-progress { margin: 1.5rem 0 2rem; }
.sp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.sp-card {
  display: block;
  padding: 1rem 1.1rem;
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  background: var(--light);
  color: var(--dark);
  text-decoration: none !important;
  background-image: none !important;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.sp-card:hover {
  border-color: var(--secondary);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  transform: translateY(-2px);
}
.sp-head { display: flex; align-items: center; gap: 0.55rem; }
.sp-icon { font-size: 1.15rem; line-height: 1; }
.sp-title { font-weight: 600; color: var(--secondary); }
.sp-blurb {
  margin: 0.5rem 0 0.9rem;
  font-size: 0.83rem;
  color: var(--gray);
  line-height: 1.45;
}
.sp-meter-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.74rem;
  color: var(--darkgray);
  margin-bottom: 0.35rem;
}
.sp-pct { font-variant-numeric: tabular-nums; }
.sp-bar {
  height: 8px;
  background: var(--lightgray);
  border-radius: 999px;
  overflow: hidden;
}
.sp-fill {
  height: 100%;
  background: var(--secondary);
  border-radius: 999px;
}
.sp-bar-lg { height: 12px; }
.sp-overall {
  margin-top: 1.2rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  background: var(--light);
}
.sp-legend {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.6rem;
  font-size: 0.76rem;
  color: var(--darkgray);
  flex-wrap: wrap;
}
.sp-legend-item { display: inline-flex; align-items: center; gap: 0.35rem; }
.sp-dot { width: 0.6rem; height: 0.6rem; border-radius: 50%; display: inline-block; }
.sp-dot.done { background: var(--secondary); }
.sp-dot.todo { background: var(--lightgray); }
.sp-pct-lg { margin-left: auto; font-weight: 600; color: var(--secondary); }
`

export default (() => SectionProgress) satisfies QuartzComponentConstructor
