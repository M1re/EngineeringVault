#!/usr/bin/env node
// Export the vault to content/ with Quartz Syncer (local mode) through the Obsidian CLI.
//
//   node scripts/sync-quartz.mjs --configure-only   point Syncer at this checkout, apply shared defaults
//   node scripts/sync-quartz.mjs                    configure + export now (also: npm run export)
//   node scripts/sync-quartz.mjs --hook             what .githooks/pre-commit runs
//
// How it works: Obsidian must be running with this vault open and its command line interface
// enabled (Settings -> General -> Command line interface). Every step is an `obsidian vault=Vault
// quartz-syncer:<command> format=json` call, so Datacore blocks are compiled by the real plugin,
// exactly as the Publication Center does. Syncer writes content/ (and its quartz/styles files)
// straight into this checkout; there is no GitHub token and nothing is pushed.
//
// In --hook mode the export runs only when the commit stages files under Vault/ (Obsidian config
// excluded), refuses to run when Vault/ has unstaged or untracked changes (the export reads the
// disk, so the disk must equal the commit), and stages the generated output.
//
// Environment:
//   OBSIDIAN_BIN          full path to the Obsidian CLI if it is not found automatically
//   OBSIDIAN_VAULT        vault name as Obsidian knows it (default: Vault)
//   QUARTZ_SYNC_TIMEOUT   overall budget in seconds (default: 600)
//   SKIP_QUARTZ_SYNC=1    skip the export for one commit (same as git commit --no-verify)

import { spawn, spawnSync } from "node:child_process"
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  appendFileSync,
  writeSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const IS_WINDOWS = process.platform === "win32"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const VAULT_NAME = process.env.OBSIDIAN_VAULT || "Vault"
const DEFAULTS_FILE = path.join(ROOT, "scripts", "quartz-syncer.defaults.json")
// Everything Syncer writes in local mode; staged after a successful export.
const OUTPUTS = ["content", "quartz/styles/syncer", "quartz/styles/custom.scss"]
// Vault paths that are app state, not notes: committing them never needs an export.
const NON_SOURCE = /^Vault\/(\.obsidian|\.trash)\//

export class SyncError extends Error {}

// ---------- small helpers ----------------------------------------------------------------------

function git(args, { allowFail = false } = {}) {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" })
  if (r.status !== 0 && !allowFail) {
    throw new SyncError(`git ${args.join(" ")} failed: ${(r.stderr || "").trim()}`)
  }
  return (r.stdout || "").replace(/\r?\n$/, "")
}

function gitPath(name) {
  return path.resolve(ROOT, git(["rev-parse", "--git-path", name]))
}

