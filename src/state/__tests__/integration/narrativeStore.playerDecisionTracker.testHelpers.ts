/**
 * Test helpers for narrativeStore.playerDecisionTracker integration tests
 */

import { PlayerDecisionTracker } from '../../../lib/ai/playerDecisionTracker';
import { useNarrativeStore } from '../../narrativeStore';

/**
 * Creates a test instance of PlayerDecisionTracker isolated from global state
 */
export const createTestTracker = () => new PlayerDecisionTracker({
  storageKey: 'test_integration_decisions',
  maxDecisionsPerSession: 20,
  maxTotalDecisions: 100
});

/**
 * Resets the narrative store to initial state
 */
export const resetNarrativeStore = () => {
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
};

/**
 * Sets up fake timers with standard test time
 */
export const setupTestTimers = () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
};

/**
 * Cleans up after tests
 */
export const cleanupTests = (tracker: PlayerDecisionTracker) => {
  tracker.clearDecisions();
  jest.useRealTimers();
};
