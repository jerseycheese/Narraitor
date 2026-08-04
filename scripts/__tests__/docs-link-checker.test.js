/**
 * @jest-environment node
 *
 * Unit tests for the pure doc-link-checking logic (issue #1651). Fixture-based
 * and deterministic -- no real fs, so it stays green in CI.
 */

import { slugify, extractHeadingSlugs, findBrokenLinks } from '../docs-link-checker.js';

describe('slugify', () => {
  it('lowercases and hyphenates a plain heading', () => {
    expect(slugify('Getting Started')).toBe('getting-started');
  });

  it('strips punctuation GitHub would also strip', () => {
    expect(slugify('What is Narraitor?')).toBe('what-is-narraitor');
  });

  it('keeps existing hyphens', () => {
    expect(slugify('ADR-013: Collapse to DS3')).toBe('adr-013-collapse-to-ds3');
  });
});

describe('extractHeadingSlugs', () => {
  it('collects every heading level as a slug', () => {
    const content = '# Title\n\nSome text.\n\n## A Section\n\n### A Subsection\n';
    expect(extractHeadingSlugs(content)).toEqual(
      new Set(['title', 'a-section', 'a-subsection'])
    );
  });

  it('ignores non-heading lines', () => {
    expect(extractHeadingSlugs('Not a heading\n# Real Heading')).toEqual(
      new Set(['real-heading'])
    );
  });

  it('suffixes repeated headings the way GitHub does (-1, -2, ...)', () => {
    const content = '## Usage\n\ntext\n\n## Usage\n\nmore text\n\n## Usage\n';
    expect(extractHeadingSlugs(content)).toEqual(new Set(['usage', 'usage-1', 'usage-2']));
  });
});

describe('findBrokenLinks', () => {
  // A minimal fs stub: only /docs/exists.md and /docs/target.md "exist".
  function fakeFs({ headings = new Set() } = {}) {
    const existing = new Set(['/docs/exists.md', '/docs/target.md', '/docs/self.md']);
    return {
      exists: (p) => existing.has(p),
      isMarkdownFile: (p) => p.endsWith('.md') && existing.has(p),
      headingSlugs: () => headings,
      resolve: (fromFile, target) =>
        target.startsWith('/') ? target : `/docs/${target.replace(/^\.\//, '')}`,
    };
  }

  it('passes a link to a file that exists', () => {
    const content = '[see this](exists.md)';
    expect(findBrokenLinks(content, fakeFs(), '/docs/self.md')).toEqual([]);
  });

  it('flags a link to a file that does not exist', () => {
    const content = '[broken](missing.md)';
    const broken = findBrokenLinks(content, fakeFs(), '/docs/self.md');
    expect(broken).toEqual([{ target: 'missing.md', reason: 'target does not exist' }]);
  });

  it('flags an anchor with no matching heading', () => {
    const content = '[jump](target.md#nope)';
    const broken = findBrokenLinks(content, fakeFs({ headings: new Set(['real-heading']) }), '/docs/self.md');
    expect(broken).toEqual([
      { target: 'target.md#nope', reason: 'no heading matches anchor "#nope"' },
    ]);
  });

  it('passes an anchor that matches a heading', () => {
    const content = '[jump](target.md#real-heading)';
    const broken = findBrokenLinks(content, fakeFs({ headings: new Set(['real-heading']) }), '/docs/self.md');
    expect(broken).toEqual([]);
  });

  it('resolves a bare #anchor against the doc itself', () => {
    const content = '[jump](#real-heading)';
    const broken = findBrokenLinks(content, fakeFs({ headings: new Set(['real-heading']) }), '/docs/self.md');
    expect(broken).toEqual([]);
  });

  it('ignores absolute URLs', () => {
    const content = '[external](https://example.com/nope)';
    expect(findBrokenLinks(content, fakeFs(), '/docs/self.md')).toEqual([]);
  });

  it('ignores links inside fenced code blocks', () => {
    const content = '```md\n[example](missing.md)\n```';
    expect(findBrokenLinks(content, fakeFs(), '/docs/self.md')).toEqual([]);
  });

  it('checks image targets the same as links', () => {
    const content = '![alt text](missing.png)';
    const broken = findBrokenLinks(content, fakeFs(), '/docs/self.md');
    expect(broken).toEqual([{ target: 'missing.png', reason: 'target does not exist' }]);
  });

  it('resolves a link with a title, ignoring the title text', () => {
    const content = '[see this](exists.md "read more")';
    expect(findBrokenLinks(content, fakeFs(), '/docs/self.md')).toEqual([]);
  });

  it('flags a broken link even when it carries a title', () => {
    const content = "[broken](missing.md 'read more')";
    const broken = findBrokenLinks(content, fakeFs(), '/docs/self.md');
    expect(broken).toEqual([{ target: "missing.md 'read more'", reason: 'target does not exist' }]);
  });

  it('resolves an anchor into the second occurrence of a repeated heading', () => {
    const broken = findBrokenLinks(
      '[jump](target.md#usage-1)',
      fakeFs({ headings: new Set(['usage', 'usage-1']) }),
      '/docs/self.md'
    );
    expect(broken).toEqual([]);
  });
});
