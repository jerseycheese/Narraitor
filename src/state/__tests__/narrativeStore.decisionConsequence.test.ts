// src/state/__tests__/narrativeStore.decisionConsequence.test.ts

import { useNarrativeStore } from '../narrativeStore';
import { Decision, DecisionOption, NarrativeSegment } from '../../types/narrative.types';
import { setupTestTimers, cleanupTestTimers } from '@/lib/test-utils/testTimers';
import { getTimestamp } from '@/lib/utils/timestamp';

describe('narrativeStore - Decision Consequence Tracking (Issue #971)', () => {
  beforeEach(() => {
    // Use fake timers for deterministic timestamp generation
    setupTestTimers();

    // Reset store state before each test
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
  });

  afterEach(() => {
    cleanupTestTimers();
  });

  describe('Decision-to-Segment Consequence Linking', () => {
    it('should link new segment to most recent decision', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const worldId = 'world-456';
      const characterId = 'char-789';

      // Add a decision
      const decisionData: Omit<Decision, 'id'> = {
        prompt: 'What do you do?',
        options: [
          { id: 'option-1', text: 'Help the merchant' },
          { id: 'option-2', text: 'Ignore and leave' }
        ] as DecisionOption[]
      };

      const decisionId = store.addDecision(sessionId, decisionData);
      store.selectDecisionOption(decisionId, 'option-1', characterId);

      // Add a new segment (should link to the decision)
      const segmentData: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'> = {
        worldId,
        content: 'The merchant thanks you warmly.',
        type: 'scene',
        metadata: { tags: [] },
        timestamp: new Date(),
        updatedAt: getTimestamp()
      };

      const segmentId = store.addSegment(sessionId, segmentData);

      // Verify the segment links to the decision
      const updatedState = useNarrativeStore.getState();
      const segment = updatedState.segments[segmentId];

      expect(segment).toBeDefined();
      expect(segment.metadata.causedByDecisionId).toBe(decisionId);
      expect(segment.metadata.causedByDecisionText).toBe('You choose to help the merchant');
    });

    it('should handle first segment with no prior decision', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const worldId = 'world-456';

      // Add first segment without any decisions
      const segmentData: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'> = {
        worldId,
        content: 'You find yourself in a bustling marketplace.',
        type: 'scene',
        metadata: { tags: [] },
        timestamp: new Date(),
        updatedAt: getTimestamp()
      };

      const segmentId = store.addSegment(sessionId, segmentData);

      // Verify no decision link exists
      const updatedState = useNarrativeStore.getState();
      const segment = updatedState.segments[segmentId];

      expect(segment).toBeDefined();
      expect(segment.metadata.causedByDecisionId).toBeUndefined();
      expect(segment.metadata.causedByDecisionText).toBeUndefined();
    });

    it('should preserve explicit decision links when provided', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const worldId = 'world-456';
      const characterId = 'char-789';

      // Add two decisions
      const decision1Id = store.addDecision(sessionId, {
        prompt: 'First choice',
        options: [{ id: 'opt-1', text: 'Option 1' }] as DecisionOption[]
      });
      store.selectDecisionOption(decision1Id, 'opt-1', characterId);

      const decision2Id = store.addDecision(sessionId, {
        prompt: 'Second choice',
        options: [{ id: 'opt-2', text: 'Option 2' }] as DecisionOption[]
      });
      store.selectDecisionOption(decision2Id, 'opt-2', characterId);

      // Add segment with explicit link to first decision (not most recent)
      const segmentData: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'> = {
        worldId,
        content: 'Consequence of first decision.',
        type: 'scene',
        metadata: {
          tags: [],
          causedByDecisionId: decision1Id,
          causedByDecisionText: 'You made the first choice'
        },
        timestamp: new Date(),
        updatedAt: getTimestamp()
      };

      const segmentId = store.addSegment(sessionId, segmentData);

      // Verify explicit link is preserved (not overwritten with decision2Id)
      const updatedState = useNarrativeStore.getState();
      const segment = updatedState.segments[segmentId];

      expect(segment.metadata.causedByDecisionId).toBe(decision1Id);
      expect(segment.metadata.causedByDecisionText).toBe('You made the first choice');
    });

    it('should handle segment when decision has no selected option', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const worldId = 'world-456';

      // Add decision but don't select an option
      store.addDecision(sessionId, {
        prompt: 'What do you do?',
        options: [{ id: 'opt-1', text: 'Do something' }] as DecisionOption[]
      });

      // Add segment
      const segmentData: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'> = {
        worldId,
        content: 'Something happens.',
        type: 'scene',
        metadata: { tags: [] },
        timestamp: new Date(),
        updatedAt: getTimestamp()
      };

      const segmentId = store.addSegment(sessionId, segmentData);

      // Verify no decision link (decision not selected)
      const updatedState = useNarrativeStore.getState();
      const segment = updatedState.segments[segmentId];

      expect(segment.metadata.causedByDecisionId).toBeUndefined();
      expect(segment.metadata.causedByDecisionText).toBeUndefined();
    });

    it('should link multiple segments to their respective decisions', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const worldId = 'world-456';
      const characterId = 'char-789';

      // Decision 1 → Segment 1
      const decision1Id = store.addDecision(sessionId, {
        prompt: 'First choice',
        options: [{ id: 'opt-1', text: 'Help the merchant' }] as DecisionOption[]
      });
      store.selectDecisionOption(decision1Id, 'opt-1', characterId);

      const segment1Id = store.addSegment(sessionId, {
        worldId,
        content: 'You help the merchant.',
        type: 'action',
        metadata: { tags: [] },
        timestamp: new Date(),
        updatedAt: getTimestamp()
      });

      // Decision 2 → Segment 2
      const decision2Id = store.addDecision(sessionId, {
        prompt: 'Second choice',
        options: [{ id: 'opt-2', text: 'Buy supplies' }] as DecisionOption[]
      });
      store.selectDecisionOption(decision2Id, 'opt-2', characterId);

      const segment2Id = store.addSegment(sessionId, {
        worldId,
        content: 'You purchase supplies.',
        type: 'action',
        metadata: { tags: [] },
        timestamp: new Date(),
        updatedAt: getTimestamp()
      });

      // Verify each segment links to its respective decision
      const updatedState = useNarrativeStore.getState();
      const segment1 = updatedState.segments[segment1Id];
      const segment2 = updatedState.segments[segment2Id];

      expect(segment1.metadata.causedByDecisionId).toBe(decision1Id);
      expect(segment1.metadata.causedByDecisionText).toBe('You choose to help the merchant');

      expect(segment2.metadata.causedByDecisionId).toBe(decision2Id);
      expect(segment2.metadata.causedByDecisionText).toBe('You choose to buy supplies');
    });

    it('should render a typed action as its own sentence', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const worldId = 'world-456';
      const characterId = 'char-789';
      const typed = 'i walk over to the mill and ask who holds the debt';

      const decisionId = store.addDecision(sessionId, {
        prompt: 'What do you do?',
        options: [
          {
            id: 'custom-1',
            text: typed,
            isCustomInput: true,
            customText: typed
          }
        ] as DecisionOption[]
      });
      store.selectDecisionOption(decisionId, 'custom-1', characterId);

      const segmentId = store.addSegment(sessionId, {
        worldId,
        content: 'The foreman looks up.',
        type: 'scene',
        metadata: { tags: [] },
        timestamp: new Date(),
        updatedAt: getTimestamp()
      });

      const segment = useNarrativeStore.getState().segments[segmentId];

      expect(segment.metadata.causedByDecisionText).toBe(
        'I walk over to the mill and ask who holds the debt'
      );
    });

    it('should format decision text with "You choose to" prefix', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const worldId = 'world-456';
      const characterId = 'char-789';

      // Test various decision text formats
      const testCases = [
        { optionText: 'Attack the enemy', expected: 'You choose to attack the enemy' },
        { optionText: 'Help them', expected: 'You choose to help them' },
        { optionText: 'Run away quickly', expected: 'You choose to run away quickly' },
        {
          optionText: 'Provoke Borro with a pointed insult.',
          expected: 'You choose to provoke Borro with a pointed insult.'
        }
      ];

      testCases.forEach(({ optionText, expected }) => {
        const decisionId = store.addDecision(sessionId, {
          prompt: 'What do you do?',
          options: [{ id: `opt-${optionText}`, text: optionText }] as DecisionOption[]
        });
        store.selectDecisionOption(decisionId, `opt-${optionText}`, characterId);

        const segmentId = store.addSegment(sessionId, {
          worldId,
          content: 'Something happens.',
          type: 'scene',
          metadata: { tags: [] },
          timestamp: new Date(),
          updatedAt: getTimestamp()
        });

        const updatedState = useNarrativeStore.getState();
        const segment = updatedState.segments[segmentId];

        expect(segment.metadata.causedByDecisionText).toBe(expected);
      });
    });

    it('should handle empty session decisions gracefully', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const worldId = 'world-456';

      // Add segment without any decisions in session
      const segmentData: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'> = {
        worldId,
        content: 'Story begins.',
        type: 'scene',
        metadata: { tags: [] },
        timestamp: new Date(),
        updatedAt: getTimestamp()
      };

      // Should not throw error
      let segmentId: string;
      expect(() => {
        segmentId = store.addSegment(sessionId, segmentData);
      }).not.toThrow();

      const updatedState = useNarrativeStore.getState();
      const segment = updatedState.segments[segmentId!];

      expect(segment).toBeDefined();
      expect(segment.metadata.causedByDecisionId).toBeUndefined();
    });

    it('should maintain existing metadata when adding decision link', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const worldId = 'world-456';
      const characterId = 'char-789';

      // Add decision
      const decisionId = store.addDecision(sessionId, {
        prompt: 'What do you do?',
        options: [{ id: 'opt-1', text: 'Investigate' }] as DecisionOption[]
      });
      store.selectDecisionOption(decisionId, 'opt-1', characterId);

      // Add segment with existing metadata
      const segmentData: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'> = {
        worldId,
        content: 'You investigate the area.',
        type: 'action',
        metadata: {
          tags: ['investigation', 'clue'],
          location: 'Old warehouse',
          mood: 'mysterious' as const,
          characterIds: [characterId]
        },
        timestamp: new Date(),
        updatedAt: getTimestamp()
      };

      const segmentId = store.addSegment(sessionId, segmentData);

      // Verify existing metadata preserved + decision link added
      const updatedState = useNarrativeStore.getState();
      const segment = updatedState.segments[segmentId];

      expect(segment.metadata.tags).toEqual(['investigation', 'clue']);
      expect(segment.metadata.location).toBe('Old warehouse');
      expect(segment.metadata.mood).toBe('mysterious');
      expect(segment.metadata.characterIds).toEqual([characterId]);
      expect(segment.metadata.causedByDecisionId).toBe(decisionId);
      expect(segment.metadata.causedByDecisionText).toBe('You choose to investigate');
    });
  });
});
