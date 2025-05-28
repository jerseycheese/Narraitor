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
        title: 'Test Character Background',
        content: 'Character has a mysterious past',
        source: 'manual',
        tags: ['mystery', 'background'],
        isCanonical: true,
        relatedFacts: [],
        worldId: 'world-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      expect(loreFact.id).toBe('fact-1');
      expect(loreFact.category).toBe('characters');
      expect(loreFact.title).toBe('Test Character Background');
      expect(loreFact.content).toBe('Character has a mysterious past');
      expect(loreFact.source).toBe('manual');
      expect(loreFact.tags).toEqual(['mystery', 'background']);
      expect(loreFact.isCanonical).toBe(true);
      expect(loreFact.worldId).toBe('world-1');
    });

    test('should support all category types', () => {
      const categories: LoreCategory[] = [
        'characters', 'locations', 'events', 'rules', 'items', 'organizations'
      ];

      categories.forEach(category => {
        const fact: Partial<LoreFact> = { category };
        expect(fact.category).toBe(category);
      });
    });

    test('should support all source types', () => {
      const sources: LoreSource[] = [
        'narrative', 'manual', 'ai_generated', 'imported'
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
        tags: ['important', 'plot'],
        source: 'narrative',
        searchTerm: 'dragon',
        worldId: 'world-1',
        isCanonical: true
      };

      expect(searchOptions.category).toBe('characters');
      expect(searchOptions.tags).toEqual(['important', 'plot']);
      expect(searchOptions.source).toBe('narrative');
      expect(searchOptions.searchTerm).toBe('dragon');
      expect(searchOptions.worldId).toBe('world-1');
      expect(searchOptions.isCanonical).toBe(true);
    });

    test('should allow partial search options', () => {
      const partialSearch: LoreSearchOptions = {
        category: 'locations'
      };

      expect(partialSearch.category).toBe('locations');
      expect(partialSearch.tags).toBeUndefined();
      expect(partialSearch.searchTerm).toBeUndefined();
    });
  });

  describe('LoreContext', () => {
    test('should structure AI context data', () => {
      const mockFact: LoreFact = {
        id: 'fact-1',
        category: 'characters',
        title: 'Hero Origin',
        content: 'The hero was born in the northern mountains',
        source: 'narrative',
        tags: ['hero', 'origin'],
        isCanonical: true,
        relatedFacts: [],
        worldId: 'world-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      const loreContext: LoreContext = {
        relevantFacts: [mockFact],
        contextSummary: 'Hero background and origin story',
        factCount: 1
      };

      expect(loreContext.relevantFacts).toHaveLength(1);
      expect(loreContext.relevantFacts[0]).toBe(mockFact);
      expect(loreContext.contextSummary).toBe('Hero background and origin story');
      expect(loreContext.factCount).toBe(1);
    });
  });
});