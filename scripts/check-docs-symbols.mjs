#!/usr/bin/env node
// Doc symbol-resolution PROTOTYPE (issue #1651, part 2 of the docs-check pair).
//
// The link checker (scripts/check-docs-links.mjs) catches broken paths and
// anchors, but not the defect that actually mattered in the #1638 sweep: docs
// that confidently describe a type, hook, or file that doesn't exist in
// `src/` anymore (or never did) -- e.g. `api/types-reference.md` documenting
// ten types that were never real. This is a first pass at automating that.
//
// Deliberately ADVISORY, not gating (unlike check-docs-links.mjs): telling
// code references apart from plain English inside backticks is a judgment
// call, so this is a warn-only report, same failure ergonomics as
// scripts/audit-css.mjs -- it never fails CI, only prints a worklist for
// human review. Promoting it to a gate is a possible follow-up once the
// tolerance list has proven itself against real docs.
//
// Approach: regex-extract every top-level `export` declaration under `src/`
// into a symbol table, then scan backticked spans in `public_docs/` for
// things that *look like* code references (PascalCase types, `camelCase()`
// calls, `useThing` hooks, or `src/...`-style paths) and flag any that don't
// resolve. Plain English backticked words (most of them) never match these
// shapes and are left alone.
//
// Run: npm run docs:check-symbols

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const EXPORT_DECL_RE =
  /export\s+(?:default\s+)?(?:abstract\s+)?(?:class|interface|type|enum|function)\s+([A-Za-z_$][\w$]*)/g;
const EXPORT_VAR_RE = /export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g;
const EXPORT_LIST_RE = /export\s+\{([^}]+)\}/g;
// The dominant component pattern here is `function Foo() {...}` declared
// earlier in the file, then `export default Foo;` at the bottom -- catch the
// bare-identifier default export too, not just `export default function Foo`.
const EXPORT_DEFAULT_IDENT_RE = /export\s+default\s+([A-Za-z_$][\w$]*)\s*;/g;

// Common built-ins and generic type params that read as PascalCase/camelCase
// but were never going to be exported from src/. Keeps the report focused on
// genuine drift instead of noise -- expand as real false positives show up.
const TOLERANCE = new Set([
  'T', 'K', 'V', 'U', 'E', 'P', 'S',
  'Promise', 'Array', 'Map', 'Set', 'Date', 'Error', 'JSON', 'Object',
  'String', 'Number', 'Boolean', 'RegExp', 'Function', 'Infinity', 'NaN',
  'React', 'ReactNode', 'ReactElement', 'JSX', 'HTMLElement', 'HTMLDivElement',
  'Record', 'Partial', 'Required', 'Readonly', 'Omit', 'Pick',
  'useEffect', 'useState', 'useMemo', 'useCallback', 'useRef', 'useContext', 'useReducer',
  // CSS/env, not project symbols, but shaped like a call/identifier.
  'var', 'NODE_ENV',
]);

const CODE_DIR_PREFIXES = ['src/', 'public_docs/', 'scripts/', '.github/'];

function extractExports(sourceDir) {
  const names = new Set();
  const files = glob.sync('**/*.{ts,tsx}', {
    cwd: sourceDir,
    ignore: ['**/*.test.*', '**/*.stories.*', '**/__tests__/**'],
    absolute: true,
  });

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const re of [EXPORT_DECL_RE, EXPORT_VAR_RE, EXPORT_DEFAULT_IDENT_RE]) {
      for (const match of content.matchAll(re)) names.add(match[1]);
    }
    for (const match of content.matchAll(EXPORT_LIST_RE)) {
      for (const entry of match[1].split(',')) {
        const name = entry.trim().split(/\s+as\s+/).pop().trim();
        if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
      }
    }
  }
  return names;
}

function extractBacktickSpans(content) {
  const withoutFences = content.replace(/```[\s\S]*?```/g, (block) => block.replace(/[^\n]/g, ' '));
  const spans = [];
  for (const match of withoutFences.matchAll(/`([^`\n]+)`/g)) spans.push(match[1]);
  return spans;
}

function classify(span) {
  if (span.includes('/')) {
    const looksLikeRepoPath = CODE_DIR_PREFIXES.some((prefix) => span.startsWith(prefix));
    return looksLikeRepoPath ? { kind: 'path', value: span } : null;
  }
  const call = /^([a-z][\w$]*)\(\)$/.exec(span);
  if (call) return { kind: 'symbol', value: call[1] };

  const type = /^([A-Z][\w$]*)(<[^`]*>)?$/.exec(span);
  if (type) return { kind: 'symbol', value: type[1] };

  const hook = /^(use[A-Z][\w$]*)$/.exec(span);
  if (hook) return { kind: 'symbol', value: hook[1] };

  return null;
}

async function main() {
  const exportedNames = extractExports(path.join(rootDir, 'src'));
  const docFiles = (
    await glob('public_docs/**/*.md', { cwd: rootDir, ignore: ['node_modules/**'] })
  ).sort();

  let flaggedCount = 0;

  for (const relPath of docFiles) {
    const content = readFileSync(path.join(rootDir, relPath), 'utf8');
    const flagged = [];
    const seen = new Set();

    for (const span of extractBacktickSpans(content)) {
      const ref = classify(span);
      if (!ref || seen.has(span)) continue;

      if (ref.kind === 'symbol') {
        if (TOLERANCE.has(ref.value) || exportedNames.has(ref.value)) continue;
        flagged.push(`\`${span}\` -- no export named "${ref.value}" found in src/`);
      } else if (ref.kind === 'path') {
        if (existsSync(path.join(rootDir, ref.value))) continue;
        flagged.push(`\`${span}\` -- path does not exist`);
      }
      seen.add(span);
    }

    if (flagged.length === 0) continue;
    flaggedCount += flagged.length;
    console.log(`\n${relPath}`);
    for (const line of flagged) console.log(`  ${line}`);
  }

  console.log(
    `\ndocs:check-symbols (advisory): ${docFiles.length} doc(s) scanned, ${flaggedCount} unresolved reference(s).`,
  );
  console.log('Review manually -- this is a prototype and does not fail CI. False positives go in TOLERANCE.');
}

main();
