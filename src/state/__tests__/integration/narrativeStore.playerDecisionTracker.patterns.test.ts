/**
 * Cross-Session Pattern Building Tests for Issue #142
 *
 * These tests verify that the integration between narrativeStore and PlayerDecisionTracker
 * correctly builds player behavior patterns across multiple game sessions.
 *
 * Focus: Long-term pattern accumulation and analysis
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

describe('NarrativeStore ↔ PlayerDecisionTracker Cross-Session Patterns', () => {
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

  describe('Cross-Session Pattern Building', () => {
    it('should build consistent player patterns across multiple game sessions', () => {
      // INTEGRATION TEST: Long-term pattern accumulation

      const store = useNarrativeStore.getState();
      const characterId = TEST_IDS.character.consistent;
      const worldId = TEST_IDS.world.pattern;

      // Simulate multiple game sessions with consistent helpful choices
      const sessions = ['session-1', 'session-2', 'session-3'];

      sessions.forEach((sessionId, sessionIndex) => {
        // Create decision for each session
        const decisionId = store.addDecision(sessionId, {
          prompt: `Session ${sessionIndex + 1}: Someone needs help. What do you do?`,
          options: [
            { id: `help-${sessionIndex}`, text: `Help them in session ${sessionIndex + 1}` },
            { id: `ignore-${sessionIndex}`, text: `Ignore them in session ${sessionIndex + 1}` }
          ] as DecisionOption[]
        });

        // Player consistently chooses to help
        store.selectDecisionOption(decisionId, `help-${sessionIndex}`, characterId);

        // Track the decision
        recordDecisionInTracker(
          testTracker,
          `Session ${sessionIndex + 1}: Someone needs help. What do you do?`,
          `Help them in session ${sessionIndex + 1}`,
          'helpful',
          sessionId,
          worldId,
          {
            situation: `session ${sessionIndex + 1} help scenario`
          }
        );
      });

      // Analyze cross-session patterns
      const patterns = testTracker.analyzeChoicePatterns();

      expect(patterns.dominantChoiceTypes[0]).toBe('helpful');
      expect(patterns.choiceDistribution.helpful).toBe(3);
      expect(patterns.patternStrength).toBeGreaterThan(90); // Very strong pattern

      // Verify each session has decisions
      sessions.forEach(sessionId => {
        const sessionDecisions = testTracker.getSessionDecisions(sessionId);
        expect(sessionDecisions).toHaveLength(1);
      });

      // Test personalization readiness
      const recentDecisions = testTracker.getRecentDecisions(30); // Last 30 days
      expect(recentDecisions).toHaveLength(3);
      expect(recentDecisions.every(d => d.choiceType === 'helpful')).toBe(true);
    });
  });
});
