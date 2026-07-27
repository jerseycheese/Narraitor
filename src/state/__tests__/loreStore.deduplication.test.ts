/**
 * Tests for lore store fact merging behavior
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { LoreFact } from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';
import {
  mergeFactsImpl,
  type DeduplicationContext,
} from '../loreStore.deduplication';

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
      visibility: 'world-shared',
      metadata: {
        importance: 'high',
        tags: ['wizard', 'istari'],
        description: 'A powerful wizard',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    secondaryFact = {
      id: 'fact-secondary' as EntityID,
      worldId: 'world-123' as EntityID,
      category: 'characters',
      key: 'character_gandolf',
      value: 'Gandolf the Gray',
      aliases: ['The Grey Wizard'],
      source: 'narrative',
      visibility: 'world-shared',
      metadata: {
        importance: 'medium',
        tags: ['magic user'],
        description: 'A wise sage',
      },
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
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

    // The merge should still proceed and update the primary despite missing metadata.
    expect(mockContext.updateFact).toHaveBeenCalledWith(
      primaryFact.id,
      expect.any(Object)
    );
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

    // When merging, the higher importance fact should become the actual primary
    mergeFactsImpl(lowImportanceFact.id, highImportanceFact.id, mockContext);

    // The update should be on the high importance fact (actual primary after swap)
    const updateCall = (mockContext.updateFact as jest.Mock).mock.calls.find(
      call => call[0] === highImportanceFact.id
    );

    // The high importance fact remains as high importance
    expect(updateCall).toBeDefined();
    expect(updateCall[1].metadata?.importance).toBe('high');

    // The low importance fact should be deleted
    expect(mockContext.deleteFact).toHaveBeenCalledWith(lowImportanceFact.id);
  });
});
