import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  shouldStoreExtractedCharacterName,
  canonicalizeLocationName,
  importanceRank,
  MAX_EVENTS_PER_EXTRACTION,
} from '../loreStore.helpers';
import {
  addStructuredLoreImpl,
  type AddStructuredLoreContext,
} from '../loreStore.extraction';
import type { StructuredLoreExtraction, LoreFact, LoreCategory, LoreSource } from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';
import { normalizeText, NORM_NAME } from '@/lib/utils/textNormalization';

// Mock logger to suppress output during tests
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Lore Extraction Hardening Logic', () => {
  // Test Suite 1: Character Name Validation
  describe('shouldStoreExtractedCharacterName', () => {
    // Valid Names
    it('should accept valid single names without "s" ending', () => {
      expect(shouldStoreExtractedCharacterName('Gandalf')).toBe(true);
      expect(shouldStoreExtractedCharacterName('Lyra')).toBe(true);
      expect(shouldStoreExtractedCharacterName('Tom')).toBe(true);
    });

    it('should accept multi-word names (up to 6 words)', () => {
      expect(shouldStoreExtractedCharacterName('Frodo Baggins the Brave')).toBe(true);
      expect(shouldStoreExtractedCharacterName('Aragorn son of Arathorn')).toBe(true);
    });

    it('should accept names with apostrophes even if short and ending in s', () => {
      expect(shouldStoreExtractedCharacterName("O'Brien")).toBe(true);
      expect(shouldStoreExtractedCharacterName("D'Artagnan")).toBe(true);
      expect(shouldStoreExtractedCharacterName("King's Guard")).toBe(true); // Possessive
    });

    it('should accept names with hyphens', () => {
      expect(shouldStoreExtractedCharacterName('Jean-Luc')).toBe(true);
    });

    // Invalid Names
    it('should reject empty or whitespace strings', () => {
      expect(shouldStoreExtractedCharacterName('')).toBe(false);
      expect(shouldStoreExtractedCharacterName('   ')).toBe(false);
      expect(shouldStoreExtractedCharacterName('\n\t')).toBe(false);
    });

    it('should reject "Unnamed" or "Unknown" placeholders', () => {
      expect(shouldStoreExtractedCharacterName('Unnamed warrior')).toBe(false);
      expect(shouldStoreExtractedCharacterName('unnamed guard')).toBe(false);
      expect(shouldStoreExtractedCharacterName('Unknown figure')).toBe(false);
      expect(shouldStoreExtractedCharacterName('unknown stranger')).toBe(false);
    });

    it('should reject descriptive phrases containing " with "', () => {
      expect(shouldStoreExtractedCharacterName('Man with sword')).toBe(false);
      expect(shouldStoreExtractedCharacterName('Woman with hood')).toBe(false);
    });

    it('should reject plural groups (short names ending in s without apostrophe)', () => {
      expect(shouldStoreExtractedCharacterName('guards')).toBe(false);
      expect(shouldStoreExtractedCharacterName('villagers')).toBe(false);
      expect(shouldStoreExtractedCharacterName('town guards')).toBe(false);
    });

    it('should reject sentence-like names (> 6 words)', () => {
      expect(shouldStoreExtractedCharacterName('The tall mysterious figure wearing a dark hooded cloak')).toBe(false);
    });

    // Edge Cases explicitly mentioned in plan
    it('should reject short names ending in s without apostrophe (heuristic)', () => {
      expect(shouldStoreExtractedCharacterName('James')).toBe(false);
      expect(shouldStoreExtractedCharacterName('Artemis')).toBe(false);
      expect(shouldStoreExtractedCharacterName('Charles')).toBe(false);
    });
  });

  // Test Suite 2: Location Canonicalization
  describe('canonicalizeLocationName', () => {
    it('should remove leading "The"', () => {
      const result = canonicalizeLocationName('The sewers');
      expect(result.canonicalName).toBe('sewers');
      expect(result.derivedAliases).toContain('The sewers');
    });

    it('should remove "The" case-insensitively', () => {
      const result = canonicalizeLocationName('the tavern');
      expect(result.canonicalName).toBe('tavern');
      expect(result.derivedAliases).toContain('the tavern');
    });

    it('should transform "Under/Beneath/Inside/Within X" to "X"', () => {
      expect(canonicalizeLocationName('Under Derry').canonicalName).toBe('Derry');
      expect(canonicalizeLocationName('Beneath the Mountain').canonicalName).toBe('the Mountain');
    });

    it('should transform location types "Sewers/Tunnels/Caves/Catacombs beneath/under/of X"', () => {
      const result = canonicalizeLocationName('Sewers beneath Derry');
      expect(result.canonicalName).toBe('Derry sewers');
      expect(result.derivedAliases).toContain('Sewers beneath Derry');
    });

    it('should collapse "X marketplace edge" to "X marketplace"', () => {
      const result = canonicalizeLocationName('Derry marketplace edge');
      expect(result.canonicalName).toBe('Derry marketplace');
      expect(result.derivedAliases).toContain('Derry marketplace edge');
    });

    it('should collapse "X edge" to "X"', () => {
      const result = canonicalizeLocationName('Forest edge');
      expect(result.canonicalName).toBe('Forest');
      expect(result.derivedAliases).toContain('Forest edge');
    });

    it('should handle chained transformations', () => {
      // "The sewers beneath Derry" applies multiple rules:
      // 1. "The X" -> "sewers beneath Derry"
      // 2. "Sewers beneath X" -> "Derry sewers"
      // Note: 'original' is captured once at start, so derivedAliases may contain duplicates
      const result = canonicalizeLocationName('The sewers beneath Derry');
      expect(result.canonicalName).toBe('Derry sewers');
      expect(result.derivedAliases).toContain('The sewers beneath Derry');
    });

    it('should handle empty input', () => {
      const result = canonicalizeLocationName('');
      expect(result.canonicalName).toBe('');
      expect(result.derivedAliases).toHaveLength(0);
    });

    it('should pass through names that need no transformation', () => {
      const result = canonicalizeLocationName('Winterfell');
      expect(result.canonicalName).toBe('Winterfell');
      expect(result.derivedAliases).toHaveLength(0);
    });
  });

  // Test Suite 3: Event Deduplication & Limiting
  describe('Event Deduplication & Limiting', () => {
    // Helper to create mock context
    function createMockAddStructuredLoreContext() {
      const addedFacts: LoreFact[] = [];
      const existingFacts: LoreFact[] = [];

      const context: AddStructuredLoreContext = {
        addFact: jest.fn((
          key: string,
          value: string,
          category: LoreCategory,
          source: LoreSource,
          worldId: EntityID,
          _sessionId: EntityID | undefined,
          metadata: LoreFact['metadata']
        ) => {
          const factId = `fact-${addedFacts.length}` as EntityID;
          const fact: LoreFact = {
            id: factId,
            worldId,
            category,
            key,
            value,
            aliases: [],
            source,
            visibility: 'world-shared',
            metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addedFacts.push(fact);
          return factId;
        }),
        setAliases: jest.fn(),
        getFacts: jest.fn((options?: { worldId?: EntityID }) => {
          if (options?.worldId) {
            return existingFacts.filter(f => f.worldId === options.worldId);
          }
          return existingFacts;
        }),
      };

      return { context, addedFacts, existingFacts };
    }

    function createTestExtraction(events: Array<{ 
      description: string;
      importance?: string;
      significance?: string;
    }>): StructuredLoreExtraction {
      return {
        characters: [],
        locations: [],
        events: events.map(e => ({
          description: e.description,
          importance: e.importance as 'low' | 'medium' | 'high' | undefined,
          significance: e.significance || 'Test event',
          relatedEntities: [],
        })),
        rules: [],
      };
    }

    it('should limit events to MAX_EVENTS_PER_EXTRACTION (3)', () => {
      const { context, addedFacts } = createMockAddStructuredLoreContext();
      const events = [
        { description: 'Event 1', importance: 'high' },
        { description: 'Event 2', importance: 'high' },
        { description: 'Event 3', importance: 'medium' },
        { description: 'Event 4', importance: 'low' },
        { description: 'Event 5', importance: 'low' },
      ];
      const extraction = createTestExtraction(events);

      addStructuredLoreImpl(extraction, 'world-1', 'session-1', context);

      expect(addedFacts.length).toBe(MAX_EVENTS_PER_EXTRACTION);
      expect(context.addFact).toHaveBeenCalledTimes(MAX_EVENTS_PER_EXTRACTION);
    });

    it('should prioritize high importance events', () => {
      const { context, addedFacts } = createMockAddStructuredLoreContext();
      const events = [
        { description: 'Low Imp Event', importance: 'low' },
        { description: 'Medium Imp Event', importance: 'medium' },
        { description: 'High Imp Event 1', importance: 'high' },
        { description: 'High Imp Event 2', importance: 'high' },
      ];
      // Expect: High 1, High 2, Medium (3 total)
      const extraction = createTestExtraction(events);

      addStructuredLoreImpl(extraction, 'world-1', 'session-1', context);

      expect(addedFacts.length).toBe(3);
      const descriptions = addedFacts.map(f => f.value);
      expect(descriptions).toContain('High Imp Event 1');
      expect(descriptions).toContain('High Imp Event 2');
      expect(descriptions).toContain('Medium Imp Event');
      expect(descriptions).not.toContain('Low Imp Event');
    });

    it('should treat missing importance as lower than low (rank 0)', () => {
      const { context, addedFacts } = createMockAddStructuredLoreContext();
      const events = [
        { description: 'No Imp Event', importance: undefined }, // Rank 0
        { description: 'Low Imp Event', importance: 'low' }, // Rank 1
        { description: 'Medium Imp Event', importance: 'medium' }, // Rank 2
        { description: 'High Imp Event', importance: 'high' }, // Rank 3
      ];
      // With limit 3, expect High, Medium, Low. Missing should be dropped.
      const extraction = createTestExtraction(events);

      addStructuredLoreImpl(extraction, 'world-1', 'session-1', context);

      expect(addedFacts.length).toBe(3);
      const descriptions = addedFacts.map(f => f.value);
      expect(descriptions).not.toContain('No Imp Event');
    });

    it('should deduplicate events with same normalized description', () => {
      const { context, addedFacts } = createMockAddStructuredLoreContext();
      const events = [
        { description: 'Unique Event 1', importance: 'medium' },
        { description: 'Duplicate Event', importance: 'medium' },
        { description: 'duplicate event', importance: 'medium' }, // Case insensitive duplicate
        { description: 'Unique Event 2', importance: 'medium' },
      ];
      // Expect 3 unique events
      const extraction = createTestExtraction(events);

      addStructuredLoreImpl(extraction, 'world-1', 'session-1', context);

      expect(addedFacts.length).toBe(3);
      const descriptions = addedFacts.map(f => f.value.toLowerCase());
      expect(descriptions.filter(d => d === 'duplicate event').length).toBe(1);
    });

    it('should not add events that already exist in the store', () => {
      const { context, addedFacts, existingFacts } = createMockAddStructuredLoreContext();
      
      // Add an existing fact
      const existingDesc = 'Existing Event';
      existingFacts.push({
        id: 'existing-1',
        worldId: 'world-1',
        category: 'events',
        key: `world-1:event_${normalizeText(existingDesc, NORM_NAME).toLowerCase()}`,
        value: existingDesc,
        aliases: [],
        source: 'narrative',
        visibility: 'world-shared',
        createdAt: '',
        updatedAt: '',
      });

      const events = [
        { description: 'New Event', importance: 'medium' },
        { description: existingDesc, importance: 'high' }, // Should be skipped even if high importance? 
        // Logic: existingKeys check happens before existingEventValues check?
        // Implementation:
        // const existingKeys = new Set(existingFacts.map((fact) => fact.key));
        // ...
        // const existingEventValues = new Set(...)
        // ...
        // if (existingEventValues.has(normalizedDescription)) return;
        
        // So it should be skipped.
      ];
      
      const extraction = createTestExtraction(events);

      addStructuredLoreImpl(extraction, 'world-1', 'session-1', context);

      expect(addedFacts.length).toBe(1);
      expect(addedFacts[0].value).toBe('New Event');
    });

    it('should allow duplicates that do not count towards the limit', () => {
      // Logic: "Dedup and limiting are interleaved... Duplicates don't 'use up' slots"
      const { context, addedFacts } = createMockAddStructuredLoreContext();
      const events = [
        { description: 'Event 1', importance: 'high' },
        { description: 'Event 1', importance: 'high' }, // Duplicate
        { description: 'Event 1', importance: 'high' }, // Duplicate
        { description: 'Event 2', importance: 'high' },
        { description: 'Event 3', importance: 'high' },
      ];
      // Should result in Event 1, Event 2, Event 3 (3 unique events)
      
      const extraction = createTestExtraction(events);

      addStructuredLoreImpl(extraction, 'world-1', 'session-1', context);

      expect(addedFacts.length).toBe(3);
      const uniqueValues = new Set(addedFacts.map(f => f.value));
      expect(uniqueValues.size).toBe(3);
    });
  });
});
