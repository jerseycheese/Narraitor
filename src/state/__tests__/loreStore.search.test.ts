/**
 * Tests for LoreStore Duplicate Detection and Search
 *
 * Verifies duplicate detection, fuzzy matching, and search functionality.
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';
import { setupLoreStore } from './loreStore.testHelpers';

describe('LoreStore - Duplicate Detection and Search', () => {
  beforeEach(() => {
    setupLoreStore();
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

  describe('Alias Search Functionality', () => {
    test('should find entity by canonical name', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add fact with aliases
      let factId: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera']);
      });

      // Search by canonical name
      const searchResults = result.current.searchFacts('Lady Seraphina', { worldId: 'world-1' });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].value).toBe('Lady Seraphina');
    });

    test('should find entity by any alias', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add fact with aliases
      let factId: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera', 'The Mysterious Woman']);
      });

      // Search by first alias
      const results1 = result.current.searchFacts('Seraphina', { worldId: 'world-1' });
      expect(results1).toHaveLength(1);
      expect(results1[0].value).toBe('Lady Seraphina');

      // Search by second alias
      const results2 = result.current.searchFacts('Lady Sera', { worldId: 'world-1' });
      expect(results2).toHaveLength(1);
      expect(results2[0].value).toBe('Lady Seraphina');

      // Search by third alias
      const results3 = result.current.searchFacts('Mysterious Woman', { worldId: 'world-1' });
      expect(results3).toHaveLength(1);
      expect(results3[0].value).toBe('Lady Seraphina');
    });

    test('should handle partial alias matches', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add fact with aliases
      let factId: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera']);
      });

      // Search with partial alias
      const searchResults = result.current.searchFacts('Sera', { worldId: 'world-1' });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].value).toBe('Lady Seraphina');
    });

    test('should find multiple entities with matching aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add multiple facts with "Lady" in aliases
      let factId1: string, factId2: string;
      act(() => {
        factId1 = result.current.addFact(
          'character:lady-seraphina',
          'Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId1, ['Lady Seraphina', 'Lady Sera']);

        factId2 = result.current.addFact(
          'character:lady-victoria',
          'Victoria',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId2, ['Lady Victoria', 'Vicky']);
      });

      // Search for "Lady"
      const searchResults = result.current.searchFacts('Lady', { worldId: 'world-1' });

      expect(searchResults).toHaveLength(2);
      expect(searchResults.some(f => f.value === 'Seraphina')).toBe(true);
      expect(searchResults.some(f => f.value === 'Victoria')).toBe(true);
    });

    test('should handle search with category filter and aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add character and location with similar aliases
      let charFactId: string, locFactId: string;
      act(() => {
        charFactId = result.current.addFact(
          'character:starweaver',
          'Lyra Starweaver',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(charFactId, ['Star Mage', 'The Starweaver']);

        locFactId = result.current.addFact(
          'location:star-tower',
          'The Star Tower',
          'locations',
          'manual',
          'world-1'
        );
        result.current.setAliases(locFactId, ['Star Observatory']);
      });

      // Search for "star" in characters only
      const searchResults = result.current.searchFacts('star', {
        worldId: 'world-1',
        category: 'characters'
      });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].category).toBe('characters');
      expect(searchResults[0].value).toBe('Lyra Starweaver');
    });
  });

  describe('findSimilarFacts with Aliases', () => {
    test('should find similar facts by canonical name', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add fact with aliases
      let factId: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera']);
      });

      // Find similar using normalized canonical name
      const similarFacts = result.current.findSimilarFacts('world-1', 'lady  seraphina');

      expect(similarFacts).toHaveLength(1);
      expect(similarFacts[0].value).toBe('Lady Seraphina');
    });

    test('should find similar facts by alias', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add fact with aliases
      let factId: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera']);
      });

      // Find similar using normalized alias
      const similarFacts1 = result.current.findSimilarFacts('world-1', 'seraphina');
      expect(similarFacts1).toHaveLength(1);
      expect(similarFacts1[0].value).toBe('Lady Seraphina');

      const similarFacts2 = result.current.findSimilarFacts('world-1', 'lady  sera');
      expect(similarFacts2).toHaveLength(1);
      expect(similarFacts2[0].value).toBe('Lady Seraphina');
    });

    test('should handle case-insensitive alias matching', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add fact with aliases
      let factId: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera']);
      });

      // Find similar with different cases
      const similarFacts1 = result.current.findSimilarFacts('world-1', 'SERAPHINA');
      const similarFacts2 = result.current.findSimilarFacts('world-1', 'LaDy SeRa');

      expect(similarFacts1).toHaveLength(1);
      expect(similarFacts2).toHaveLength(1);
      expect(similarFacts1[0].value).toBe('Lady Seraphina');
      expect(similarFacts2[0].value).toBe('Lady Seraphina');
    });
  });
});
