#!/usr/bin/env node
/*
 * PostToolUse hook (Edit / Write / MultiEdit).
 *
 * A tripwire for instruction bloat. When CLAUDE.md or .claude/feedback.md grows past a soft
 * limit, it prints a nudge (surfaced back into the session) telling Claude to run
 * /consolidate-feedback. It ONLY measures and warns — the actual semantic compaction (merging
 * rules, resolving contradictions) is Claude's job; a shell script can't do that intelligently.
 *
 * It never edits the files it watches, so it cannot cause an edit -> hook -> edit loop.
 * Soft limits are overridable via env vars (handy for testing).
 */
import { readFileSync, existsSync } from "node:fs";

const CLAUDE_MAX_LINES = Number(process.env.LEDGER_CLAUDE_MAX || 120);
const ACTIVE_MAX = Number(process.env.LEDGER_ACTIVE_MAX || 25);
const ARCHIVE_MAX = Number(process.env.LEDGER_ARCHIVE_MAX || 40);

function readStdin() {
  return new Promise((resolve) => {
    let d = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => resolve(d));
    setTimeout(() => resolve(d), 2000);
  });
}

const norm = (p) => String(p || "").replace(/\\/g, "/").toLowerCase();

(async () => {
  try {
    const raw = await readStdin();
    if (!raw.trim()) process.exit(0);

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      process.exit(0);
    }

    const fp = norm(payload.tool_input && payload.tool_input.file_path);
    const touchedClaude = fp.endsWith("/claude.md");
    const touchedFeedback = fp.endsWith("/feedback.md");
    if (!touchedClaude && !touchedFeedback) process.exit(0); // only react to the two ledgers

    const cwd = process.cwd();
    const warns = [];

    const claudePath = cwd + "/CLAUDE.md";
    if (existsSync(claudePath)) {
      const lines = readFileSync(claudePath, "utf8").split("\n").length;
      if (lines > CLAUDE_MAX_LINES)
        warns.push(`CLAUDE.md is ${lines} lines (soft limit ${CLAUDE_MAX_LINES}); keep it principle-level.`);
    }

    const fbPath = cwd + "/.claude/feedback.md";
    if (existsSync(fbPath)) {
      const lines = readFileSync(fbPath, "utf8").split("\n");
      let inActive = false, inArchive = false, active = 0, archive = 0;
      for (const ln of lines) {
        if (/^##\s+/.test(ln)) {
          inActive = /active rules/i.test(ln);
          inArchive = /archive|log/i.test(ln);
          continue;
        }
        if (inActive && /^\s*-\s+/.test(ln)) active++;
        if (inArchive && /^###\s+/.test(ln)) archive++;
      }
      if (active > ACTIVE_MAX)
        warns.push(`feedback.md has ${active} active rules (soft limit ${ACTIVE_MAX}); merge duplicates or promote mature rules into a skill/template/hook.`);
      if (archive > ARCHIVE_MAX)
        warns.push(`feedback.md archive has ${archive} entries (soft limit ${ARCHIVE_MAX}); time to consolidate.`);
    }

    if (warns.length) {
      console.error(
        "LEDGER SIZE TRIPWIRE — consider running /consolidate-feedback now:\n  - " +
          warns.join("\n  - ")
      );
      process.exit(2); // surfaces stderr back into the session (the edit already succeeded)
    }
    process.exit(0);
  } catch {
    process.exit(0); // never disrupt the workflow on a hook bug
  }
})();
