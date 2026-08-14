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

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Turn a snapshot name literal into a matcher tested against committed PNGs.
//
// Playwright appends a `-<browser>-<platform>` suffix before `.png`, so a
// baseline for name `n` is `<n minus .png>-chromium-darwin.png`. The matcher
// is therefore anchored at the start but open at the end (prefix semantics,
// matching the original file.startsWith check).
//
// For template literals, each `${...}` becomes a single dash-free wildcard
// ([^-]+) rather than truncating the whole name to its static prefix. That
// preserves the static suffix, so a removed variant still gets pruned -- e.g.
// `scene-status-${theme}-desktop.png` matches `scene-status-ds1-desktop-...`
// but NOT a stale `scene-status-retired-layout-...`.
//
// [^-]+ matches one dash-free segment. Where an interpolated value can contain
// dashes (e.g. manuscript `${state.id}` = `drawer-character`), it spans more
// than one segment -- but in the suite today such values are only ever
// followed by another interpolation or end-of-name, never a static suffix, so
// the open-ended (prefix) matcher still keeps the real baseline. The only way
// [^-]+ could wrongly prune a real baseline is a dash-containing value placed
// immediately before a static suffix; no spec does that.
function nameToMatcher(name) {
  const withoutExt = name.replace(/\.png$/i, '');
  const staticParts = withoutExt.split(/\$\{[^}]*\}/);
  const pattern = '^' + staticParts.map(escapeRegExp).join('[^-]+');
  return new RegExp(pattern);
}

// Extract expected snapshot name matchers from a spec file.
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
function extractScreenshotMatchers(source) {
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
      names.add(m[2]);
    }
  }
  return Array.from(names).map(nameToMatcher);
}

// Remove a snapshot directory's PNGs (optionally all of them) and the dir if
// it ends up empty. Returns the number of files deleted.
function removePngs(snapshotDir, shouldDelete) {
  let deleted = 0;
  const entries = fs.readdirSync(snapshotDir, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const file = ent.name;
    if (!file.toLowerCase().endsWith('.png')) continue;
    if (!shouldDelete(file)) continue;
    const full = path.join(snapshotDir, file);
    try {
      fs.unlinkSync(full);
      deleted++;
      console.log(`Pruned orphan snapshot: ${path.relative(ROOT, full)}`);
    } catch (e) {
      console.warn(`Failed to delete ${full}: ${e.message}`);
    }
  }

  // Remove directory if now empty
  const remaining = fs.readdirSync(snapshotDir).filter((n) => n !== '.gitkeep');
  if (remaining.length === 0) {
    try {
      fs.rmdirSync(snapshotDir);
      console.log(`Removed empty snapshot dir: ${path.relative(ROOT, snapshotDir)}`);
    } catch {}
  }
  return deleted;
}

// Snapshot dirs whose sibling spec was deleted entirely. The per-spec loop
// below never visits these (it iterates specs, not dirs), so a fully-removed
// spec leaves its baselines stranded forever. Prune the whole dir.
function pruneOrphanDirs() {
  const snapshotDirs = glob.sync('**/*.spec.ts-snapshots', {
    cwd: VISUAL_DIR,
    absolute: true,
  });
  let deleted = 0;
  for (const dir of snapshotDirs) {
    const siblingSpec = dir.replace(/-snapshots$/, '');
    if (fs.existsSync(siblingSpec)) continue;
    console.log(`Orphan snapshot dir (no sibling spec): ${path.relative(ROOT, dir)}`);
    deleted += removePngs(dir, () => true);
  }
  return deleted;
}

function pruneSnapshots() {
  const specFiles = glob.sync('**/*.spec.ts', { cwd: VISUAL_DIR, absolute: true });
  let deleted = pruneOrphanDirs();
  let checked = 0;

  for (const specPath of specFiles) {
    // Build expected snapshot matchers for this spec
    const source = fs.readFileSync(specPath, 'utf8');
    const expectedMatchers = extractScreenshotMatchers(source);

    const snapshotDir = `${specPath}-snapshots`;
    if (!fs.existsSync(snapshotDir)) continue;

    checked += fs
      .readdirSync(snapshotDir)
      .filter((n) => n.toLowerCase().endsWith('.png')).length;

    // Keep a PNG only if some expected matcher accepts its name.
    deleted += removePngs(
      snapshotDir,
      (file) => !expectedMatchers.some((re) => re.test(file))
    );
  }

  console.log(`Snapshot prune complete. Checked ${checked} files, deleted ${deleted}.`);
}

pruneSnapshots();
