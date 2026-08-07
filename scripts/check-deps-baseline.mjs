#!/usr/bin/env node
// Ratchets the dependency-cruiser suppression baseline downward. `deps:validate`
// already fails on violations that aren't in `.dependency-cruiser-known-violations.json`,
// so new debt can't land. This covers the other direction: it fails when a
// baseline entry no longer reproduces, forcing the list to shrink as violations
// get fixed instead of quietly filling up with dead suppressions.
//
// Fix: run `npm run deps:baseline` and commit the smaller file.
//
// Same idea as `check-circular-count.mjs` / `.skott-baseline.json`, one level
// more precise: it compares individual entries rather than a count.

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const baselinePath = resolve(repoRoot, '.dependency-cruiser-known-violations.json');

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));

if (!Array.isArray(baseline)) {
  console.error(`Invalid baseline in ${baselinePath}: expected an array of violations`);
  process.exit(2);
}

const keyOf = (violation) =>
  `${violation.type}|${violation.rule?.name}|${violation.from} -> ${violation.to}`;

const child = spawn('npx', ['depcruise', 'src', '--config', '--output-type', 'json'], {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'inherit'],
});

let stdout = '';
child.stdout.on('data', (chunk) => {
  stdout += chunk.toString('utf8');
});

child.on('error', (err) => {
  console.error('Failed to spawn depcruise:', err.message);
  process.exit(2);
});

child.on('close', () => {
  let current;
  try {
    current = JSON.parse(stdout).summary.violations ?? [];
  } catch {
    console.error('Could not parse depcruise JSON output.');
    process.exit(2);
  }

  const reproducing = new Set(current.map(keyOf));
  const stale = baseline.filter((violation) => !reproducing.has(keyOf(violation)));

  if (stale.length > 0) {
    console.error(
      (stale.length === 1
        ? '1 baseline entry no longer reproduces:\n'
        : `${stale.length} baseline entries no longer reproduce:\n`) +
        stale.map((violation) => `  ${keyOf(violation)}`).join('\n') +
        `\n\nRun \`npm run deps:baseline\` and commit the smaller file.`
    );
    process.exit(1);
  }

  console.log(
    `Baseline holds at ${baseline.length} suppressed violation${baseline.length === 1 ? '' : 's'}, all still reproducing.`
  );
});
