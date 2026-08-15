/**
 * Comment audit.
 *
 * Lists code comments that the repo's comment hygiene rules say shouldn't exist:
 * ones that restate the line below them, cite an issue number, narrate refactor
 * history, or draw a section banner. It is an AUDIT, not a fix: it writes
 * nothing, deletes nothing, and never fails CI (exit 0 on findings).
 *
 * Why this approach (chosen over alternatives):
 *  - A line-oriented scan with a tiny comment-state machine is enough here. The
 *    patterns we care about are lexical (a token in a comment, a phrase, an
 *    overlap between a comment and the next line), so a full TS AST parse buys
 *    accuracy we don't need and a dependency we'd have to keep current.
 *  - ESLint rules were considered and rejected: these findings are advisory and
 *    subjective, and wiring them into the lint gate would either block commits
 *    on style opinions or get blanket-disabled within a week.
 *  - The restating-the-code check is a word-overlap heuristic, not a parser. It
 *    is deliberately tuned to under-report: a missed noise comment costs
 *    nothing, a false positive costs trust in the whole list.
 *
 * Findings are grouped into three tiers, matching the comment-reaper skill:
 *   Tier 1  mechanical, safe to strip without reading context
 *   Tier 2  needs a human call, presented as a batch
 *   Context density stats, to pick where to sweep next
 *
 * Tier 3 (never touch) is deliberately absent. Regression anchors, type-field
 * docblocks, and SECURITY notes are judgment the script shouldn't pretend to
 * make; the skill applies that filter when reading this output.
 *
 * How to read the output: every line is a CANDIDATE for human review -- DO NOT
 * auto-delete. Comments citing an issue number inside a test file are called out
 * separately because those are usually regression anchors, where the number is
 * the point.
 *
 * Run: npm run audit:comments [-- --json] [-- --root <dir>] [-- --dir src/state]
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

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'coverage',
  'dist',
  'build',
  '__snapshots__',
]);
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

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
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

const isTestFile = (file) => /\.(test|spec)\.[jt]sx?$/.test(file);

// A comment line is a whole-line //, a block opener, or a block continuation.
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/;

// Words that carry no signal when comparing a comment against the code below it.
const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'to', 'of', 'for', 'in', 'on', 'at', 'by', 'is',
  'are', 'be', 'it', 'its', 'this', 'that', 'these', 'those', 'we', 'if',
  'then', 'else', 'so', 'as', 'or', 'not', 'no', 'with', 'from', 'into',
  'each', 'all', 'any', 'new', 'via', 'per', 'up', 'out', 'do', 'does',
]);

// Split identifiers into their component words: camelCase, PascalCase,
// snake_case, kebab-case, SCREAMING_CASE.
function identifierWords(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function commentWords(text) {
  return identifierWords(text.replace(/^\s*\/\/+/, '').replace(/[*/]/g, ' '));
}

// Singular/plural and verb-form collapse, so "Add attribute" matches
// "addAttributes" and "Updates the world" matches "updateWorld".
const stem = (w) => w.replace(/(ies)$/, 'y').replace(/(es|s|ed|ing)$/, '');
const stemSet = (words) => new Set(words.map(stem));

