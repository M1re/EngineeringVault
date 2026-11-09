#!/usr/bin/env node
/*
 * PostToolUse hook (Edit / Write / MultiEdit): remember which concept notes this session edited,
 * so enforce-review.js can require a reviewer receipt for them before the turn ends.
 * Never blocks and never fails the edit.
 */
import { isConceptNote, projectRoot, readState, readStdin, toRepoPath, writeState } from "./review-state.js";

try {
  const raw = await readStdin();
  const payload = raw.trim() ? JSON.parse(raw) : {};
  const root = projectRoot(payload);
  const note = toRepoPath(root, payload.tool_input?.file_path);
  const id = payload.session_id;
  if (id && isConceptNote(note)) {
    const state = readState(root);
    const session = (state.sessions[id] ||= { at: 0, notes: [] });
    session.at = Date.now();
    if (!session.notes.includes(note)) session.notes.push(note);
    writeState(root, state);
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext: `${note} changed; it needs a reviewer pass and a receipt before you finish (see "Reviewer gate" in AGENTS.md).`,
        },
      }),
    );
  }
} catch {
  // a hook bug must never break the edit flow
}
process.exit(0);
