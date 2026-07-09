// Auto-publish watcher.
// Watches Vault/ and, whenever a note with `publish: true` in its frontmatter changes,
// runs the Quartz Syncer CLI to publish (debounced). Drafts (publish:false) are ignored.
// Requires: Obsidian running with "Command line interface" enabled (Settings > General > Advanced).
//
//   node scripts/watch-publish.mjs           # live: actually publishes
//   node scripts/watch-publish.mjs --dry     # dry run: logs, never publishes
//
// The Obsidian CLI redirector path can be overridden with the OBSIDIAN_COM env var.

import chokidar from "chokidar"
import { readFileSync } from "node:fs"
import { execFile } from "node:child_process"
import path from "node:path"

const REPO = process.cwd()
const VAULT = path.join(REPO, "Vault")
const OBSIDIAN_COM = process.env.OBSIDIAN_COM || "D:/Obsidian/Obsidian.com"
const DEBOUNCE_MS = Number(process.env.PUBLISH_DEBOUNCE_MS || 25000)
const DRY = process.argv.includes("--dry")

const now = () => new Date().toLocaleTimeString()
const rel = (f) => path.relative(VAULT, f)

function isPublishTrue(file) {
  try {
    const m = readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)
    return m ? /(^|\n)\s*publish:\s*true\b/i.test(m[1]) : false
  } catch {
    return false
  }
}

let timer = null
let publishing = false
let queued = false

function schedule(file) {
  console.log(`[${now()}] change: ${rel(file)} (publish:true) → publish in ${DEBOUNCE_MS / 1000}s`)
  if (timer) clearTimeout(timer)
  timer = setTimeout(runPublish, DEBOUNCE_MS)
}

function runPublish() {
  timer = null
  if (publishing) {
    queued = true
    return
  }
  publishing = true
  if (DRY) {
    console.log(`[${now()}] DRY RUN — would run: ${OBSIDIAN_COM} quartz-syncer:publish`)
    publishing = false
    return
  }
  console.log(`[${now()}] running quartz-syncer:publish …`)
  execFile(OBSIDIAN_COM, ["quartz-syncer:publish"], { windowsHide: true }, (err, stdout, stderr) => {
    publishing = false
    const out = (stdout || "").trim() || (stderr || "").trim()
    if (err) console.error(`[${now()}] publish FAILED: ${out || err.message}`)
    else console.log(`[${now()}] ${out || "done"}`)
    if (queued) {
      queued = false
      runPublish()
    }
  })
}

const watcher = chokidar.watch(VAULT, {
  ignoreInitial: true,
  ignored: (p) => /[\\/](\.obsidian|Templates|\.trash|attachments)[\\/]/.test(p),
})

watcher.on("all", (event, file) => {
  if (event !== "add" && event !== "change") return
  if (!file.endsWith(".md")) return
  if (isPublishTrue(file)) schedule(file)
})

console.log(`Auto-publish watcher${DRY ? " (DRY RUN)" : ""}`)
console.log(`  watching: ${VAULT}`)
console.log(`  cli:      ${OBSIDIAN_COM} quartz-syncer:publish`)
console.log(`  debounce: ${DEBOUNCE_MS / 1000}s   (Obsidian must be running)`)
console.log(`Press Ctrl+C to stop.`)
