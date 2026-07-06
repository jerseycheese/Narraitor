/**
 * MVP-level tests for PersonalizationEngine
 * Focus on core acceptance criteria: providing raw data to LLM for personalization
 */

import {
  analyzePlayerBehavior,
  createPersonalizedContext,
  generateNarrativeEnhancement,
} from '../personalizationEngine';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';
import { PlayerDecision } from '@/types/personalization.types';

describe('PersonalizationEngine - MVP Tests', () => {
  const engine = {
    analyzePlayerBehavior,
    createPersonalizedContext,
    generateNarrativeEnhancement,
  };
  let mockCharacter: Character;
  let mockWorld: World;

  // Helper to convert Character to PersonalizationCharacter format
  const convertToPersonalizationCharacter = (character: Character) => ({
    id: character.id,
    name: character.name,
    background:
      typeof character.background === 'object'
        ? character.background.history || ''
        : character.background,
    attributes: character.attributes,
    skills: character.skills,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  });

  beforeEach(() => {

    mockCharacter = {
      id: 'char-1',
      name: 'Alex Archer',
      worldId: 'world-1',
      description: 'A skilled archaeologist seeking ancient mysteries',
      background: {
        history: 'Experienced archaeologist with a mysterious past',
        personality: 'Curious and determined',
        goals: ['Discover ancient secrets'],
        fears: ['Failure'],
        relationships: [],
      },
      attributes: [
        { attributeId: 'attr-intelligence', value: 8 },
        { attributeId: 'attr-dexterity', value: 6 },
      ],
      skills: [
        { skillId: 'skill-1', level: 8, experience: 100, isActive: true },
        { skillId: 'skill-2', level: 5, experience: 50, isActive: true },
      ],
      derivedStats: [],
      inventory: {
        characterId: 'char-1',
        items: [],
        capacity: 100,
        categories: [],
        itemOrder: [],
      },
      status: {
        health: 100,
        maxHealth: 100,
        conditions: [],
      },
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    };

    mockWorld = {
      id: 'world-1',
      name: 'Ancient Mysteries',
      description: 'A world of archaeological discoveries',
      genre: 'mystery',
      settings: {
        maxAttributes: 6,
        maxSkills: 12,
        attributePointPool: 27,
        skillPointPool: 40,
      },
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      attributes: [],
      skills: [],
    };
  });

  describe('Core Personalization Functionality', () => {
    test('generates narrative enhancement that references character details', () => {
      const context = engine.createPersonalizedContext(
        convertToPersonalizationCharacter(mockCharacter),
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should reference character name
      expect(enhancement).toContain('Alex Archer');
    });

    test('provides basic preference aggregation', () => {
      const aggressiveDecisions: PlayerDecision[] = [
        {
          id: 'dec-1',
          prompt: 'Combat situation',
          choiceText: 'Attack directly',
          choiceType: 'aggressive',
          timestamp: '2023-01-01',
          sessionId: 'session-1',
          worldId: 'world-1',
          context: {},
        },
        {
          id: 'dec-2',
          prompt: 'Conflict',
          choiceText: 'Fight back',
          choiceType: 'aggressive',
          timestamp: '2023-01-01',
          sessionId: 'session-1',
          worldId: 'world-1',
          context: {},
        },
      ];

      const analysis = engine.analyzePlayerBehavior(
        convertToPersonalizationCharacter(mockCharacter),
        aggressiveDecisions,
        [],
        []
      );

      // We aggregate choice types; trait inference is delegated to the LLM at narrative-generation time
      expect(analysis.preferences.preferredChoiceTypes).toContain('aggressive');
      expect(analysis.detectedTraits).toEqual([]);
    });

    test('sanitizes dangerous input in narrative enhancement', () => {
      const maliciousCharacter = {
        ...convertToPersonalizationCharacter(mockCharacter),
        name: 'Alex<script>alert("xss")</script>',
        background: 'Evil & "dangerous" character',
      };

      const context = engine.createPersonalizedContext(
        maliciousCharacter,
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should not contain dangerous characters
      expect(enhancement).not.toContain('<script>');
      expect(enhancement).not.toContain('&');
      expect(enhancement).not.toContain('"');
      expect(enhancement).toContain('Alex');
    });

    test('analyzes player behavior from decision history', () => {
      const decisions: PlayerDecision[] = [
        {
          id: 'dec-1',
          prompt: 'Test prompt',
          choiceText: 'Diplomatic response',
          choiceType: 'diplomatic',
          timestamp: '2023-01-01',
          sessionId: 'session-1',
          worldId: 'world-1',
          context: {},
        },
      ];

      const analysis = engine.analyzePlayerBehavior(
        convertToPersonalizationCharacter(mockCharacter),
        decisions,
        [],
        []
      );

      expect(analysis.detectedTraits).toEqual([]);
      expect(analysis.preferences.preferredChoiceTypes).toContain('diplomatic');
    });
  });

  describe('MVP Acceptance Criteria', () => {
    test('integrates player decision patterns when available', () => {
      const decisions: PlayerDecision[] = [
        {
          id: 'dec-1',
          prompt: 'Test',
          choiceText: 'Help others',
          choiceType: 'helpful',
          timestamp: '2023-01-01',
          sessionId: 'session-1',
          worldId: 'world-1',
          context: {},
        },
        {
          id: 'dec-2',
          prompt: 'Test',
          choiceText: 'Negotiate peacefully',
          choiceType: 'diplomatic',
          timestamp: '2023-01-01',
          sessionId: 'session-1',
          worldId: 'world-1',
          context: {},
        },
      ];

      const context = engine.createPersonalizedContext(
        convertToPersonalizationCharacter(mockCharacter),
        mockWorld,
        decisions,
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should reference decision patterns
      expect(enhancement).toMatch(/helpful|diplomatic/i);
    });
  });
});