const PATTERNS = {
  issueCitation: /#\d{3,4}\b/,
  // Past-state phrasing only. Bare "used to" is usually present tense
  // ("the salt used to encrypt"), so it is matched with a past-state verb.
  archaeological:
    /\b(extracted (?:out )?from|moved (?:out )?from|refactored out|refactored from|formerly|previously|renamed from|split out (?:of|from)|used to (?:be|live|call|gate|have|exist|return|do|get|point|sit)|(?:was|were|had) (?:previously|originally)|once (?:was|lived|called)|as of \d)\b/i,
  // Only line comments draw banners. Block-comment continuation lines are
  // excluded because markdown inside JSDoc ("* - **Bold**:", "* ### Heading")
  // trips any charset loose enough to catch a real divider.
  banner:
    /^\s*\/\/\s*(?:[-=_~]{3,}|[-=_~]{2,}[^\n]*?[-=_~]{2,})\s*$/,
  malformedJsdoc: /\*\/\s*\*\//,
  // A docblock whose entire content is one line, in either form:
  //   /** Get the thing */
  //   /**
  //    * Get the thing
  //    */
  oneLineJsdoc: /^\s*\/\*\*\s*([^*].*?)\s*\*\/\s*$/,
  jsdocOpen: /^\s*\/\*\*\s*$/,
  jsdocBody: /^\s*\*\s*([^*@\s].*?)\s*$/,
  jsdocClose: /^\s*\*\/\s*$/,
  declaration:
    /^\s*(?:export\s+)?(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z0-9_$]+)|^\s*([A-Za-z0-9_$]+)\s*[:(]/,
  // A type or interface field: `name: Type;` with no call or arrow. Docblocks
  // on these are the closest thing the repo has to a data-model spec and are
  // never proposed for removal, so they are counted apart from function docs.
  typeField: /^\s*(?:readonly\s+)?[A-Za-z0-9_$]+\??:\s*[^=(]*;\s*$/,
};

const findings = {
  issueCitation: [],
  issueCitationInTest: [],
  restating: [],
  banner: [],
  malformedJsdoc: [],
  redundantJsdoc: [],
  typeFieldJsdoc: [],
  archaeological: [],
};

const density = [];

function nextCodeLine(lines, from) {
  for (let i = from; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (COMMENT_LINE.test(line)) continue;
    return { line, index: i };
  }
  return null;
}

// Ratio of the comment's meaningful words that also appear in the code line.
// maxWords caps how long a comment can be and still be judged a restatement:
// past a handful of words a comment is usually saying something extra.
function overlapRatio(comment, code, maxWords = 6) {
  const cWords = commentWords(comment);
  if (cWords.length === 0 || cWords.length > maxWords) return 0;
  const codeWords = stemSet(identifierWords(code));
  const hits = cWords.filter((w) => codeWords.has(stem(w))).length;
  return hits / cWords.length;
}

function scanFile(file) {
  const rel = path.relative(rootDir, file);
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split('\n');
  const test = isTestFile(file);
  let commentLines = 0;

  lines.forEach((line, i) => {
    const lineNo = i + 1;
    const at = `${rel}:${lineNo}`;
    const trimmed = line.trim();
    const isComment = COMMENT_LINE.test(line);
    if (isComment) commentLines += 1;

    if (PATTERNS.malformedJsdoc.test(line)) {
      findings.malformedJsdoc.push({ at, text: trimmed });
    }

    if (!isComment) return;

    if (PATTERNS.issueCitation.test(line)) {
      const entry = { at, text: trimmed };
      if (test) findings.issueCitationInTest.push(entry);
      else findings.issueCitation.push(entry);
    }

    if (PATTERNS.archaeological.test(line)) {
      findings.archaeological.push({ at, text: trimmed });
    }

    if (PATTERNS.banner.test(line)) {
      findings.banner.push({ at, text: trimmed });
    }

    // Redundant JSDoc: a docblock whose whole content is one sentence that the
    // declaration name below it already says. Matches both the inline form and
    // the three-line block form, which is the common one in practice.
    let docText = null;
    let docEnd = i;
    const inline = line.match(PATTERNS.oneLineJsdoc);
    if (inline) {
      docText = inline[1];
    } else if (PATTERNS.jsdocOpen.test(line)) {
      const body = lines[i + 1]?.match(PATTERNS.jsdocBody);
      if (body && PATTERNS.jsdocClose.test(lines[i + 2] ?? '')) {
        docText = body[1];
        docEnd = i + 2;
      }
    }
    if (docText) {
      const next = nextCodeLine(lines, docEnd + 1);
      if (next && next.index <= docEnd + 1) {
        const decl = next.line.match(PATTERNS.declaration);
        const name = decl ? decl[1] || decl[2] : null;
        if (name && overlapRatio(docText, name, 8) >= 0.6) {
          const bucket = PATTERNS.typeField.test(next.line)
            ? findings.typeFieldJsdoc
            : findings.redundantJsdoc;
          bucket.push({
            at,
            text: docText,
            code: next.line.trim().slice(0, 80),
          });
        }
      }
      return;
    }

    // Restating-the-code: a short // comment whose words are all already in the
    // identifiers on the next line of code.
    if (!trimmed.startsWith('//')) return;
    if (PATTERNS.issueCitation.test(line) || PATTERNS.banner.test(line)) return;
    const next = nextCodeLine(lines, i + 1);
    if (!next || next.index > i + 1) return;
    // Tuned to under-report: at most four meaningful words, nearly all of which
    // the next line already spells out. "// Add attribute" over "addAttribute:"
    // is the shape this is looking for.
    if (overlapRatio(trimmed, next.line, 4) >= 0.8) {
      findings.restating.push({
        at,
        text: trimmed,
        code: next.line.trim().slice(0, 80),
      });
    }
  });

  if (lines.length > 40) {
    density.push({
      file: rel,
      commentLines,
      total: lines.length,
      pct: Math.round((commentLines / lines.length) * 100),
    });
  }
  return commentLines;
}

function main() {
  const scanRoot = path.join(rootDir, scopeDir);
  if (!fs.existsSync(scanRoot)) {
    console.error(`No such directory: ${scanRoot}`);
    return;
  }
  const files = walk(scanRoot);
  let totalComments = 0;
  let totalLines = 0;
  for (const file of files) {
    totalComments += scanFile(file);
    totalLines += fs.readFileSync(file, 'utf8').split('\n').length;
  }

  const tier1 =
    findings.issueCitation.length +
    findings.restating.length +
    findings.banner.length +
    findings.malformedJsdoc.length;
  const tier2 =
    findings.redundantJsdoc.length + findings.archaeological.length;

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          scope: scopeDir,
          files: files.length,
          totalLines,
          commentLines: totalComments,
          tier1,
          tier2,
          findings,
          density: density.sort((a, b) => b.pct - a.pct).slice(0, 20),
        },
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
    for (const item of items.slice(0, 40)) console.log(`  ${render(item)}`);
    if (items.length > 40) console.log(`  ... and ${items.length - 40} more`);
  };

  console.log(`Comment audit: ${scopeDir} (${files.length} files, ${totalLines} lines)`);
  console.log(`Comment lines: ${totalComments} (${Math.round((totalComments / totalLines) * 100)}%)`);

  console.log('\n==== TIER 1: mechanical, safe to strip ====');
  section('Issue/PR citations in production code', findings.issueCitation, (f) => `${f.at}  ${f.text}`);
  section('Restating the code', findings.restating, (f) => `${f.at}  ${f.text}\n      -> ${f.code}`);
  section('Section-divider banners', findings.banner, (f) => `${f.at}  ${f.text}`);
  section('Malformed comment syntax', findings.malformedJsdoc, (f) => `${f.at}  ${f.text}`);

  console.log('\n==== TIER 2: needs a human call ====');
  section('Redundant one-line JSDoc', findings.redundantJsdoc, (f) => `${f.at}  ${f.text}\n      -> ${f.code}`);
  section('Archaeological comments', findings.archaeological, (f) => `${f.at}  ${f.text}`);

  console.log('\n==== TIER 3: reported for context, do not reap ====');
  console.log('Citations inside tests are usually regression anchors, where the number IS the');
  console.log('information. Docblocks on type fields are the data-model spec and feed IDE hover.');
  section('Issue/PR citations in tests', findings.issueCitationInTest, (f) => `${f.at}  ${f.text}`);
  section('Docblocks on type fields', findings.typeFieldJsdoc, (f) => `${f.at}  ${f.text}`);

  console.log('\n==== Densest files (comment % of total lines) ====');
  for (const d of density.sort((a, b) => b.pct - a.pct).slice(0, 15)) {
    console.log(`  ${String(d.pct).padStart(3)}%  ${String(`${d.commentLines}/${d.total}`).padStart(10)}  ${d.file}`);
  }

  console.log(`\n==== TOTAL: ${tier1} tier-1, ${tier2} tier-2, ${findings.issueCitationInTest.length} test citations ====`);
  console.log(
    'NOTE: every line above is a CANDIDATE. Review manually; keep any comment ' +
      'carrying a WHY the code cannot show. DO NOT auto-delete.',
  );
}

main();
