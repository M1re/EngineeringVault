# Restoring on a new machine (or after a Windows reinstall)

Everything except three things lives in this git repo (notes, Obsidian config + plugins, Quartz,
Claude automation, the auto-publish scripts). The three that do **not** and must be redone by hand:

- installed programs (Node, Git, Obsidian),
- the Quartz Syncer **GitHub token** (a secret — never committed),
- toggles inside Obsidian's GUI (enable the CLI, trust plugins).

## 1. Install the programs

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Obsidian.Obsidian
winget install GitHub.cli        # optional, for gh
```

## 2. Get the repo

```powershell
git clone https://github.com/M1re/EngineeringVault.git
cd EngineeringVault
npm install
```

## 3. Set up Obsidian

1. **Open folder as vault** → select `...\EngineeringVault\Vault`.
2. If prompted, **trust the author / enable community plugins** (the plugins themselves are already
   in the repo, so nothing to reinstall).
3. **Settings → General → Advanced → Command line interface** → turn **on** (needed by auto-publish).
4. **Settings → Quartz Syncer → Git**: paste a **GitHub Personal Access Token**
   (fine-grained, permission *Contents: Read and write*).
5. (Optional) **Settings → General → "Open Obsidian on system startup"** — so the watcher always has
   Obsidian to talk to.

## 4. Turn on auto-publish

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1
```

This adds a hidden launcher to your Startup folder. From the next login, editing a `publish: true`
note auto-publishes to the site. (Run it now without logging out: `wscript "scripts\autopublish-launcher.vbs"`.)

## 5. Claude Code

Nothing to restore — `.claude/` (commands, skills, hooks, settings) is in the repo. Just run
`claude` from the repo root. Your personal `settings.local.json` is machine-local (gitignored).

---

## Keeping this machine in sync (git pull)

The repo receives commits from three places: **you/Claude** (structure, scripts), **Quartz Syncer**
(the compiled `content/`), and **GitHub Actions** never writes back. To pull the latest safely:

```powershell
git pull --rebase
```

Use `--rebase` because Syncer and your local edits can diverge on unrelated files; rebase replays
your local commits on top cleanly. If you only ever edit on one machine, plain `git pull` is fine.
