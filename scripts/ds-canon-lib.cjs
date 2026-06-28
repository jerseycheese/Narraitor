// Pure matching logic for the design-system canon guard (issue #1486).
//
// No fs, no glob, no process: every function takes its inputs and returns a
// value, so the scope/coverage logic is unit-testable against fixtures. The CLI
// wrapper (scripts/verify-ds-canon.cjs) does the file I/O and feeds these.
//
// Mirrors the route-validation.js / validate-routes.js split (issue #420).

// A component file is "storyable" (in scope as a standalone catalog entry) only
// if it's a real component module — not a test, a story, or a barrel index.
const NON_COMPONENT_RE = /(\.test\.|\.stories\.|(^|[/\\])index\.)/;

function isStoryableComponentFile(relPath) {
  return !NON_COMPONENT_RE.test(relPath);
}

// The component's identity for coverage matching: its basename without the
// React extension. e.g. 'src/components/shared/cards/ActiveStateCard.tsx' ->
// 'ActiveStateCard'. Matches how the guard has always keyed primitives.
function componentNameFromPath(relPath) {
  const base = relPath.split(/[/\\]/).pop() || relPath;
  return base.replace(/\.(tsx|jsx|ts|js)$/, '');
}

// Every path segment of every `@/components/...` import found in the given file
// contents, as a Set. A story that imports `@/components/shared/Hero` or
// `@/components/shared/cards/ActiveStateCard` contributes 'shared', 'Hero',
// 'cards', 'ActiveStateCard' — so coverage matching works across nested dirs,
// the shared layer, and domain dirs alike (the old guard only matched
// `@/components/ui/<name>`).
function collectComponentImportSegments(contents) {
  const segments = new Set();
  const importRe = /@\/components\/([A-Za-z0-9/_-]+)/g;
  for (const content of contents) {
    let m;
    importRe.lastIndex = 0;
    while ((m = importRe.exec(content)) !== null) {
      for (const seg of m[1].split('/')) if (seg) segments.add(seg);
    }
  }
  return segments;
}

// Given the in-scope component names and the set of names that appear in some
// story, return the names that are genuinely uncovered: not storied, not a
// documented non-visual exception, and not grandfathered. Mirrors the guide
// coverage check so both halves share one rule.
function findUncovered(componentNames, coveredNames, { exceptions = {}, grandfathered = new Set() } = {}) {
  const uncovered = [];
  for (const name of componentNames) {
    if (coveredNames.has(name)) continue;     // has a story
    if (exceptions[name]) continue;            // documented non-visual exception
    if (grandfathered.has(name)) continue;     // tracked baseline gap
    uncovered.push(name);
  }
  return uncovered;
}

// De-duplicate component names across the in-scope file list, preserving the
// first path seen for each (used only for nicer error messages).
function dedupeByName(relPaths) {
  const byName = new Map();
  for (const p of relPaths) {
    if (!isStoryableComponentFile(p)) continue;
    const name = componentNameFromPath(p);
    if (!byName.has(name)) byName.set(name, p);
  }
  return byName;
}

module.exports = {
  isStoryableComponentFile,
  componentNameFromPath,
  collectComponentImportSegments,
  findUncovered,
  dedupeByName,
};
