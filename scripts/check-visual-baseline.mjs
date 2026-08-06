#!/usr/bin/env node

/**
 * Visual baseline governance -- CLI.
 *
 * Advisory check for a PR that changes both application source and a visual
 * test snapshot: that combination is often legitimate (a layout fix regens
 * its own baseline), but it's also exactly how an unnoticed regression gets
 * blessed as the new expected screenshot. This surfaces the case loudly
 * instead of deciding it -- same non-blocking posture as scripts/audit-css.mjs.
 *
 * What it flags:
 *  - The diff touches src/** and a *-snapshots/*.png in the same PR.
 *  - A changed snapshot whose filename never appears in the PR body, i.e.
 *    nobody wrote down what produced it.
 *
 * Exit code is always 0 -- this never fails the build. The pure logic lives
 * in ./visual-baseline-check.js (unit-tested in isolation).
 *
 * Run: npm run test:visual:check-baselines
 */

import { execFileSync } from 'node:child_process';
import {
  getChangedSnapshots,
  hasMixedChange,
  findUndocumentedSnapshots,
} from './visual-baseline-check.js';

const baseRef = process.env.BASE_REF || 'origin/develop';
const prBody = process.env.PR_BODY || '';

function getChangedFiles(base) {
  try {
    const output = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
      encoding: 'utf8',
    });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error(`Could not diff against ${base}: ${error.message}`);
    return [];
  }
}

const changedFiles = getChangedFiles(baseRef);
const changedSnapshots = getChangedSnapshots(changedFiles);

if (changedSnapshots.length === 0) {
  console.log('No visual baseline changes in this diff.');
  process.exit(0);
}

if (hasMixedChange(changedFiles)) {
  console.log(
    '::warning::This PR changes source (src/**) and visual baselines together. ' +
      "Confirm each baseline change is intentional and listed in the PR's Visual Baseline Changes section."
  );
}

const undocumented = findUndocumentedSnapshots(changedSnapshots, prBody);
for (const snapshotPath of undocumented) {
  const filename = snapshotPath.split('/').pop();
  console.log(
    `::warning::Baseline "${filename}" changed but isn't mentioned in the PR body. ` +
      'Add a line to the Visual Baseline Changes section explaining what produced it.'
  );
}

if (undocumented.length === 0) {
  console.log(`All ${changedSnapshots.length} changed baseline(s) are documented in the PR body.`);
}

process.exit(0);
