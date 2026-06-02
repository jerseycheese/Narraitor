/**
 * @fileoverview Tests for example selection
 */

import { selectExamples, formatExamples } from './exampleManager';
import { PromptExample } from './types';

const library: PromptExample[] = [
  {
    id: 'select-1',
    name: 'High Priority Scene',
    description: 'High priority example',
    content: 'Short content.',
    categories: ['scene'],
    priority: 'high',
    tokenCount: 10,
    tags: ['formatting'],
  },
  {
    id: 'select-2',
    name: 'Medium Priority Scene',
    description: 'Medium priority example',
    content: 'Medium length content here.',
    categories: ['scene'],
    priority: 'medium',
    tokenCount: 20,
    tags: ['formatting'],
  },
  {
    id: 'select-3',
    name: 'Low Priority Scene',
    description: 'Low priority example',
    content: 'Another piece of content.',
    categories: ['scene'],
    priority: 'low',
    tokenCount: 15,
  },
  {
    id: 'select-4',
    name: 'Critical Priority Choice',
    description: 'Critical choice example',
    content: 'Important choice example.',
    categories: ['choice'],
    priority: 'critical',
    tokenCount: 25,
  },
  {
    id: 'select-5',
    name: 'Universal Example',
    description: 'Applies to all',
    content: 'Universal content.',
    categories: ['all'],
    priority: 'high',
    tokenCount: 12,
  },
];

describe('selectExamples', () => {
  it('selects examples for a specific category (including "all")', () => {
    const result = selectExamples(library, {
      category: 'scene',
      tokenBudget: 100,
    });

    expect(result.examples.length).toBeGreaterThan(0);
    expect(
      result.examples.every(
        (ex) =>
          ex.categories.includes('scene') || ex.categories.includes('all')
      )
    ).toBe(true);
  });

  it('respects the token budget', () => {
    const result = selectExamples(library, {
      category: 'scene',
      tokenBudget: 25,
    });

    expect(result.totalTokens).toBeLessThanOrEqual(25);
  });

  it('prioritizes high priority examples first', () => {
    const result = selectExamples(library, {
      category: 'scene',
      tokenBudget: 50,
    });

    expect(result.examples[0].priority).toBe('high');
  });

  it('filters by minimum priority', () => {
    const result = selectExamples(library, {
      category: 'scene',
      tokenBudget: 100,
      minPriority: 'medium',
    });

    expect(
      result.examples.every(
        (ex) => ex.priority === 'high' || ex.priority === 'medium'
      )
    ).toBe(true);
  });

  it('filters by tags', () => {
    const result = selectExamples(library, {
      category: 'scene',
      tokenBudget: 100,
      tags: ['formatting'],
    });

    expect(
      result.examples.every((ex) => ex.tags?.includes('formatting'))
    ).toBe(true);
  });

  it('respects the maxExamples limit', () => {
    const result = selectExamples(library, {
      category: 'scene',
      tokenBudget: 100,
      maxExamples: 2,
    });

    expect(result.examples.length).toBeLessThanOrEqual(2);
  });

  it('reports an excluded count', () => {
    const result = selectExamples(library, {
      category: 'scene',
      tokenBudget: 15,
    });

    expect(result.excludedCount).toBeGreaterThan(0);
  });

  it('returns formatted content', () => {
    const result = selectExamples(library, {
      category: 'scene',
      tokenBudget: 100,
    });

    expect(result.formattedContent).toContain('EXAMPLES:');
  });

  it('returns an empty result when nothing matches', () => {
    const result = selectExamples(library, {
      category: 'scene',
      tokenBudget: 100,
      tags: ['non-existent-tag'],
    });

    expect(result.examples).toHaveLength(0);
    expect(result.totalTokens).toBe(0);
    expect(result.formattedContent).toBe('');
  });

  it('includes "all" category examples for any category', () => {
    const result = selectExamples(library, {
      category: 'transition',
      tokenBudget: 100,
    });

    expect(
      result.examples.some((ex) => ex.categories.includes('all'))
    ).toBe(true);
  });

  it('auto-calculates token count when not provided', () => {
    const result = selectExamples(
      [
        {
          id: 'no-tokens',
          name: 'No Tokens',
          description: 'Missing token count',
          content: 'One two three four five.',
          categories: ['scene'],
          priority: 'high',
        },
      ],
      { category: 'scene', tokenBudget: 100 }
    );

    expect(result.examples[0].tokenCount).toBeGreaterThan(0);
  });
});

describe('formatExamples', () => {
  it('returns an empty string for no examples', () => {
    expect(formatExamples([])).toBe('');
  });

  it('formats examples under an EXAMPLES header', () => {
    const formatted = formatExamples(library.slice(0, 1));
    expect(formatted).toContain('EXAMPLES:');
    expect(formatted).toContain('High Priority Scene');
  });
});
