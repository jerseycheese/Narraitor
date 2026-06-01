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

// Extract expected snapshot name prefixes from a spec file.
//
// Handles two ways specs name snapshots, with single quotes, double quotes,
// or backticks:
//   1. Inline:  expect(x).toHaveScreenshot('name.png')
//   2. Via a helper: captureStep(page, prepare, `name-${theme}.png`), where the
//      snapshot name is the last argument and always ends in .png.
//
// Both are anchored on the call site rather than scanning every string literal
// in the file -- prose in header comments (apostrophes, backtick spans) would
// otherwise open phantom literals and desync the scan, silently dropping real
// names.
//
// Template-literal names (e.g. `scene-status-${theme}-desktop.png`) are reduced
// to their static prefix up to the first `${`, so the file.startsWith(base)
// check keeps every interpolated variant. Keeping a prefix only ever broadens
// what survives, so it's strictly safe against deleting a real baseline.
function extractScreenshotNames(source) {
  const names = new Set();
  const patterns = [
    // 1. Direct toHaveScreenshot('name.png') / `name.png` argument.
    /toHaveScreenshot\(\s*(["'`])([^"'`]*?\.png)\1/gi,
    // 2. A quoted .png literal sitting as the final argument of a call
    //    (e.g. captureStep/captureWidget) -- closing quote then ')'.
    /(["'`])([^"'`\n]*?\.png)\1\s*\)/gi,
  ];
  for (const regex of patterns) {
    let m;
    while ((m = regex.exec(source)) !== null) {
      let value = m[2];
      // Reduce template-literal names to their static prefix.
      const interp = value.indexOf('${');
      if (interp !== -1) value = value.slice(0, interp);
      if (value) names.add(value);
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
