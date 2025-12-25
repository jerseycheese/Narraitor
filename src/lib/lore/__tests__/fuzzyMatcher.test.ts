/**
 * Tests for fuzzy matching functionality
 * Tests focus on behavior and acceptance criteria, not implementation details
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { LoreFact } from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';

// Import functions we're about to implement
import {
  calculateStringSimilarity,
  findPotentialDuplicates,
  checkFactSimilarity,
  type DuplicateMatch,
  type SimilarityResult
} from '../fuzzyMatcher';

describe('calculateStringSimilarity', () => {
  it('returns 1.0 for exact matches', () => {
    expect(calculateStringSimilarity('Gandalf', 'Gandalf')).toBe(1.0);
  });

  it('returns 1.0 for exact matches ignoring case', () => {
    expect(calculateStringSimilarity('Gandalf', 'gandalf')).toBe(1.0);
  });

  it('returns high similarity for minor spelling variations', () => {
    const similarity = calculateStringSimilarity('Gandalf the Grey', 'Gandolf the Gray');
    expect(similarity).toBeGreaterThan(0.80);
    expect(similarity).toBeLessThan(1.0);
  });

  it('returns lower similarity for different names', () => {
    const similarity = calculateStringSimilarity('Gandalf', 'Aragorn');
    expect(similarity).toBeLessThan(0.5);
  });

  it('handles title variations appropriately', () => {
    const similarity = calculateStringSimilarity('Lady Seraphina', 'Seraphina');
    expect(similarity).toBeGreaterThan(0.6);
  });

  it('handles special characters and normalization', () => {
    const similarity = calculateStringSimilarity("Sir John's Tavern", 'Sir Johns Tavern');
    expect(similarity).toBeGreaterThan(0.9);
  });
});

describe('findPotentialDuplicates', () => {
  const worldId: EntityID = 'world-123' as EntityID;
  let testFacts: LoreFact[];

  beforeEach(() => {
    testFacts = [
      {
        id: 'fact-1' as EntityID,
        worldId,
        category: 'characters',
        key: 'character_gandalf',
        value: 'Gandalf the Grey',
        aliases: ['Mithrandir', 'The Grey Wizard'],
        source: 'narrative',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'fact-2' as EntityID,
        worldId,
        category: 'characters',
        key: 'character_gandolf',
        value: 'Gandolf the Gray',
        aliases: [],
        source: 'narrative',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        id: 'fact-3' as EntityID,
        worldId,
        category: 'characters',
        key: 'character_aragorn',
        value: 'Aragorn',
        aliases: ['Strider'],
        source: 'narrative',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
      {
        id: 'fact-4' as EntityID,
        worldId: 'world-456' as EntityID, // Different world
        category: 'characters',
        key: 'character_gandalf',
        value: 'Gandalf',
        aliases: [],
        source: 'narrative',
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04'),
      },
    ];
  });

  it('finds high-confidence duplicates within the same world', () => {
    const duplicates = findPotentialDuplicates(testFacts, worldId, { minConfidence: 0.8 });

    expect(duplicates.length).toBeGreaterThan(0);
    const gandalfMatch = duplicates.find(d =>
      (d.fact1.value === 'Gandalf the Grey' && d.fact2.value === 'Gandolf the Gray') ||
      (d.fact2.value === 'Gandalf the Grey' && d.fact1.value === 'Gandolf the Gray')
    );
    expect(gandalfMatch).toBeDefined();
    expect(gandalfMatch!.confidence).toBeGreaterThan(0.8);
  });

  it('does not match facts from different worlds', () => {
    const duplicates = findPotentialDuplicates(testFacts, worldId);

    // Should not find any duplicates involving fact-4 (different world)
    const crossWorldMatch = duplicates.find(d =>
      d.fact1.worldId !== d.fact2.worldId
    );
    expect(crossWorldMatch).toBeUndefined();
  });

  it('filters by category when specified', () => {
    const locationsWorld = 'world-789' as EntityID;
    const mixedFacts: LoreFact[] = [
      {
        id: 'fact-loc-1' as EntityID,
        worldId: locationsWorld,
        category: 'locations',
        key: 'location_tavern',
        value: 'The Prancing Pony',
        aliases: [],
        source: 'narrative',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'fact-loc-2' as EntityID,
        worldId: locationsWorld,
        category: 'locations',
        key: 'location_inn',
        value: 'Prancing Pony Inn',
        aliases: [],
        source: 'narrative',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'fact-char-1' as EntityID,
        worldId: locationsWorld,
        category: 'characters',
        key: 'character_similar',
        value: 'Prancing Peter',
        aliases: [],
        source: 'narrative',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const locationDuplicates = findPotentialDuplicates(mixedFacts, locationsWorld, { category: 'locations' });

    // Should only find location duplicates, not characters
    locationDuplicates.forEach(dup => {
      expect(dup.fact1.category).toBe('locations');
      expect(dup.fact2.category).toBe('locations');
    });
  });

  it('respects minimum confidence threshold', () => {
    const duplicates = findPotentialDuplicates(testFacts, worldId, { minConfidence: 0.95 });

    // High threshold should filter out medium-confidence matches
    duplicates.forEach(dup => {
      expect(dup.confidence).toBeGreaterThanOrEqual(0.95);
    });
  });

  it('detects alias matches as high confidence', () => {
    const factsWithAliasMatch: LoreFact[] = [
      {
        id: 'fact-a1' as EntityID,
        worldId,
        category: 'characters',
        key: 'character_aragorn_1',
        value: 'Aragorn',
        aliases: ['Strider', 'Elessar'],
        source: 'narrative',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'fact-a2' as EntityID,
        worldId,
        category: 'characters',
        key: 'character_strider',
        value: 'Strider',
        aliases: [],
        source: 'narrative',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const duplicates = findPotentialDuplicates(factsWithAliasMatch, worldId);

    const aliasMatch = duplicates.find(d =>
      (d.fact1.value === 'Aragorn' && d.fact2.value === 'Strider') ||
      (d.fact2.value === 'Aragorn' && d.fact1.value === 'Strider')
    );

    expect(aliasMatch).toBeDefined();
    expect(aliasMatch!.method).toBe('alias');
    expect(aliasMatch!.confidence).toBe(1.0);
  });
});

describe('checkFactSimilarity', () => {
  const worldId: EntityID = 'world-123' as EntityID;

  it('returns exact match for identical normalized values', async () => {
    const fact1: LoreFact = {
      id: 'fact-1' as EntityID,
      worldId,
      category: 'characters',
      key: 'character_gandalf',
      value: 'Gandalf',
      aliases: [],
      source: 'narrative',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const fact2: LoreFact = {
      ...fact1,
      id: 'fact-2' as EntityID,
      key: 'character_gandalf_2',
    };

    const result = await checkFactSimilarity(fact1, fact2);

    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe(1.0);
    expect(result.method).toBe('exact');
  });

  it('detects alias matches', async () => {
    const fact1: LoreFact = {
      id: 'fact-1' as EntityID,
      worldId,
      category: 'characters',
      key: 'character_aragorn',
      value: 'Aragorn',
      aliases: ['Strider', 'Elessar'],
      source: 'narrative',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const fact2: LoreFact = {
      id: 'fact-2' as EntityID,
      worldId,
      category: 'characters',
      key: 'character_strider',
      value: 'Strider',
      aliases: [],
      source: 'narrative',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await checkFactSimilarity(fact1, fact2);

    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe(1.0);
    expect(result.method).toBe('alias');
  });

  it('uses Levenshtein for high-similarity matches', async () => {
    const fact1: LoreFact = {
      id: 'fact-1' as EntityID,
      worldId,
      category: 'characters',
      key: 'character_gandalf',
      value: 'Gandalf the Grey',
      aliases: [],
      source: 'narrative',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const fact2: LoreFact = {
      id: 'fact-2' as EntityID,
      worldId,
      category: 'characters',
      key: 'character_gandolf',
      value: 'Gandolf the Gray',
      aliases: [],
      source: 'narrative',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await checkFactSimilarity(fact1, fact2);

    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(['levenshtein', 'ai']).toContain(result.method);
  });

  it('returns not duplicate for clearly different names', async () => {
    const fact1: LoreFact = {
      id: 'fact-1' as EntityID,
      worldId,
      category: 'characters',
      key: 'character_gandalf',
      value: 'Gandalf',
      aliases: [],
      source: 'narrative',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const fact2: LoreFact = {
      id: 'fact-2' as EntityID,
      worldId,
      category: 'characters',
      key: 'character_frodo',
      value: 'Frodo Baggins',
      aliases: [],
      source: 'narrative',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await checkFactSimilarity(fact1, fact2);

    expect(result.isDuplicate).toBe(false);
    expect(result.confidence).toBeLessThan(0.6);
  });
});