let logFile = null
function log(message) {
  const line = `[quartz-sync] ${message}`
  console.log(line)
  try {
    logFile ??= gitPath("quartz-sync.log")
    appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`)
  } catch {
    // logging must never break the export
  }
}

const samePath = (a, b) => {
  const norm = (p) => path.resolve(p).replace(/[\\/]+$/, "")
  return IS_WINDOWS ? norm(a).toLowerCase() === norm(b).toLowerCase() : norm(a) === norm(b)
}

// ---------- Obsidian CLI -----------------------------------------------------------------------

// Find the CLI binary. Order: OBSIDIAN_BIN, PATH, the default install locations.
export function findObsidian() {
  if (process.env.OBSIDIAN_BIN) return process.env.OBSIDIAN_BIN
  const exts = IS_WINDOWS ? [".exe", ".com", ".cmd", ".bat", ""] : [""]
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    if (!dir) continue
    for (const ext of exts) {
      const candidate = path.join(dir, "obsidian" + ext)
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
    }
  }
  const fallbacks = IS_WINDOWS
    ? [
        path.join(process.env.LOCALAPPDATA || "", "Programs", "Obsidian", "Obsidian.com"),
        path.join(process.env.LOCALAPPDATA || "", "Programs", "Obsidian", "Obsidian.exe"),
      ]
    : [
        "/Applications/Obsidian.app/Contents/MacOS/obsidian",
        "/Applications/Obsidian.app/Contents/MacOS/Obsidian",
      ]
  const hit = fallbacks.find((p) => existsSync(p))
  if (hit) return hit
  throw new SyncError(
    "Obsidian CLI not found. In Obsidian enable Settings -> General -> Command line interface " +
      "(follow its registration prompt), reopen the terminal, or set OBSIDIAN_BIN to the CLI path.",
  )
}

function runCli(bin, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    // .cmd/.bat shims can only be started through the shell on Windows.
    const viaShell = IS_WINDOWS && /\.(cmd|bat)$/i.test(bin)
    const child = spawn(viaShell ? `"${bin}"` : bin, viaShell ? args.map((a) => `"${a}"`) : args, {
      cwd: ROOT,
      shell: viaShell,
      windowsHide: true,
    })
    let out = ""
    let err = ""
    const timer = setTimeout(() => {
      child.kill()
      reject(new SyncError(`Obsidian CLI timed out: ${args.join(" ")}`))
    }, Math.max(1000, timeoutMs))
    child.stdout.on("data", (d) => (out += d))
    child.stderr.on("data", (d) => (err += d))
    child.on("error", (e) => {
      clearTimeout(timer)
      reject(new SyncError(`Could not start the Obsidian CLI (${bin}): ${e.message}`))
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        reject(new SyncError(`Obsidian CLI (${bin}) exited ${code}: ${args.join(" ")}\n${(err + out).trim() || "(no output: is Obsidian running with this vault open and Quartz Syncer enabled?)"}`))
      } else resolve(out)
    })
  })
}

// The CLI may print notices before the JSON payload; take the outermost JSON value.
function parseJson(text, args) {
  const start = text.search(/[{[]/)
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"))
  if (start < 0 || end < start) {
    throw new SyncError(`Expected JSON from "${args.join(" ")}", got: ${text.trim().slice(0, 400)}`)
  }
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    throw new SyncError(`Unreadable JSON from "${args.join(" ")}": ${text.trim().slice(0, 400)}`)
  }
}

class Obsidian {
  constructor(deadline) {
    this.bin = findObsidian()
    this.deadline = deadline
  }
  remaining() {
    const ms = this.deadline - Date.now()
    if (ms <= 0) throw new SyncError("Quartz export deadline reached (QUARTZ_SYNC_TIMEOUT).")
    return ms
  }
  async raw(args) {
    return runCli(this.bin, [`vault=${VAULT_NAME}`, ...args], this.remaining())
  }
  async json(args) {
    const full = [...args, "format=json"]
    const data = parseJson(await this.raw(full), full)
    if (data && data.success === false) {
      throw new SyncError(`${args.join(" ")}: ${data.error || JSON.stringify(data)}`)
    }
    // Commands answer either the payload itself or { success, data }.
    return data && typeof data === "object" && "data" in data && "success" in data ? data.data : data
  }
}

// ---------- configure --------------------------------------------------------------------------

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export async function configure(cli) {
  const defaults = JSON.parse(readFileSync(DEFAULTS_FILE, "utf8"))
  let settings = await cli.json(["quartz-syncer:config", "action=list"])
  const changed = Object.keys(defaults).filter((k) => !sameValue(settings[k], defaults[k]))
  const destinationOk = () =>
    settings.publishTarget === "local" &&
    typeof settings.quartzRepoPath === "string" &&
    path.isAbsolute(settings.quartzRepoPath) &&
    samePath(settings.quartzRepoPath, ROOT)

  if (changed.length || !destinationOk()) {
    log(`Configuring Syncer (${changed.length} setting(s), destination ${destinationOk() ? "ok" : "-> this checkout"}).`)
    // Settings change how notes compile, so drop compiled pages before applying them.
    await cli.json(["quartz-syncer:cache", "action=clear"])
    for (const key of changed) {
      const v = defaults[key]
      const value = typeof v === "string" ? v : JSON.stringify(v)
      await cli.json(["quartz-syncer:config", "action=set", `key=${key}`, `value=${value}`])
    }
    if (!destinationOk()) {
      await cli.json(["quartz-syncer:repo", "action=set-local", `path=${ROOT}`])
    }
    await cli.raw(["plugin:reload", "id=quartz-syncer"])
    settings = await cli.json(["quartz-syncer:config", "action=list"])
  }
  const still = Object.keys(defaults).filter((k) => !sameValue(settings[k], defaults[k]))
  if (still.length || !destinationOk()) {
    throw new SyncError(
      `Syncer settings do not match this checkout after configuring (${[...still, ...(destinationOk() ? [] : ["destination"])].join(", ")}).`,
    )
  }
  log(`Syncer exports locally to ${ROOT}${path.sep}content.`)
}

// ---------- export -----------------------------------------------------------------------------

function failureDetails(result) {
  return JSON.stringify(result).slice(0, 800)
}

function findUnrenderedQueries(dir) {
  const bad = []
  if (!existsSync(dir)) return bad
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) bad.push(...findUnrenderedQueries(p))
    else if (entry.name.endsWith(".md")) {
      const text = readFileSync(p, "utf8").replace(/%%[\s\S]*?%%/g, "")
      if (/^\s*(`{3,}|~{3,})(datacore(js|jsx|ts|tsx)?|dataview(js)?)\b/m.test(text)) bad.push(p)
    }
  }
  return bad
}

