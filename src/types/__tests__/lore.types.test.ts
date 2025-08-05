/**
 * Tests for lore type definitions
 */

import type { 
  LoreFact, 
  LoreCategory, 
  LoreSource, 
  LoreSearchOptions,
  LoreContext 
} from '../lore.types';

describe('Lore Types', () => {
  describe('LoreFact', () => {
    test('should have required properties', () => {
      const loreFact: LoreFact = {
        id: 'fact-1',
        category: 'characters',
        key: 'Test Character Background',
        value: 'Character has a mysterious past',
        source: 'manual',
        worldId: 'world-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        metadata: {
          tags: ['mystery', 'background'],
          importance: 'high'
        }
      };

      expect(loreFact.id).toBe('fact-1');
      expect(loreFact.category).toBe('characters');
      expect(loreFact.key).toBe('Test Character Background');
      expect(loreFact.value).toBe('Character has a mysterious past');
      expect(loreFact.source).toBe('manual');
      expect(loreFact.metadata?.tags).toEqual(['mystery', 'background']);
      expect(loreFact.worldId).toBe('world-1');
    });

    test('should support all category types', () => {
      const categories: LoreCategory[] = [
        'characters', 'locations', 'events', 'rules'
      ];

      categories.forEach(category => {
        const fact: Partial<LoreFact> = { category };
        expect(fact.category).toBe(category);
      });
    });

    test('should support all source types', () => {
      const sources: LoreSource[] = [
        'narrative', 'manual'
      ];

      sources.forEach(source => {
        const fact: Partial<LoreFact> = { source };
        expect(fact.source).toBe(source);
      });
    });
  });

  describe('LoreSearchOptions', () => {
    test('should support all filter options', () => {
      const searchOptions: LoreSearchOptions = {
        category: 'characters',
        worldId: 'world-1',
        sessionId: 'session-1'
      };

      expect(searchOptions.category).toBe('characters');
      expect(searchOptions.worldId).toBe('world-1');
      expect(searchOptions.sessionId).toBe('session-1');
    });

    test('should allow partial search options', () => {
      const partialSearch: LoreSearchOptions = {
        category: 'locations'
      };

      expect(partialSearch.category).toBe('locations');
      expect(partialSearch.worldId).toBeUndefined();
      expect(partialSearch.sessionId).toBeUndefined();
    });
  });

  describe('LoreContext', () => {
    test('should structure AI context data', () => {
      const loreContext: LoreContext = {
        facts: ['Hero Origin: The hero was born in the northern mountains'],
        factCount: 1
      };

      expect(loreContext.facts).toHaveLength(1);
      expect(loreContext.facts[0]).toBe('Hero Origin: The hero was born in the northern mountains');
      expect(loreContext.factCount).toBe(1);
    });
  });
});
