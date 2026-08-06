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

/**
 * A changed snapshot counts as documented if its filename appears anywhere
 * in the PR body -- deliberately loose (no required section format) since
 * the goal is catching a baseline with zero mention, not grading prose.
 */
export function findUndocumentedSnapshots(changedSnapshots, prBody) {
  const body = prBody ?? '';
  return changedSnapshots.filter((snapshotPath) => {
    const filename = snapshotPath.split('/').pop();
    return !body.includes(filename);
  });
}
