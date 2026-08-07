/**
 * Internal doc link checker -- pure logic (issue #1651).
 *
 * Walks every relative markdown link (and in-page anchor) in a doc's content
 * and reports any that don't resolve. This is the automated version of the
 * manual link walk from the #1638 correctness sweep -- that sweep found real
 * drift and had no way to re-run itself, so nothing caught the next round of
 * rot. This does.
 *
 * Deliberately gating (unlike scripts/audit-css.mjs): a broken relative link
 * or anchor is unambiguous -- there's no judgment call and no false-positive
 * risk the way there is with "unused" CSS selectors, so it's safe to block CI.
 *
 * Fixture-based and deterministic -- no fs, no live codebase scan, so it
 * stays green in CI. The CLI wrapper (./check-docs-links.js) supplies real
 * filesystem access.
 */

const LINK_RE = /!?\[[^\]]*\]\(([^)]+)\)/g;
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const FENCE_RE = /```[\s\S]*?```/g;

/** GitHub's heading-to-anchor-slug algorithm. */
export function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Extract the set of heading-derived anchor slugs from markdown content.
 *
 * GitHub suffixes repeated headings with `-1`, `-2`, ... (first occurrence
 * keeps the bare slug), so duplicate headings must be counted, not just
 * collected into a Set of unique slugs.
 */
export function extractHeadingSlugs(content) {
  const counts = new Map();
  const slugs = new Set();
  for (const line of content.split('\n')) {
    const match = /^#{1,6}\s+(.+)$/.exec(line);
    if (!match) continue;
    const base = slugify(match[1]);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    slugs.add(count === 0 ? base : `${base}-${count}`);
  }
  return slugs;
}

/**
 * Split a markdown link target into its href and an optional title, e.g.
 * `target.md "read more"` -> `{ href: 'target.md', title: 'read more' }`.
 * GitHub (and the spec) treats the quoted suffix as a title, not part of the
 * path -- checking the raw string as a path would look for a file literally
 * named "target.md \"read more\"".
 */
function splitLinkTitle(target) {
  const match = /^(\S+)\s+(?:"[^"]*"|'[^']*'|\([^)]*\))$/.exec(target);
  return match ? match[1] : target;
}

/**
 * Find broken links in a doc's markdown content.
 *
 * @param {string} content - the raw markdown source.
 * @param {object} fs - injected filesystem access, so this stays pure/testable:
 *   - exists(absPath): boolean
 *   - isMarkdownFile(absPath): boolean -- true if absPath is a real .md file
 *   - headingSlugs(absPath): Set<string> -- anchor slugs for that file
 *   - resolve(fromContentPath, relativeTarget): string -- resolves a link
 *     target to an absolute path
 * @param {string} selfPath - absolute path of the doc being checked, used to
 *   resolve bare `#anchor` links against itself.
 */
export function findBrokenLinks(content, fs, selfPath) {
  const stripped = content.replace(FENCE_RE, (block) => block.replace(/[^\n]/g, ' '));
  const broken = [];

  for (const match of stripped.matchAll(LINK_RE)) {
    const target = match[1].trim();
    if (!target || SCHEME_RE.test(target) || target.startsWith('mailto:')) continue;

    const href = splitLinkTitle(target);
    const [rawPath, anchor] = href.split('#');
    const targetPath = rawPath ? fs.resolve(selfPath, rawPath) : selfPath;

    if (rawPath && !fs.exists(targetPath)) {
      broken.push({ target, reason: 'target does not exist' });
      continue;
    }

    if (anchor !== undefined && fs.isMarkdownFile(targetPath)) {
      const slugs = fs.headingSlugs(targetPath);
      if (!slugs.has(slugify(decodeURIComponent(anchor)))) {
        broken.push({ target, reason: `no heading matches anchor "#${anchor}"` });
      }
    }
  }

  return broken;
}
