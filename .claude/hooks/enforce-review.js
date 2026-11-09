#!/usr/bin/env node
/*
 * Stop hook: the turn cannot end while a concept note this session edited has no reviewer
 * receipt for its current text. Turns the "review before commit" rule into a mechanical gate.
 *
 * On the re-entered Stop (stop_hook_active) it lets go, so a broken state file can never trap
 * the session in a loop; the first block is the enforcement.
 */
import { pendingReviews, projectRoot, readStdin } from "./review-state.js";

try {
  const raw = await readStdin();
  const payload = raw.trim() ? JSON.parse(raw) : {};
  if (payload.stop_hook_active !== true && payload.session_id) {
    const pending = pendingReviews(projectRoot(payload), payload.session_id);
    if (pending.length) {
      const list = pending.map((n) => `"${n}"`).join(" ");
      process.stdout.write(
        JSON.stringify({
          decision: "block",
          reason:
            `Reviewer gate: no receipt for the current text of ${pending.join(", ")}. ` +
            "Run the reviewer subagent on each note, apply every must-fix, then record it: " +
            `node .claude/hooks/review-receipt.js --verdict PUBLISH-READY|FIXES-APPLIED ${list}`,
        }),
      );
    }
  }
} catch {
  // never trap the session on a hook bug
}
process.exit(0);
