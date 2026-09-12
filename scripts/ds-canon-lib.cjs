// Pure matching logic for the design-system canon guard (issue #1486).
//
// No fs, no glob, no process: every function takes its inputs and returns a
// value, so the scope/coverage logic is unit-testable against fixtures. The CLI
// wrapper (scripts/verify-ds-canon.cjs) does the file I/O and feeds these.
//
// Mirrors the route-validation.js / validate-routes.js split (issue #420).

const ts = require('typescript');

// Task-advancing / navigation verbs. These move the player through the app, so
// they belong on default, outline or secondary — never on success (#2083).
const TASK_VERB_RE = /\b(?:Play|Continue|Start|Create|Begin)\b|\bNew\s+Story\b/i;

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

// The success-verb check polices product surfaces. Tests assert the wrong
// variants on purpose, and the "Wrong…" anti-pattern stories have to render a
// green Play for the rule to be legible, so both are out of scope.
function isProductActionFile(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (normalized.includes('__tests__') || normalized.includes('.test.')) return false;
  if (normalized.startsWith('src/stories/') || normalized.includes('.stories.')) return false;
  return true;
}

function getStringLiteralValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return null;
}

function getPropertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return null;
}

function getJsxAttributeValue(attribute) {
  if (!attribute.initializer) return null;
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
  if (ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression) {
    return getStringLiteralValue(attribute.initializer.expression);
  }
  return null;
}

// The visible label of a button: its JSX text plus any string literals its
// children render. Icons are self-closing elements and contribute nothing, so
// <Button variant="success"><Play />Play</Button> still reads as "Play".
function collectRenderedStrings(node, values) {
  if (ts.isJsxText(node)) {
    const value = node.text.trim();
    if (value) values.push(value);
    return;
  }

  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
    for (const child of node.children) collectRenderedStrings(child, values);
    return;
  }

  if (ts.isJsxSelfClosingElement(node)) return;

  const literalValue = getStringLiteralValue(node);
  if (literalValue) {
    values.push(literalValue);
    return;
  }

  ts.forEachChild(node, (child) => collectRenderedStrings(child, values));
}

// Returns the labels of every success-variant action whose label is a task verb,
// across all three action APIs: a direct <Button variant="success">, an
// ActionButtonGroup action ({ variant, label }) and a CardActionGroup action
// ({ variant, text }). Parsing beats regex here because an action object may
// carry an arrow-function onClick, and a Button may wrap its label in an icon —
// both of which a flat pattern walks straight past.
function findSuccessVerbActions(source, relPath = 'source.tsx') {
  const sourceFile = ts.createSourceFile(
    relPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const labels = [];

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      let variant = null;
      let label = null;

      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const propertyName = getPropertyName(property.name);
        if (propertyName === 'variant') variant = getStringLiteralValue(property.initializer);
        if (propertyName === 'label' || propertyName === 'text') {
          label = getStringLiteralValue(property.initializer);
        }
      }

      if (variant === 'success' && label && TASK_VERB_RE.test(label)) labels.push(label);
    }

    if (ts.isJsxElement(node)) {
      const opening = node.openingElement;
      if (opening.tagName.getText(sourceFile) === 'Button') {
        const variantAttribute = opening.attributes.properties.find(
          (attribute) =>
            ts.isJsxAttribute(attribute) && attribute.name.getText(sourceFile) === 'variant'
        );

        if (variantAttribute && getJsxAttributeValue(variantAttribute) === 'success') {
          const renderedStrings = [];
          for (const child of node.children) collectRenderedStrings(child, renderedStrings);
          const label = renderedStrings.join(' ').replace(/\s+/g, ' ').trim();
          if (label && TASK_VERB_RE.test(label)) labels.push(label);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return labels;
}

module.exports = {
  isStoryableComponentFile,
  componentNameFromPath,
  collectComponentImportSegments,
  findUncovered,
  dedupeByName,
  isProductActionFile,
  findSuccessVerbActions,
};
