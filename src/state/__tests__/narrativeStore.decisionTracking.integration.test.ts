/**
 * Integration tests for Issue #142: PlayerDecisionTracker integration with narrativeStore.selectDecisionOption()
 * 
 * These tests verify that when players make choices through narrativeStore.selectDecisionOption(),
 * the decisions are automatically tracked by PlayerDecisionTracker for personalization.
 * 
 * Focus: Integration behavior, not implementation details
 */

import { useNarrativeStore } from '../narrativeStore';
import { getTimestamp } from '@/lib/utils/timestamp';
import { playerDecisionTracker } from '../../lib/ai/playerDecisionTracker';
import { DecisionOption } from '../../types/narrative.types';

// Mock the PlayerDecisionTracker to control its behavior in tests
jest.mock('../../lib/ai/playerDecisionTracker', () => ({
  playerDecisionTracker: {
    recordDecision: jest.fn(),
    getSessionDecisions: jest.fn(() => []),
    clearDecisions: jest.fn(),
    analyzeChoicePatterns: jest.fn(() => ({
      dominantChoiceTypes: [],
      choiceDistribution: {},
      patternStrength: 0
    }))
  }
}));

const mockPlayerDecisionTracker = playerDecisionTracker as jest.Mocked<typeof playerDecisionTracker>;

