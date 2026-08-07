/**
 * @jest-environment node
 *
 * Unit tests for the pure visual-baseline governance logic. Fixture-based and
 * deterministic -- no git, no fs, so it stays green in CI.
 */

import {
  isSourceChange,
  isSnapshotChange,
  getChangedSnapshots,
  hasMixedChange,
  findUndocumentedSnapshots,
} from '../visual-baseline-check.js';

describe('isSourceChange', () => {
  it('is true for a path under src/', () => {
    expect(isSourceChange('src/components/Hero.tsx')).toBe(true);
  });

  it('is false for a path outside src/', () => {
    expect(isSourceChange('tests/visual/character-detail.spec.ts')).toBe(false);
  });
});

describe('isSnapshotChange', () => {
  it('is true for a PNG under a Playwright snapshots directory', () => {
    expect(
      isSnapshotChange(
        'tests/visual/character-detail.spec.ts-snapshots/character-detail-chromium-darwin.png'
      )
    ).toBe(true);
  });

  it('is false for a non-snapshot PNG', () => {
    expect(isSnapshotChange('public/visual-assets/logo.png')).toBe(false);
  });

  it('is false for a non-PNG file inside a snapshots directory', () => {
    expect(isSnapshotChange('tests/visual/character-detail.spec.ts-snapshots/README.md')).toBe(
      false
    );
  });
});

describe('getChangedSnapshots', () => {
  it('filters a changed-files list down to snapshot PNGs', () => {
    const changedFiles = [
      'src/components/Hero.tsx',
      'tests/visual/character-detail.spec.ts-snapshots/character-detail-chromium-darwin.png',
      'README.md',
    ];
    expect(getChangedSnapshots(changedFiles)).toEqual([
      'tests/visual/character-detail.spec.ts-snapshots/character-detail-chromium-darwin.png',
    ]);
  });
});

describe('hasMixedChange', () => {
  it('is true when a diff touches both src/** and a snapshot png', () => {
    const changedFiles = [
      'src/components/Hero.tsx',
      'tests/visual/character-detail.spec.ts-snapshots/character-detail-chromium-darwin.png',
    ];
    expect(hasMixedChange(changedFiles)).toBe(true);
  });

  it('is false when only src/** changed', () => {
    expect(hasMixedChange(['src/components/Hero.tsx'])).toBe(false);
  });

  it('is false when only a snapshot changed', () => {
    expect(
      hasMixedChange([
        'tests/visual/character-detail.spec.ts-snapshots/character-detail-chromium-darwin.png',
      ])
    ).toBe(false);
  });
});

describe('findUndocumentedSnapshots', () => {
  it('flags a changed snapshot whose filename is absent from the PR body', () => {
    const changed = ['tests/visual/world-creation.spec.ts-snapshots/world-form-chromium-darwin.png'];
    expect(findUndocumentedSnapshots(changed, 'Closes #1. No baseline notes here.')).toEqual(
      changed
    );
  });

  it('does not flag a changed snapshot named in the PR body', () => {
    const changed = ['tests/visual/world-creation.spec.ts-snapshots/world-form-chromium-darwin.png'];
    const body = 'Baseline changes:\n- world-form-chromium-darwin.png - spacing fix';
    expect(findUndocumentedSnapshots(changed, body)).toEqual([]);
  });

  it('treats a missing PR body as documenting nothing', () => {
    const changed = ['tests/visual/world-creation.spec.ts-snapshots/world-form-chromium-darwin.png'];
    expect(findUndocumentedSnapshots(changed, undefined)).toEqual(changed);
  });

  it('does not count a filename that only appears inside an HTML comment', () => {
    const changed = ['tests/visual/world-creation.spec.ts-snapshots/world-form-chromium-darwin.png'];
    const body =
      '## Visual Baseline Changes\n<!-- e.g. "world-form-chromium-darwin.png - spacing fix" -->\n';
    expect(findUndocumentedSnapshots(changed, body)).toEqual(changed);
  });

  it('still flags a filename named outside the comment even if it also appears inside one', () => {
    const changed = ['tests/visual/world-creation.spec.ts-snapshots/world-form-chromium-darwin.png'];
    const body =
      '<!-- e.g. "world-form-chromium-darwin.png - spacing fix" -->\n' +
      'Baseline changes:\n- world-form-chromium-darwin.png - spacing fix';
    expect(findUndocumentedSnapshots(changed, body)).toEqual([]);
  });

  it('fully strips nested/malformed comment markers, leaving no dangling delimiter', () => {
    const changed = ['tests/visual/world-creation.spec.ts-snapshots/world-form-chromium-darwin.png'];
    // Nested "<!--" inside a comment, plus a stray trailing "-->" with no
    // opener of its own -- the strip should consume the real comment and
    // leave only inert dangling text, never a filename mention that reads
    // as "outside a comment" by accident.
    const body =
      '<!--<!-- world-form-chromium-darwin.png -->--> world-form-chromium-darwin.png - spacing fix';
    expect(findUndocumentedSnapshots(changed, body)).toEqual([]);
  });
});
