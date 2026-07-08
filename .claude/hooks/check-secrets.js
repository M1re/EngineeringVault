#!/usr/bin/env node
/*
 * PreToolUse hook for Write/Edit.
 * Scans the text about to be written for high-confidence secrets and personal data.
 * If any are found, it exits with code 2 to BLOCK the write and tells Claude what to fix.
 *
 * Design notes:
 *  - This file is committed to a PUBLIC repo, so it must contain NO personal data itself.
 *    It matches on generic patterns, not on any specific person or company.
 *  - It targets real secrets/PII, not the mere words "password"/"token"/"secret",
 *    so writing ABOUT security concepts is never blocked.
 *  - It fails OPEN on unexpected input (a bug must not brick every write), but fails
 *    CLOSED (blocks) whenever a pattern actually matches.
 */

'use strict';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    // Safety: if no stdin arrives, don't hang forever.
    setTimeout(() => resolve(data), 2000);
  });
}

// [label, regex] — high-signal patterns only.
const PATTERNS = [
  ['Private key block', /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/],
  ['AWS access key id', /\bAKIA[0-9A-Z]{16}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['Stripe secret key', /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_\-]{35}\b/],
  ['Bearer token literal', /\bBearer\s+[A-Za-z0-9._\-]{20,}\b/],
  ['JWT (looks real)', /\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/],
  // Email addresses, but allow the conventional placeholder domains.
  ['Email address', /\b[A-Za-z0-9._%+\-]+@(?!example\.(?:com|org|net)\b)[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/],
  // key = "long-random-value" style assignments
  ['Hardcoded credential assignment', /\b(?:api[_-]?key|secret|passwd|password|token|private[_-]?key)\b\s*[:=]\s*['"][^'"\s]{12,}['"]/i],
];

(async () => {
  try {
    const raw = await readStdin();
    if (!raw.trim()) process.exit(0);

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      process.exit(0); // can't parse -> don't block
    }

    const ti = payload.tool_input || {};
    // Gather text depending on the tool.
    let text = '';
    if (typeof ti.content === 'string') text += ti.content + '\n';
    if (typeof ti.new_string === 'string') text += ti.new_string + '\n';
    if (Array.isArray(ti.edits)) {
      for (const e of ti.edits) if (e && typeof e.new_string === 'string') text += e.new_string + '\n';
    }
    if (!text.trim()) process.exit(0);

    const hits = [];
    for (const [label, rx] of PATTERNS) {
      const m = text.match(rx);
      if (m) hits.push(`${label}: "${String(m[0]).slice(0, 40)}${m[0].length > 40 ? '…' : ''}"`);
    }

    if (hits.length) {
      const file = ti.file_path || '(unknown file)';
      console.error(
        'BLOCKED by check-secrets hook — this repo is PUBLIC.\n' +
          `File: ${file}\n` +
          'Possible secret / personal data found:\n  - ' +
          hits.join('\n  - ') +
          '\n\nRemove or replace these (use placeholders like user@example.com or <REDACTED>) before writing.'
      );
      process.exit(2); // block the tool call
    }

    process.exit(0);
  } catch {
    process.exit(0); // never brick the workflow on a hook bug
  }
})();
