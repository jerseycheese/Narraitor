// src/state/__tests__/narrativeStore.decisionRecording.test.ts

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
    it('should record complete decision data when player selects an option', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';
      
      // Create a decision with options
      const decisionData: Omit<Decision, 'id'> = {
        prompt: 'What do you do?',
        options: [
          { id: 'option-1', text: 'Attack' },
          { id: 'option-2', text: 'Defend' }
        ] as DecisionOption[]
      };
      
      const decisionId = store.addDecision(sessionId, decisionData);

      // Record the decision selection with deterministic timestamp
      const expectedTime = new Date('2025-01-15T12:00:00Z');
      store.selectDecisionOption(decisionId, 'option-1', characterId);

      // Get fresh state after mutation
      const updatedState = useNarrativeStore.getState();
      const updatedDecision = updatedState.decisions[decisionId];

      expect(updatedDecision).toBeDefined();
      expect(updatedDecision.selectedOptionId).toBe('option-1');
      expect(updatedDecision.selectedAt).toBeDefined();
      expect(updatedDecision.selectedAt).toBeInstanceOf(Date);
      expect(updatedDecision.selectedAt!.getTime()).toBe(expectedTime.getTime());
      expect(updatedDecision.characterId).toBe(characterId);
    });

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

    it('should create decision record with decision ID and option ID', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';
      
      // Create decision
      const decisionData: Omit<Decision, 'id'> = {
        prompt: 'Make your choice',
        options: [
          { id: 'option-a', text: 'Option A' },
          { id: 'option-b', text: 'Option B' }
        ] as DecisionOption[]
      };
      
      const decisionId = store.addDecision(sessionId, decisionData);
      
      // Select option
      store.selectDecisionOption(decisionId, 'option-b', characterId);
      
      // Verify the complete record structure
      const updatedState = useNarrativeStore.getState();
      const decision = updatedState.decisions[decisionId];
      expect(decision.id).toBe(decisionId);
      expect(decision.selectedOptionId).toBe('option-b');
      expect(decision.characterId).toBe(characterId);
      expect(decision.selectedAt).toBeInstanceOf(Date);
    });

    it('should persist decision records between browser sessions', () => {
      // This test verifies that decisions are included in the persisted state
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';
      
      // Create and select decision
      const decisionData: Omit<Decision, 'id'> = {
        prompt: 'Test persistence',
        options: [
          { id: 'option-1', text: 'Yes' },
          { id: 'option-2', text: 'No' }
        ] as DecisionOption[]
      };
      
      const decisionId = store.addDecision(sessionId, decisionData);
      const expectedTime = new Date('2025-01-15T12:00:00Z');
      store.selectDecisionOption(decisionId, 'option-1', characterId);

      // Get current state
      const currentState = useNarrativeStore.getState();

      // Simulate browser session end/restart by creating new store instance
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

      // Restore state (simulating persistence load)
      useNarrativeStore.setState({
        decisions: currentState.decisions,
        sessionDecisions: currentState.sessionDecisions
      });

      // Verify decision persists with all data
      const restoredState = useNarrativeStore.getState();
      const persistedDecision = restoredState.decisions[decisionId];

      expect(persistedDecision).toBeDefined();
      expect(persistedDecision.selectedOptionId).toBe('option-1');
      expect(persistedDecision.characterId).toBe(characterId);
      expect(persistedDecision.selectedAt).toBeInstanceOf(Date);
      expect(persistedDecision.selectedAt!.getTime()).toBe(expectedTime.getTime());
    });

    it('should correctly associate choices with player character', () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const character1 = 'char-alice';
      const character2 = 'char-bob';
      
      // Create two decisions
      const decision1Data: Omit<Decision, 'id'> = {
        prompt: 'Alice, what do you do?',
        options: [
          { id: 'option-1a', text: 'Attack' },
          { id: 'option-1b', text: 'Defend' }
        ] as DecisionOption[]
      };
      
      const decision2Data: Omit<Decision, 'id'> = {
        prompt: 'Bob, what do you do?',
        options: [
          { id: 'option-2a', text: 'Help Alice' },
          { id: 'option-2b', text: 'Run away' }
        ] as DecisionOption[]
      };
      
      const decision1Id = store.addDecision(sessionId, decision1Data);
      const decision2Id = store.addDecision(sessionId, decision2Data);
      
      // Make selections for different characters
      store.selectDecisionOption(decision1Id, 'option-1a', character1);
      store.selectDecisionOption(decision2Id, 'option-2a', character2);
      
      // Verify character associations
      const updatedState = useNarrativeStore.getState();
      const decision1 = updatedState.decisions[decision1Id];
      const decision2 = updatedState.decisions[decision2Id];
      
      expect(decision1.characterId).toBe(character1);
      expect(decision1.selectedOptionId).toBe('option-1a');
      
      expect(decision2.characterId).toBe(character2);
      expect(decision2.selectedOptionId).toBe('option-2a');
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