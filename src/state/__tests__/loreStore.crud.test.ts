/**
 * Tests for LoreStore CRUD Operations and AI Context
 *
 * Verifies updating, deleting facts and generating AI context.
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';
import { setupLoreStore } from './loreStore.testHelpers';

describe('LoreStore - CRUD Operations', () => {
  beforeEach(() => {
    setupLoreStore();
  });

  describe('AI Context', () => {
    test('should generate lore context for AI', () => {
      const { result } = renderHook(() => useLoreStore());

      act(() => {
        result.current.addFact('hero_name', 'Lyra', 'characters', 'manual', 'test-world');
        result.current.addFact('magic_rule', 'Magic requires sacrifice', 'rules', 'manual', 'test-world');
      });

      const context = result.current.getLoreContext('test-world');

      expect(context.factCount).toBe(2);
      expect(context.facts).toContain('characters: hero_name = Lyra');
      expect(context.facts).toContain('rules: magic_rule = Magic requires sacrifice');
    });

    test('should limit context size', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add more facts than the limit
      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addFact(
            `fact_${i}`,
            `value_${i}`,
            'characters',
            'manual',
            'test-world'
          );
        }
      });

      const context = result.current.getLoreContext('test-world', undefined, 5);
      expect(context.factCount).toBe(5);
    });

    describe('Importance-based sorting', () => {
      test('should prioritize high-importance facts over low-importance', () => {
        const { result } = renderHook(() => useLoreStore());

        act(() => {
          // Add facts in reverse importance order to test sorting
          result.current.addFact('background_npc', 'Random Guard', 'characters', 'narrative', 'test-world', undefined, { importance: 'low' });
          result.current.addFact('main_hero', 'Lyra the Brave', 'characters', 'narrative', 'test-world', undefined, { importance: 'high' });
          result.current.addFact('side_character', 'Merchant Bob', 'characters', 'narrative', 'test-world', undefined, { importance: 'medium' });
        });

        const context = result.current.getLoreContext('test-world');

        // High importance should be first, then medium, then low
        expect(context.facts[0]).toContain('Lyra the Brave');
        expect(context.facts[1]).toContain('Merchant Bob');
        expect(context.facts[2]).toContain('Random Guard');
      });

      test('should use recency as tiebreaker within same importance level', () => {
        const { result } = renderHook(() => useLoreStore());

        // Add facts with explicit delay to ensure different timestamps
        act(() => {
          result.current.addFact('old_villain', 'Old Villain', 'characters', 'narrative', 'test-world', undefined, { importance: 'high' });
        });

        // Wait 1ms to ensure different timestamp
        const startTime = Date.now();
        while (Date.now() - startTime < 2) {
          // Busy wait to ensure time passes
        }

        act(() => {
          result.current.addFact('new_villain', 'New Villain', 'characters', 'narrative', 'test-world', undefined, { importance: 'high' });
        });

        const context = result.current.getLoreContext('test-world');

        // Among high-importance facts, newer should come first
        const newVillainIndex = context.facts.findIndex(f => f.includes('New Villain'));
        const oldVillainIndex = context.facts.findIndex(f => f.includes('Old Villain'));
        expect(newVillainIndex).toBeLessThan(oldVillainIndex);
      });

      test('should treat undefined importance as lowest priority', () => {
        const { result } = renderHook(() => useLoreStore());

        act(() => {
          result.current.addFact('unimportant_fact', 'No importance', 'characters', 'manual', 'test-world');
          result.current.addFact('low_fact', 'Low importance', 'characters', 'manual', 'test-world', undefined, { importance: 'low' });
          result.current.addFact('high_fact', 'High importance', 'characters', 'manual', 'test-world', undefined, { importance: 'high' });
        });

        const context = result.current.getLoreContext('test-world');

        // High > low > undefined
        expect(context.facts[0]).toContain('High importance');
        expect(context.facts[1]).toContain('Low importance');
        expect(context.facts[2]).toContain('No importance');
      });

      test('should handle mixed importance levels and categories correctly', () => {
        const { result } = renderHook(() => useLoreStore());

        act(() => {
          result.current.addFact('low_char', 'Low Character', 'characters', 'narrative', 'test-world', undefined, { importance: 'low' });
          result.current.addFact('high_loc', 'High Location', 'locations', 'narrative', 'test-world', undefined, { importance: 'high' });
          result.current.addFact('med_event', 'Medium Event', 'events', 'narrative', 'test-world', undefined, { importance: 'medium' });
          result.current.addFact('high_rule', 'High Rule', 'rules', 'manual', 'test-world', undefined, { importance: 'high' });
          result.current.addFact('med_char', 'Medium Character', 'characters', 'narrative', 'test-world', undefined, { importance: 'medium' });
        });

        const context = result.current.getLoreContext('test-world');

        expect(context.factCount).toBe(5);

        // First two should be high-importance
        const highFacts = context.facts.slice(0, 2);
        expect(highFacts.some(f => f.includes('High Location'))).toBe(true);
        expect(highFacts.some(f => f.includes('High Rule'))).toBe(true);

        // Next two should be medium-importance
        const mediumFacts = context.facts.slice(2, 4);
        expect(mediumFacts.some(f => f.includes('Medium Event'))).toBe(true);
        expect(mediumFacts.some(f => f.includes('Medium Character'))).toBe(true);

        // Last should be low-importance
        expect(context.facts[4]).toContain('Low Character');
      });

      test('should respect increased default limit of 20 facts', () => {
        const { result } = renderHook(() => useLoreStore());

        act(() => {
          // Add 25 facts to test the new default limit
          for (let i = 0; i < 25; i++) {
            result.current.addFact(
              `fact_${i}`,
              `value_${i}`,
              'characters',
              'manual',
              'test-world',
              undefined,
              { importance: i % 2 === 0 ? 'high' : 'low' }
            );
          }
        });

        // Without explicit limit, should return 20 (new default)
        const context = result.current.getLoreContext('test-world');
        expect(context.factCount).toBe(20);

        // Should still respect explicit limits
        const limitedContext = result.current.getLoreContext('test-world', undefined, 5);
        expect(limitedContext.factCount).toBe(5);
      });
    });
  });

});
