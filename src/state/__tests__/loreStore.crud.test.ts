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

      const context = result.current.getLoreContext('test-world', 5);
      expect(context.factCount).toBe(5);
    });
  });

  describe('Update and Delete', () => {
    test('should update an existing fact', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add initial fact
      act(() => {
        result.current.addFact(
          'test_character',
          'Original Name',
          'characters',
          'manual',
          'world-1'
        );
      });

      const facts = result.current.getFacts({ worldId: 'world-1' });
      const factId = facts[0].id;

      // Update the fact
      act(() => {
        result.current.updateFact(factId, {
          value: 'Updated Name',
          metadata: { importance: 'high' }
        });
      });

      const updatedFacts = result.current.getFacts({ worldId: 'world-1' });
      expect(updatedFacts[0].value).toBe('Updated Name');
      expect(updatedFacts[0].metadata?.importance).toBe('high');
      expect(updatedFacts[0].updatedAt).toBeDefined();
    });

    test('should delete a fact', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add facts
      act(() => {
        result.current.addFact('fact1', 'value1', 'characters', 'manual', 'world-1');
        result.current.addFact('fact2', 'value2', 'locations', 'manual', 'world-1');
      });

      const facts = result.current.getFacts({ worldId: 'world-1' });
      expect(facts).toHaveLength(2);

      // Delete one fact
      act(() => {
        result.current.deleteFact(facts[0].id);
      });

      const remainingFacts = result.current.getFacts({ worldId: 'world-1' });
      expect(remainingFacts).toHaveLength(1);
      expect(remainingFacts[0].id).toBe(facts[1].id);
    });
  });
});
