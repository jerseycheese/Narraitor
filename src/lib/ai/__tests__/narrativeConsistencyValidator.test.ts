/**
 * TDD Unit Tests for AI Narrative Consistency Validation
 * Issue #184: AI consistency for enhanced player experience
 * 
 * Tests the new consistency validation functionality focusing on:
 * - Basic contradiction detection through keyword analysis  
 * - Enhanced lore context formatting and prioritization
 * - Validation integration into narrative generation pipeline
 */

import { validateNarrativeConsistency, formatLoreForConsistency, detectPotentialContradictions } from '../narrativeConsistencyValidator';
import { useLoreStore } from '@/state/loreStore';
import type { LoreFact } from '@/types/lore.types';

// Mock the lore store
jest.mock('@/state/loreStore', () => ({
  useLoreStore: {
    getState: jest.fn()
  }
}));

describe('Narrative Consistency Validator', () => {
  const mockWorldId = 'world-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatLoreForConsistency', () => {
    test('should format lore facts with priority hierarchy for consistency checking', () => {
      const mockLoreFacts: LoreFact[] = [
        {
          id: 'fact-1',
          category: 'characters',
          key: 'character_lyra',
          value: 'Lyra Starweaver',
          source: 'narrative',
          worldId: mockWorldId,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          metadata: {
            description: 'Hero with magical abilities',
            importance: 'high',
            type: 'protagonist',
            tags: ['magic', 'hero']
          }
        },
        {
          id: 'fact-2', 
          category: 'locations',
          key: 'location_mystical_forest',
          value: 'Mystical Forest',
          source: 'manual',
          worldId: mockWorldId,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          metadata: {
            description: 'Dark enchanted forest',
            importance: 'medium',
            type: 'wilderness'
          }
        },
        {
          id: 'fact-3',
          category: 'rules',
          key: 'magic_system',
          value: 'Magic requires sacrifice',
          source: 'narrative',
          worldId: mockWorldId,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          metadata: {
            importance: 'high',
            tags: ['magic', 'system']
          }
        }
      ];

      (useLoreStore.getState as jest.Mock).mockReturnValue({
        getFacts: jest.fn().mockReturnValue(mockLoreFacts)
      });

      const result = formatLoreForConsistency(mockWorldId);

      // Should prioritize high-importance facts first
      expect(result).toBeDefined();
      expect(result.prioritizedFacts).toHaveLength(3);
      expect(result.prioritizedFacts[0].importance).toBe('high');
      expect(result.prioritizedFacts[1].importance).toBe('high');
      expect(result.prioritizedFacts[2].importance).toBe('medium');

      // Should include keyword mapping for consistency checking
      expect(result.keywordMap).toBeDefined();
      expect(result.keywordMap.get('lyra')).toContain('Lyra Starweaver');
      expect(result.keywordMap.get('magic')).toContain('Magic requires sacrifice');
      expect(result.keywordMap.get('forest')).toContain('Mystical Forest');

      // Should format for AI prompt inclusion
      expect(result.formattedContext).toContain('PRIORITY LORE');
      expect(result.formattedContext).toContain('Lyra Starweaver');
      expect(result.formattedContext).toContain('Magic requires sacrifice');
    });

    test('should handle empty lore gracefully', () => {
      (useLoreStore.getState as jest.Mock).mockReturnValue({
        getFacts: jest.fn().mockReturnValue([])
      });

      const result = formatLoreForConsistency(mockWorldId);

      expect(result.prioritizedFacts).toHaveLength(0);
      expect(result.keywordMap.size).toBe(0);
      expect(result.formattedContext).toBe('');
    });

    test('should limit facts when token limit is specified', () => {
      const manyFacts: LoreFact[] = Array.from({ length: 10 }, (_, i) => ({
        id: `fact-${i}`,
        category: 'characters' as const,
        key: `character_${i}`,
        value: `Character ${i}`,
        source: 'narrative' as const,
        worldId: mockWorldId,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        metadata: {
          importance: i < 5 ? 'high' as const : 'medium' as const
        }
      }));

      (useLoreStore.getState as jest.Mock).mockReturnValue({
        getFacts: jest.fn().mockReturnValue(manyFacts)
      });

      const result = formatLoreForConsistency(mockWorldId, { maxFacts: 3 });

      expect(result.prioritizedFacts).toHaveLength(3);
      // Should prioritize high-importance facts
      expect(result.prioritizedFacts.every(fact => fact.metadata?.importance === 'high')).toBe(true);
    });
  });

  describe('detectPotentialContradictions', () => {
    test('should detect character name contradictions', () => {
      const existingLore = new Map([
        ['lyra', ['Lyra Starweaver - Hero with magical abilities']],
        ['forest', ['Mystical Forest - Dark enchanted woodland']]
      ]);

      const narrativeContent = 'Lyra Shadowbane entered the bright sunny forest.';

      const contradictions = detectPotentialContradictions(narrativeContent, existingLore);

      expect(contradictions).toHaveLength(2);
      
      // Should detect character name contradiction
      const characterContradiction = contradictions.find(c => c.type === 'character');
      expect(characterContradiction).toBeDefined();
      expect(characterContradiction?.description).toContain('character name inconsistency');
      expect(characterContradiction?.conflictingElements).toContain('Lyra Shadowbane');
      expect(characterContradiction?.establishedLore).toContain('Lyra Starweaver');

      // Should detect location description contradiction  
      const locationContradiction = contradictions.find(c => c.type === 'location');
      expect(locationContradiction).toBeDefined();
      expect(locationContradiction?.description).toContain('location description inconsistency');
      expect(locationContradiction?.conflictingElements).toContain('bright sunny');
      expect(locationContradiction?.establishedLore).toContain('Dark enchanted');
    });

    test('should detect magical system contradictions', () => {
      const existingLore = new Map([
        ['magic', ['Magic requires sacrifice to cast spells']]
      ]);

      const narrativeContent = 'She cast a spell effortlessly without any cost or sacrifice.';

      const contradictions = detectPotentialContradictions(narrativeContent, existingLore);

      expect(contradictions).toHaveLength(1);
      expect(contradictions[0].type).toBe('rule');
      expect(contradictions[0].description).toContain('rule contradiction');
      expect(contradictions[0].conflictingElements).toContain('without any cost');
      expect(contradictions[0].establishedLore).toContain('requires sacrifice');
    });

    test('should return empty array when no contradictions found', () => {
      const existingLore = new Map([
        ['lyra', ['Lyra Starweaver - Hero with magical abilities']],
        ['forest', ['Mystical Forest - Dark enchanted woodland']]
      ]);

      const consistentNarrative = 'Lyra Starweaver carefully navigated the dark enchanted forest.';

      const contradictions = detectPotentialContradictions(consistentNarrative, existingLore);

      expect(contradictions).toHaveLength(0);
    });

    test('should handle empty lore and content gracefully', () => {
      const emptyLore = new Map<string, string[]>();
      const emptyContent = '';

      const contradictions = detectPotentialContradictions(emptyContent, emptyLore);

      expect(contradictions).toHaveLength(0);
    });
  });

  describe('validateNarrativeConsistency', () => {
    test('should validate narrative against established lore and return consistency report', () => {
      const mockLoreFacts: LoreFact[] = [
        {
          id: 'fact-1',
          category: 'characters',
          key: 'character_lyra',
          value: 'Lyra Starweaver',
          source: 'narrative',
          worldId: mockWorldId,
          createdAt: '2023-01-01', 
          updatedAt: '2023-01-01',
          metadata: {
            description: 'Hero with fire magic',
            importance: 'high',
            tags: ['fire', 'hero']
          }
        }
      ];

      (useLoreStore.getState as jest.Mock).mockReturnValue({
        getFacts: jest.fn().mockReturnValue(mockLoreFacts)
      });

      const narrativeContent = 'Lyra Icecaster used her powerful ice magic to freeze the enemy.';

      const validationResult = validateNarrativeConsistency(
        narrativeContent,
        mockWorldId,
        { includeWarnings: true }
      );

      // Should return comprehensive validation report
      expect(validationResult.isConsistent).toBe(false);
      expect(validationResult.contradictions).toHaveLength(1);
      expect(validationResult.contradictions[0].type).toBe('character');
      expect(validationResult.contradictions[0].description).toContain('character name inconsistency');
      
      // Should include consistency score
      expect(validationResult.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(validationResult.consistencyScore).toBeLessThanOrEqual(1);

      // Should include warnings about potential issues
      expect(validationResult.warnings).toBeDefined();
      expect(validationResult.warnings).toContain('Character ability change detected');
    });

    test('should return consistent result for narrative that matches lore', () => {
      const mockLoreFacts: LoreFact[] = [
        {
          id: 'fact-1',
          category: 'characters', 
          key: 'character_lyra',
          value: 'Lyra Starweaver',
          source: 'narrative',
          worldId: mockWorldId,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          metadata: {
            description: 'Hero with fire magic',
            importance: 'high',
            tags: ['fire', 'hero']
          }
        }
      ];

      (useLoreStore.getState as jest.Mock).mockReturnValue({
        getFacts: jest.fn().mockReturnValue(mockLoreFacts)
      });

      const consistentNarrative = 'Lyra Starweaver channeled her fire magic with great skill.';

      const validationResult = validateNarrativeConsistency(consistentNarrative, mockWorldId);

      expect(validationResult.isConsistent).toBe(true);
      expect(validationResult.contradictions).toHaveLength(0);
      expect(validationResult.consistencyScore).toBe(1.0);
      expect(validationResult.warnings).toHaveLength(0);
    });

    test('should handle validation with no existing lore', () => {
      (useLoreStore.getState as jest.Mock).mockReturnValue({
        getFacts: jest.fn().mockReturnValue([])
      });

      const narrativeContent = 'A new adventure begins in an unknown world.';

      const validationResult = validateNarrativeConsistency(narrativeContent, mockWorldId);

      // With no existing lore, narrative should be considered consistent
      expect(validationResult.isConsistent).toBe(true);
      expect(validationResult.contradictions).toHaveLength(0);
      expect(validationResult.consistencyScore).toBe(1.0);
      expect(validationResult.loreCoverage).toBe(0); // No lore to reference
    });

    test('should calculate lore coverage correctly', () => {
      const mockLoreFacts: LoreFact[] = [
        {
          id: 'fact-1',
          category: 'characters',
          key: 'character_lyra', 
          value: 'Lyra Starweaver',
          source: 'narrative',
          worldId: mockWorldId,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        },
        {
          id: 'fact-2',
          category: 'locations',
          key: 'location_forest',
          value: 'Mystical Forest',
          source: 'narrative', 
          worldId: mockWorldId,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        }
      ];

      (useLoreStore.getState as jest.Mock).mockReturnValue({
        getFacts: jest.fn().mockReturnValue(mockLoreFacts)
      });

      const narrativeContent = 'Lyra Starweaver walked through the village, ignoring the forest.';

      const validationResult = validateNarrativeConsistency(narrativeContent, mockWorldId);

      // Should reference 1 out of 2 established lore elements
      expect(validationResult.loreCoverage).toBe(0.5);
      expect(validationResult.referencedLore).toContain('Lyra Starweaver');
      expect(validationResult.referencedLore).not.toContain('Mystical Forest');
    });
  });
});