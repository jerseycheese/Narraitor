/**
 * MVP-level tests for PersonalizationEngine
 * Focus on core acceptance criteria: personalized narrative content using world and character details
 */

import { PersonalizationEngine } from '../personalizationEngine';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';
import { PlayerDecision } from '@/types/personalization.types';

describe('PersonalizationEngine - MVP Tests', () => {
  let engine: PersonalizationEngine;
  let mockCharacter: Character;
  let mockWorld: World;

  beforeEach(() => {
    engine = new PersonalizationEngine();
    
    mockCharacter = {
      id: 'char-1',
      name: 'Alex Archer',
      background: 'Experienced archaeologist with a mysterious past',
      attributes: { Intelligence: 8, Dexterity: 6 },
      skills: [
        { name: 'Investigation', level: 8, worldSkillId: 'skill-1' },
        { name: 'Athletics', level: 5, worldSkillId: 'skill-2' }
      ],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    mockWorld = {
      id: 'world-1',
      name: 'Ancient Mysteries',
      description: 'A world of archaeological discoveries',
      genre: 'mystery',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      attributes: [],
      skills: []
    };
  });

  describe('Core Personalization Functionality', () => {
    test('generates narrative enhancement that references character details', () => {
      const context = engine.createPersonalizedContext(
        mockCharacter,
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should reference character name and background
      expect(enhancement).toContain('Alex Archer');
      expect(enhancement).toContain('archaeologist');
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
          context: {}
        }
      ];

      const analysis = engine.analyzePlayerBehavior(
        mockCharacter,
        mockWorld,
        decisions,
        [],
        []
      );

      expect(analysis.detectedTraits).toContain('diplomatic');
      expect(analysis.preferences.preferredChoiceTypes).toContain('diplomatic');
    });

    test('creates personalized context with character and world information', () => {
      const context = engine.createPersonalizedContext(
        mockCharacter,
        mockWorld,
        [],
        [],
        [],
        []
      );

      expect(context.character.personality).toBeDefined();
      expect(context.playerPreferences).toBeDefined();
      expect(context.narrativeHistory).toBeDefined();
    });
  });

  describe('MVP Acceptance Criteria', () => {
    test('references specific character details in narrative enhancement', () => {
      const context = engine.createPersonalizedContext(
        mockCharacter,
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Must reference character background
      expect(enhancement).toMatch(/archaeologist|mysterious past/i);
      
      // Must reference character skills if present
      if (mockCharacter.skills.length > 0) {
        expect(enhancement).toMatch(/Investigation|Athletics/i);
      }
    });

    test('maintains consistency with world genre and tone', () => {
      const context = engine.createPersonalizedContext(
        mockCharacter,
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should reference world genre
      expect(enhancement).toMatch(/mystery|exploration/i);
    });

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
          context: {}
        },
        {
          id: 'dec-2',
          prompt: 'Test',
          choiceText: 'Negotiate peacefully',
          choiceType: 'diplomatic',
          timestamp: '2023-01-01',
          sessionId: 'session-1',
          worldId: 'world-1',
          context: {}
        }
      ];

      const context = engine.createPersonalizedContext(
        mockCharacter,
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

  describe('Edge Cases', () => {
    test('handles empty decision history gracefully', () => {
      const context = engine.createPersonalizedContext(
        mockCharacter,
        mockWorld,
        [], // Empty decisions
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should still generate enhancement with character info
      expect(enhancement).toBeTruthy();
      expect(enhancement.length).toBeGreaterThan(0);
    });

    test('handles minimal character information', () => {
      const minimalCharacter: Character = {
        id: 'char-min',
        name: 'Min Char',
        background: '',
        attributes: {},
        skills: [],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      };

      const context = engine.createPersonalizedContext(
        minimalCharacter,
        mockWorld,
        [],
        [],
        [],
        []
      );

      expect(context).toBeDefined();
      expect(() => engine.generateNarrativeEnhancement(context)).not.toThrow();
    });
  });
});