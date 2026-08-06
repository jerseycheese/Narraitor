/**
 * Visual baseline governance -- pure logic.
 *
 * A PR that breaks a screen and regenerates that screen's baseline in the
 * same commit looks identical, from GitHub's diff UI, to a PR that changed
 * the screen on purpose. These functions surface that ambiguity instead of
 * letting it pass silently: do the changed files mix source and snapshots,
 * and does the PR body actually say what each changed baseline was for.
 *
 * Deterministic and free of git/fs access, so it stays testable in isolation.
 * The CLI wrapper (./check-visual-baseline.mjs) supplies the real diff and
 * PR body.
 */

const SOURCE_PREFIX_RE = /^src\//;
const SNAPSHOT_RE = /-snapshots\/.*\.png$/;

export function isSourceChange(filePath) {
  return SOURCE_PREFIX_RE.test(filePath);
}

export function isSnapshotChange(filePath) {
  return SNAPSHOT_RE.test(filePath);
}

export function getChangedSnapshots(changedFiles) {
  return changedFiles.filter(isSnapshotChange);
}

export function hasMixedChange(changedFiles) {
  return changedFiles.some(isSourceChange) && changedFiles.some(isSnapshotChange);
}

const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;

/**
 * Strips HTML comments so template boilerplate (e.g. the PR template's own
 * example filename inside a `<!-- -->` block) can't count as documentation
 * that the author never actually wrote.
 *
 * Loops to a fixed point rather than trusting a single pass: a bare
 * `replace(re, '')` on a multi-character delimiter is the general shape of
 * an incomplete-sanitization bug (nested/malformed markup can in principle
 * leave a delimiter fragment that only becomes a full match once an earlier
 * removal closes the gap around it). Re-running until nothing changes closes
 * that class of gap regardless of whether this exact regex is susceptible.
 */
function stripHtmlComments(text) {
  let result = text;
  let previous;
  do {
    previous = result;
    result = result.replace(HTML_COMMENT_RE, '');
  } while (result !== previous);
  return result;
}

/**
 * A changed snapshot counts as documented if its filename appears anywhere
 * in the PR body outside an HTML comment -- deliberately loose (no required
 * section format) since the goal is catching a baseline with zero mention,
 * not grading prose.
 */
export function findUndocumentedSnapshots(changedSnapshots, prBody) {
  const body = stripHtmlComments(prBody ?? '');
  return changedSnapshots.filter((snapshotPath) => {
    const filename = snapshotPath.split('/').pop();
    return !body.includes(filename);
  });
}
