/*
 * Shared state for the reviewer gate (track-note-edits.js, review-receipt.js, enforce-review.js).
 *
 * State lives in .claude/state/review.json (gitignored, per machine):
 *   receipts: { "<Vault/...md>": { hash, verdict, at } }  — a reviewed version of a note
 *   sessions: { "<session id>": { at, notes: ["Vault/...md"] } } — notes an agent edited
 *
 * A receipt is bound to the note's content hash, so any later edit voids it. The `status:` and
 * `publish:` frontmatter lines are left out of the hash: flipping a reviewed note to `done` or
 * publishing it must not void the review.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

export const VERDICTS = ["PUBLISH-READY", "FIXES-APPLIED"];
const MAX_SESSIONS = 30;

export function projectRoot(payload = {}) {
  return resolve(process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd());
}

/** Repo-relative POSIX path, or null when the file is outside the repo. */
export function toRepoPath(root, filePath) {
  if (!filePath) return null;
  const abs = isAbsolute(filePath) ? filePath : resolve(root, filePath);
  const rel = relative(root, abs).replace(/\\/g, "/");
  if (!rel || rel.startsWith("../") || isAbsolute(rel)) return null;
  return rel;
}

/** Concept notes only: Markdown under Vault/, not folder-notes/dashboards, not templates. */
export function isConceptNote(repoPath) {
  if (!repoPath || !repoPath.startsWith("Vault/")) return false;
  if (!repoPath.toLowerCase().endsWith(".md")) return false;
  if (repoPath.startsWith("Vault/Templates/") || repoPath.startsWith("Vault/.obsidian/")) return false;
  return !/(^|\/)index\.md$/i.test(repoPath);
}

export function noteHash(root, repoPath) {
  const abs = join(root, repoPath);
  if (!existsSync(abs)) return null;
  const text = readFileSync(abs, "utf8").replace(/\r\n/g, "\n");
  const fm = /^---\n[\s\S]*?\n---\n/.exec(text);
  const stable = fm
    ? fm[0].replace(/^(status|publish):.*\n/gm, "") + text.slice(fm[0].length)
    : text;
  return createHash("sha256").update(stable).digest("hex");
}

const statePath = (root) => join(root, ".claude", "state", "review.json");

export function readState(root) {
  try {
    const s = JSON.parse(readFileSync(statePath(root), "utf8"));
    return { receipts: s.receipts || {}, sessions: s.sessions || {} };
  } catch {
    return { receipts: {}, sessions: {} };
  }
}

export function writeState(root, state) {
  const ids = Object.keys(state.sessions).sort(
    (a, b) => (state.sessions[b].at || 0) - (state.sessions[a].at || 0),
  );
  for (const id of ids.slice(MAX_SESSIONS)) delete state.sessions[id];
  const p = statePath(root);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(state, null, 2) + "\n");
}

/** Notes this session edited whose current text has no matching receipt. */
export function pendingReviews(root, sessionId) {
  const state = readState(root);
  const notes = state.sessions[sessionId]?.notes || [];
  return notes.filter((n) => {
    const hash = noteHash(root, n);
    if (hash === null) return false; // deleted or renamed away — nothing left to review
    return state.receipts[n]?.hash !== hash;
  });
}

export function readStdin() {
  return new Promise((done) => {
    let d = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => done(d));
    process.stdin.on("error", () => done(d));
    setTimeout(() => done(d), 2000);
  });
}
