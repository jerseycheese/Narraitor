/**
 * @jest-environment node
 *
 * Tests the pure port-derivation logic in scripts/worktree-port.js.
 */

import { derivePort } from '../worktree-port.js';

describe('derivePort', () => {
  it('keeps the main checkout on 3000 (git-dir == git-common-dir)', () => {
    expect(
      derivePort({ gitDir: '/repo/.git', commonDir: '/repo/.git', cwd: '/repo' })
    ).toBe(3000);
  });

  it('derives a stable, in-range port for a linked worktree', () => {
    const port = derivePort({
      gitDir: '/repo/.git/worktrees/feature-a',
      commonDir: '/repo/.git',
      cwd: '/repo/worktrees/feature-a',
    });
    expect(port).toBeGreaterThanOrEqual(3001);
    expect(port).toBeLessThanOrEqual(3899);
  });

  it('is deterministic for a given worktree path', () => {
    const args = {
      gitDir: '/repo/.git/worktrees/feature-a',
      commonDir: '/repo/.git',
      cwd: '/repo/worktrees/feature-a',
    };
    expect(derivePort(args)).toBe(derivePort(args));
  });

  it('gives two different worktree paths different ports', () => {
    const a = derivePort({
      gitDir: '/repo/.git/worktrees/feature-a',
      commonDir: '/repo/.git',
      cwd: '/repo/worktrees/feature-a',
    });
    const b = derivePort({
      gitDir: '/repo/.git/worktrees/feature-b',
      commonDir: '/repo/.git',
      cwd: '/repo/worktrees/feature-b',
    });
    expect(a).not.toBe(b);
  });

  it('honors an explicit PORT override even in a worktree', () => {
    expect(
      derivePort({
        gitDir: '/repo/.git/worktrees/feature-a',
        commonDir: '/repo/.git',
        cwd: '/repo/worktrees/feature-a',
        portEnv: '4500',
      })
    ).toBe(4500);
  });

  it('ignores a non-numeric PORT and falls back to derivation', () => {
    expect(
      derivePort({ gitDir: '/repo/.git', commonDir: '/repo/.git', cwd: '/repo', portEnv: 'nope' })
    ).toBe(3000);
  });
});
