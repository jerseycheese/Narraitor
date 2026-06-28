/**
 * @jest-environment node
 *
 * Unit tests for the design-system canon guard's pure matching logic (#1486).
 * Fixture-based and deterministic — no fs, no live codebase scan.
 */

import {
  isStoryableComponentFile,
  componentNameFromPath,
  collectComponentImportSegments,
  findUncovered,
  dedupeByName,
} from '../ds-canon-lib.cjs';

describe('isStoryableComponentFile', () => {
  it('accepts a real component file', () => {
    expect(isStoryableComponentFile('src/components/shared/Hero.tsx')).toBe(true);
    expect(isStoryableComponentFile('src/components/ui/EmptyState/EmptyState.tsx')).toBe(true);
  });

  it('rejects tests, stories, and barrel indexes', () => {
    expect(isStoryableComponentFile('src/components/ui/button.test.tsx')).toBe(false);
    expect(isStoryableComponentFile('src/components/ui/button.stories.tsx')).toBe(false);
    expect(isStoryableComponentFile('src/components/shared/index.tsx')).toBe(false);
    expect(isStoryableComponentFile('src/components/shared/cards/index.ts')).toBe(false);
  });
});

describe('componentNameFromPath', () => {
  it('returns the basename without the React extension', () => {
    expect(componentNameFromPath('src/components/ui/button.tsx')).toBe('button');
    expect(componentNameFromPath('src/components/shared/cards/ActiveStateCard.tsx')).toBe('ActiveStateCard');
    expect(componentNameFromPath('src/components/ui/toast/toast.tsx')).toBe('toast');
  });
});

describe('collectComponentImportSegments', () => {
  it('captures every path segment of @/components imports', () => {
    const segs = collectComponentImportSegments([
      "import { Hero } from '@/components/shared/Hero';",
      "import ActiveStateCard from '@/components/shared/cards/ActiveStateCard';",
      "import { Button } from '@/components/ui/button';",
    ]);
    expect(segs.has('Hero')).toBe(true);
    expect(segs.has('ActiveStateCard')).toBe(true);
    expect(segs.has('cards')).toBe(true);
    expect(segs.has('button')).toBe(true);
  });

  it('ignores non-component imports', () => {
    const segs = collectComponentImportSegments([
      "import { useWorldStore } from '@/state/worldStore';",
      "import { getTimestamp } from '@/lib/utils';",
    ]);
    expect(segs.size).toBe(0);
  });
});

describe('findUncovered', () => {
  const names = ['button', 'Hero', 'SimpleModal', 'scroll-area'];

  it('flags names with no story', () => {
    const covered = new Set(['button']);
    expect(findUncovered(names, covered)).toEqual(['Hero', 'SimpleModal', 'scroll-area']);
  });

  it('honors documented exceptions and grandfathered gaps', () => {
    const covered = new Set(['button']);
    const result = findUncovered(names, covered, {
      exceptions: { 'scroll-area': 'behavior wrapper' },
      grandfathered: new Set(['SimpleModal']),
    });
    expect(result).toEqual(['Hero']);
  });

  it('returns nothing when everything is covered or excused', () => {
    const covered = new Set(['button', 'Hero']);
    const result = findUncovered(names, covered, {
      exceptions: { 'scroll-area': 'x' },
      grandfathered: new Set(['SimpleModal']),
    });
    expect(result).toEqual([]);
  });
});

describe('dedupeByName', () => {
  it('keys by component name and skips non-component files', () => {
    const map = dedupeByName([
      'src/components/shared/Hero.tsx',
      'src/components/shared/Hero.test.tsx',
      'src/components/ui/EmptyState/EmptyState.tsx',
    ]);
    expect([...map.keys()].sort()).toEqual(['EmptyState', 'Hero']);
    expect(map.get('Hero')).toBe('src/components/shared/Hero.tsx');
  });
});
