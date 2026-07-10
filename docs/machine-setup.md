# Restoring on a new machine (or after a Windows reinstall)

Everything except three things lives in this git repo (notes, Obsidian config + plugins, Quartz,
Claude automation, the auto-publish scripts). The three that do **not** and must be redone by hand:

- installed programs (Node, Git, Obsidian),
- the Quartz Syncer **GitHub token** (a secret — never committed),
- toggles inside Obsidian's GUI (trust/enable plugins, enable the `notion` CSS snippet, Syncer
  "Include all properties", a Set Cover hotkey — all in step 3).

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
2. If prompted, **trust the author / enable community plugins** (they're already in the repo — nothing
   to reinstall). Make sure **Banners** is enabled (it renders the covers).
3. **Settings → Appearance → CSS snippets** → enable **`notion`** (the Notion theme + palette).
4. **Settings → Quartz Syncer → Git**: paste a **GitHub Personal Access Token** (fine-grained,
   permission *Contents: Read and write*). Also turn **ON "Include all properties"** so
   `banner`/`color`/`status`/`icon` survive publishing.
5. (Optional) **Settings → Templater → Template Hotkeys** → bind a key to **Set Cover** (the cover picker).
6. (Optional, only for manual CLI publishing) **Settings → General → Advanced → Command line interface** → on.

## 4. Publishing (manual)

Publish from Obsidian's **Quartz Syncer → Publication Center** (or the Syncer CLI). Before publishing a
note that has a cover, run `node scripts/sync-banners.mjs` — it mirrors cover images into `content/`
so they reach the site build.

> [!note] Auto-publish is disabled
> The watcher (`scripts/watch-publish.mjs`, run on startup by the Shell commands plugin) raced with
> manual edits and wedged Syncer, so it's off. Kill-switch: `scripts/.autopublish-disabled` — delete
> it to re-enable. Tracked in [issue #1](https://github.com/M1re/EngineeringVault/issues/1).

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
