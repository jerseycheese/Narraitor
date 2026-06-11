// src/state/__tests__/narrativeStore.decisionRecording.test.ts
//
// Cases unique to this file. The complete-record, cross-session persistence, and
// character-association scenarios live in narrativeStore.decisionRecording.behavior.test.ts.

import { useNarrativeStore } from '../narrativeStore';
import { Decision, DecisionOption } from '../../types/narrative.types';
import { setupTestTimers, cleanupTestTimers } from '@/lib/test-utils/testTimers';

describe('narrativeStore - Decision Recording (Issue #207)', () => {
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

  describe('Decision Recording with Timestamps and Character Association', () => {
    it('should allow selection without characterId but record undefined', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';

      // Create a decision
      const decisionData: Omit<Decision, 'id'> = {
        prompt: 'Choose your path',
        options: [
          { id: 'option-1', text: 'Go left' },
          { id: 'option-2', text: 'Go right' }
        ] as DecisionOption[]
      };

      const decisionId = store.addDecision(sessionId, decisionData);

      // Select option without characterId (should work but record undefined)
      store.selectDecisionOption(decisionId, 'option-1');

      // Get fresh state and verify
      const updatedState = useNarrativeStore.getState();
      const decision = updatedState.decisions[decisionId];

      expect(decision).toBeDefined();
      expect(decision.selectedOptionId).toBe('option-1');
      expect(decision.selectedAt).toBeInstanceOf(Date);
      expect(decision.characterId).toBeUndefined();
    });

    it('should handle multiple decisions for the same character', async () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Create multiple decisions
      const decisions = [
        {
          prompt: 'First choice',
          options: [
            { id: 'opt-1a', text: 'Option 1A' },
            { id: 'opt-1b', text: 'Option 1B' }
          ] as DecisionOption[]
        },
        {
          prompt: 'Second choice',
          options: [
            { id: 'opt-2a', text: 'Option 2A' },
            { id: 'opt-2b', text: 'Option 2B' }
          ] as DecisionOption[]
        }
      ];

      const decisionIds = decisions.map(d => store.addDecision(sessionId, d));

      // Make first selection at base time
      const time1 = new Date('2025-01-15T12:00:00Z');
      store.selectDecisionOption(decisionIds[0], 'opt-1a', characterId);

      // Advance time by 10ms for second selection
      jest.setSystemTime(new Date('2025-01-15T12:00:00.010Z'));
      const time2 = new Date('2025-01-15T12:00:00.010Z');
      store.selectDecisionOption(decisionIds[1], 'opt-2b', characterId);

      // Verify both decisions are recorded correctly
      const updatedState = useNarrativeStore.getState();
      const decision1 = updatedState.decisions[decisionIds[0]];
      const decision2 = updatedState.decisions[decisionIds[1]];

      expect(decision1.characterId).toBe(characterId);
      expect(decision1.selectedOptionId).toBe('opt-1a');
      expect(decision1.selectedAt!.getTime()).toBe(time1.getTime());

      expect(decision2.characterId).toBe(characterId);
      expect(decision2.selectedOptionId).toBe('opt-2b');
      expect(decision2.selectedAt!.getTime()).toBe(time2.getTime());

      // Verify timestamps are different
      expect(decision2.selectedAt!.getTime()).toBeGreaterThan(decision1.selectedAt!.getTime());
    });

    it('should retrieve decisions by character for session', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const character1 = 'char-alice';
      const character2 = 'char-bob';

      // Create decisions for both characters
      const decision1Id = store.addDecision(sessionId, {
        prompt: 'Alice choice',
        options: [{ id: 'opt-1', text: 'Option 1' }] as DecisionOption[]
      });

      const decision2Id = store.addDecision(sessionId, {
        prompt: 'Bob choice',
        options: [{ id: 'opt-2', text: 'Option 2' }] as DecisionOption[]
      });

      const decision3Id = store.addDecision(sessionId, {
        prompt: 'Alice choice 2',
        options: [{ id: 'opt-3', text: 'Option 3' }] as DecisionOption[]
      });

      // Make selections
      store.selectDecisionOption(decision1Id, 'opt-1', character1);
      store.selectDecisionOption(decision2Id, 'opt-2', character2);
      store.selectDecisionOption(decision3Id, 'opt-3', character1);

      // Get decisions for character1
      const character1Decisions = store.getSessionDecisions(sessionId)
        .filter(d => d.characterId === character1);

      expect(character1Decisions).toHaveLength(2);
      expect(character1Decisions.map(d => d.id)).toContain(decision1Id);
      expect(character1Decisions.map(d => d.id)).toContain(decision3Id);

      // Get decisions for character2
      const character2Decisions = store.getSessionDecisions(sessionId)
        .filter(d => d.characterId === character2);

      expect(character2Decisions).toHaveLength(1);
      expect(character2Decisions[0].id).toBe(decision2Id);
    });
  });
});
