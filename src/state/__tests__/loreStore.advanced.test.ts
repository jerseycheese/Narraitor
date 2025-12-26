/**
 * Tests for LoreStore Advanced Features
 *
 * Verifies import/export, validation, history tracking, and structured lore.
 */

import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';
import type { LoreFact } from '@/types/lore.types';
import { setupLoreStore } from './loreStore.testHelpers';

describe('LoreStore - Advanced Features', () => {
  beforeEach(() => {
    setupLoreStore();
  });

  describe('Import/Export', () => {
    test('should export facts as JSON', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add facts
      act(() => {
        result.current.addFact('fact1', 'value1', 'characters', 'manual', 'world-1');
        result.current.addFact('fact2', 'value2', 'locations', 'manual', 'world-1');
      });

      // Export facts
      const exported = result.current.exportFacts('world-1');
      const parsed = JSON.parse(exported);

      expect(parsed.worldId).toBe('world-1');
      expect(parsed.facts).toHaveLength(2);

      // Sort facts by key to avoid order dependency
      const sortedFacts = parsed.facts.sort((a: LoreFact, b: LoreFact) => a.key.localeCompare(b.key));
      expect(sortedFacts[0].key).toBe('fact1');
      expect(sortedFacts[1].key).toBe('fact2');
    });

    test('should import facts from JSON', () => {
      const { result } = renderHook(() => useLoreStore());

      const importData = JSON.stringify({
        worldId: 'world-1',
        facts: [
          {
            key: 'imported_hero',
            value: 'Imported Hero',
            category: 'characters',
            source: 'manual',
            metadata: { importance: 'high' }
          },
          {
            key: 'imported_city',
            value: 'Imported City',
            category: 'locations',
            source: 'manual'
          }
        ]
      });

      // Import facts
      act(() => {
        result.current.importFacts('world-1', importData);
      });

      const facts = result.current.getFacts({ worldId: 'world-1' });
      expect(facts).toHaveLength(2);
      expect(facts.some(f => f.value === 'Imported Hero')).toBe(true);
      expect(facts.some(f => f.value === 'Imported City')).toBe(true);
    });

    test('should skip duplicate facts during import', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add existing fact
      act(() => {
        result.current.addFact('existing_hero', 'Existing Hero', 'characters', 'manual', 'world-1');
      });

      const importData = JSON.stringify({
        worldId: 'world-1',
        facts: [
          {
            key: 'existing_hero',
            value: 'Existing Hero',
            category: 'characters',
            source: 'manual'
          },
          {
            key: 'new_hero',
            value: 'New Hero',
            category: 'characters',
            source: 'manual'
          }
        ]
      });

      // Import facts
      act(() => {
        result.current.importFacts('world-1', importData);
      });

      const facts = result.current.getFacts({ worldId: 'world-1' });
      expect(facts).toHaveLength(2); // Only one new fact added
    });

    test('should preserve visibility and sessionId during export/import round-trip', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add facts with different visibility settings
      act(() => {
        const id1 = result.current.addFact('session_fact', 'Session Fact', 'characters', 'manual', 'world-1', 'session-1');
        result.current.updateFact(id1, { visibility: 'session-private' });

        const id2 = result.current.addFact('world_fact', 'World Fact', 'locations', 'manual', 'world-1');
        result.current.updateFact(id2, { visibility: 'world-shared' });
      });

      // Export facts
      const exported = result.current.exportFacts('world-1');
      const parsed = JSON.parse(exported);

      expect(parsed.facts).toHaveLength(2);

      // Check that visibility and sessionId are in export
      const sessionFact = parsed.facts.find((f: LoreFact) => f.key === 'session_fact');
      const worldFact = parsed.facts.find((f: LoreFact) => f.key === 'world_fact');

      expect(sessionFact.visibility).toBe('session-private');
      expect(sessionFact.sessionId).toBe('session-1');
      expect(worldFact.visibility).toBe('world-shared');

      // Clear and re-import
      act(() => {
        result.current.clearFacts('world-1');
        result.current.importFacts('world-1', exported);
      });

      // Verify imported facts retain visibility
      const importedFacts = result.current.getFacts({ worldId: 'world-1' });
      const importedSession = importedFacts.find(f => f.key === 'session_fact');
      const importedWorld = importedFacts.find(f => f.key === 'world_fact');

      expect(importedSession?.visibility).toBe('session-private');
      expect(importedSession?.sessionId).toBe('session-1');
      expect(importedWorld?.visibility).toBe('world-shared');
    });
  });

  describe('Fact Validation', () => {
    test('should validate fact structure', () => {
      const { result } = renderHook(() => useLoreStore());

      // Test valid fact
      const validFact = {
        key: 'valid_key',
        value: 'Valid Value',
        category: 'characters' as const,
        worldId: 'world-1'
      };

      expect(result.current.validateFact(validFact)).toBe(true);

      // Test invalid facts
      const invalidKey = { ...validFact, key: '' };
      expect(result.current.validateFact(invalidKey)).toBe(false);

      const invalidValue = { ...validFact, value: '' };
      expect(result.current.validateFact(invalidValue)).toBe(false);

      const invalidCategory = { ...validFact, category: 'invalid' as string };
      expect(result.current.validateFact(invalidCategory as LoreFact)).toBe(false);
    });

    test('should validate key format', () => {
      const { result } = renderHook(() => useLoreStore());

      // Valid keys
      expect(result.current.validateKey('valid_key')).toBe(true);
      expect(result.current.validateKey('key123')).toBe(true);
      expect(result.current.validateKey('KEY_NAME')).toBe(true);

      // Invalid keys
      expect(result.current.validateKey('key with spaces')).toBe(false);
      expect(result.current.validateKey('key-with-dashes')).toBe(false);
      expect(result.current.validateKey('123startswithnumber')).toBe(false);
    });
  });

  describe('Fact History', () => {
    test('should track fact history', () => {
      const { result } = renderHook(() => useLoreStore());

      // Add fact
      act(() => {
        result.current.addFact('tracked_fact', 'Version 1', 'characters', 'manual', 'world-1');
      });

      const facts = result.current.getFacts({ worldId: 'world-1' });
      const factId = facts[0].id;

      // Update fact multiple times
      act(() => {
        result.current.updateFact(factId, { value: 'Version 2' });
        result.current.updateFact(factId, { value: 'Version 3' });
      });

      // Get history
      const history = result.current.getFactHistory(factId);

      expect(history).toHaveLength(3);
      expect(history[0].value).toBe('Version 1');
      expect(history[1].value).toBe('Version 2');
      expect(history[2].value).toBe('Version 3');
    });
  });

  describe('Structured Lore', () => {
    test('should add structured lore from extraction', () => {
      const { result } = renderHook(() => useLoreStore());

      const extraction = {
        characters: [
          { name: 'Sir Gareth', role: 'Knight', importance: 'medium' as const }
        ],
        locations: [
          { name: 'Aetheria', type: 'city', importance: 'high' as const }
        ],
        events: [
          { description: 'Hero arrives in city', importance: 'medium' as const }
        ],
        rules: [
          { rule: 'Magic requires focus', importance: 'medium' as const }
        ]
      };

      act(() => {
        result.current.addStructuredLore(extraction, 'test-world', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });

      expect(facts.length).toBe(4);
      expect(facts.some(f => f.category === 'characters' && f.value === 'Sir Gareth')).toBe(true);
      expect(facts.some(f => f.category === 'locations' && f.value === 'Aetheria')).toBe(true);
      expect(facts.some(f => f.category === 'events')).toBe(true);
      expect(facts.some(f => f.category === 'rules')).toBe(true);
    });

    test('should ignore generic/unnamed character entities', () => {
      const { result } = renderHook(() => useLoreStore());

      const extraction = {
        characters: [
          { name: 'Unnamed Dothraki Warrior with Crimson Braid', importance: 'medium' as const },
          { name: 'Dothraki warriors', importance: 'medium' as const },
          { name: 'Sir Gareth', role: 'Knight', importance: 'medium' as const },
        ],
        locations: [],
        events: [],
        rules: [],
      };

      act(() => {
        result.current.addStructuredLore(extraction, 'test-world', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      const characterValues = facts
        .filter((fact) => fact.category === 'characters')
        .map((fact) => fact.value);

      expect(characterValues).toEqual(['Sir Gareth']);
    });

    test('should canonicalize derived locations and keep as aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      const extraction = {
        characters: [],
        locations: [
          { name: 'Vaes Leisi marketplace edge', importance: 'medium' as const },
        ],
        events: [],
        rules: [],
      };

      act(() => {
        result.current.addStructuredLore(extraction, 'test-world', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      const locationFact = facts.find((fact) => fact.category === 'locations');

      expect(locationFact?.value).toBe('Vaes Leisi marketplace');
      expect(locationFact?.aliases).toContain('Vaes Leisi marketplace edge');
    });

    test('should canonicalize "Under X" to "X"', () => {
      const { result } = renderHook(() => useLoreStore());

      const extraction = {
        characters: [],
        locations: [
          { name: 'Under Derry', importance: 'medium' as const },
        ],
        events: [],
        rules: [],
      };

      act(() => {
        result.current.addStructuredLore(extraction, 'test-world', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      const locationFact = facts.find((fact) => fact.category === 'locations');

      expect(locationFact?.value).toBe('Derry');
      expect(locationFact?.aliases).toContain('Under Derry');
    });

    test('should canonicalize "Sewers beneath X" to "X sewers"', () => {
      const { result } = renderHook(() => useLoreStore());

      const extraction = {
        characters: [],
        locations: [
          { name: 'Sewers beneath Derry', importance: 'medium' as const },
        ],
        events: [],
        rules: [],
      };

      act(() => {
        result.current.addStructuredLore(extraction, 'test-world', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      const locationFact = facts.find((fact) => fact.category === 'locations');

      expect(locationFact?.value).toBe('Derry sewers');
      expect(locationFact?.aliases).toContain('Sewers beneath Derry');
    });

    test('should canonicalize "The X" to "X"', () => {
      const { result } = renderHook(() => useLoreStore());

      const extraction = {
        characters: [],
        locations: [
          { name: 'The marketplace', importance: 'medium' as const },
        ],
        events: [],
        rules: [],
      };

      act(() => {
        result.current.addStructuredLore(extraction, 'test-world', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      const locationFact = facts.find((fact) => fact.category === 'locations');

      expect(locationFact?.value).toBe('marketplace');
      expect(locationFact?.aliases).toContain('The marketplace');
    });

    test('should merge multiple location variants into canonical form', () => {
      const { result } = renderHook(() => useLoreStore());

      // Simulate multiple extractions with different location variants
      const extraction1 = {
        characters: [],
        locations: [
          { name: 'Under Derry', importance: 'medium' as const },
        ],
        events: [],
        rules: [],
      };

      const extraction2 = {
        characters: [],
        locations: [
          { name: 'Sewers beneath Derry', importance: 'medium' as const },
        ],
        events: [],
        rules: [],
      };

      act(() => {
        result.current.addStructuredLore(extraction1, 'test-world', 'session-1');
        result.current.addStructuredLore(extraction2, 'test-world', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      const locationFacts = facts.filter((fact) => fact.category === 'locations');

      // Should only have 2 canonical locations, not 2 separate ones
      expect(locationFacts.length).toBe(2);

      // Check that both "Derry" and "Derry sewers" exist
      const derryFact = locationFacts.find(f => f.value === 'Derry');
      const derrySewersFact = locationFacts.find(f => f.value === 'Derry sewers');

      expect(derryFact).toBeDefined();
      expect(derrySewersFact).toBeDefined();

      // Check aliases
      expect(derryFact?.aliases).toContain('Under Derry');
      expect(derrySewersFact?.aliases).toContain('Sewers beneath Derry');
    });

    test('should cap extracted events per extraction', () => {
      const { result } = renderHook(() => useLoreStore());

      const extraction = {
        characters: [],
        locations: [],
        events: [
          { description: 'Event one: short', importance: 'low' as const },
          { description: 'Event two: medium detail', importance: 'medium' as const },
          { description: 'Event three: high importance and longer description', importance: 'high' as const },
          { description: 'Event four: also high but should be capped out', importance: 'high' as const },
          { description: 'Event five: another medium event', importance: 'medium' as const },
        ],
        rules: [],
      };

      act(() => {
        result.current.addStructuredLore(extraction, 'test-world', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      const eventFacts = facts.filter((fact) => fact.category === 'events');

      expect(eventFacts).toHaveLength(3);
    });

    test('should use world-scoped keys', () => {
      const { result } = renderHook(() => useLoreStore());

      const extraction = {
        characters: [
          { name: 'Test Character', importance: 'medium' as const }
        ],
        locations: [],
        events: [],
        rules: []
      };

      act(() => {
        result.current.addStructuredLore(extraction, 'world-123', 'session-1');
      });

      const facts = result.current.getFacts({ worldId: 'world-123' });
      const characterFact = facts.find(f => f.category === 'characters');

      expect(characterFact?.key).toMatch(/^world-123:character_/);
    });

    test('should avoid duplicate structured facts', () => {
      const { result } = renderHook(() => useLoreStore());

      const extraction = {
        characters: [
          { name: 'Duplicate Character', importance: 'medium' as const }
        ],
        locations: [],
        events: [],
        rules: []
      };

      act(() => {
        result.current.addStructuredLore(extraction, 'test-world');
        result.current.addStructuredLore(extraction, 'test-world'); // Same extraction twice
      });

      const facts = result.current.getFacts({ worldId: 'test-world' });
      const characterFacts = facts.filter(f => f.category === 'characters' && f.value === 'Duplicate Character');

      expect(characterFacts.length).toBe(1);
    });
  });
});
