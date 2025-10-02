/**
 * TDD Tests for PersonalizationEngine Decision Enhancement (Issue #210)
 * 
 * Tests that the PersonalizationEngine generates specific decision context
 * and instructions for AI narrative generation, not just general patterns.
 */

import { PersonalizationEngine } from '../personalizationEngine';
import { PlayerDecision, PersonalizedNarrativeContext } from '@/types/personalization.types';
import { getTimestamp } from '@/lib/utils';

describe('PersonalizationEngine - Decision Enhancement (Issue #210)', () => {
  let personalizationEngine: PersonalizationEngine;

  const mockCharacter = {
    id: 'char-1',
    name: 'Hero',
    background: 'A noble warrior',
    attributes: { strength: 8, wisdom: 6 },
    skills: [{ name: 'Swordsmanship', level: 3 }],
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  // Note: mockWorld defined but not used in PersonalizationEngine tests - it works directly with context objects

  const pastDecisions: PlayerDecision[] = [
    {
      id: 'decision-1',
      prompt: 'Bandits are threatening the village. What do you do?',
      sessionId: 'session-1',
      worldId: 'world-1',
      choiceText: 'Save the village from bandits',
      choiceType: 'helpful',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
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
      timestamp: new Date(Date.now() - 43200000).toISOString(),
      context: {
        situation: 'justice decision', 
        charactersPresent: ['bandit leader', 'villagers'],
        location: 'Bandit Camp'
      }
    }
  ];

  beforeEach(() => {
    personalizationEngine = new PersonalizationEngine();
  });

  describe('Specific Decision Context Generation', () => {
    test('should include specific decision details in enhancement text', () => {
      // ACCEPTANCE CRITERIA: Enhancement must include specific past decision details
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
          contentFocus: 'balanced',
          confidenceLevel: 85,
          lastUpdated: getTimestamp()
        },
        narrativeHistory: {
          keyEvents: [],
          establishedElements: ['Hero', 'noble warrior', 'Swordsmanship'],
          characterMilestones: []
        }
      };

      const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

      // Should include specific decision text, not just patterns
      expect(enhancement).toContain('Save the village from bandits');
      expect(enhancement).toContain('Spare the bandit leader\'s life');
      
      // Should include location context
      expect(enhancement).toContain('Millbrook Village');
      expect(enhancement).toContain('Bandit Camp');
    });

    test('should generate AI instructions for decision consequences', () => {
      // ACCEPTANCE CRITERIA: Must instruct AI how to use past decisions
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

      // Should contain explicit AI instructions
      expect(enhancement).toMatch(/REFERENCE PAST DECISIONS?:/i);
      expect(enhancement).toMatch(/build.*upon.*these.*choices?/i);
      expect(enhancement).toMatch(/consequences?.*of.*actions?/i);
      expect(enhancement).toMatch(/NPCs?.*remember.*interactions?/i);
    });

    test('should create NPC-specific reaction instructions', () => {
      // ACCEPTANCE CRITERIA: NPCs should react based on past interactions
      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: ['diplomatic'],
          goals: [],
          relationships: [],
          recentDecisions: pastDecisions
        },
        playerPreferences: {
          preferredChoiceTypes: ['diplomatic'],
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

      // Should reference specific NPCs by name (from decision context)
      expect(enhancement).toContain('village elder');
      expect(enhancement).toContain('bandit leader');
      expect(enhancement).toContain('villagers');
      expect(enhancement).toContain('scared farmers');
      
      // Should include merciful consequences
      expect(enhancement).toMatch(/merciful.*consequences/i);
      expect(enhancement).toMatch(/affected.*by.*your.*mercy/i);
    });
  });

  describe('Decision Impact Mapping', () => {
    test('should map heroic decisions to reputation consequences', () => {
      // ACCEPTANCE CRITERIA: Heroic choices should build positive reputation
      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: ['empathetic'],
          goals: [],
          relationships: [],
          recentDecisions: [pastDecisions[0]] // Just the village-saving decision
        },
        playerPreferences: {
          preferredChoiceTypes: ['helpful'],
          narrativeStyle: 'action-focused',
          detailLevel: 'moderate',
          contentFocus: 'action',
          confidenceLevel: 80,
          lastUpdated: getTimestamp()
        },
        narrativeHistory: {
          keyEvents: [],
          establishedElements: [],
          characterMilestones: []
        }
      };

      const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

      // Should connect heroic choice to reputation effects
      expect(enhancement).toMatch(/heroic.*consequences/i);
      expect(enhancement).toMatch(/positive.*reputation/i);
      expect(enhancement).toMatch(/protective.*nature.*spreads/i);
      expect(enhancement).toContain('village elder, scared farmers');
    });

    test('should map merciful decisions to moral authority consequences', () => {
      // ACCEPTANCE CRITERIA: Merciful choices should establish moral authority
      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: ['diplomatic'],
          goals: [],
          relationships: [],
          recentDecisions: [pastDecisions[1]] // Just the mercy decision
        },
        playerPreferences: {
          preferredChoiceTypes: ['diplomatic'],
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

      // Should connect mercy to moral authority
      expect(enhancement).toMatch(/merciful.*consequences/i);
      expect(enhancement).toMatch(/moral.*authority/i);
      expect(enhancement).toMatch(/showing.*restraint/i);
      expect(enhancement).toContain('bandit leader, villagers');
    });

    test('should create compound consequences for multiple decision types', () => {
      // ACCEPTANCE CRITERIA: Multiple decisions should create complex consequences
      const context: PersonalizedNarrativeContext = {
        character: {
          ...mockCharacter,
          personality: ['empathetic', 'diplomatic'],
          goals: [],
          relationships: [],
          recentDecisions: pastDecisions // Both decisions
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

      // Should combine both decision consequences
      expect(enhancement).toMatch(/heroic.*and.*merciful/i);
      expect(enhancement).toMatch(/compound.*consequences/i);
      expect(enhancement).toMatch(/strength.*wisdom.*restraint/i);
      expect(enhancement).toMatch(/power.*protect.*judgment.*mercy/i);
    });
  });

  describe('Contextual Decision References', () => {
    test('should format decisions with location and NPC context', () => {
      // ACCEPTANCE CRITERIA: Decision context should be formatted for AI use
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

      // Should format decision context clearly for AI
      expect(enhancement).toMatch(/PAST PLAYER DECISIONS?:[\s\S]*Millbrook Village/i);
      expect(enhancement).toMatch(/village elder.*scared farmers/i);
      expect(enhancement).toMatch(/Bandit Camp.*bandit leader.*villagers/i);
    });

    test('should provide consequence instructions for each decision type', () => {
      // ACCEPTANCE CRITERIA: Each decision type should have specific consequence guidance
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
          narrativeStyle: 'character-driven',
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

      // Should have specific instructions for heroic consequences
      expect(enhancement).toMatch(/HEROIC.*CONSEQUENCES?:/i);
      expect(enhancement).toMatch(/positive.*reputation/i);
      
      // Should have specific instructions for merciful consequences  
      expect(enhancement).toMatch(/MERCIFUL.*CONSEQUENCES?:/i);
      expect(enhancement).toMatch(/moral.*authority/i);
    });
  });

  describe('Token Management and Optimization', () => {
    test('should prioritize most recent and impactful decisions', () => {
      // Create many decisions to test prioritization
      const manyDecisions: PlayerDecision[] = Array.from({ length: 15 }, (_, i) => ({
        id: `decision-${i}`,
        prompt: `What do you do in situation ${i}?`,
        sessionId: 'session-1',
        worldId: 'world-1',
        choiceText: `Minor choice ${i}`,
        choiceType: 'neutral' as const,
        timestamp: new Date(Date.now() - (i * 1000)).toISOString(),
        context: { situation: 'minor' }
      }));

      // Add one significant decision at the end
      manyDecisions.push({
        id: 'significant-decision',
        prompt: 'A terrible disaster threatens everyone. What do you do?',
        sessionId: 'session-1',
        worldId: 'world-1',
        choiceText: 'Saved all the people from the disaster',
        choiceType: 'helpful',
        timestamp: getTimestamp(),
        context: { 
          situation: 'world-changing',
          charactersPresent: ['leader', 'deputy', 'all citizens'],
          location: 'Central Plaza'
        }
      });

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
          contentFocus: 'action',
          confidenceLevel: 80,
          lastUpdated: getTimestamp()
        },
        narrativeHistory: {
          keyEvents: [],
          establishedElements: [],
          characterMilestones: []
        }
      };

      const enhancement = personalizationEngine.generateNarrativeEnhancement(context);

      // Should prioritize the significant decision
      expect(enhancement).toContain('Saved all the people from the disaster');
      expect(enhancement).toContain('Central Plaza');
      
      // Should not include all minor decisions
      const minorChoiceMatches = enhancement.match(/Minor choice \d+/g) || [];
      expect(minorChoiceMatches.length).toBeLessThan(10);
    });
  });
});