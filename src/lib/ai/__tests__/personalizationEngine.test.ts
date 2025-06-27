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

    test('dynamically infers narrative style from decisions', () => {
      const aggressiveDecisions: PlayerDecision[] = [
        {
          id: 'dec-1',
          prompt: 'Combat situation',
          choiceText: 'Attack directly',
          choiceType: 'aggressive',
          timestamp: '2023-01-01',
          sessionId: 'session-1',
          worldId: 'world-1',
          context: {}
        },
        {
          id: 'dec-2', 
          prompt: 'Conflict',
          choiceText: 'Fight back',
          choiceType: 'aggressive',
          timestamp: '2023-01-01',
          sessionId: 'session-1',
          worldId: 'world-1',
          context: {}
        }
      ];

      const analysis = engine.analyzePlayerBehavior(
        mockCharacter,
        mockWorld,
        aggressiveDecisions,
        [],
        []
      );

      expect(analysis.preferences.narrativeStyle).toBe('action-focused');
    });

    test('sanitizes dangerous input in narrative enhancement', () => {
      const maliciousCharacter = {
        ...mockCharacter,
        name: 'Alex<script>alert("xss")</script>',
        background: 'Evil & "dangerous" character'
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
      expect(enhancement).toContain('Evil');
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
});