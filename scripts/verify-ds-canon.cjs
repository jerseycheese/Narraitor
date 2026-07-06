#!/usr/bin/env node

// Storybook canon guard (issue #1484; supersedes the living-style-guide guard
// of #1276 — see ADR-012).
//
// Storybook is the single canonical, backend-free view of the frontend. Every
// in-scope component must appear in a story under `src/stories/**`, or it can
// drift with nothing catching it. Scope is `componentScope` from the baseline:
// nested `ui/**`, the whole `shared/**` presentational layer, and an explicit
// domain allowlist of presentational cards/portraits/displays. Coverage is
// matched by import-path segments, so it works across nested/shared/domain dirs,
// not just `@/components/ui/<name>`.
//
// Existing gaps are grandfathered in `.ds-canon-baseline.json` (mirrors the
// .skott-baseline.json pattern). The guard fails only on NEW uncovered
// components, so it prevents future drift without blocking on existing gaps.
//
// History: the living style guide (`src/app/dev/design-system*`) was retired in
// #1488; its skinning and guide-coverage checks went with it. The pure matching
// logic lives in ./ds-canon-lib.cjs (unit-tested in scripts/__tests__).

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const {
  dedupeByName,
  collectComponentImportSegments,
  findUncovered,
} = require('./ds-canon-lib.cjs');

const ROOT = process.cwd();
// Match Storybook's configured story patterns (.storybook/main.cjs) so a
// component covered by a .stories.{js,jsx,ts,tsx} or .mdx story isn't falsely
// flagged as missing.
const STORIES_GLOBS = [
  'src/stories/**/*.stories.{js,jsx,ts,tsx}',
  'src/stories/**/*.mdx',
];
const BASELINE_PATH = path.join(ROOT, '.ds-canon-baseline.json');

function loadBaseline() {
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

const baseline = loadBaseline();
const coverageExceptions = baseline.coverageExceptions || {};
const baselineStorybook = new Set(baseline.storybookGaps || []);

// --- Storybook coverage -----------------------------------------------------
// In-scope set = componentScope.globs (nested ui/** + shared/**) plus the
// explicit domain allowlist. A component is covered when some story imports a
// module path whose segments include the component's name.
const scope = baseline.componentScope || {};
const scopeGlobs = scope.globs || [];
const domainAllowlist = scope.domainAllowlist || [];

const scopeFiles = scopeGlobs
  .flatMap((g) => glob.sync(g, { cwd: ROOT, nodir: true }))
  .concat(domainAllowlist);
const inScopeByName = dedupeByName(scopeFiles); // name -> relPath
const inScopeNames = [...inScopeByName.keys()];

const storyFiles = STORIES_GLOBS.flatMap((g) =>
  glob.sync(g, { cwd: ROOT, nodir: true }),
);
const storyContents = storyFiles.map((f) => {
  try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { return ''; }
});
const coveredNames = collectComponentImportSegments(storyContents);

const storybookViolations = findUncovered(inScopeNames, coveredNames, {
  exceptions: coverageExceptions,
  grandfathered: baselineStorybook,
}).map((name) => ({ name, file: inScopeByName.get(name) }));

// --- Report ------------------------------------------------------------------
if (storybookViolations.length > 0) {
  console.error('Canon violation — in-scope component(s) without a Storybook story:');
  console.error('Storybook is the canon surface (ADR-012). Every in-scope component (componentScope in .ds-canon-baseline.json) must appear in a story under src/stories/**, or it can drift uncaught.\n');
  for (const v of storybookViolations) console.error(` - ${v.name} (${v.file}) — add a story under src/stories/**`);
  console.error('\nIf it is a non-visual behavior/utility wrapper, add it to "coverageExceptions" in .ds-canon-baseline.json with a reason.');
  console.error('\nSee #1484 (Storybook = canon) and ADR-012.');
  process.exit(1);
}

const sbN = baselineStorybook.size;
const excN = Object.keys(coverageExceptions).length;
console.log(
  `Storybook canon OK — ${inScopeNames.length} in-scope component(s) checked ` +
  `(${sbN} grandfathered gap(s), ${excN} exception(s)).`,
);
