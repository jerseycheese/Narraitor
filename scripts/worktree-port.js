/**
 * Picks the dev-server port for the current git checkout.
 *
 * The main checkout keeps the canonical port 3000. Each linked git worktree
 * gets its own stable port derived from its path, so concurrent worktrees
 * never collide on 3000 (and `npm run dev` no longer has to kill whatever is
 * already serving the main tree). An explicit PORT env var always wins.
 *
 * Used by scripts/dev.sh (CLI) and playwright.config.ts (local baseURL).
 */

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const MIN_WORKTREE_PORT = 3001;
const PORT_RANGE = 899; // 3001..3899

/**
 * Pure port derivation, separated from git/process lookups so it can be tested.
 *
 * @param {object} args
 * @param {string} [args.gitDir] - `git rev-parse --git-dir`
 * @param {string} [args.commonDir] - `git rev-parse --git-common-dir`
 * @param {string} [args.cwd] - current working directory
 * @param {string} [args.portEnv] - value of process.env.PORT, if any
 * @returns {number}
 */
export function derivePort({ gitDir, commonDir, cwd, portEnv } = {}) {
  if (portEnv) {
    const explicit = parseInt(portEnv, 10);
    if (Number.isInteger(explicit) && explicit > 0) {
      return explicit;
    }
  }

  // In the main checkout, --git-dir and --git-common-dir resolve to the same
  // path. In a linked worktree they differ.
  if (gitDir && commonDir && resolve(gitDir) === resolve(commonDir)) {
    return 3000;
  }

  // Stable hash of the worktree path -> a deterministic port in range.
  const key = cwd || '';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return MIN_WORKTREE_PORT + (hash % PORT_RANGE);
}

function gitRevParse(flag) {
  try {
    return execSync(`git rev-parse ${flag}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/** Resolve the port for the current process's checkout. */
export function getWorktreePort() {
  return derivePort({
    gitDir: gitRevParse('--git-dir'),
    commonDir: gitRevParse('--git-common-dir'),
    cwd: process.cwd(),
    portEnv: process.env.PORT,
  });
}

// CLI entry: `node scripts/worktree-port.js` prints the port (no newline).
// Avoids import.meta so the module also loads cleanly under ts-jest (CJS).
if (process.argv[1] && process.argv[1].endsWith('worktree-port.js')) {
  process.stdout.write(String(getWorktreePort()));
}