describe('NarrativeStore - PlayerDecisionTracker Integration (Issue #142)', () => {
  beforeEach(() => {
    // Reset narrative store state
    useNarrativeStore.setState({
      segments: {},
      sessionSegments: {},
      decisions: {},
      sessionDecisions: {},
      endedSessions: {},
      currentEnding: null,
      isGeneratingEnding: false,
      endingError: null,
      loading: false,
      error: null
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Core Integration Behavior', () => {
    it('should automatically track decisions when players select options', () => {
      // ACCEPTANCE CRITERIA: When a player selects a decision option through narrativeStore,
      // the decision should be automatically recorded in PlayerDecisionTracker

      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';
      const worldId = 'world-789';

      // Set up world context with a segment
      store.addSegment(sessionId, {
        content: 'You are traveling on a forest road.',
        type: 'scene',
        worldId: worldId,
        timestamp: new Date(),
        updatedAt: getTimestamp(),
        metadata: {
          tags: ['travel', 'road'],
          location: 'Forest Road'
        }
      });

      // Create a decision with options (using alignment for proper type inference)
      const decisionId = store.addDecision(sessionId, {
        prompt: 'You encounter a wounded traveler on the road. What do you do?',
        options: [
          { id: 'help-option', text: 'Help the traveler with healing supplies', alignment: 'lawful' },
          { id: 'ignore-option', text: 'Continue on your way', alignment: 'neutral' },
          { id: 'question-option', text: 'Ask what happened before helping', alignment: 'neutral' }
        ] as DecisionOption[]
      });

      // Player selects the helpful option
      store.selectDecisionOption(decisionId, 'help-option', characterId);

      // Verify PlayerDecisionTracker.recordDecision was called with correct data
      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledTimes(1);
      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledWith(
        'You encounter a wounded traveler on the road. What do you do?', // prompt
        'Help the traveler with healing supplies', // choiceText
        'diplomatic', // choiceType (lawful alignment maps to diplomatic)
        sessionId,
        worldId,
        expect.objectContaining({
          situation: expect.any(String),
          location: 'Forest Road'
        })
      );
    });

    it('should correctly infer choice types from decision options', () => {
      // ACCEPTANCE CRITERIA: System should intelligently categorize player choices
      // using alignment-based mapping when available, AI inference when not

      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';

      const testCases = [
        {
          optionText: 'Attack the bandits directly',
          alignment: 'chaotic' as const,
          expectedType: 'aggressive',
          prompt: 'Bandits block your path. What do you do?'
        },
        {
          optionText: 'Try to negotiate a peaceful solution',
          alignment: 'lawful' as const,
          expectedType: 'diplomatic', 
          prompt: 'The merchant is angry about the damaged goods. How do you respond?'
        },
        {
          optionText: 'Wait and observe the situation',
          alignment: 'neutral' as const,
          expectedType: 'neutral',
          prompt: 'Guards patrol the castle entrance. What is your approach?'
        },
        {
          optionText: 'Offer to help the villagers rebuild',
          alignment: 'lawful' as const,
          expectedType: 'diplomatic',
          prompt: 'The village was destroyed by monsters. What do you do?'
        }
      ];

      testCases.forEach(({ optionText, alignment, expectedType, prompt }, index) => {
        const decisionId = store.addDecision(sessionId, {
          prompt,
          options: [
            { id: `option-${index}`, text: optionText, alignment },
            { id: `other-option-${index}`, text: 'Do something else' }
          ] as DecisionOption[]
        });

        store.selectDecisionOption(decisionId, `option-${index}`, characterId);

        // Verify the choice type was correctly mapped from alignment
        expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledWith(
          prompt,
          optionText,
          expectedType,
          sessionId,
          expect.any(String), // worldId
          expect.any(Object)  // context
        );
      });

      // Should have been called once for each test case
      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledTimes(testCases.length);
    });

    it('should extract relevant context from game session', () => {
      // ACCEPTANCE CRITERIA: Context information should be extracted from the current
      // narrative session to provide rich decision tracking data

      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Add some narrative segments to establish context
      store.addSegment(sessionId, {
        content: 'You arrive at the bustling marketplace of Rivertown.',
        type: 'scene',
        timestamp: new Date(),
        updatedAt: getTimestamp(),
        metadata: {
          tags: ['marketplace', 'town'],
          location: 'Rivertown Marketplace',
          mood: 'neutral'
        }
      });

      store.addSegment(sessionId, {
        content: 'A merchant approaches you with a worried expression.',
        type: 'dialogue',
        timestamp: new Date(),
        updatedAt: getTimestamp(),
        characterIds: [characterId, 'merchant-npc'],
        metadata: {
          tags: ['interaction', 'merchant'],
          location: 'Rivertown Marketplace'
        }
      });

      // Create decision in this rich context
      const decisionId = store.addDecision(sessionId, {
        prompt: 'The merchant asks for help finding his stolen goods. What do you do?',
        options: [
          { id: 'help-merchant', text: 'Agree to help investigate the theft' },
          { id: 'decline-help', text: 'Politely decline and continue shopping' }
        ] as DecisionOption[]
      });

      store.selectDecisionOption(decisionId, 'help-merchant', characterId);

      // Verify context was extracted and passed to tracker
      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledWith(
        expect.any(String), // prompt
        expect.any(String), // choiceText
        expect.any(String), // choiceType
        sessionId,
        expect.any(String), // worldId
        expect.objectContaining({
          location: 'Rivertown Marketplace',
          situation: expect.stringContaining('merchant'),
          charactersPresent: expect.arrayContaining(['merchant-npc'])
        })
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle tracking failures gracefully without breaking game flow', () => {
      // ACCEPTANCE CRITERIA: If PlayerDecisionTracker fails, the game should continue normally
      // The core decision recording in narrativeStore should not be affected

      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Mock PlayerDecisionTracker to throw an error
      mockPlayerDecisionTracker.recordDecision.mockImplementation(() => {
        throw new Error('Tracking system temporarily unavailable');
      });

      const decisionId = store.addDecision(sessionId, {
        prompt: 'Choose your path',
        options: [
          { id: 'left-path', text: 'Take the left path' },
          { id: 'right-path', text: 'Take the right path' }
        ] as DecisionOption[]
      });

      // This should not throw an error despite tracking failure
      expect(() => {
        store.selectDecisionOption(decisionId, 'left-path', characterId);
      }).not.toThrow();

      // Core narrative decision should still be recorded correctly
      const updatedState = useNarrativeStore.getState();
      const decision = updatedState.decisions[decisionId];
      
      expect(decision).toBeDefined();
      expect(decision.selectedOptionId).toBe('left-path');
      expect(decision.characterId).toBe(characterId);
      expect(decision.selectedAt).toBeInstanceOf(Date);

      // No error should be set in the store
      expect(updatedState.error).toBeNull();
    });

    it('should handle decisions without character IDs appropriately', () => {
      // ACCEPTANCE CRITERIA: System should handle cases where no character ID is provided
      // by skipping tracking but continuing normal game flow

      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';

      const decisionId = store.addDecision(sessionId, {
        prompt: 'A mysterious voice asks: What is your greatest fear?',
        options: [
          { id: 'answer-honestly', text: 'Answer honestly about your fears' },
          { id: 'deflect', text: 'Deflect with humor' }
        ] as DecisionOption[]
      });

      // Select option without providing character ID
      store.selectDecisionOption(decisionId, 'answer-honestly');

      // Should NOT attempt tracking without character ID (our implementation requires both sessionId and characterId)
      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledTimes(0);

      // Core narrative functionality should work normally
      const updatedState = useNarrativeStore.getState();
      const decision = updatedState.decisions[decisionId];
      
      expect(decision.selectedOptionId).toBe('answer-honestly');
      expect(decision.characterId).toBeUndefined();
    });

    it('should handle missing world context gracefully', () => {
      // ACCEPTANCE CRITERIA: System should work even when world information is not available
      // This could happen during system transitions or incomplete game state

      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Create decision without world context established
      const decisionId = store.addDecision(sessionId, {
        prompt: 'You wake up in an unfamiliar place. What do you do first?',
        options: [
          { id: 'look-around', text: 'Look around carefully' },
          { id: 'call-out', text: 'Call out to see if anyone is nearby' }
        ] as DecisionOption[]
      });

      store.selectDecisionOption(decisionId, 'look-around', characterId);

      // Should attempt tracking with whatever context is available
      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledTimes(1);
      
      // Verify it was called with some fallback world ID or appropriate handling
      const [, , , calledSessionId, calledWorldId] = 
        mockPlayerDecisionTracker.recordDecision.mock.calls[0];
      
      expect(calledSessionId).toBe(sessionId);
      expect(calledWorldId).toBeDefined(); // Should have some value, even if fallback
    });
  });

  describe('Integration Quality Assurance', () => {
    it('should maintain decision tracking across multiple game sessions', () => {
      // ACCEPTANCE CRITERIA: Player decision patterns should accumulate across game sessions
      // for better long-term personalization

      const store = useNarrativeStore.getState();
      const characterId = 'char-456';

      // Simulate decisions across multiple sessions
      const sessions = ['session-1', 'session-2', 'session-3'];

      sessions.forEach((sessionId, index) => {
        const decisionId = store.addDecision(sessionId, {
          prompt: `Session ${index + 1}: How do you handle this challenge?`,
          options: [
            { id: `diplomatic-${index}`, text: 'Try to find a peaceful solution', alignment: 'lawful' },
            { id: `aggressive-${index}`, text: 'Take direct action', alignment: 'chaotic' }
          ] as DecisionOption[]
        });

        // Player consistently chooses diplomatic solutions
        store.selectDecisionOption(decisionId, `diplomatic-${index}`, characterId);
      });

      // Should have tracked decisions from all sessions
      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledTimes(3);

      // Each call should have correct session context
      sessions.forEach((sessionId, index) => {
        expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenNthCalledWith(
          index + 1,
          expect.stringContaining(`Session ${index + 1}`),
          'Try to find a peaceful solution',
          'diplomatic',
          sessionId,
          expect.any(String),
          expect.any(Object)
        );
      });
    });

    it('should provide consistent choice type categorization', () => {
      // ACCEPTANCE CRITERIA: Similar choices with same alignment should be categorized consistently
      // to enable accurate pattern recognition

      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Test variations of lawful choices - should all map to diplomatic
      const lawfulVariations = [
        'Help the injured traveler according to the healer\'s code',
        'Report the incident to proper authorities',
        'Follow established protocols for this situation',
        'Uphold the law even if it\'s difficult',
        'Honor your oath to protect the innocent'
      ];

      lawfulVariations.forEach((choiceText, index) => {
        const decisionId = store.addDecision(sessionId, {
          prompt: `Scenario ${index + 1}: What do you do?`,
          options: [
            { id: `lawful-${index}`, text: choiceText, alignment: 'lawful' },
            { id: `other-${index}`, text: 'Walk away' }
          ] as DecisionOption[]
        });

        store.selectDecisionOption(decisionId, `lawful-${index}`, characterId);

        // Each should be categorized as 'diplomatic' (lawful -> diplomatic mapping)
        expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenNthCalledWith(
          index + 1,
          expect.any(String),
          choiceText,
          'diplomatic', // Should consistently map lawful -> diplomatic
          sessionId,
          expect.any(String),
          expect.any(Object)
        );
      });
    });
  });
});