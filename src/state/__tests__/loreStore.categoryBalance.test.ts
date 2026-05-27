import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';
import { setupLoreStore } from './loreStore.testHelpers';
import type { LoreCategory } from '@/types/lore.types';

describe('LoreStore - Category-Balanced getLoreContext', () => {
  beforeEach(() => {
    setupLoreStore();
  });

  function seedFacts(
    add: ReturnType<typeof useLoreStore.getState>['addFact'],
    counts: Partial<Record<LoreCategory, number>>
  ) {
    for (const [category, count] of Object.entries(counts) as [LoreCategory, number][]) {
      for (let i = 0; i < count; i++) {
        add(
          `world-1:${category}_${i}`,
          `${category} ${i}`,
          category,
          'manual',
          'world-1',
          undefined,
          { importance: i === 0 ? 'high' : 'medium' }
        );
      }
    }
  }

  it('does not guarantee per-category representation by default', () => {
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      // All characters at medium importance, only one fact for other categories at low importance.
      const add = result.current.addFact;
      for (let i = 0; i < 10; i++) {
        add(`world-1:characters_${i}`, `Character ${i}`, 'characters', 'manual', 'world-1', undefined, { importance: 'medium' });
      }
      add('world-1:locations_0', 'Location 0', 'locations', 'manual', 'world-1', undefined, { importance: 'low' });
      add('world-1:rules_0', 'Rule 0', 'rules', 'manual', 'world-1', undefined, { importance: 'low' });
    });

    const context = result.current.getLoreContext('world-1', undefined, 5);
    const categories = context.facts.map((s) => s.split(':')[0]);

    // Default sort: medium-importance characters crowd out low-importance locations/rules.
    expect(categories.filter((c) => c === 'characters').length).toBe(5);
    expect(categories).not.toContain('locations');
    expect(categories).not.toContain('rules');
  });

  it('guarantees per-category representation when categoryBalanced is true', () => {
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      seedFacts(result.current.addFact, {
        characters: 10,
        locations: 2,
        rules: 1,
        events: 1,
      });
    });

    const context = result.current.getLoreContext('world-1', undefined, 6, {
      categoryBalanced: true,
    });
    const categories = context.facts.map((s) => s.split(':')[0]);

    expect(categories).toContain('characters');
    expect(categories).toContain('locations');
    expect(categories).toContain('rules');
    expect(categories).toContain('events');
    expect(context.factCount).toBe(6);
  });

  it('falls back gracefully when categories are missing', () => {
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      seedFacts(result.current.addFact, { characters: 3, locations: 1 });
    });

    const context = result.current.getLoreContext('world-1', undefined, 10, {
      categoryBalanced: true,
    });

    // Should pull everything available without throwing or padding.
    expect(context.factCount).toBe(4);
  });

  it('prefers high-importance facts within each category', () => {
    const { result } = renderHook(() => useLoreStore());

    act(() => {
      // First addFact for each category gets 'high', rest get 'medium'.
      seedFacts(result.current.addFact, {
        characters: 3,
        locations: 3,
        rules: 3,
        events: 3,
      });
    });

    const context = result.current.getLoreContext('world-1', undefined, 4, {
      categoryBalanced: true,
    });

    // Each category's "0" entry (high-importance) should land before lower-importance siblings.
    for (const category of ['characters', 'locations', 'rules', 'events']) {
      const firstFromCategory = context.facts.find((s) => s.startsWith(`${category}:`));
      expect(firstFromCategory).toMatch(new RegExp(`${category}_0`));
    }
  });
});
