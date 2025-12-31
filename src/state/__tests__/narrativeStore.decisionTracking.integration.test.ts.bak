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

// Test helpers
const TEST_SESSION = 'session-123';
const TEST_CHARACTER = 'char-456';
const TEST_WORLD = 'world-789';

const addTestSegment = (sessionId: string, overrides = {}) => {
  const store = useNarrativeStore.getState();
  return store.addSegment(sessionId, {
    content: 'Test content',
    type: 'scene' as const,
    timestamp: new Date(),
    updatedAt: getTimestamp(),
    metadata: { tags: [] },
    ...overrides
  });
};

const createTestDecision = (sessionId: string, prompt: string, options: DecisionOption[]) => {
  const store = useNarrativeStore.getState();
  return store.addDecision(sessionId, { prompt, options });
};

describe('NarrativeStore - PlayerDecisionTracker Integration (Issue #142)', () => {
  beforeEach(() => {
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
    jest.clearAllMocks();
  });

  describe('Core Integration Behavior', () => {
    it('should automatically track decisions when players select options', () => {
      addTestSegment(TEST_SESSION, {
        content: 'You are traveling on a forest road.',
        worldId: TEST_WORLD,
        metadata: { tags: ['travel', 'road'], location: 'Forest Road' }
      });

      const decisionId = createTestDecision(TEST_SESSION,
        'You encounter a wounded traveler on the road. What do you do?',
        [
          { id: 'help-option', text: 'Help the traveler with healing supplies', alignment: 'lawful' },
          { id: 'ignore-option', text: 'Continue on your way', alignment: 'neutral' },
          { id: 'question-option', text: 'Ask what happened before helping', alignment: 'neutral' }
        ] as DecisionOption[]
      );

      useNarrativeStore.getState().selectDecisionOption(decisionId, 'help-option', TEST_CHARACTER);

      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledTimes(1);
      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledWith(
        'You encounter a wounded traveler on the road. What do you do?',
        'Help the traveler with healing supplies',
        'diplomatic',
        TEST_SESSION,
        TEST_WORLD,
        expect.objectContaining({
          situation: expect.any(String),
          location: 'Forest Road'
        })
      );
    });

    it('should correctly infer choice types from decision options', () => {
      const testCases = [
        { text: 'Attack the bandits directly', alignment: 'chaotic' as const, type: 'aggressive', prompt: 'Bandits block your path. What do you do?' },
        { text: 'Try to negotiate a peaceful solution', alignment: 'lawful' as const, type: 'diplomatic', prompt: 'The merchant is angry about the damaged goods. How do you respond?' },
        { text: 'Wait and observe the situation', alignment: 'neutral' as const, type: 'neutral', prompt: 'Guards patrol the castle entrance. What is your approach?' },
        { text: 'Offer to help the villagers rebuild', alignment: 'lawful' as const, type: 'diplomatic', prompt: 'The village was destroyed by monsters. What do you do?' }
      ];

      testCases.forEach(({ text, alignment, type, prompt }, i) => {
        const decisionId = createTestDecision(TEST_SESSION, prompt, [
          { id: `opt-${i}`, text, alignment },
          { id: `other-${i}`, text: 'Do something else' }
        ] as DecisionOption[]);

        useNarrativeStore.getState().selectDecisionOption(decisionId, `opt-${i}`, TEST_CHARACTER);

        expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledWith(
          prompt, text, type, TEST_SESSION, expect.any(String), expect.any(Object)
        );
      });

      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledTimes(testCases.length);
    });

    it('should extract relevant context from game session', () => {
      addTestSegment(TEST_SESSION, {
        content: 'You arrive at the bustling marketplace of Rivertown.',
        metadata: { tags: ['marketplace', 'town'], location: 'Rivertown Marketplace', mood: 'neutral' }
      });

      addTestSegment(TEST_SESSION, {
        content: 'A merchant approaches you with a worried expression.',
        type: 'dialogue',
        characterIds: [TEST_CHARACTER, 'merchant-npc'],
        metadata: { tags: ['interaction', 'merchant'], location: 'Rivertown Marketplace' }
      });

      const decisionId = createTestDecision(TEST_SESSION,
        'The merchant asks for help finding his stolen goods. What do you do?',
        [
          { id: 'help-merchant', text: 'Agree to help investigate the theft' },
          { id: 'decline-help', text: 'Politely decline and continue shopping' }
        ] as DecisionOption[]
      );

      useNarrativeStore.getState().selectDecisionOption(decisionId, 'help-merchant', TEST_CHARACTER);

      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledWith(
        expect.any(String), expect.any(String), expect.any(String), TEST_SESSION, expect.any(String),
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
      mockPlayerDecisionTracker.recordDecision.mockImplementation(() => {
        throw new Error('Tracking system temporarily unavailable');
      });

      const decisionId = createTestDecision(TEST_SESSION, 'Choose your path', [
        { id: 'left-path', text: 'Take the left path' },
        { id: 'right-path', text: 'Take the right path' }
      ] as DecisionOption[]);

      expect(() => {
        useNarrativeStore.getState().selectDecisionOption(decisionId, 'left-path', TEST_CHARACTER);
      }).not.toThrow();

      const { decisions, error } = useNarrativeStore.getState();
      expect(decisions[decisionId]).toBeDefined();
      expect(decisions[decisionId].selectedOptionId).toBe('left-path');
      expect(decisions[decisionId].characterId).toBe(TEST_CHARACTER);
      expect(decisions[decisionId].selectedAt).toBeInstanceOf(Date);
      expect(error).toBeNull();
    });

    it('should handle decisions without character IDs appropriately', () => {
      const decisionId = createTestDecision(TEST_SESSION, 'A mysterious voice asks: What is your greatest fear?', [
        { id: 'answer-honestly', text: 'Answer honestly about your fears' },
        { id: 'deflect', text: 'Deflect with humor' }
      ] as DecisionOption[]);

      useNarrativeStore.getState().selectDecisionOption(decisionId, 'answer-honestly');

      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledTimes(0);

      const decision = useNarrativeStore.getState().decisions[decisionId];
      expect(decision.selectedOptionId).toBe('answer-honestly');
      expect(decision.characterId).toBeUndefined();
    });

    it('should handle missing world context gracefully', () => {
      const decisionId = createTestDecision(TEST_SESSION, 'You wake up in an unfamiliar place. What do you do first?', [
        { id: 'look-around', text: 'Look around carefully' },
        { id: 'call-out', text: 'Call out to see if anyone is nearby' }
      ] as DecisionOption[]);

      useNarrativeStore.getState().selectDecisionOption(decisionId, 'look-around', TEST_CHARACTER);

      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledTimes(1);
      const [, , , calledSessionId, calledWorldId] = mockPlayerDecisionTracker.recordDecision.mock.calls[0];
      expect(calledSessionId).toBe(TEST_SESSION);
      expect(calledWorldId).toBeDefined();
    });
  });

  describe('Integration Quality Assurance', () => {
    it('should maintain decision tracking across multiple game sessions', () => {
      const sessions = ['session-1', 'session-2', 'session-3'];

      sessions.forEach((sessionId, i) => {
        const decisionId = createTestDecision(sessionId, `Session ${i + 1}: How do you handle this challenge?`, [
          { id: `diplomatic-${i}`, text: 'Try to find a peaceful solution', alignment: 'lawful' },
          { id: `aggressive-${i}`, text: 'Take direct action', alignment: 'chaotic' }
        ] as DecisionOption[]);

        useNarrativeStore.getState().selectDecisionOption(decisionId, `diplomatic-${i}`, TEST_CHARACTER);
      });

      expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenCalledTimes(3);

      sessions.forEach((sessionId, i) => {
        expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenNthCalledWith(
          i + 1,
          expect.stringContaining(`Session ${i + 1}`),
          'Try to find a peaceful solution',
          'diplomatic',
          sessionId,
          expect.any(String),
          expect.any(Object)
        );
      });
    });

    it('should provide consistent choice type categorization', () => {
      const lawfulVariations = [
        'Help the injured traveler according to the healer\'s code',
        'Report the incident to proper authorities',
        'Follow established protocols for this situation',
        'Uphold the law even if it\'s difficult',
        'Honor your oath to protect the innocent'
      ];

      lawfulVariations.forEach((choiceText, i) => {
        const decisionId = createTestDecision(TEST_SESSION, `Scenario ${i + 1}: What do you do?`, [
          { id: `lawful-${i}`, text: choiceText, alignment: 'lawful' },
          { id: `other-${i}`, text: 'Walk away' }
        ] as DecisionOption[]);

        useNarrativeStore.getState().selectDecisionOption(decisionId, `lawful-${i}`, TEST_CHARACTER);

        expect(mockPlayerDecisionTracker.recordDecision).toHaveBeenNthCalledWith(
          i + 1,
          expect.any(String),
          choiceText,
          'diplomatic',
          TEST_SESSION,
          expect.any(String),
          expect.any(Object)
        );
      });
    });
  });
});