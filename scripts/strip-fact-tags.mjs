#!/usr/bin/env node
// Remove the pipeline's fact tags ([F12], [F3, F7]) from a draft and write the clean note.
//   node scripts/strip-fact-tags.mjs <draft.md> <note.md>
// Exits 1 if a tag-like leftover remains, so a malformed tag never reaches the vault.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import path from "node:path"

const [src, dest] = process.argv.slice(2)
if (!src || !dest) {
  console.error("Usage: strip-fact-tags.mjs <draft.md> <note.md>")
  process.exit(1)
}

const TAG = /[ \t]*\[F\d+(?:\s*,\s*F\d+)*\]/g
const draft = readFileSync(src, "utf8")
const count = (draft.match(TAG) || []).length
const clean = draft.replace(TAG, "")

const leftover = clean.match(/\[F\d+[^\]]*\]/g)
if (leftover) {
  console.error(`Malformed fact tags left: ${[...new Set(leftover)].join(", ")}`)
  process.exit(1)
}

mkdirSync(path.dirname(dest), { recursive: true })
writeFileSync(dest, clean)
console.log(`Removed ${count} fact tag(s) → ${dest}`)
