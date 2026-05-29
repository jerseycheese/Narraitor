#!/usr/bin/env node

// Showcase-canon guard (issue #1276).
//
// The DS showcase (`src/app/dev/design-system*`) is meant to be canon: it should
// render the REAL production components so the showcase and the app move together.
// The failure mode this guards against is the showcase re-skinning a real primitive
// with showcase-local classes — that makes the showcase look right while the app's
// own component ships unstyled. See #1316 (modals) and #1317 (card/alert/tabs/etc.).
//
// The signal: the design-system primitives expose component-specific className props
// (overlayClassName, contentClassName, panelClassName, footerClassName, ...). Those
// props don't exist on plain HTML, so their use inside the showcase means a real
// primitive is being skinned showcase-locally instead of styled in production.
//
// Known existing violations are grandfathered in `.showcase-canon-baseline.json`
// (mirrors the .skott-baseline.json pattern). This guard fails only on NEW skinning,
// so it prevents future drift without blocking on the existing retro-fix.

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = process.cwd();
const SHOWCASE_GLOB = 'src/app/dev/design-system*/**/*.{ts,tsx}';
const BASELINE_PATH = path.join(ROOT, '.showcase-canon-baseline.json');

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

const propRe = new RegExp(
  `\\b(${SKIN_PROPS.join('|')})\\s*=\\s*["']([^"']*)["']`,
  'g'
);

function loadBaseline() {
  try {
    const raw = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    return new Set(raw.allowed || []);
  } catch {
    return new Set();
  }
}

function keyFor(relPath, prop, value) {
  return `${relPath}::${prop}::${value}`;
}

const files = glob.sync(SHOWCASE_GLOB, { cwd: ROOT, absolute: true, nodir: true });
const baseline = loadBaseline();

const current = new Map(); // key -> { relPath, prop, value, line }
for (const file of files) {
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const relPath = path.relative(ROOT, file);
  const lines = content.split('\n');
  lines.forEach((lineText, i) => {
    let m;
    propRe.lastIndex = 0;
    while ((m = propRe.exec(lineText)) !== null) {
      const [, prop, value] = m;
      current.set(keyFor(relPath, prop, value), { relPath, prop, value, line: i + 1 });
    }
  });
}

const violations = [];
for (const [key, info] of current) {
  if (!baseline.has(key)) violations.push(info);
}

if (violations.length > 0) {
  console.error('Showcase-canon violation: real primitives are being skinned with showcase-local classes.');
  console.error('The DS showcase must render real components; style them in production (so the app inherits), not here.');
  console.error('See #1276 (canon flows downstream), #1316, #1317.\n');
  for (const v of violations) {
    console.error(` - ${v.relPath}:${v.line} — ${v.prop}="${v.value}"`);
  }
  console.error('\nIf this styling is genuinely intentional, move it to the production component, or');
  console.error('(only for grandfathered debt) add the key to .showcase-canon-baseline.json with a tracking issue.');
  process.exit(1);
}

console.log(`Showcase-canon OK (${current.size} grandfathered skin-prop use(s) within baseline).`);