export async function exportVault(cli) {
  await cli.json(["quartz-syncer:cache", "action=tree-refresh"])
  const published = await cli.json(["quartz-syncer:publish"])
  const failures = published?.failures
  const skipped = published?.skipped
  if ((Array.isArray(failures) && failures.length) || (typeof skipped === "number" && skipped > 0)) {
    throw new SyncError(`Syncer failed or skipped notes: ${failureDetails(published)}`)
  }
  await cli.json(["quartz-syncer:delete", "force"])
  await cli.json(["quartz-syncer:cache", "action=tree-refresh"])
  const status = await cli.json(["quartz-syncer:status"])
  if ((status?.unpublished ?? 0) !== 0 || (status?.deleted ?? 0) !== 0) {
    throw new SyncError(`Export left unpublished/deleted notes: ${failureDetails(status)}`)
  }
  const unrendered = findUnrenderedQueries(path.join(ROOT, "content"))
  if (unrendered.length) {
    throw new SyncError(
      `Unrendered Datacore/Dataview block in ${unrendered.map((p) => path.relative(ROOT, p)).join(", ")} — let Datacore finish indexing and retry.`,
    )
  }
  // Covers live only in frontmatter, which Syncer does not treat as embeds: mirror them.
  const banners = spawnSync(process.execPath, [path.join(ROOT, "scripts", "sync-banners.mjs")], {
    cwd: ROOT,
    encoding: "utf8",
  })
  if (banners.status !== 0) throw new SyncError(`sync-banners failed: ${banners.stderr}`)
  log("Export finished.")
}

// ---------- pre-commit guards ------------------------------------------------------------------

function stagedVaultSource() {
  return git(["diff", "--cached", "--name-only", "-z", "--", "Vault"])
    .split("\0")
    .filter((p) => p && !NON_SOURCE.test(p))
}

function dirtyVaultSource() {
  const unstaged = git(["diff", "--name-only", "-z", "--", "Vault"]).split("\0")
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z", "--", "Vault"]).split("\0")
  return [...unstaged, ...untracked].filter((p) => p && !NON_SOURCE.test(p))
}

function takeLock() {
  const lock = gitPath("quartz-sync.lock")
  let fd
  try {
    fd = openSync(lock, "wx")
  } catch {
    throw new SyncError(
      `Another Quartz export is running (lock: ${lock}). If none is, delete that file and retry.`,
    )
  }
  writeSync(fd, String(process.pid))
  closeSync(fd)
  return () => {
    try {
      unlinkSync(lock)
    } catch {}
  }
}

// ---------- entry point ------------------------------------------------------------------------

async function main() {
  const args = new Set(process.argv.slice(2))
  const hook = args.has("--hook")
  const configureOnly = args.has("--configure-only")

  if (hook && process.env.SKIP_QUARTZ_SYNC === "1") {
    log("SKIP_QUARTZ_SYNC=1: export skipped for this commit.")
    return
  }
  if (hook) {
    const staged = stagedVaultSource()
    if (!staged.length) return // nothing in the vault changed: plain commit
    const dirty = dirtyVaultSource()
    if (dirty.length) {
      throw new SyncError(
        "Vault/ has unstaged or untracked changes; the export reads the disk, so stage them first:\n  " +
          dirty.slice(0, 20).join("\n  "),
      )
    }
    log(`${staged.length} staged vault file(s); exporting before commit.`)
  }

  const timeoutSec = Number(process.env.QUARTZ_SYNC_TIMEOUT || 600)
  if (!Number.isFinite(timeoutSec) || timeoutSec <= 0) {
    throw new SyncError("QUARTZ_SYNC_TIMEOUT must be a positive number of seconds.")
  }
  const release = takeLock()
  try {
    const cli = new Obsidian(Date.now() + timeoutSec * 1000)
    await configure(cli)
    if (configureOnly) return
    await exportVault(cli)
    if (hook) {
      if (dirtyVaultSource().length) {
        throw new SyncError("Vault/ changed while exporting. Review, stage, and commit again.")
      }
      const present = OUTPUTS.filter((p) => existsSync(path.join(ROOT, p)) || git(["ls-files", "--", p]))
      if (present.length) git(["add", "-A", "--", ...present])
      log("Generated output staged with the commit.")
    }
  } finally {
    release()
  }
}

if (process.argv[1] && samePath(process.argv[1], fileURLToPath(import.meta.url))) {
  main().catch((e) => {
    console.error(`[quartz-sync] ${e instanceof SyncError ? e.message : e.stack || e}`)
    if (process.argv.includes("--hook")) {
      console.error(
        "[quartz-sync] Commit blocked. Fix the cause and commit again. To commit once without " +
          "exporting: git commit --no-verify",
      )
    }
    process.exit(1)
  })
}
