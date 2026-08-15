/**
 * Test audit.
 *
 * Lists tests that pass no matter what the code does: duplicates, cases whose
 * every assertion is a mock call-check, single-assertion render checks, and
 * suites whose name promises behavior the body never observes. It is an AUDIT,
 * not a fix: it writes nothing, deletes nothing, and never fails CI (exit 0).
 *
 * Why this approach (chosen over alternatives):
 *  - Coverage tooling answers "was this line executed", which is the wrong
 *    question. A mock-only test executes plenty of lines and asserts nothing
 *    about them. This scans assertion SHAPE instead, which is what decides
 *    whether a test can fail for a real reason.
 *  - Mutation testing (stryker, already configured here for a few directories)
 *    answers the question properly but takes far too long to run as a sweep.
 *    Treat this audit as the cheap filter that says where to point it.
 *  - A brace-counting block scanner is used rather than a TS AST parse. Test
 *    files are formatted regularly enough that it holds, and it keeps the
 *    script dependency-free.
 *
 * IMPORTANT CAVEAT the output repeats: a global jest.mock() in the setup file
 * means whole suites run against auto-mocks, and a mock assertion may be the
 * only observation available to them. Check the setup file before judging any
 * case this flags. The script reports which modules are globally mocked.
 *
 * How to read the output: every case listed is a CANDIDATE for human review --
 * DO NOT auto-delete. Mock-only cases especially: they usually mark a coverage
 * gap that wants a rewrite, not a deletion.
 *
 * Run: npm run audit:tests [-- --json] [-- --root <dir>] [-- --dir src/state]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const asJson = argv.includes('--json');
const rootDir = path.resolve(argValue('--root', path.join(__dirname, '..')));
const scopeDir = argValue('--dir', 'src');

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'coverage', 'dist', 'build']);
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/;

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out);
    } else if (TEST_FILE.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const CASE_OPEN =
  /^\s*(?:(x)|f)?(it|test)(\.(?:each|only|skip|todo|concurrent))?\s*(?:\([^)]*\))?\s*\(\s*(['"`])(.*?)\4/;
const DESCRIBE_OPEN = /^(\s*)(?:x|f)?describe(?:\.\w+)?\s*\(\s*(['"`])(.*?)\2/;
const DESCRIBE_SKIP = /^\s*(?:x)?describe\s*\.\s*(skip|todo)\s*\(/;
const ONLY = /^\s*(?:it|test|describe)\s*\.\s*only\s*\(/;

// Assertion shapes.
const EXPECT = /\bexpect\s*\(/;
const MOCK_MATCHER = /\.(toHaveBeenCalled|toHaveBeenCalledWith|toHaveBeenCalledTimes|toHaveBeenLastCalledWith|toHaveBeenNthCalledWith)\b/;
const MOCK_SUBJECT = /\bexpect\s*\(\s*[^)]*\b(mock[A-Za-z0-9_$]*|[A-Za-z0-9_$]*Mock|jest\.fn|\w+\.mock)\b/i;
const SNAPSHOT = /\.(toMatchSnapshot|toMatchInlineSnapshot)\b/;
const IN_DOCUMENT = /\.(toBeInTheDocument|toBeVisible)\b/;
const DEFINED_ONLY = /expect\s*\([^)]*\)\s*\.\s*(toBeDefined|toBeTruthy)\s*\(\s*\)/;
const RENDER = /\brender\s*\(/;

// Names that promise more than a mock assertion can deliver.
const PROMISE_WORDS =
  /\b(persist|persists|persisted|persistence|save|saves|saved|store[sd]?|restore[sd]?|load[sd]?|integrat|sync|write[sn]?|read[sn]?|hydrat)/i;

const findings = {
  duplicateNames: [],
  skipped: [],
  only: [],
  snapshotOnly: [],
  definedOnly: [],
  mockOnly: [],
  mockOnlyNameMismatch: [],
  singleRenderAssertion: [],
  noAssertion: [],
};

let totalCases = 0;
let totalFiles = 0;
const fileStats = [];

// Walk forward from a case's opening line, tracking brace depth, and return
// every line in its body. Brace counting ignores braces inside strings, which
// is the only place it would otherwise drift.
function caseBody(lines, start) {
  let depth = 0;
  let started = false;
  const body = [];
  for (let i = start; i < lines.length && i < start + 400; i += 1) {
    const line = lines[i];
    const stripped = line
      .replace(/\\./g, '')
      .replace(/'[^']*'/g, "''")
      .replace(/"[^"]*"/g, '""')
      .replace(/`[^`]*`/g, '``');
    for (const ch of stripped) {
      if (ch === '{') {
        depth += 1;
        started = true;
      } else if (ch === '}') depth -= 1;
    }
    if (i > start) body.push(line);
    if (started && depth <= 0) break;
  }
  return body;
}

function globalMocks() {
  const out = [];
  for (const candidate of ['jest.setup.ts', 'jest.setup.js', 'jest.setup.tsx']) {
    const full = path.join(rootDir, candidate);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const m of text.matchAll(/jest\.mock\(\s*['"`]([^'"`]+)/g)) out.push(m[1]);
  }
  return out;
}

function scanFile(file) {
  const rel = path.relative(rootDir, file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const seenNames = new Map();
  let cases = 0;
  // Duplicate names only matter within one describe block: jest's reported name
  // is the full describe > it path, so the same `it` text under two different
  // describes is unique and usually deliberate.
  const describeStack = [];

  lines.forEach((line, i) => {
    const lineNo = i + 1;
    const at = `${rel}:${lineNo}`;

    const describe = line.match(DESCRIBE_OPEN);
    if (describe) {
      const indent = describe[1].length;
      while (describeStack.length && describeStack[describeStack.length - 1].indent >= indent) {
        describeStack.pop();
      }
      describeStack.push({ indent, name: describe[3] });
    }

    if (DESCRIBE_SKIP.test(line)) findings.skipped.push({ at, text: line.trim().slice(0, 90) });
    if (ONLY.test(line)) findings.only.push({ at, text: line.trim().slice(0, 90) });

    const open = line.match(CASE_OPEN);
    if (!open) return;
    const modifier = open[3] || '';
    const name = open[5];
    cases += 1;
    totalCases += 1;

    if (open[1] || /skip|todo/.test(modifier)) {
      findings.skipped.push({ at, name });
      return;
    }
    if (/only/.test(modifier)) findings.only.push({ at, name });

    // Duplicate names inside a single describe block.
    const scope = describeStack.map((d) => d.name).join(' > ');
    const key = `${scope} > ${name}`;
    if (seenNames.has(key)) {
      findings.duplicateNames.push({ at, name, scope, first: seenNames.get(key) });
    } else {
      seenNames.set(key, at);
    }

    const body = caseBody(lines, i);
    const text = body.join('\n');
    const expects = body.filter((l) => EXPECT.test(l));
    const statements = body.filter((l) => l.trim() && !l.trim().startsWith('//')).length;

    if (expects.length === 0) {
      // A case with no expect() at all still counts if it awaits an assertion
      // helper, so only flag when nothing assertion-shaped appears anywhere.
      if (!/\b(expect|assert|toThrow|rejects|resolves)\b/.test(text)) {
        findings.noAssertion.push({ at, name, statements });
      }
      return;
    }

    if (expects.every((l) => SNAPSHOT.test(l))) {
      findings.snapshotOnly.push({ at, name });
      return;
    }
    if (expects.every((l) => DEFINED_ONLY.test(l))) {
      findings.definedOnly.push({ at, name });
      return;
    }

    // Mock-only: every assertion is a call-check, or targets a mock and checks
    // nothing but call-ness. These can fail when wiring changes, never when
    // behavior does.
    const allMockMatchers = expects.every((l) => MOCK_MATCHER.test(l));
    const allMockSubjects = expects.every((l) => MOCK_SUBJECT.test(l));
    if (allMockMatchers && allMockSubjects) {
      const entry = { at, name, assertions: expects.length };
      findings.mockOnly.push(entry);
      if (PROMISE_WORDS.test(name) || PROMISE_WORDS.test(rel)) {
        findings.mockOnlyNameMismatch.push(entry);
      }
      return;
    }

    // A render plus one presence assertion. Fine alone, a smell in bulk, so the
    // per-file rollup below is what actually matters.
    if (expects.length === 1 && IN_DOCUMENT.test(expects[0]) && RENDER.test(text) && statements <= 4) {
      findings.singleRenderAssertion.push({ at, name });
    }
  });

  totalFiles += 1;
  fileStats.push({ file: rel, cases });
}

function main() {
  const scanRoot = path.join(rootDir, scopeDir);
  if (!fs.existsSync(scanRoot)) {
    console.error(`No such directory: ${scanRoot}`);
    return;
  }
  for (const file of walk(scanRoot)) scanFile(file);

  const mocks = globalMocks();

  // Roll single-assertion render checks up per file: one is fine, a file made
  // of them is the finding.
  const renderByFile = {};
  for (const f of findings.singleRenderAssertion) {
    const file = f.at.split(':')[0];
    renderByFile[file] = (renderByFile[file] || 0) + 1;
  }
  const renderHeavy = Object.entries(renderByFile)
    .map(([file, count]) => {
      const stat = fileStats.find((s) => s.file === file);
      return { file, count, cases: stat ? stat.cases : count };
    })
    .filter((f) => f.count >= 3 && f.count / f.cases >= 0.5)
    .sort((a, b) => b.count - a.count);

  if (asJson) {
    console.log(
      JSON.stringify(
        { scope: scopeDir, totalFiles, totalCases, globalMocks: mocks, findings, renderHeavy },
        null,
        2,
      ),
    );
    return;
  }

  const section = (title, items, render) => {
    console.log(`\n## ${title} (${items.length})`);
    if (items.length === 0) {
      console.log('  none');
      return;
    }
    for (const item of items.slice(0, 30)) console.log(`  ${render(item)}`);
    if (items.length > 30) console.log(`  ... and ${items.length - 30} more`);
  };

  console.log(`Test audit: ${scopeDir} (${totalFiles} files, ${totalCases} cases)`);
  if (mocks.length) {
    console.log(`\nGLOBAL MOCKS in jest.setup - suites touching these may have no`);
    console.log(`non-mock observation available. Judge their tests accordingly:`);
    for (const m of mocks) console.log(`  ${m}`);
  }

  console.log('\n==== TIER 1: mechanical ====');
  section("Duplicate test names in one describe block", findings.duplicateNames, (f) => `${f.at}  "${f.name}"  in [${f.scope}]  (first at ${f.first})`);
  section('Leaked .only - silently skips the rest of the file', findings.only, (f) => `${f.at}  ${f.name || f.text}`);
  section('Skipped / todo cases', findings.skipped, (f) => `${f.at}  ${f.name || f.text}`);
  section('Snapshot-only cases', findings.snapshotOnly, (f) => `${f.at}  "${f.name}"`);
  section('Existence-only cases (toBeDefined / toBeTruthy)', findings.definedOnly, (f) => `${f.at}  "${f.name}"`);
  section('Cases with no assertion at all', findings.noAssertion, (f) => `${f.at}  "${f.name}"`);

  console.log('\n==== TIER 2: needs a human call - rewrite or delete ====');
  console.log('Name promises behavior the body never observes. Strongest signal here:');
  section('Mock-only, and the name claims real behavior', findings.mockOnlyNameMismatch, (f) => `${f.at}  "${f.name}"  (${f.assertions} assertions, all call-checks)`);
  section('Mock-only cases (all assertions are call-checks)', findings.mockOnly, (f) => `${f.at}  "${f.name}"  (${f.assertions})`);
  section('Files that are mostly single-assertion render checks', renderHeavy, (f) => `${f.file}  ${f.count}/${f.cases} cases`);

  const tier1 =
    findings.duplicateNames.length +
    findings.only.length +
    findings.skipped.length +
    findings.snapshotOnly.length +
    findings.definedOnly.length +
    findings.noAssertion.length;

  console.log(`\n==== TOTAL: ${tier1} tier-1, ${findings.mockOnly.length} mock-only (${findings.mockOnlyNameMismatch.length} with a mismatched name), ${findings.singleRenderAssertion.length} single-assertion render checks ====`);
  console.log(
    'NOTE: every case above is a CANDIDATE. Mock-only cases usually mark a ' +
      'coverage gap that wants a REWRITE, not a deletion. DO NOT auto-delete.',
  );
}

main();
