/**
 * Tests for lore store deduplication functionality
 * Tests focus on behavior: scanning, merging, and duplicate detection
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { LoreFact } from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';
import {
  scanForDuplicatesImpl,
  mergeFactsImpl,
  checkDuplicateBeforeCreateImpl,
  type DeduplicationContext,
} from '../loreStore.deduplication';

// Mock the fuzzy matcher module
jest.mock('@/lib/lore/fuzzyMatcher', () => ({
  findPotentialDuplicates: jest.fn(),
  checkFactSimilarity: jest.fn(),
}));

import { findPotentialDuplicates, checkFactSimilarity } from '@/lib/lore/fuzzyMatcher';

const mockFindPotentialDuplicates = findPotentialDuplicates as jest.MockedFunction<typeof findPotentialDuplicates>;
const mockCheckFactSimilarity = checkFactSimilarity as jest.MockedFunction<typeof checkFactSimilarity>;

describe('scanForDuplicatesImpl', () => {
  const worldId: EntityID = 'world-123' as EntityID;
  let mockContext: DeduplicationContext;
  let testFacts: LoreFact[];

  beforeEach(() => {
    testFacts = [
      {
        id: 'fact-1' as EntityID,
        worldId,
        category: 'characters',
        key: 'character_gandalf',
        value: 'Gandalf the Grey',
        aliases: [],
        source: 'narrative',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'fact-2' as EntityID,
        worldId,
        category: 'characters',
        key: 'character_gandolf',
        value: 'Gandolf',
        aliases: [],
        source: 'narrative',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    mockContext = {
      getFacts: jest.fn((options) => {
        if (options?.worldId) {
          return testFacts.filter(f => f.worldId === options.worldId);
        }
        return testFacts;
      }),
      updateFact: jest.fn(),
      deleteFact: jest.fn(),
      setAliases: jest.fn(),
      setError: jest.fn(),
    };

    mockFindPotentialDuplicates.mockReturnValue([
      {
        fact1: testFacts[0],
        fact2: testFacts[1],
        confidence: 0.87,
        method: 'levenshtein',
        rationale: 'Names are very similar',
      },
    ]);
  });

  it('finds duplicates in specified world', async () => {
    const duplicates = await scanForDuplicatesImpl(worldId, null, mockContext);

    expect(mockContext.getFacts).toHaveBeenCalledWith({ worldId });
    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].confidence).toBe(0.87);
  });

  it('filters by category when specified', async () => {
    await scanForDuplicatesImpl(worldId, 'characters', mockContext);

    expect(mockFindPotentialDuplicates).toHaveBeenCalledWith(
      expect.anything(),
      worldId,
      expect.objectContaining({ category: 'characters' })
    );
  });

  it('returns empty array when no duplicates found', async () => {
    mockFindPotentialDuplicates.mockReturnValue([]);

    const duplicates = await scanForDuplicatesImpl(worldId, null, mockContext);

    expect(duplicates).toEqual([]);
  });
});

describe('mergeFactsImpl', () => {
  let mockContext: DeduplicationContext;
  let primaryFact: LoreFact;
  let secondaryFact: LoreFact;
  let testFacts: Map<EntityID, LoreFact>;

  beforeEach(() => {
    primaryFact = {
      id: 'fact-primary' as EntityID,
      worldId: 'world-123' as EntityID,
      category: 'characters',
      key: 'character_gandalf',
      value: 'Gandalf the Grey',
      aliases: ['Mithrandir'],
      source: 'narrative',
      metadata: {
        importance: 'high',
        tags: ['wizard', 'istari'],
        description: 'A powerful wizard',
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    secondaryFact = {
      id: 'fact-secondary' as EntityID,
      worldId: 'world-123' as EntityID,
      category: 'characters',
      key: 'character_gandolf',
      value: 'Gandolf the Gray',
      aliases: ['The Grey Wizard'],
      source: 'narrative',
      metadata: {
        importance: 'medium',
        tags: ['magic user'],
        description: 'A wise sage',
      },
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    };

    testFacts = new Map([
      [primaryFact.id, primaryFact],
      [secondaryFact.id, secondaryFact],
    ]);

    mockContext = {
      getFact: (id: EntityID) => testFacts.get(id),
      getFacts: jest.fn(() => Array.from(testFacts.values())),
      updateFact: jest.fn((id, updates) => {
        const fact = testFacts.get(id);
        if (fact) {
          Object.assign(fact, updates);
        }
      }),
      deleteFact: jest.fn((id) => {
        testFacts.delete(id);
      }),
      setAliases: jest.fn((id, aliases) => {
        const fact = testFacts.get(id);
        if (fact) {
          fact.aliases = aliases;
        }
      }),
      setError: jest.fn(),
    };
  });

  it('merges aliases from both facts', () => {
    mergeFactsImpl(primaryFact.id, secondaryFact.id, mockContext);

    expect(mockContext.setAliases).toHaveBeenCalledWith(
      primaryFact.id,
      expect.arrayContaining(['Mithrandir', 'The Grey Wizard', 'Gandolf the Gray'])
    );
  });

  it('keeps higher importance when merging metadata', () => {
    mergeFactsImpl(primaryFact.id, secondaryFact.id, mockContext);

    const updateCall = (mockContext.updateFact as jest.Mock).mock.calls.find(
      call => call[0] === primaryFact.id
    );

    expect(updateCall).toBeDefined();
    expect(updateCall[1].metadata?.importance).toBe('high');
  });

  it('merges tags from both facts without duplicates', () => {
    mergeFactsImpl(primaryFact.id, secondaryFact.id, mockContext);

    const updateCall = (mockContext.updateFact as jest.Mock).mock.calls.find(
      call => call[0] === primaryFact.id
    );

    expect(updateCall).toBeDefined();
    const mergedTags = updateCall[1].metadata?.tags || [];
    expect(mergedTags).toContain('wizard');
    expect(mergedTags).toContain('istari');
    expect(mergedTags).toContain('magic user');
    // Should not have duplicates
    expect(mergedTags.length).toBe(new Set(mergedTags).size);
  });

  it('deletes the secondary fact after merging', () => {
    mergeFactsImpl(primaryFact.id, secondaryFact.id, mockContext);

    expect(mockContext.deleteFact).toHaveBeenCalledWith(secondaryFact.id);
  });

  it('preserves primary fact ID and key', () => {
    const originalPrimaryId = primaryFact.id;
    const originalPrimaryKey = primaryFact.key;

    mergeFactsImpl(primaryFact.id, secondaryFact.id, mockContext);

    expect(testFacts.has(originalPrimaryId)).toBe(true);
    const updatedPrimary = testFacts.get(originalPrimaryId);
    expect(updatedPrimary?.key).toBe(originalPrimaryKey);
  });

  it('throws error when trying to merge same fact', () => {
    expect(() => {
      mergeFactsImpl(primaryFact.id, primaryFact.id, mockContext);
    }).toThrow();
  });

  it('throws error when primary fact does not exist', () => {
    expect(() => {
      mergeFactsImpl('nonexistent' as EntityID, secondaryFact.id, mockContext);
    }).toThrow();
  });

  it('throws error when secondary fact does not exist', () => {
    expect(() => {
      mergeFactsImpl(primaryFact.id, 'nonexistent' as EntityID, mockContext);
    }).toThrow();
  });

  it('throws error when merging facts from different worlds', () => {
    const differentWorldFact: LoreFact = {
      ...secondaryFact,
      worldId: 'world-456' as EntityID,
    };
    testFacts.set(differentWorldFact.id, differentWorldFact);

    expect(() => {
      mergeFactsImpl(primaryFact.id, differentWorldFact.id, mockContext);
    }).toThrow();
  });

  it('handles facts without metadata gracefully', () => {
    const factWithoutMetadata: LoreFact = {
      ...secondaryFact,
      metadata: undefined,
    };
    testFacts.set(secondaryFact.id, factWithoutMetadata);

    expect(() => {
      mergeFactsImpl(primaryFact.id, secondaryFact.id, mockContext);
    }).not.toThrow();
  });

  it('determines primary based on importance when swapped', () => {
    // Test that merging uses higher importance fact as primary
    const lowImportanceFact: LoreFact = {
      ...primaryFact,
      metadata: { ...primaryFact.metadata, importance: 'low' },
    };
    const highImportanceFact: LoreFact = {
      ...secondaryFact,
      metadata: { ...secondaryFact.metadata, importance: 'high' },
    };

    testFacts.clear();
    testFacts.set(lowImportanceFact.id, lowImportanceFact);
    testFacts.set(highImportanceFact.id, highImportanceFact);

    // When merging, the higher importance should be preserved
    mergeFactsImpl(lowImportanceFact.id, highImportanceFact.id, mockContext);

    const updateCall = (mockContext.updateFact as jest.Mock).mock.calls.find(
      call => call[0] === lowImportanceFact.id
    );

    // The low importance fact gets the high importance from the merge
    expect(updateCall[1].metadata?.importance).toBe('high');
  });
});

describe('checkDuplicateBeforeCreateImpl', () => {
  const worldId: EntityID = 'world-123' as EntityID;
  let mockContext: DeduplicationContext;

  beforeEach(() => {
    mockContext = {
      getFacts: jest.fn(() => [
        {
          id: 'fact-1' as EntityID,
          worldId,
          category: 'characters',
          key: 'character_gandalf',
          value: 'Gandalf',
          aliases: [],
          source: 'narrative',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      updateFact: jest.fn(),
      deleteFact: jest.fn(),
      setAliases: jest.fn(),
      setError: jest.fn(),
    };

    mockCheckFactSimilarity.mockResolvedValue({
      isDuplicate: false,
      confidence: 0.3,
      method: 'levenshtein',
      rationale: 'Different names',
    });
  });

  it('finds high confidence matches before creation', async () => {
    mockCheckFactSimilarity.mockResolvedValue({
      isDuplicate: true,
      confidence: 0.92,
      method: 'levenshtein',
      rationale: 'Very similar names',
    });

    const matches = await checkDuplicateBeforeCreateImpl(
      'Gandolf',
      'characters',
      worldId,
      mockContext
    );

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].confidence).toBeGreaterThan(0.9);
  });

  it('returns empty array when no similar facts exist', async () => {
    const matches = await checkDuplicateBeforeCreateImpl(
      'Frodo Baggins',
      'characters',
      worldId,
      mockContext
    );

    expect(matches).toEqual([]);
  });

  it('only checks facts in the same world and category', async () => {
    await checkDuplicateBeforeCreateImpl(
      'Gandolf',
      'characters',
      worldId,
      mockContext
    );

    expect(mockContext.getFacts).toHaveBeenCalledWith({ worldId });
  });
});
