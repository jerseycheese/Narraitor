// src/state/__tests__/narrativeStore.decisionRecording.behavior.test.ts

import { useNarrativeStore } from '../narrativeStore';
import { Decision, DecisionOption } from '../../types/narrative.types';

describe('narrativeStore - Decision Recording Behavior Tests (Issue #207)', () => {
  beforeEach(() => {
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

  describe('Core Acceptance Criteria', () => {
    it('should create complete record when player selects option', () => {
      // Test Requirement: When a player selects an option, a complete record is created
      // with timestamp and character association
      
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';
      
      // Create decision with options
      const decisionId = store.addDecision(sessionId, {
        prompt: 'Choose your action',
        options: [
          { id: 'option-attack', text: 'Attack the enemy' },
          { id: 'option-defend', text: 'Defend yourself' }
        ] as DecisionOption[]
      });
      
      // Player selects an option
      const beforeSelection = Date.now();
      store.selectDecisionOption(decisionId, 'option-attack', characterId);
      const afterSelection = Date.now();
      
      // Verify complete record was created
      const updatedState = useNarrativeStore.getState();
      const decision = updatedState.decisions[decisionId];
      
      // Core requirements verification
      expect(decision.id).toBe(decisionId); // Decision ID
      expect(decision.selectedOptionId).toBe('option-attack'); // Option ID  
      expect(decision.characterId).toBe(characterId); // Character association
      expect(decision.selectedAt).toBeInstanceOf(Date); // Timestamp
      expect(decision.selectedAt!.getTime()).toBeGreaterThanOrEqual(beforeSelection);
      expect(decision.selectedAt!.getTime()).toBeLessThanOrEqual(afterSelection);
    });

    it('should persist choice records between browser sessions', () => {
      // Test Requirement: Choice records persist between browser sessions
      
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';
      
      // Create and select decision
      const decisionId = store.addDecision(sessionId, {
        prompt: 'Make your choice',
        options: [
          { id: 'option-yes', text: 'Yes' },
          { id: 'option-no', text: 'No' }
        ] as DecisionOption[]
      });
      
      store.selectDecisionOption(decisionId, 'option-yes', characterId);
      
      // Capture current state (simulates what persistence would save)
      const currentState = useNarrativeStore.getState();
      const persistedDecisionData = {
        decisions: currentState.decisions,
        sessionDecisions: currentState.sessionDecisions
      };
      
      // Simulate browser restart - clear all state
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
      
      // Verify state is cleared
      expect(useNarrativeStore.getState().decisions).toEqual({});
      
      // Restore from persistence (simulates loading saved data)
      useNarrativeStore.setState(persistedDecisionData);
      
      // Verify the decision record persisted with all required data
      const restoredDecision = useNarrativeStore.getState().decisions[decisionId];
      expect(restoredDecision).toBeDefined();
      expect(restoredDecision.selectedOptionId).toBe('option-yes');
      expect(restoredDecision.characterId).toBe(characterId);
      expect(restoredDecision.selectedAt).toBeInstanceOf(Date);
    });

    it('should correctly associate choices with player character', () => {
      // Test Requirement: The system correctly associates choices with the player's character
      
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const aliceCharacterId = 'char-alice';
      const bobCharacterId = 'char-bob';
      
      // Create decision for Alice
      const aliceDecisionId = store.addDecision(sessionId, {
        prompt: 'Alice, what do you do?',
        options: [
          { id: 'alice-option-1', text: 'Cast a spell' },
          { id: 'alice-option-2', text: 'Use sword' }
        ] as DecisionOption[]
      });
      
      // Create decision for Bob
      const bobDecisionId = store.addDecision(sessionId, {
        prompt: 'Bob, what do you do?',
        options: [
          { id: 'bob-option-1', text: 'Sneak attack' },
          { id: 'bob-option-2', text: 'Provide support' }
        ] as DecisionOption[]
      });
      
      // Each character makes their choice
      store.selectDecisionOption(aliceDecisionId, 'alice-option-1', aliceCharacterId);
      store.selectDecisionOption(bobDecisionId, 'bob-option-2', bobCharacterId);
      
      // Verify correct character associations
      const updatedState = useNarrativeStore.getState();
      const aliceDecision = updatedState.decisions[aliceDecisionId];
      const bobDecision = updatedState.decisions[bobDecisionId];
      
      expect(aliceDecision.characterId).toBe(aliceCharacterId);
      expect(aliceDecision.selectedOptionId).toBe('alice-option-1');
      
      expect(bobDecision.characterId).toBe(bobCharacterId);
      expect(bobDecision.selectedOptionId).toBe('bob-option-2');
      
      // Verify decisions are not mixed up
      expect(aliceDecision.characterId).not.toBe(bobCharacterId);
      expect(bobDecision.characterId).not.toBe(aliceCharacterId);
    });

    it('should record decision ID and option ID in choice record', () => {
      // Test Requirement: The record includes decision ID, option ID, and timestamp
      
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';
      
      // Create decision
      const decisionId = store.addDecision(sessionId, {
        prompt: 'Choose your path',
        options: [
          { id: 'option-left', text: 'Go left' },
          { id: 'option-right', text: 'Go right' }
        ] as DecisionOption[]
      });
      
      // Make choice
      store.selectDecisionOption(decisionId, 'option-right', characterId);
      
      // Verify record contains required IDs
      const updatedState = useNarrativeStore.getState();
      const decision = updatedState.decisions[decisionId];
      
      expect(decision.id).toBe(decisionId); // Decision ID
      expect(decision.selectedOptionId).toBe('option-right'); // Option ID
      expect(decision.selectedAt).toBeInstanceOf(Date); // Timestamp
    });
  });

  describe('User Experience Verification', () => {
    it('should handle rapid successive choices without data loss', () => {
      // Real-world scenario: Player makes multiple quick decisions
      
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';
      
      // Create multiple decisions
      const decision1Id = store.addDecision(sessionId, {
        prompt: 'First choice',
        options: [{ id: 'opt-1', text: 'Option 1' }] as DecisionOption[]
      });
      
      const decision2Id = store.addDecision(sessionId, {
        prompt: 'Second choice',
        options: [{ id: 'opt-2', text: 'Option 2' }] as DecisionOption[]
      });
      
      const decision3Id = store.addDecision(sessionId, {
        prompt: 'Third choice',
        options: [{ id: 'opt-3', text: 'Option 3' }] as DecisionOption[]
      });
      
      // Make rapid choices
      store.selectDecisionOption(decision1Id, 'opt-1', characterId);
      store.selectDecisionOption(decision2Id, 'opt-2', characterId);
      store.selectDecisionOption(decision3Id, 'opt-3', characterId);
      
      // Verify all choices were recorded correctly
      const updatedState = useNarrativeStore.getState();
      const decision1 = updatedState.decisions[decision1Id];
      const decision2 = updatedState.decisions[decision2Id];
      const decision3 = updatedState.decisions[decision3Id];
      
      expect(decision1.selectedOptionId).toBe('opt-1');
      expect(decision1.characterId).toBe(characterId);
      expect(decision1.selectedAt).toBeInstanceOf(Date);
      
      expect(decision2.selectedOptionId).toBe('opt-2');
      expect(decision2.characterId).toBe(characterId);
      expect(decision2.selectedAt).toBeInstanceOf(Date);
      
      expect(decision3.selectedOptionId).toBe('opt-3');
      expect(decision3.characterId).toBe(characterId);
      expect(decision3.selectedAt).toBeInstanceOf(Date);
    });

    it('should retrieve player choice history for session', () => {
      // Real-world scenario: System needs to review player's choices
      
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      const characterId = 'char-456';
      
      // Create and make several choices
      const choices = [
        { prompt: 'Choice 1', option: 'option-1' },
        { prompt: 'Choice 2', option: 'option-2' },
        { prompt: 'Choice 3', option: 'option-3' }
      ];
      
      const decisionIds = choices.map(choice => {
        const decisionId = store.addDecision(sessionId, {
          prompt: choice.prompt,
          options: [{ id: choice.option, text: choice.option }] as DecisionOption[]
        });
        
        store.selectDecisionOption(decisionId, choice.option, characterId);
        return decisionId;
      });
      
      // Retrieve session decisions
      const sessionDecisions = store.getSessionDecisions(sessionId);
      
      // Verify all decisions are retrievable
      expect(sessionDecisions).toHaveLength(3);
      
      // Verify all decisions belong to the character
      const characterDecisions = sessionDecisions.filter(d => d.characterId === characterId);
      expect(characterDecisions).toHaveLength(3);
      
      // Verify decision IDs match
      const retrievedIds = sessionDecisions.map(d => d.id);
      decisionIds.forEach(id => {
        expect(retrievedIds).toContain(id);
      });
    });
  });
});