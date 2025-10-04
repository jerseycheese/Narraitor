/**
 * Tests for PersonalizationEngine Decision Enhancement
 *
 * Tests the KISS approach: provide raw decision data to the LLM and let it infer patterns,
 * rather than manually generating complex consequence instructions.
 */

import { PersonalizationEngine } from '../personalizationEngine';
import { PlayerDecision, PersonalizedNarrativeContext } from '@/types/personalization.types';
import { getTimestamp } from '@/lib/utils/timestamp';

describe('PersonalizationEngine - KISS Decision Enhancement', () => {
  let personalizationEngine: PersonalizationEngine;
  let pastDecisions: PlayerDecision[];

  const mockCharacter = {
    id: 'char-1',
    name: 'Hero',
    background: 'A noble warrior',
    attributes: { strength: 8, wisdom: 6 },
    skills: [{ name: 'Swordsmanship', level: 3 }],
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    const oneDayAgo = getTimestamp();
    jest.setSystemTime(new Date('2025-01-15T00:00:00Z'));
    const twelveHoursAgo = getTimestamp();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    pastDecisions = [
      {
        id: 'decision-1',
        prompt: 'Bandits are threatening the village. What do you do?',
        sessionId: 'session-1',
        worldId: 'world-1',
        choiceText: 'Save the village from bandits',
        choiceType: 'helpful',
        timestamp: oneDayAgo,
        context: {
          situation: 'moral challenge',
          charactersPresent: ['village elder', 'scared farmers'],
          location: 'Millbrook Village'
        }
      },
      {
        id: 'decision-2',
        prompt: 'The defeated bandit leader begs for mercy. What do you decide?',
        sessionId: 'session-1',
        worldId: 'world-1',
        choiceText: 'Spare the bandit leader\'s life',
        choiceType: 'diplomatic',
        timestamp: twelveHoursAgo,
        context: {
          situation: 'justice decision',
          charactersPresent: ['bandit leader', 'villagers'],
          location: 'Bandit Camp'
        }
      }
    ];

    personalizationEngine = new PersonalizationEngine();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Raw Decision Data for LLM', () => {
    test('should provide raw decision details for LLM analysis', () => {
      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: ['empathetic', 'diplomatic'],
          goals: [],
          relationships: [],
          recentDecisions: pastDecisions
        },
        playerPreferences: {
          preferredChoiceTypes: ['helpful', 'diplomatic'],
          narrativeStyle: 'action-focused',
          detailLevel: 'moderate',
          contentFocus: 'dialogue',
          confidenceLevel: 90,
          lastUpdated: getTimestamp()
        },
        narrativeHistory: {
          keyEvents: [],
          establishedElements: ['Hero', 'noble warrior', 'Swordsmanship'],
          characterMilestones: []
        }
      };

      const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

      // Should include decision text for LLM to analyze
      expect(enhancement).toContain('Save the village from bandits');
      expect(enhancement).toContain('Spare the bandit leader\'s life');

      // Should include location context
      expect(enhancement).toContain('Millbrook Village');
      expect(enhancement).toContain('Bandit Camp');

      // Should include NPC names for LLM to reference
      expect(enhancement).toContain('village elder');
      expect(enhancement).toContain('scared farmers');
      expect(enhancement).toContain('bandit leader');
      expect(enhancement).toContain('villagers');
    });

    test('should provide simple instruction for LLM to adapt narrative', () => {
      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: ['empathetic'],
          goals: [],
          relationships: [],
          recentDecisions: pastDecisions
        },
        playerPreferences: {
          preferredChoiceTypes: ['helpful'],
          narrativeStyle: 'exploration',
          detailLevel: 'detailed',
          contentFocus: 'balanced',
          confidenceLevel: 85,
          lastUpdated: getTimestamp()
        },
        narrativeHistory: {
          keyEvents: [],
          establishedElements: [],
          characterMilestones: []
        }
      };

      const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

      // Should have simple instruction for LLM to use the data
      expect(enhancement).toMatch(/adapt.*narrative.*player.*style/i);
      expect(enhancement).toMatch(/reference.*past.*choices/i);
    });

    test('should include choice types for pattern recognition', () => {
      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: ['diplomatic'],
          goals: [],
          relationships: [],
          recentDecisions: pastDecisions
        },
        playerPreferences: {
          preferredChoiceTypes: ['diplomatic', 'helpful'],
          narrativeStyle: 'character-driven',
          detailLevel: 'detailed',
          contentFocus: 'dialogue',
          confidenceLevel: 90,
          lastUpdated: getTimestamp()
        },
        narrativeHistory: {
          keyEvents: [],
          establishedElements: [],
          characterMilestones: []
        }
      };

      const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

      // Should include choice types for LLM to recognize patterns
      expect(enhancement).toContain('[helpful]');
      expect(enhancement).toContain('[diplomatic]');

      // Should include preferred play style
      expect(enhancement).toMatch(/PREFERRED PLAY STYLE.*diplomatic/i);
    });
  });

  describe('Character Context', () => {
    test('should include character traits detected from decisions', () => {
      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: ['empathetic', 'diplomatic', 'patient'],
          goals: [],
          relationships: [],
          recentDecisions: pastDecisions
        },
        playerPreferences: {
          preferredChoiceTypes: ['helpful', 'diplomatic'],
          narrativeStyle: 'exploration',
          detailLevel: 'detailed',
          contentFocus: 'balanced',
          confidenceLevel: 85,
          lastUpdated: getTimestamp()
        },
        narrativeHistory: {
          keyEvents: [],
          establishedElements: [],
          characterMilestones: []
        }
      };

      const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

      // Should include detected traits
      expect(enhancement).toMatch(/CHARACTER TRAITS.*empathetic.*diplomatic.*patient/i);
    });

    test('should include active goals for context', () => {
      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: ['empathetic'],
          goals: [
            {
              id: 'goal-1',
              description: 'Protect the innocent',
              priority: 'primary',
              progress: 50,
              isActive: true
            },
            {
              id: 'goal-2',
              description: 'Find the truth',
              priority: 'secondary',
              progress: 25,
              isActive: true
            }
          ],
          relationships: [],
          recentDecisions: pastDecisions
        },
        playerPreferences: {
          preferredChoiceTypes: ['helpful'],
          narrativeStyle: 'exploration',
          detailLevel: 'detailed',
          contentFocus: 'balanced',
          confidenceLevel: 85,
          lastUpdated: getTimestamp()
        },
        narrativeHistory: {
          keyEvents: [],
          establishedElements: [],
          characterMilestones: []
        }
      };

      const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

      // Should include active goals
      expect(enhancement).toContain('Protect the innocent');
      expect(enhancement).toContain('Find the truth');
      expect(enhancement).toMatch(/ACTIVE GOALS/i);
    });
  });

  describe('Decision Prioritization', () => {
    test('should limit to most recent 5 decisions', () => {
      // Create many decisions
      const manyDecisions: PlayerDecision[] = Array.from({ length: 15 }, (_, i) => ({
        id: `decision-${i}`,
        prompt: `What do you do in situation ${i}?`,
        sessionId: 'session-1',
        worldId: 'world-1',
        choiceText: `Choice number ${i}`,
        choiceType: 'neutral' as const,
        timestamp: getTimestamp(),
        context: { situation: 'minor' }
      }));

      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: ['empathetic'],
          goals: [],
          relationships: [],
          recentDecisions: manyDecisions
        },
        playerPreferences: {
          preferredChoiceTypes: ['helpful'],
          narrativeStyle: 'action-focused',
          detailLevel: 'moderate',
          contentFocus: 'balanced',
          confidenceLevel: 85,
          lastUpdated: getTimestamp()
        },
        narrativeHistory: {
          keyEvents: [],
          establishedElements: [],
          characterMilestones: []
        }
      };

      const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

      // Should only include up to 5 decisions
      const choiceMatches = enhancement.match(/Choice number \d+/g) || [];
      expect(choiceMatches.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Empty State Handling', () => {
    test('should handle no decisions gracefully', () => {
      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: [],
          goals: [],
          relationships: [],
          recentDecisions: []
        },
        playerPreferences: {
          preferredChoiceTypes: [],
          narrativeStyle: 'exploration',
          detailLevel: 'moderate',
          contentFocus: 'balanced',
          confidenceLevel: 0,
          lastUpdated: getTimestamp()
        },
        narrativeHistory: {
          keyEvents: [],
          establishedElements: ['Hero'],
          characterMilestones: []
        }
      };

      const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

      // Should still include character name
      expect(enhancement).toContain('Hero');

      // Should not crash or include decision sections
      expect(enhancement).not.toContain('RECENT PLAYER DECISIONS');
    });
  });
});
