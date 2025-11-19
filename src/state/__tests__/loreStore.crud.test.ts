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

});
