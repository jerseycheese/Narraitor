/**
 * Lore Store Visibility Tests
 * Issue #946: Hybrid lore scoping
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';

// Helper to reset store before each test
const setupLoreStore = () => {
  const { result } = renderHook(() => useLoreStore());
  act(() => {
    result.current.reset();
  });
};

describe('LoreStore - Visibility', () => {
  beforeEach(() => {
    setupLoreStore();
  });

  describe('Default visibility', () => {
    test('addFact defaults to session-private visibility', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId: string;
      act(() => {
        factId = result.current.addFact(
          'hero_name',
          'Lyra',
          'characters',
          'manual',
          'world-1',
          'session-1'
        );
      });

      const fact = result.current.getById(factId!);
      expect(fact?.visibility).toBe('session-private');
    });
  });

  describe('Session-scoped filtering', () => {
    test('getLoreContext returns session-private facts for current session only', () => {
      const { result } = renderHook(() => useLoreStore());

      act(() => {
        // Session 1 private fact
        const id1 = result.current.addFact('fact1', 'value1', 'characters', 'manual', 'world-1', 'session-1');
        result.current.updateFact(id1, { visibility: 'session-private' });

        // Session 2 private fact
        const id2 = result.current.addFact('fact2', 'value2', 'characters', 'manual', 'world-1', 'session-2');
        result.current.updateFact(id2, { visibility: 'session-private' });

        // World-shared fact
        const id3 = result.current.addFact('fact3', 'value3', 'characters', 'manual', 'world-1');
        result.current.updateFact(id3, { visibility: 'world-shared' });
      });

      const context = result.current.getLoreContext('world-1', 'session-1');

      expect(context.factCount).toBe(2); // session-1 private + world-shared
      expect(context.facts.join()).toContain('fact1');
      expect(context.facts.join()).toContain('fact3');
      expect(context.facts.join()).not.toContain('fact2');
    });

    test('getLoreContext returns all world-shared facts to all sessions', () => {
      const { result } = renderHook(() => useLoreStore());

      act(() => {
        const id1 = result.current.addFact('shared1', 'val1', 'characters', 'manual', 'world-1');
        result.current.updateFact(id1, { visibility: 'world-shared' });

        const id2 = result.current.addFact('shared2', 'val2', 'locations', 'manual', 'world-1');
        result.current.updateFact(id2, { visibility: 'world-shared' });
      });

      const context1 = result.current.getLoreContext('world-1', 'session-1');
      const context2 = result.current.getLoreContext('world-1', 'session-2');

      // Both sessions see world-shared facts
      expect(context1.factCount).toBe(2);
      expect(context2.factCount).toBe(2);
    });
  });

  describe('Facts without sessionId', () => {
    test('session-private facts without sessionId are never visible', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId: string;
      act(() => {
        factId = result.current.addFact('orphan', 'val', 'characters', 'manual', 'world-1');
        result.current.updateFact(factId!, { visibility: 'session-private', sessionId: undefined });
      });

      const context = result.current.getLoreContext('world-1', 'session-1');

      expect(context.factCount).toBe(0); // orphan fact not visible
    });
  });

  describe('addStructuredLore behavior', () => {
    test('addStructuredLore creates session-private facts when sessionId provided', () => {
      const { result } = renderHook(() => useLoreStore());

      const extraction = {
        characters: [{ name: 'Lyra', description: 'Hero' }],
        locations: [],
        events: [],
        rules: []
      };

      act(() => {
        result.current.addStructuredLore(extraction, 'world-1', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'world-1' });
      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].visibility).toBe('session-private');
      expect(facts[0].sessionId).toBe('session-1');
    });
  });
});
