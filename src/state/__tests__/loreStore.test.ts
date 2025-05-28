/**
 * Tests for lore store
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';
import type { LoreFact, LoreSearchOptions } from '../../types';

// Mock data for testing
const mockLoreFact: Omit<LoreFact, 'id' | 'createdAt' | 'updatedAt'> = {
  category: 'characters',
  title: 'Hero Background',
  content: 'The hero was raised by dragons in the northern peaks',
  source: 'narrative',
  tags: ['hero', 'dragons', 'background'],
  isCanonical: true,
  relatedFacts: [],
  worldId: 'world-1'
};

const mockSecondFact: Omit<LoreFact, 'id' | 'createdAt' | 'updatedAt'> = {
  category: 'locations',
  title: 'Dragon Peak',
  content: 'A mystical mountain where ancient dragons dwell',
  source: 'manual',
  tags: ['dragons', 'mountain', 'mystical'],
  isCanonical: true,
  relatedFacts: [],
  worldId: 'world-1'
};

describe('LoreStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useLoreStore());
    act(() => {
      result.current.clearAllFacts();
    });
  });

  describe('Core CRUD Operations', () => {
    test('should create a new lore fact', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId: string;
      act(() => {
        factId = result.current.createFact(mockLoreFact);
      });

      expect(factId).toBeDefined();
      expect(result.current.facts[factId!]).toBeDefined();
      expect(result.current.facts[factId!].title).toBe('Hero Background');
      expect(result.current.facts[factId!].category).toBe('characters');
      expect(result.current.facts[factId!].worldId).toBe('world-1');
    });

    test('should update an existing lore fact', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId: string;
      act(() => {
        factId = result.current.createFact(mockLoreFact);
      });

      act(() => {
        result.current.updateFact(factId!, {
          title: 'Updated Hero Background',
          content: 'The hero was actually raised by wise dragons'
        });
      });

      expect(result.current.facts[factId!].title).toBe('Updated Hero Background');
      expect(result.current.facts[factId!].content).toBe('The hero was actually raised by wise dragons');
    });

    test('should delete a lore fact', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId: string;
      act(() => {
        factId = result.current.createFact(mockLoreFact);
      });

      expect(result.current.facts[factId!]).toBeDefined();

      act(() => {
        result.current.deleteFact(factId!);
      });

      expect(result.current.facts[factId!]).toBeUndefined();
    });

    test('should get facts by world ID', () => {
      const { result } = renderHook(() => useLoreStore());

      act(() => {
        result.current.createFact(mockLoreFact);
        result.current.createFact({ ...mockSecondFact, worldId: 'world-2' });
      });

      const world1Facts = result.current.getFactsByWorld('world-1');
      const world2Facts = result.current.getFactsByWorld('world-2');

      expect(world1Facts).toHaveLength(1);
      expect(world2Facts).toHaveLength(1);
      expect(world1Facts[0].title).toBe('Hero Background');
      expect(world2Facts[0].title).toBe('Dragon Peak');
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useLoreStore());
      act(() => {
        result.current.createFact(mockLoreFact);
        result.current.createFact(mockSecondFact);
      });
    });

    test('should search facts by category', () => {
      const { result } = renderHook(() => useLoreStore());

      const searchOptions: LoreSearchOptions = {
        category: 'characters',
        worldId: 'world-1'
      };

      const results = result.current.searchFacts(searchOptions);
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('characters');
      expect(results[0].title).toBe('Hero Background');
    });

    test('should search facts by tags', () => {
      const { result } = renderHook(() => useLoreStore());

      const searchOptions: LoreSearchOptions = {
        tags: ['dragons'],
        worldId: 'world-1'
      };

      const results = result.current.searchFacts(searchOptions);
      expect(results).toHaveLength(2);
      results.forEach(fact => {
        expect(fact.tags).toContain('dragons');
      });
    });

    test('should search facts by text content', () => {
      const { result } = renderHook(() => useLoreStore());

      const searchOptions: LoreSearchOptions = {
        searchTerm: 'mystical',
        worldId: 'world-1'
      };

      const results = result.current.searchFacts(searchOptions);
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('mystical');
    });

    test('should combine multiple search criteria', () => {
      const { result } = renderHook(() => useLoreStore());

      const searchOptions: LoreSearchOptions = {
        category: 'locations',
        tags: ['mountain'],
        source: 'manual',
        worldId: 'world-1'
      };

      const results = result.current.searchFacts(searchOptions);
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('locations');
      expect(results[0].tags).toContain('mountain');
      expect(results[0].source).toBe('manual');
    });
  });

  describe('AI Context Generation', () => {
    test('should generate lore context for AI prompts', () => {
      const { result } = renderHook(() => useLoreStore());

      act(() => {
        result.current.createFact(mockLoreFact);
        result.current.createFact(mockSecondFact);
      });

      const context = result.current.getLoreContext('world-1', ['dragons']);

      expect(context.factCount).toBe(2);
      expect(context.relevantFacts).toHaveLength(2);
      expect(context.contextSummary).toContain('dragons');
      context.relevantFacts.forEach(fact => {
        expect(fact.tags).toContain('dragons');
      });
    });

    test('should limit context size when many facts exist', () => {
      const { result } = renderHook(() => useLoreStore());

      // Create many facts
      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.createFact({
            ...mockLoreFact,
            title: `Fact ${i}`,
            tags: ['common-tag']
          });
        }
      });

      const context = result.current.getLoreContext('world-1', ['common-tag'], 10);

      expect(context.factCount).toBeLessThanOrEqual(10);
      expect(context.relevantFacts).toHaveLength(10);
    });
  });

  describe('Fact Extraction', () => {
    test('should extract facts from narrative text', () => {
      const { result } = renderHook(() => useLoreStore());

      const narrativeText = 'The ancient tower of Valdris stands guard over the valley. Sir Marcus, the knight commander, leads the defense.';

      act(() => {
        result.current.extractFactsFromText(narrativeText, 'world-1', 'narrative');
      });

      // Should have extracted location and character facts
      const facts = result.current.getFactsByWorld('world-1');
      expect(facts.length).toBeGreaterThan(0);
      
      const locationFacts = facts.filter(f => f.category === 'locations');
      const characterFacts = facts.filter(f => f.category === 'characters');
      
      expect(locationFacts.length).toBeGreaterThan(0);
      expect(characterFacts.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle updating non-existent fact gracefully', () => {
      const { result } = renderHook(() => useLoreStore());

      expect(() => {
        act(() => {
          result.current.updateFact('non-existent-id', { title: 'New Title' });
        });
      }).not.toThrow();

      expect(result.current.error).toBeNull();
    });

    test('should handle deleting non-existent fact gracefully', () => {
      const { result } = renderHook(() => useLoreStore());

      expect(() => {
        act(() => {
          result.current.deleteFact('non-existent-id');
        });
      }).not.toThrow();

      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading States', () => {
    test('should track loading state during operations', () => {
      const { result } = renderHook(() => useLoreStore());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });
});