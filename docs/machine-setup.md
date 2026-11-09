# Setting up a new machine (Windows first)

Everything lives in this repo (notes, Obsidian config + plugins, Quartz, Claude automation) except
installed programs, your Git identity/GitHub sign-in, and one Obsidian GUI toggle (the CLI). The
`notion` CSS snippet is already enabled by the committed `appearance.json`. One command
(`npm run setup`) does the rest.

## 1. Install the programs

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Obsidian.Obsidian
```

Node must be 22 or newer (`.node-version`). Obsidian must be 1.13 or newer (Quartz Syncer 2.2.0).
On macOS: `brew install node git` and `brew install --cask obsidian`.

## 2. Clone

```powershell
git clone https://github.com/M1re/EngineeringVault.git
cd EngineeringVault
```

Set your Git name/email if this machine has none (`git config --global user.name …`). Git for
Windows signs in to GitHub through its credential manager on the first push.

## 3. Open the vault in Obsidian (once)

1. **Open folder as vault** → select `EngineeringVault\Vault` (not the repo root).
2. **Trust the author / enable community plugins** — they are already in the repo.
3. **Settings → General → Command line interface** → turn it on and accept the registration prompt.
   Then reopen your terminal so the `obsidian` command is on `PATH`.

Keep Obsidian open for the next step.

## 4. Run setup

```powershell
npm run setup
```

> [!tip] "running scripts is disabled on this system"
> Windows PowerShell blocks `npm.ps1` by default. Allow local scripts once for your user:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or call the shim directly: `npm.cmd run setup`.

It installs the locked npm dependencies, enables the repo's Git hooks (`core.hooksPath .githooks`),
and points Quartz Syncer at this checkout in **local mode** with the shared defaults from
`scripts/quartz-syncer.defaults.json` ("Include all properties" included). No GitHub token is
needed. It never exports, commits or pushes. If a step fails it says which; fix it and run it again.

Syncer's own `data.json` is per-machine (it holds the absolute checkout path) and is gitignored.

## 5. Daily flow: commit = publish

1. Write notes in Obsidian; set `publish: true` on what should go live.
2. Commit — from **Obsidian Git** or `git commit`. The pre-commit hook
   (`.githooks/pre-commit` → `scripts/sync-quartz.mjs`) runs only when the commit touches notes in
   `Vault/`. It:
   - refuses if `Vault/` has unstaged/untracked changes (the export reads the disk, so stage all of it);
   - exports through Quartz Syncer via the Obsidian CLI (Datacore dashboards are compiled by the real plugin);
   - removes pages of deleted/unpublished notes, blocks on failed notes or uncompiled Datacore blocks;
   - mirrors covers (`scripts/sync-banners.mjs`) and stages `content/` into the same commit.
3. Push to `main` → GitHub Actions builds and deploys the site.

**Automatic by default.** Obsidian Git's shared settings (`Vault/.obsidian/plugins/obsidian-git/data.json`)
pull on startup and, 10 minutes after your last edit, commit everything, pull (rebase) and push to
the current branch, so steps 2–3 happen on their own while Obsidian is open. The commit still runs
the export hook; if the hook blocks it, Obsidian shows the error. Run **Obsidian Git: Commit-and-sync**
to publish right away. Needs a Git identity on the machine (`git config --global user.name/user.email`).

Export without committing: `npm run export`. Commit once without exporting:
`git commit --no-verify`. Log: `.git/quartz-sync.log`. If Obsidian's CLI is not on `PATH`, set
`OBSIDIAN_BIN` to its full path.

> [!note] Obsidian may be minimized
> Syncer compiles Datacore by rendering it, and Chromium pauses rendering in a minimized or covered
> window. The export therefore turns Obsidian's background throttling off while it runs and back on
> afterwards (via `obsidian eval`). If it logs that it could not, keep the Obsidian window visible
> during the commit, or `publish`/`status` will wait until the deadline.

> [!tip] First export on a fresh clone
> Syncer dates pages from the files' timestamps, so the first export after a clone rewrites the
> `created`/`modified`/`published` lines of every published page. This is expected and happens once.
> Before committing it, check `git diff content/` for body changes: a page published from another
> machine without committing its note would be rolled back to the older note in `Vault/`.

## 6. Claude Code

Nothing to restore — `.claude/` is in the repo. Run `claude` from the repo root. Your personal
`settings.local.json` is machine-local (gitignored).

## Keeping in sync

```powershell
git pull --rebase
```
