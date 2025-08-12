/**
 * Enhanced tests for lore store developer features
 * Issue #182: Store world facts for developer tools and debugging
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';

describe('LoreStore Developer Features', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useLoreStore());
    act(() => {
      // Clear all facts before each test
      Object.keys(result.current.facts).forEach(id => {
        const fact = result.current.facts[id];
        result.current.clearFacts(fact.worldId);
      });
    });
  });

  describe('Fact CRUD Operations', () => {
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
      // The timestamp should be updated (though it might be the same in fast tests)
      expect(new Date(updatedFacts[0].updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(facts[0].updatedAt).getTime()
      );
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

  describe('Duplicate Detection', () => {
    test('should detect exact duplicate facts', () => {
      const { result } = renderHook(() => useLoreStore());
      
      // Add initial fact
      act(() => {
        result.current.addFact(
          'character_alice',
          'Alice the Brave',
          'characters',
          'manual',
          'world-1'
        );
      });

      // Check for exact duplicate
      const isDuplicate = result.current.validateFactUniqueness(
        'world-1',
        'character_alice',
        'Alice the Brave'
      );

      expect(isDuplicate).toBe(false); // false means it's a duplicate
    });

    test('should allow same fact in different worlds', () => {
      const { result } = renderHook(() => useLoreStore());
      
      // Add fact to world-1
      act(() => {
        result.current.addFact(
          'character_alice',
          'Alice the Brave',
          'characters',
          'manual',
          'world-1'
        );
      });

      // Check uniqueness in different world
      const isUnique = result.current.validateFactUniqueness(
        'world-2',
        'character_alice',
        'Alice the Brave'
      );

      expect(isUnique).toBe(true); // true means it's unique
    });

    test('should detect similar facts with fuzzy matching', () => {
      const { result } = renderHook(() => useLoreStore());
      
      // Add initial fact
      act(() => {
        result.current.addFact(
          'character_alice',
          'Alice the Brave',
          'characters',
          'manual',
          'world-1'
        );
      });

      // Check for similar fact (different capitalization/spacing)
      const similarFacts = result.current.findSimilarFacts(
        'world-1',
        'alice the  brave' // extra space, different case
      );

      expect(similarFacts).toHaveLength(1);
      expect(similarFacts[0].value).toBe('Alice the Brave');
    });
  });

  describe('Search Functionality', () => {
    test('should search facts by query string', () => {
      const { result } = renderHook(() => useLoreStore());
      
      // Add various facts
      act(() => {
        result.current.addFact('hero_name', 'Lyra Starweaver', 'characters', 'manual', 'world-1');
        result.current.addFact('villain_name', 'Dark Lord', 'characters', 'manual', 'world-1');
        result.current.addFact('city_name', 'Starfall City', 'locations', 'manual', 'world-1');
      });

      // Search for "star"
      const searchResults = result.current.searchFacts('star', { worldId: 'world-1' });
      
      expect(searchResults).toHaveLength(2);
      expect(searchResults.some(f => f.value === 'Lyra Starweaver')).toBe(true);
      expect(searchResults.some(f => f.value === 'Starfall City')).toBe(true);
    });

    test('should search with category filter', () => {
      const { result } = renderHook(() => useLoreStore());
      
      // Add facts
      act(() => {
        result.current.addFact('hero', 'Star Hero', 'characters', 'manual', 'world-1');
        result.current.addFact('city', 'Star City', 'locations', 'manual', 'world-1');
      });

      // Search for "star" in characters only
      const searchResults = result.current.searchFacts('star', {
        worldId: 'world-1',
        category: 'characters'
      });
      
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].category).toBe('characters');
    });
  });

  describe('Import/Export', () => {
    test('should export facts as JSON', () => {
      const { result } = renderHook(() => useLoreStore());
      
      // Add facts
      act(() => {
        result.current.addFact('fact1', 'value1', 'characters', 'manual', 'world-1');
        result.current.addFact('fact2', 'value2', 'locations', 'manual', 'world-1');
      });

      // Export facts
      const exported = result.current.exportFacts('world-1');
      const parsed = JSON.parse(exported);
      
      expect(parsed.worldId).toBe('world-1');
      expect(parsed.facts).toHaveLength(2);
      expect(parsed.facts[0].key).toBe('fact1');
      expect(parsed.facts[1].key).toBe('fact2');
    });

    test('should import facts from JSON', () => {
      const { result } = renderHook(() => useLoreStore());
      
      const importData = JSON.stringify({
        worldId: 'world-1',
        facts: [
          {
            key: 'imported_hero',
            value: 'Imported Hero',
            category: 'characters',
            source: 'manual',
            metadata: { importance: 'high' }
          },
          {
            key: 'imported_city',
            value: 'Imported City',
            category: 'locations',
            source: 'manual'
          }
        ]
      });

      // Import facts
      act(() => {
        result.current.importFacts('world-1', importData);
      });

      const facts = result.current.getFacts({ worldId: 'world-1' });
      expect(facts).toHaveLength(2);
      expect(facts.some(f => f.value === 'Imported Hero')).toBe(true);
      expect(facts.some(f => f.value === 'Imported City')).toBe(true);
    });

    test('should skip duplicate facts during import', () => {
      const { result } = renderHook(() => useLoreStore());
      
      // Add existing fact
      act(() => {
        result.current.addFact('existing_hero', 'Existing Hero', 'characters', 'manual', 'world-1');
      });

      const importData = JSON.stringify({
        worldId: 'world-1',
        facts: [
          {
            key: 'existing_hero',
            value: 'Existing Hero',
            category: 'characters',
            source: 'manual'
          },
          {
            key: 'new_hero',
            value: 'New Hero',
            category: 'characters',
            source: 'manual'
          }
        ]
      });

      // Import facts
      act(() => {
        result.current.importFacts('world-1', importData);
      });

      const facts = result.current.getFacts({ worldId: 'world-1' });
      expect(facts).toHaveLength(2); // Only one new fact added
    });
  });

  describe('Fact Validation', () => {
    test('should validate fact structure', () => {
      const { result } = renderHook(() => useLoreStore());
      
      // Test valid fact
      const validFact = {
        key: 'valid_key',
        value: 'Valid Value',
        category: 'characters' as const,
        worldId: 'world-1'
      };
      
      expect(result.current.validateFact(validFact)).toBe(true);

      // Test invalid facts
      const invalidKey = { ...validFact, key: '' };
      expect(result.current.validateFact(invalidKey)).toBe(false);

      const invalidValue = { ...validFact, value: '' };
      expect(result.current.validateFact(invalidValue)).toBe(false);

      // @ts-expect-error Testing invalid category
      const invalidCategory = { ...validFact, category: 'invalid' };
      expect(result.current.validateFact(invalidCategory)).toBe(false);
    });

    test('should validate key format', () => {
      const { result } = renderHook(() => useLoreStore());
      
      // Valid keys
      expect(result.current.validateKey('valid_key')).toBe(true);
      expect(result.current.validateKey('key123')).toBe(true);
      expect(result.current.validateKey('KEY_NAME')).toBe(true);

      // Invalid keys
      expect(result.current.validateKey('key with spaces')).toBe(false);
      expect(result.current.validateKey('key-with-dashes')).toBe(false);
      expect(result.current.validateKey('123startswithnumber')).toBe(false);
    });
  });

  describe('Fact History', () => {
    test('should track fact history', () => {
      const { result } = renderHook(() => useLoreStore());
      
      // Add fact
      act(() => {
        result.current.addFact('tracked_fact', 'Version 1', 'characters', 'manual', 'world-1');
      });

      const facts = result.current.getFacts({ worldId: 'world-1' });
      const factId = facts[0].id;

      // Update fact multiple times
      act(() => {
        result.current.updateFact(factId, { value: 'Version 2' });
        result.current.updateFact(factId, { value: 'Version 3' });
      });

      // Get history
      const history = result.current.getFactHistory(factId);
      
      expect(history).toHaveLength(3);
      expect(history[0].value).toBe('Version 1');
      expect(history[1].value).toBe('Version 2');
      expect(history[2].value).toBe('Version 3');
    });
  });
});