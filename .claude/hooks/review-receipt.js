#!/usr/bin/env node
/*
 * Record that a concept note's CURRENT text passed the reviewer.
 *
 *   node .claude/hooks/review-receipt.js --verdict PUBLISH-READY "Vault/Networks/DNS.md"
 *   node .claude/hooks/review-receipt.js --verdict FIXES-APPLIED "Vault/Networks/DNS.md" ...
 *
 * PUBLISH-READY = the reviewer's own verdict. FIXES-APPLIED = it said NEEDS WORK and every
 * must-fix has now been applied. Run it only after a real reviewer pass on that note.
 */
import { VERDICTS, isConceptNote, noteHash, projectRoot, readState, toRepoPath, writeState } from "./review-state.js";

const args = process.argv.slice(2);
const i = args.indexOf("--verdict");
const verdict = i >= 0 ? args[i + 1] : undefined;
const notes = args.filter((_, k) => k !== i && k !== i + 1);

if (!VERDICTS.includes(verdict) || notes.length === 0) {
  console.error(`Usage: review-receipt.js --verdict ${VERDICTS.join("|")} <note.md> [...]`);
  process.exit(1);
}

const root = projectRoot();
const state = readState(root);
let failed = false;
for (const arg of notes) {
  const note = toRepoPath(root, arg);
  const hash = isConceptNote(note) ? noteHash(root, note) : null;
  if (!hash) {
    console.error(`Rejected (not an existing concept note under Vault/): ${arg}`);
    failed = true;
    continue;
  }
  state.receipts[note] = { hash, verdict, at: new Date().toISOString() };
  console.log(`Recorded ${verdict}: ${note}`);
}
writeState(root, state);
process.exit(failed ? 1 : 0);
