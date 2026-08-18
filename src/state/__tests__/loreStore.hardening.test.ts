import { describe, it, expect, jest } from '@jest/globals';
import {
  shouldStoreExtractedCharacterName,
  canonicalizeLocationName,
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
jest.mock('@/lib/utils/logger', () => {
  const methods = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
  return {
    __esModule: true,
    logger: methods,
    Logger: jest.fn().mockImplementation(() => methods),
    default: jest.fn().mockImplementation(() => methods),
  };
});

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

    it('should reject names made entirely of generic NPC words (denylist)', () => {
      expect(shouldStoreExtractedCharacterName('guards')).toBe(false);
      expect(shouldStoreExtractedCharacterName('villagers')).toBe(false);
      expect(shouldStoreExtractedCharacterName('the villagers')).toBe(false);
    });

    it('should reject plural-group structures like "Dothraki warriors"', () => {
      expect(shouldStoreExtractedCharacterName('Dothraki warriors')).toBe(false);
      expect(shouldStoreExtractedCharacterName('town guards')).toBe(false);
    });

    it('should reject sentence-like names (> 6 words)', () => {
      expect(shouldStoreExtractedCharacterName('The tall mysterious figure wearing a dark hooded cloak')).toBe(false);
    });

    // Single-token proper names ending in 's' shouldn't be rejected as plural
    // groups — that was the structural false-positive #1301 calls out.
    it('should accept single-token proper names that end in s', () => {
      expect(shouldStoreExtractedCharacterName('James')).toBe(true);
      expect(shouldStoreExtractedCharacterName('Artemis')).toBe(true);
      expect(shouldStoreExtractedCharacterName('Charles')).toBe(true);
    });

    it('should accept faction-style names with "of" or a possessive', () => {
      expect(shouldStoreExtractedCharacterName('Brothers of Steel')).toBe(true);
      expect(shouldStoreExtractedCharacterName("King's Guard")).toBe(true);
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
      return {
        context: {
          addFact: jest.fn((key: string, value: string, category: LoreCategory, source: LoreSource, worldId: EntityID, _sessionId: EntityID | undefined, metadata: LoreFact['metadata'], _visibility?: 'session-private' | 'world-shared') => {
            const factId = `fact-${addedFacts.length}` as EntityID;
            addedFacts.push({ id: factId, worldId, category, key, value, aliases: [], source, visibility: _visibility ?? 'world-shared', metadata, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            return factId;
          }),
          setAliases: jest.fn(),
          addAlias: jest.fn(),
          getFacts: jest.fn((options?: { worldId?: EntityID }) => options?.worldId ? existingFacts.filter(f => f.worldId === options.worldId) : existingFacts),
          getFact: jest.fn((id: EntityID) => addedFacts.find((fact) => fact.id === id) || existingFacts.find((fact) => fact.id === id)),
          updateFact: jest.fn(),
          resolveEntity: jest.fn(),
        } as AddStructuredLoreContext,
        addedFacts,
        existingFacts,
      };
    }

    const createTestExtraction = (events: Array<{ description: string; importance?: string; significance?: string }>): StructuredLoreExtraction => ({
      characters: [], locations: [], rules: [],
      events: events.map(e => ({ description: e.description, importance: e.importance as 'low' | 'medium' | 'high' | undefined, significance: e.significance || 'Test event', relatedEntities: [] })),
    });

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
      const extraction = createTestExtraction([
        { description: 'Low Imp Event', importance: 'low' },
        { description: 'Medium Imp Event', importance: 'medium' },
        { description: 'High Imp Event 1', importance: 'high' },
        { description: 'High Imp Event 2', importance: 'high' },
      ]);
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
      const extraction = createTestExtraction([
        { description: 'No Imp Event', importance: undefined },
        { description: 'Low Imp Event', importance: 'low' },
        { description: 'Medium Imp Event', importance: 'medium' },
        { description: 'High Imp Event', importance: 'high' },
      ]);
      addStructuredLoreImpl(extraction, 'world-1', 'session-1', context);
      expect(addedFacts.length).toBe(3);
      expect(addedFacts.map(f => f.value)).not.toContain('No Imp Event');
    });

    it('should deduplicate events with same normalized description', () => {
      const { context, addedFacts } = createMockAddStructuredLoreContext();
      const extraction = createTestExtraction([
        { description: 'Unique Event 1', importance: 'medium' },
        { description: 'Duplicate Event', importance: 'medium' },
        { description: 'duplicate event', importance: 'medium' },
        { description: 'Unique Event 2', importance: 'medium' },
      ]);
      addStructuredLoreImpl(extraction, 'world-1', 'session-1', context);
      expect(addedFacts.length).toBe(3);
      expect(addedFacts.map(f => f.value.toLowerCase()).filter(d => d === 'duplicate event').length).toBe(1);
    });

    it('should not add events that already exist in the store', () => {
      const { context, addedFacts, existingFacts } = createMockAddStructuredLoreContext();
      const existingDesc = 'Existing Event';
      existingFacts.push({ id: 'existing-1', worldId: 'world-1', category: 'events', key: `world-1:event_${normalizeText(existingDesc, NORM_NAME).toLowerCase()}`, value: existingDesc, aliases: [], source: 'narrative', visibility: 'world-shared', createdAt: '', updatedAt: '' });
      const extraction = createTestExtraction([
        { description: 'New Event', importance: 'medium' },
        { description: existingDesc, importance: 'high' },
      ]);
      addStructuredLoreImpl(extraction, 'world-1', 'session-1', context);
      expect(addedFacts.length).toBe(1);
      expect(addedFacts[0].value).toBe('New Event');
    });

    it('should allow duplicates that do not count towards the limit', () => {
      const { context, addedFacts } = createMockAddStructuredLoreContext();
      const extraction = createTestExtraction([
        { description: 'Event 1', importance: 'high' },
        { description: 'Event 1', importance: 'high' },
        { description: 'Event 1', importance: 'high' },
        { description: 'Event 2', importance: 'high' },
        { description: 'Event 3', importance: 'high' },
      ]);
      addStructuredLoreImpl(extraction, 'world-1', 'session-1', context);
      expect(addedFacts.length).toBe(3);
      expect(new Set(addedFacts.map(f => f.value)).size).toBe(3);
    });
  });
});
