#!/usr/bin/env node
// One-command setup for a fresh clone (Windows, macOS, Linux):  npm run setup
//
// 1. checks Node and that this is the repository root;
// 2. installs the locked npm dependencies (npm ci) and the pinned Quartz plugins;
// 3. enables this checkout's Git hooks (.githooks/pre-commit exports the vault on commit);
// 4. points Quartz Syncer at this checkout in local mode and applies the shared defaults
//    (needs Obsidian running with Vault/ open and its command line interface enabled).
//
// Full steps: README.md -> "Setup on a new machine". It never exports, stages, commits or pushes. Running it again is safe.

import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const IS_WINDOWS = process.platform === "win32"

const say = (m) => console.log(`[setup] ${m}`)
function fail(message) {
  console.error(`[setup] ${message}`)
  process.exit(1)
}

function run(cmd, args, label) {
  // npm is a .cmd shim on Windows, which only starts through the shell.
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: IS_WINDOWS && (cmd === "npm" || cmd === "npx") })
  if (r.status !== 0) fail(`${label} failed. Fix the error above and run npm run setup again.`)
}

// 1. prerequisites
const wantedMajor = Number(readFileSync(path.join(ROOT, ".node-version"), "utf8").trim().replace(/^v/, "").split(".")[0])
const haveMajor = Number(process.versions.node.split(".")[0])
if (haveMajor < wantedMajor) {
  fail(`Node ${wantedMajor}+ is required (.node-version); found ${process.version}. Install it: winget install OpenJS.NodeJS.LTS`)
}
const top = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: ROOT, encoding: "utf8" })
if (top.status !== 0) fail("Git not found, or this is not a Git checkout. Install Git (winget install Git.Git) and clone the repo.")
const sameRoot = IS_WINDOWS
  ? path.resolve(top.stdout.trim()).toLowerCase() === ROOT.toLowerCase()
  : path.resolve(top.stdout.trim()) === ROOT
if (!sameRoot) fail("This script must sit in the root of its own Git checkout; refusing to configure a parent repository.")

// 2. dependencies
say("Installing locked npm dependencies (npm ci)...")
run("npm", ["ci"], "npm ci")

say("Installing Quartz plugins pinned in quartz.lock.json...")
run("npx", ["quartz", "plugin", "restore"], "quartz plugin restore")

// 3. git hooks
say("Enabling this checkout's Git hooks (.githooks)...")
run("git", ["config", "--local", "core.hooksPath", ".githooks"], "git config core.hooksPath")

// 4. Quartz Syncer
say("Configuring Quartz Syncer for local export into this checkout...")
const sync = spawnSync(process.execPath, [path.join(ROOT, "scripts", "sync-quartz.mjs"), "--configure-only"], {
  cwd: ROOT,
  stdio: "inherit",
})
if (sync.status !== 0) {
  console.error(`
[setup] Quartz Syncer is not configured yet. Dependencies and Git hooks are already in place.
        Do this, then run npm run setup again:
  1. Open Obsidian -> "Open folder as vault" -> pick ${path.join(ROOT, "Vault")}
  2. Trust the author / enable community plugins (Quartz Syncer, Datacore are bundled).
  3. Settings -> General -> Command line interface: turn it on and accept the registration prompt.
  4. Reopen this terminal so the new "obsidian" command is on PATH.
  Keep Obsidian open while setup runs.`)
  process.exit(1)
}

console.log(`
[setup] Done: dependencies installed, Git hooks enabled, Syncer exports locally to content/.
How publishing works now:
  - write notes in Obsidian; set publish: true on what should go live;
  - commit (Obsidian Git or git commit): the pre-commit hook exports the vault through
    Quartz Syncer and adds content/ to the same commit;
  - push to main: GitHub Actions builds and deploys the site.
Keep Obsidian open and let Datacore finish indexing before you commit notes.
Preview the site locally: npx quartz build --serve  ->  http://localhost:8080`)
