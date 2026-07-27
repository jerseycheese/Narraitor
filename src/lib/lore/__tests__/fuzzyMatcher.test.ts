/**
 * Tests for fuzzy matching functionality
 * Tests focus on behavior and acceptance criteria, not implementation details
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { LoreFact } from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils';

// Import functions we're about to implement
import {
  calculateStringSimilarity,
  findPotentialDuplicates,
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
      visibility: 'world-shared',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'fact-2' as EntityID,
        worldId,
        category: 'characters',
        key: 'character_gandolf',
        value: 'Gandolf the Gray',
        aliases: [],
        source: 'narrative',
      visibility: 'world-shared',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'fact-3' as EntityID,
        worldId,
        category: 'characters',
        key: 'character_aragorn',
        value: 'Aragorn',
        aliases: ['Strider'],
        source: 'narrative',
      visibility: 'world-shared',
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      },
      {
        id: 'fact-4' as EntityID,
        worldId: 'world-456' as EntityID, // Different world
        category: 'characters',
        key: 'character_gandalf',
        value: 'Gandalf',
        aliases: [],
        source: 'narrative',
      visibility: 'world-shared',
        createdAt: '2024-01-04T00:00:00.000Z',
        updatedAt: '2024-01-04T00:00:00.000Z',
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
      visibility: 'world-shared',
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      },
      {
        id: 'fact-loc-2' as EntityID,
        worldId: locationsWorld,
        category: 'locations',
        key: 'location_inn',
        // Drop-the-article duplicate of "The Prancing Pony" (~0.76 similarity, above
        // the default 0.60 threshold) so the category-filter test has a real match.
        value: 'Prancing Pony',
        aliases: [],
        source: 'narrative',
      visibility: 'world-shared',
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      },
      {
        id: 'fact-char-1' as EntityID,
        worldId: locationsWorld,
        category: 'characters',
        key: 'character_similar',
        value: 'Prancing Peter',
        aliases: [],
        source: 'narrative',
      visibility: 'world-shared',
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      },
    ];

    const locationDuplicates = findPotentialDuplicates(mixedFacts, locationsWorld, { category: 'locations' });

    // The two similar locations must be detected (guards against a vacuous pass on []).
    expect(locationDuplicates.length).toBeGreaterThan(0);
    // ...and only locations are returned, never the similarly-named character.
    locationDuplicates.forEach(dup => {
      expect(dup.fact1.category).toBe('locations');
      expect(dup.fact2.category).toBe('locations');
    });
  });

  it('respects minimum confidence threshold', () => {
    const strict = findPotentialDuplicates(testFacts, worldId, { minConfidence: 0.95 });
    const lenient = findPotentialDuplicates(testFacts, worldId, { minConfidence: 0.8 });

    // A higher threshold must actually filter out the medium-confidence Gandalf/Gandolf
    // match (guards against a vacuous pass when the result is empty).
    expect(lenient.length).toBeGreaterThan(0);
    expect(strict.length).toBeLessThan(lenient.length);

    // Anything that does pass must meet the threshold.
    strict.forEach(dup => {
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
      visibility: 'world-shared',
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      },
      {
        id: 'fact-a2' as EntityID,
        worldId,
        category: 'characters',
        key: 'character_strider',
        value: 'Strider',
        aliases: [],
        source: 'narrative',
      visibility: 'world-shared',
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      },
    ];

    const duplicates = findPotentialDuplicates(factsWithAliasMatch, worldId);

    const aliasMatch = duplicates.find(d =>
      (d.fact1.value === 'Aragorn' && d.fact2.value === 'Strider') ||
      (d.fact2.value === 'Aragorn' && d.fact1.value === 'Strider')
    );

    expect(aliasMatch!.method).toBe('alias');
    expect(aliasMatch!.confidence).toBe(1.0);
  });
});
