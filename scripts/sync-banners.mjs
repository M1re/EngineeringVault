// Mirror Vault/attachments -> content/attachments.
//
// Cover images / GIFs are referenced only in the `banner` frontmatter field,
// which Quartz Syncer does NOT treat as an embed — so it never copies them to
// content/. This script mirrors the attachments folder so covers reach the site
// build. Run it before publishing:
//
//   node scripts/sync-banners.mjs
//
import { cpSync, existsSync, mkdirSync } from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const src = path.join(REPO, "Vault", "attachments")
const dst = path.join(REPO, "content", "attachments")

if (!existsSync(src)) {
  console.log("Nothing to do: Vault/attachments does not exist.")
  process.exit(0)
}

mkdirSync(dst, { recursive: true })
cpSync(src, dst, { recursive: true })
console.log("Mirrored Vault/attachments -> content/attachments")
