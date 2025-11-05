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
});
