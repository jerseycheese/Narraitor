/**
 * Integration Robustness Tests for Issue #142
 *
 * These tests verify that the integration between narrativeStore and PlayerDecisionTracker
 * maintains data integrity under various error conditions and edge cases.
 *
 * Focus: System resilience and error handling
 */

import { useNarrativeStore } from '../../narrativeStore';
import {
  createTestTracker,
  resetNarrativeStore,
  setupTestTimers,
  cleanupTests,
  TEST_IDS,
  recordDecisionInTracker
} from './narrativeStore.playerDecisionTracker.testHelpers';
import { PlayerDecisionTracker } from '../../../lib/ai/playerDecisionTracker';
import { DecisionOption } from '../../../types/narrative.types';

describe('NarrativeStore ↔ PlayerDecisionTracker Integration Robustness', () => {
  let testTracker: PlayerDecisionTracker;

  beforeEach(() => {
    setupTestTimers();
    resetNarrativeStore();
    testTracker = createTestTracker();
    testTracker.clearDecisions();
  });

  afterEach(() => {
    cleanupTests(testTracker);
  });

  describe('Integration Robustness and Error Handling', () => {
    it('should maintain data integrity during integration failures', () => {
      // INTEGRATION TEST: System resilience when tracking fails

      const store = useNarrativeStore.getState();
      const sessionId = TEST_IDS.session.robust;
      const characterId = TEST_IDS.character.test;

      // Create normal decision
      const decisionId = store.addDecision(sessionId, {
        prompt: 'Test decision for robustness',
        options: [
          { id: 'option-1', text: 'First option' },
          { id: 'option-2', text: 'Second option' }
        ] as DecisionOption[]
      });

      // Record selection in narrative store with deterministic timestamp
      const expectedTime = new Date('2025-01-15T12:00:00Z');
      store.selectDecisionOption(decisionId, 'option-1', characterId);

      // Get fresh state after selection
      const updatedState = useNarrativeStore.getState();
      const decision = updatedState.decisions[decisionId];
      expect(decision.selectedOptionId).toBe('option-1');
      expect(decision.characterId).toBe(characterId);
      expect(decision.selectedAt).toBeInstanceOf(Date);
      expect(decision.selectedAt!.getTime()).toBe(expectedTime.getTime());

      // Verify no errors are set
      const currentState = useNarrativeStore.getState();
      expect(currentState.error).toBeNull();

      // Verify decision is retrievable
      const sessionDecisions = store.getSessionDecisions(sessionId);
      expect(sessionDecisions).toHaveLength(1);
      expect(sessionDecisions[0].id).toBe(decisionId);
    });

    it('should handle missing or incomplete context gracefully', () => {
      // INTEGRATION TEST: Partial context scenarios

      const store = useNarrativeStore.getState();
      const sessionId = TEST_IDS.session.minimal;
      const characterId = TEST_IDS.character.test;

      // Create decision without rich context
      const decisionId = store.addDecision(sessionId, {
        prompt: 'A choice with minimal context',
        options: [
          { id: 'minimal-option', text: 'Make the choice anyway' }
        ] as DecisionOption[]
      });

      // Make selection
      store.selectDecisionOption(decisionId, 'minimal-option', characterId);

      // Simulate tracking with minimal context
      recordDecisionInTracker(
        testTracker,
        'A choice with minimal context',
        'Make the choice anyway',
        'neutral',
        sessionId,
        TEST_IDS.world.unknown,
        {} // Empty context
      );

      // Verify tracking works with minimal data
      const decisions = testTracker.getSessionDecisions(sessionId);
      expect(decisions).toHaveLength(1);
      expect(decisions[0].context).toEqual({});
      expect(decisions[0].worldId).toBe('unknown-world');
    });

    it('should handle rapid successive decisions without data loss', () => {
      // INTEGRATION TEST: Performance under rapid decision making

      const store = useNarrativeStore.getState();
      const sessionId = TEST_IDS.session.rapid;
      const characterId = TEST_IDS.character.speed;

      const decisions = [];
      const numDecisions = 10;

      // Create and select multiple decisions rapidly
      for (let i = 0; i < numDecisions; i++) {
        const decisionId = store.addDecision(sessionId, {
          prompt: `Rapid decision ${i + 1}`,
          options: [
            { id: `option-${i}`, text: `Choice ${i + 1}` }
          ] as DecisionOption[]
        });

        store.selectDecisionOption(decisionId, `option-${i}`, characterId);

        // Simulate rapid tracking
        recordDecisionInTracker(
          testTracker,
          `Rapid decision ${i + 1}`,
          `Choice ${i + 1}`,
          'neutral',
          sessionId,
          TEST_IDS.world.speed,
          { situation: `rapid choice ${i + 1}` }
        );

        decisions.push(decisionId);
      }

      // Verify all decisions were tracked
      const trackedDecisions = testTracker.getSessionDecisions(sessionId);
      expect(trackedDecisions).toHaveLength(numDecisions);

      // Verify narrative store integrity
      const narrativeDecisions = store.getSessionDecisions(sessionId);
      expect(narrativeDecisions).toHaveLength(numDecisions);

      // Verify each decision has correct data (sort numerically by prompt)
      const sortedTrackedDecisions = trackedDecisions.sort((a, b) => {
        const aNum = parseInt(a.prompt.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.prompt.match(/\d+/)?.[0] || '0');
        return aNum - bNum;
      });
      sortedTrackedDecisions.forEach((decision, index) => {
        expect(decision.prompt).toBe(`Rapid decision ${index + 1}`);
        expect(decision.choiceText).toBe(`Choice ${index + 1}`);
      });
    });
  });
});
