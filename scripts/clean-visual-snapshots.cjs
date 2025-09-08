#!/usr/bin/env node

// Prune orphaned Playwright visual snapshot images.
// - Scans tests/visual/**/*.spec.ts for explicit toHaveScreenshot('name.png') calls
// - Builds an allowlist of expected base names (without browser/platform suffixes)
// - For each spec's snapshot folder (<spec>.spec.ts-snapshots/), deletes PNGs
//   that do not start with any expected base name for that spec.
// - Removes empty snapshot folders after pruning.

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = process.cwd();
const VISUAL_DIR = path.join(ROOT, 'tests', 'visual');

// Extract explicit screenshot names from a spec file.
// Supports both single and double quotes.
function extractScreenshotNames(source) {
  const names = new Set();
  const regex = /toHaveScreenshot\(\s*(["'])\s*([^\s"']+?)\s*\1/gm;
  let m;
  while ((m = regex.exec(source)) !== null) {
    const file = m[2];
    if (file && file.toLowerCase().endsWith('.png')) {
      names.add(file);
    }
  }
  return Array.from(names);
}

function pruneSnapshots() {
  const specFiles = glob.sync('**/*.spec.ts', { cwd: VISUAL_DIR, absolute: true });
  let deleted = 0;
  let checked = 0;

  for (const specPath of specFiles) {
    // Build expected base names for this spec
    const source = fs.readFileSync(specPath, 'utf8');
    const expectedFiles = extractScreenshotNames(source);
    const expectedBases = expectedFiles.map((f) => f.replace(/\.png$/i, ''));

    const snapshotDir = `${specPath}-snapshots`;
    if (!fs.existsSync(snapshotDir)) continue;

    const entries = fs.readdirSync(snapshotDir, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isFile()) continue;
      const file = ent.name;
      if (!file.toLowerCase().endsWith('.png')) continue;

      const keep = expectedBases.some((base) => file.startsWith(base));
      checked++;
      if (!keep) {
        const full = path.join(snapshotDir, file);
        try {
          fs.unlinkSync(full);
          deleted++;
          // eslint-disable-next-line no-console
          console.log(`Pruned orphan snapshot: ${path.relative(ROOT, full)}`);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`Failed to delete ${full}: ${e.message}`);
        }
      }
    }

    // Remove directory if now empty
    const remaining = fs.readdirSync(snapshotDir).filter((n) => n !== '.gitkeep');
    if (remaining.length === 0) {
      try {
        fs.rmdirSync(snapshotDir);
        // eslint-disable-next-line no-console
        console.log(`Removed empty snapshot dir: ${path.relative(ROOT, snapshotDir)}`);
      } catch {}
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Snapshot prune complete. Checked ${checked} files, deleted ${deleted}.`);
}

pruneSnapshots();
