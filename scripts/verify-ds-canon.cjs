#!/usr/bin/env node

// Design-system canon guard (issue #1276).
//
// The living style guide (`src/app/dev/design-system*`) must be canon: it should
// render the REAL production components so the guide and the app move together,
// with styling defined in production so it flows downstream. The app must never be
// the de-facto canon. This guards both halves of that:
//
//   1. No guide-local skinning — the guide must not re-skin a real primitive with
//      guide-local classes (component-specific *ClassName props), which makes the
//      guide look right while the app's own component ships unstyled. (#1316)
//   2. Full coverage — every production primitive (src/components/ui/*) must be
//      represented in the living style guide. If the app uses a primitive the guide
//      doesn't render, the app has become the canon source. (#1317)
//
// Existing violations are grandfathered in `.ds-canon-baseline.json` (mirrors the
// .skott-baseline.json pattern). The guard fails only on NEW violations, so it
// prevents future drift without blocking on the existing retro-fix. Shrink the
// baseline as canon work moves styling/coverage downstream.

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = process.cwd();
const GUIDE_GLOB = 'src/app/dev/design-system*/**/*.{ts,tsx}';
const PRIMITIVES_GLOB = 'src/components/ui/*.tsx';
const BASELINE_PATH = path.join(ROOT, '.ds-canon-baseline.json');

// Component-specific styling props — present only on DS primitives, never on raw HTML.
const SKIN_PROPS = [
  'overlayClassName',
  'contentClassName',
  'panelClassName',
  'footerClassName',
  'headerClassName',
  'wrapperClassName',
  'bodyClassName',
];
const skinRe = new RegExp(`\\b(${SKIN_PROPS.join('|')})\\s*=\\s*["']([^"']*)["']`, 'g');

function loadBaseline() {
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

const baseline = loadBaseline();
const baselineSkin = new Set(baseline.skinning || []);
const baselineCoverage = new Set(baseline.coverageGaps || []);
const coverageExceptions = baseline.coverageExceptions || {};

const guideFiles = glob.sync(GUIDE_GLOB, { cwd: ROOT, absolute: true, nodir: true });

// --- Check 1: guide-local skinning -----------------------------------------
const skinViolations = [];
for (const file of guideFiles) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const relPath = path.relative(ROOT, file);
  content.split('\n').forEach((lineText, i) => {
    let m;
    skinRe.lastIndex = 0;
    while ((m = skinRe.exec(lineText)) !== null) {
      const [, prop, value] = m;
      const key = `${relPath}::${prop}::${value}`;
      if (!baselineSkin.has(key)) skinViolations.push({ relPath, prop, value, line: i + 1 });
    }
  });
}

// --- Check 2: coverage -------------------------------------------------------
const primitiveFiles = glob.sync(PRIMITIVES_GLOB, { cwd: ROOT, absolute: true, nodir: true });
const primitives = primitiveFiles
  .map((f) => path.basename(f, '.tsx'))
  .filter((name) => !name.endsWith('.test'));

const guideImports = new Set();
const importRe = /@\/components\/ui\/([A-Za-z0-9-]+)/g;
for (const file of guideFiles) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
  let m;
  while ((m = importRe.exec(content)) !== null) guideImports.add(m[1]);
}

const coverageViolations = [];
for (const name of primitives) {
  if (guideImports.has(name)) continue;            // represented in the guide
  if (coverageExceptions[name]) continue;          // documented non-visual exception
  if (baselineCoverage.has(name)) continue;        // grandfathered gap (tracked)
  coverageViolations.push(name);
}

// --- Report ------------------------------------------------------------------
let failed = false;

if (skinViolations.length > 0) {
  failed = true;
  console.error('Canon violation — guide-local primitive skinning:');
  console.error('The living style guide must render real components; style them in production (so the app inherits), not here.\n');
  for (const v of skinViolations) console.error(` - ${v.relPath}:${v.line} — ${v.prop}="${v.value}"`);
  console.error('');
}

if (coverageViolations.length > 0) {
  failed = true;
  console.error('Canon violation — production primitive(s) not represented in the living style guide:');
  console.error('Every src/components/ui/* primitive must appear in the guide, or the app becomes the canon source.\n');
  for (const name of coverageViolations) console.error(` - ${name} (src/components/ui/${name}.tsx) — render it in src/app/dev/design-system*`);
  console.error('\nIf it is a non-visual behavior/utility wrapper, add it to "coverageExceptions" in .ds-canon-baseline.json with a reason.');
}

if (failed) {
  console.error('\nSee #1276 (canon flows downstream), #1316, #1317.');
  process.exit(1);
}

const skinN = baselineSkin.size;
const gapN = baselineCoverage.size;
const excN = Object.keys(coverageExceptions).length;
console.log(`DS canon OK — ${primitives.length} primitives checked (${gapN} grandfathered coverage gap(s), ${excN} exception(s)); ${skinN} grandfathered skin(s) within baseline.`);
