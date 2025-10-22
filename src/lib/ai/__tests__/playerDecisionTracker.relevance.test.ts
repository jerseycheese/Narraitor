/**
 * Integration tests for PlayerDecisionTracker with relevance scoring
 * Tests the integration between decision tracking and relevance calculation
 */

import { PlayerDecisionTracker } from '../playerDecisionTracker';
import { CurrentNarrativeContext } from '@/types/relevance.types';
import { getTimestamp } from '@/lib/utils/timestamp';

describe('PlayerDecisionTracker - Relevance Integration', () => {
  let tracker: PlayerDecisionTracker;
  let mockCurrentContext: CurrentNarrativeContext;

  beforeEach(() => {
    // Use fake timers for deterministic timestamp generation
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    // Create fresh tracker instance for each test
    tracker = new PlayerDecisionTracker({ storageKey: 'test_decisions' });
    tracker.clearDecisions();

    mockCurrentContext = {
      location: 'Village Square',
      charactersPresent: ['Guard Captain', 'Town Crier'],
      situation: 'Investigation ongoing',
      recentEvents: ['Crime reported', 'Witness questioned'],
      activeTags: ['mystery', 'social'],
      worldId: 'world-test',
      sessionId: 'session-test',
      timestamp: getTimestamp()
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getRelevantDecisions', () => {
    beforeEach(() => {
      // Add test decisions with different contexts and timestamps
      tracker.recordDecision(
        'You see a suspicious figure near the crime scene',
        'Follow the suspicious figure',
        'stealthy',
        'session-test',
        'world-test',
        {
          location: 'Village Square',
          situation: 'Investigation ongoing',
          charactersPresent: ['Suspicious Figure']
        }
      );

      tracker.recordDecision(
        'The tavern keeper offers you ale',
        'Accept the ale and chat',
        'helpful',
        'session-test', 
        'world-test',
        {
          location: 'Tavern',
          situation: 'Social interaction',
          charactersPresent: ['Tavern Keeper']
        }
      );

      tracker.recordDecision(
        'Bandits block your path',
        'Attack the bandits',
        'aggressive',
        'session-test',
        'world-test',
        {
          location: 'Forest Road',
          situation: 'Combat encounter',
          charactersPresent: ['Bandits']
        }
      );
    });

    test('returns most relevant decisions based on current context', () => {
      const relevantDecisions = tracker.getRelevantDecisions(mockCurrentContext, 2);
      
      expect(relevantDecisions).toHaveLength(2);
      expect(relevantDecisions[0]).toBeDefined();
      expect(relevantDecisions[1]).toBeDefined();
      
      // First decision should be the Village Square one (same location)
      expect(relevantDecisions[0].context.location).toBe('Village Square');
    });

    test('limits results to requested number', () => {
      const relevantDecisions = tracker.getRelevantDecisions(mockCurrentContext, 1);
      expect(relevantDecisions).toHaveLength(1);
    });

    test('returns empty array when no decisions exist', () => {
      tracker.clearDecisions();
      const relevantDecisions = tracker.getRelevantDecisions(mockCurrentContext, 5);
      expect(relevantDecisions).toEqual([]);
    });
  });

  describe('getDecisionsWithRelevanceScores', () => {
    beforeEach(() => {
      tracker.recordDecision(
        'A merchant offers you a deal',
        'Negotiate the price',
        'diplomatic',
        'session-test',
        'world-test',
        {
          location: 'Market Square',
          situation: 'Trade negotiation',
          charactersPresent: ['Merchant']
        }
      );
    });

    test('returns decisions with calculated relevance scores', () => {
      const decisionsWithScores = tracker.getDecisionsWithRelevanceScores(mockCurrentContext);
      
      expect(decisionsWithScores).toHaveLength(1);
      
      const first = decisionsWithScores[0];
      expect(first.decision).toBeDefined();
      expect(first.relevanceScore).toBeDefined();
      expect(first.relevanceScore.overallScore).toBeGreaterThanOrEqual(0.0);
      expect(first.relevanceScore.overallScore).toBeLessThanOrEqual(1.0);
      expect(first.relevanceScore.decisionId).toBe(first.decision.id);
    });

    test('sorts decisions by relevance score descending', () => {
      // Add another decision that should be less relevant
      tracker.recordDecision(
        'You find a coin on the ground',
        'Pick up the coin',
        'neutral',
        'session-test',
        'world-test',
        {
          location: 'Remote Cave',
          situation: 'Exploration',
          charactersPresent: []
        }
      );

      const decisionsWithScores = tracker.getDecisionsWithRelevanceScores(mockCurrentContext);
      
      expect(decisionsWithScores).toHaveLength(2);
      expect(decisionsWithScores[0].relevanceScore.overallScore)
        .toBeGreaterThanOrEqual(decisionsWithScores[1].relevanceScore.overallScore);
    });
  });

  describe('relevance-based session filtering', () => {
    test('prioritizes decisions from current session', () => {
      // Add decision from current session
      tracker.recordDecision(
        'Current session decision',
        'Make current choice',
        'helpful',
        'session-test', // Same session
        'world-test',
        {
          location: 'Village Square',
          situation: 'Investigation ongoing'
        }
      );

      // Add decision from different session
      tracker.recordDecision(
        'Different session decision',
        'Make different choice',
        'helpful',
        'session-other', // Different session
        'world-test',
        {
          location: 'Village Square', 
          situation: 'Investigation ongoing'
        }
      );

      const relevantDecisions = tracker.getRelevantDecisions(mockCurrentContext, 2);
      
      // Current session decision should rank higher
      expect(relevantDecisions[0].sessionId).toBe('session-test');
    });

    test('filters out other sessions when session filter provided', () => {
      tracker.recordDecision(
        'Session-scoped decision',
        'Take patient approach',
        'helpful',
        'session-test',
        'world-test'
      );

      tracker.recordDecision(
        'Different session decision',
        'Act rashly',
        'aggressive',
        'session-other',
        'world-test'
      );

      const relevantDecisions = tracker.getRelevantDecisions(
        mockCurrentContext,
        5,
        {
          sessionId: 'session-test',
          worldId: 'world-test'
        }
      );

      expect(relevantDecisions).toHaveLength(1);
      expect(relevantDecisions[0].sessionId).toBe('session-test');
    });

    test('falls back to world filter when session has no decisions', () => {
      tracker.recordDecision(
        'Different session decision',
        'Act rashly',
        'aggressive',
        'session-other',
        'world-test'
      );

      const relevantDecisions = tracker.getRelevantDecisions(
        mockCurrentContext,
        5,
        {
          sessionId: 'session-test',
          worldId: 'world-test'
        }
      );

      expect(relevantDecisions).toHaveLength(1);
      expect(relevantDecisions[0].sessionId).toBe('session-other');
    });
  });

  describe('edge cases', () => {
    test('handles context with missing optional fields', () => {
      const minimalContext: CurrentNarrativeContext = {
        charactersPresent: [],
        recentEvents: [],
        activeTags: [],
        worldId: 'world-test',
        sessionId: 'session-test',
        timestamp: getTimestamp()
        // location and situation are optional
      };

      tracker.recordDecision(
        'Test decision',
        'Test choice',
        'neutral',
        'session-test',
        'world-test'
      );

      const relevantDecisions = tracker.getRelevantDecisions(minimalContext, 1);
      expect(relevantDecisions).toHaveLength(1);
    });

    test('handles decisions from different worlds', () => {
      // Record same world decision at current time
      tracker.recordDecision(
        'Same world decision',
        'Same world choice',
        'helpful',
        'session-test',
        'world-test' // Same world
      );

      // Set time to 1 second ago for different world decision
      jest.setSystemTime(new Date('2025-01-15T11:59:59Z'));
      const decision2Timestamp = getTimestamp();

      // Reset to "now"
      jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

      // Create decision manually to control timestamp
      const differentWorldDecision = {
        id: 'decision-different-world',
        prompt: 'Different world decision',
        choiceText: 'Different world choice',
        choiceType: 'helpful' as const,
        timestamp: decision2Timestamp,
        sessionId: 'session-test',
        worldId: 'world-other', // Different world
        context: {}
      };
      
      // Add it directly to tracker's decisions array for controlled testing
      const tracker_private = tracker as unknown as { decisions: typeof differentWorldDecision[] };
      tracker_private.decisions.push(differentWorldDecision);

      const relevantDecisions = tracker.getRelevantDecisions(mockCurrentContext, 2);
      
      // Same world decision should rank higher due to world matching bonus
      expect(relevantDecisions).toHaveLength(2);
      expect(relevantDecisions[0].worldId).toBe('world-test');
    });
  });

  describe('performance with large datasets', () => {
    test('maintains performance with many decisions', () => {
      // Add 50 decisions
      for (let i = 0; i < 50; i++) {
        tracker.recordDecision(
          `Decision ${i}`,
          `Choice ${i}`,
          'neutral',
          'session-test',
          'world-test',
          {
            location: i % 2 === 0 ? 'Village Square' : 'Other Location',
            situation: 'Test situation'
          }
        );
      }

      const startTime = performance.now();
      const relevantDecisions = tracker.getRelevantDecisions(mockCurrentContext, 10);
      const endTime = performance.now();

      expect(relevantDecisions).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(50); // Should complete quickly
    });
  });
});
