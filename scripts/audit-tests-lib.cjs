/**
 * Pure detectors for scripts/audit-tests.mjs: over-mocking shapes and the
 * mocked-module rollup that points the seam review. No fs here, so each one is
 * testable against fixture strings.
 */
const path = require('path');

const MOCK_MATCHER =
  /\.(toHaveBeenCalled|toHaveBeenCalledWith|toHaveBeenCalledTimes|toHaveBeenLastCalledWith|toHaveBeenNthCalledWith)\b/;
// Existence-only checks. toBeInTheDocument is deliberately NOT here: on a
// getByText('specific copy') query it observes real rendered output.
const FILLER =
  /\.(toBeDefined|toBeTruthy)\s*\(\s*\)|\.not\s*\.\s*(toBeNull|toBeUndefined)\s*\(\s*\)/;

/**
 * Call-checks plus existence-only padding, with at least one of each. The
 * padding is the only reason an "every assertion is a call-check" rule misses it.
 * @param {string[]} expectLines
 */
function isMockPlusFiller(expectLines) {
  const mocks = expectLines.filter((l) => MOCK_MATCHER.test(l));
  if (mocks.length === 0 || mocks.length === expectLines.length) return false;
  return expectLines.every((l) => MOCK_MATCHER.test(l) || FILLER.test(l));
}

const STUB_VALUE =
  /mock(?:Return|Resolved)Value(?:Once)?\s*\(\s*([A-Za-z_$][\w$.]*|'[^']*'|"[^"]*"|-?\d+(?:\.\d+)?)\s*\)/g;
// A plain result variable compared to a value: `expect(result).toBe(x)`. A
// property chain or call (`expect(headers.get('key')).toBe(x)`) means the value
// was routed somewhere new, which is real behavior, so it never counts as echo.
const ECHO_ASSERTION =
  /^\s*expect\s*\(\s*[A-Za-z_$][\w$]*\s*\)\s*\.(?:toBe|toEqual|toStrictEqual)\s*\(\s*([A-Za-z_$][\w$.]*|'[^']*'|"[^"]*"|-?\d+(?:\.\d+)?)\s*\)/;
// Booleans and nullish stubs usually steer a branch rather than flow through.
const BRANCH_STUB = /^(true|false|null|undefined)$/;

/**
 * The case stubs a return value and every value assertion expects exactly that
 * stub back on a plain result variable, so it can only fail if the code stops
 * passing values through. Only looks inside the case body; stubs set in
 * beforeEach are out of reach.
 * @param {string} bodyText
 * @param {string[]} expectLines
 */
function isMockEcho(bodyText, expectLines) {
  const stubs = new Set(
    [...bodyText.matchAll(STUB_VALUE)].map((m) => m[1]).filter((v) => !BRANCH_STUB.test(v)),
  );
  if (stubs.size === 0) return false;
  const valueChecks = expectLines.filter((l) => !MOCK_MATCHER.test(l));
  if (valueChecks.length === 0) return false;
  return valueChecks.every((l) => {
    const m = l.match(ECHO_ASSERTION);
    return Boolean(m) && stubs.has(m[1]);
  });
}

const CALL_SUBJECT = /expect\s*\(\s*([\w$.]+)\s*\)\s*\.(?:not\s*\.\s*)?toHaveBeen/;
// Callback props and router spies: for a controlled component the callback IS
// the public contract, and next/navigation is mocked suite-wide, so a call-check
// is the only observation available. These stay listed, just out of the
// name-mismatch bucket, which was mostly this pattern when reviewed by hand.
const CONTRACT_SUBJECT = /^(on[A-Z]\w*|handle[A-Z]\w*|mock(?:On|Handle)[A-Z]\w*|mock(?:Push|Replace)|push|replace)$/;

/**
 * True when every call-checked subject is a callback prop or router spy.
 * @param {string[]} expectLines
 */
function isCallbackContract(expectLines) {
  const subjects = expectLines.map((l) => {
    const m = l.match(CALL_SUBJECT);
    return m ? m[1].split('.').pop() : null;
  });
  return subjects.length > 0 && subjects.every((s) => s && CONTRACT_SUBJECT.test(s));
}

const PROMISING_FILE = /(integration|persistence)/i;
const MOCK_SPEC = /jest\.mock\(\s*['"`]([^'"`]+)['"`]/g;
const isLocalSpec = (spec) => spec.startsWith('@/') || spec.startsWith('.');

/**
 * Local modules jest.mock'ed by a file whose name promises integration or
 * persistence. Empty for any other file.
 * @param {string} relPath
 * @param {string} text
 */
function promisedCollaboratorMocks(relPath, text) {
  if (!PROMISING_FILE.test(path.basename(relPath))) return [];
  return [...text.matchAll(MOCK_SPEC)].map((m) => m[1]).filter(isLocalSpec);
}

/**
 * Normalize a module specifier to a repo-relative path without extension, so
 * `@/lib/api/characterApi` and `../characterApi` from the api folder match.
 * @param {string} spec
 * @param {string} fromRel repo-relative path of the importing file
 */
function resolveSpec(spec, fromRel) {
  let out;
  if (spec.startsWith('@/')) out = path.posix.join('src', spec.slice(2));
  else if (spec.startsWith('.')) out = path.posix.join(path.posix.dirname(fromRel), spec);
  else return null;
  return out.replace(/\.(tsx?|jsx?|mjs|cjs)$/, '').replace(/\/index$/, '');
}

const IMPORT_SPEC = /(?:from\s+|require\(\s*|import\(\s*)['"`]([^'"`]+)['"`]/g;

/**
 * For every local module mocked in at least `minMocks` test files, list the test
 * files that import it for real. A module nobody imports unmocked has never had
 * its side of the seam exercised by a test. One with real importers still needs
 * a human to check those fixtures look like production data.
 * @param {{ rel: string, text: string }[]} files
 * @param {number} minMocks
 */
function mockedModules(files, minMocks = 3) {
  const mockedIn = new Map();
  const importedBy = new Map();
  for (const { rel, text } of files) {
    const mocked = new Set();
    for (const m of text.matchAll(MOCK_SPEC)) {
      const mod = resolveSpec(m[1], rel);
      if (mod) mocked.add(mod);
    }
    for (const mod of mocked) {
      if (!mockedIn.has(mod)) mockedIn.set(mod, []);
      mockedIn.get(mod).push(rel);
    }
    for (const m of text.matchAll(IMPORT_SPEC)) {
      const mod = resolveSpec(m[1], rel);
      if (!mod || mocked.has(mod)) continue;
      if (!importedBy.has(mod)) importedBy.set(mod, new Set());
      importedBy.get(mod).add(rel);
    }
  }
  return [...mockedIn.entries()]
    .filter(([, mockers]) => mockers.length >= minMocks)
    .map(([module, mockers]) => {
      const realTests = [...(importedBy.get(module) || [])];
      return { module, mockedIn: mockers.length, realTests };
    })
    .sort((a, b) => a.realTests.length - b.realTests.length || b.mockedIn - a.mockedIn);
}

module.exports = {
  MOCK_MATCHER,
  isMockPlusFiller,
  isMockEcho,
  isCallbackContract,
  promisedCollaboratorMocks,
  resolveSpec,
  mockedModules,
};
