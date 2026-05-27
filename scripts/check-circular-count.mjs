#!/usr/bin/env node
// Runs skott against the app entrypoint and fails if the circular-dependency
// count exceeds the checked-in baseline in `.skott-baseline.json`. Used by
// the `skott:check` npm script and the `skott` CI job (see `.github/workflows/ci.yml`).
//
// If you intentionally accept a new cycle (e.g. the StoreEventBus pattern),
// re-run this script and copy the reported count into `.skott-baseline.json`.

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const baselinePath = resolve(repoRoot, '.skott-baseline.json');

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const limit = baseline.maxCircularDependencies;

if (typeof limit !== 'number' || !Number.isFinite(limit) || limit < 0) {
  console.error(`Invalid baseline in ${baselinePath}: expected { maxCircularDependencies: <number> }`);
  process.exit(2);
}

const args = [
  'skott',
  '--showCircularDependencies',
  '--displayMode=raw',
  '--tsconfig=./tsconfig.json',
  '--ignorePattern=**/*.test.*',
  '--ignorePattern=**/*.stories.*',
  '--ignorePattern=**/__tests__/**',
  '--exitCodeOnCircularDependencies=0',
  'src/app/layout.tsx',
];

const child = spawn('npx', args, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'inherit'] });

let stdout = '';
child.stdout.on('data', (chunk) => {
  stdout += chunk.toString('utf8');
});

child.on('error', (err) => {
  console.error('Failed to spawn skott:', err.message);
  process.exit(2);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`skott exited with code ${code}`);
    process.stdout.write(stdout);
    process.exit(2);
  }

  // skott prints e.g. `✖ (17) circular dependencies found` on the final line
  // when cycles exist; absence of the line means zero cycles.
  const match = stdout.match(/\((\d+)\)\s+circular dependencies found/);
  const count = match ? Number.parseInt(match[1], 10) : 0;

  if (count > limit) {
    console.error(
      `Cycle count regressed: ${count} circular dependencies (baseline ${limit}).\n` +
        `Run \`npm run skott:circular\` to inspect which loop is new, then either fix it\n` +
        `or, if it's a deliberate addition like StoreEventBus, bump\n` +
        `\`.skott-baseline.json\` to ${count} and leave a note in the commit message.`
    );
    process.stdout.write(stdout);
    process.exit(1);
  }

  if (count < limit) {
    // Lowering happens organically — not an error, just a heads-up that the
    // baseline is now loose. Bumping is optional; tightening is on the
    // next person who runs `skott:check` after a refactor that drops cycles.
    console.log(
      `Cycle count is ${count} (baseline ${limit}). Consider lowering the baseline.`
    );
    process.exit(0);
  }

  console.log(`Cycle count holds at ${count} (baseline ${limit}).`);
  process.exit(0);
});
