// Auto-publish watcher.
// Watches Vault/ and, whenever a note with `publish: true` in its frontmatter changes,
// runs the Quartz Syncer CLI to publish (debounced). Drafts (publish:false) are ignored.
// Requires: Obsidian running with "Command line interface" enabled (Settings > General > Advanced).
//
//   node scripts/watch-publish.mjs           # live: actually publishes
//   node scripts/watch-publish.mjs --dry     # dry run: logs, never publishes
//
// - Singleton: refuses to start if another instance is already running (lock file), so triggering it
//   again — e.g. on every Obsidian startup — never spawns duplicates.
// - Tied to Obsidian: on Windows it exits by itself once Obsidian is no longer running.
// - CLI resolution: uses `obsidian` from PATH (portable); override with the OBSIDIAN_COM env var.

import chokidar from "chokidar"
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs"
import { exec } from "node:child_process"
import path from "node:path"

const REPO = process.cwd()
const VAULT = path.join(REPO, "Vault")
const LOCK = path.join(REPO, "scripts", ".watch-publish.lock")
const OBSIDIAN = process.env.OBSIDIAN_COM || "obsidian"
const OBSIDIAN_PROC = process.env.OBSIDIAN_PROC || "Obsidian.exe"
const DEBOUNCE_MS = Number(process.env.PUBLISH_DEBOUNCE_MS || 15000)
const DRY = process.argv.includes("--dry")

const now = () => new Date().toLocaleTimeString()

// --- kill switch ----------------------------------------------------------
// Presence of scripts/.autopublish-disabled fully disables the auto-publisher.
// Survives Obsidian restarts and is version-controlled; re-enable by deleting it.
const DISABLED_FLAG = path.join(REPO, "scripts", ".autopublish-disabled")
if (existsSync(DISABLED_FLAG)) {
  console.log(`[${now()}] auto-publish disabled (${path.basename(DISABLED_FLAG)} present) — exiting`)
  process.exit(0)
}
const rel = (f) => path.relative(VAULT, f)

// --- singleton lock -------------------------------------------------------
function anotherInstanceAlive() {
  try {
    if (!existsSync(LOCK)) return false
    const pid = Number(readFileSync(LOCK, "utf8").trim())
    if (!pid || pid === process.pid) return false
    process.kill(pid, 0) // throws if that PID is not alive
    return true
  } catch {
    return false
  }
}
if (anotherInstanceAlive()) {
  console.log("Another watcher is already running — exiting.")
  process.exit(0)
}
writeFileSync(LOCK, String(process.pid))
process.on("exit", () => {
  try {
    unlinkSync(LOCK)
  } catch {}
})
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => process.exit(0))

// --- exit when Obsidian is gone (Windows) --------------------------------
if (process.platform === "win32") {
  let misses = 0
  setInterval(() => {
    exec(`tasklist /FI "IMAGENAME eq ${OBSIDIAN_PROC}" /NH`, { windowsHide: true }, (err, stdout) => {
      const alive = !err && new RegExp(OBSIDIAN_PROC.replace(".", "\\."), "i").test(stdout || "")
      if (alive) {
        misses = 0
        return
      }
      if (++misses >= 2) {
        console.log(`[${now()}] Obsidian is not running — exiting.`)
        process.exit(0)
      }
    })
  }, 10000)
}

// --- watch + publish ------------------------------------------------------
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
  const cmd = `"${OBSIDIAN}" quartz-syncer:publish`
  if (DRY) {
    console.log(`[${now()}] DRY RUN — would run: ${cmd}`)
    publishing = false
    return
  }
  console.log(`[${now()}] running quartz-syncer:publish …`)
  exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
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

console.log(`Auto-publish watcher${DRY ? " (DRY RUN)" : ""}  (pid ${process.pid})`)
console.log(`  watching: ${VAULT}`)
console.log(`  cli:      ${OBSIDIAN} quartz-syncer:publish`)
console.log(`  debounce: ${DEBOUNCE_MS / 1000}s   (exits when ${OBSIDIAN_PROC} closes)`)
console.log(`Press Ctrl+C to stop.`)
