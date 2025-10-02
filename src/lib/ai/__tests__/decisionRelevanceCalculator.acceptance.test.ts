/**
 * Acceptance tests for DecisionRelevanceCalculator
 * Validates that all acceptance criteria from issue #130 are met
 */

import { DecisionRelevanceCalculator } from '../decisionRelevanceCalculator';
import { PlayerDecision } from '@/types/personalization.types';
import { CurrentNarrativeContext } from '@/types/relevance.types';
import { getTimestamp } from '@/lib/utils';

describe('DecisionRelevanceCalculator - Acceptance Criteria', () => {
  let calculator: DecisionRelevanceCalculator;
  let mockDecisions: PlayerDecision[];
  let mockCurrentContext: CurrentNarrativeContext;

  beforeEach(() => {
    // Use fake timers for deterministic time-based testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    calculator = new DecisionRelevanceCalculator();

    mockCurrentContext = {
      location: 'Town Square',
      charactersPresent: ['Guard Captain', 'Merchant'],
      situation: 'Investigation',
      recentEvents: ['Crime reported'],
      activeTags: ['mystery', 'social'],
      worldId: 'world-1',
      sessionId: 'session-1',
      timestamp: getTimestamp() // 2025-01-15T12:00:00Z
    };

    // Create timestamps for test decisions
    jest.setSystemTime(new Date('2025-01-15T11:00:00Z'));
    const oneHourAgo = getTimestamp();

    jest.setSystemTime(new Date('2025-01-08T12:00:00Z'));
    const sevenDaysAgo = getTimestamp();

    jest.setSystemTime(new Date('2025-01-14T12:00:00Z'));
    const oneDayAgo = getTimestamp();

    // Reset to "now"
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    // Create decisions with different characteristics for testing
    mockDecisions = [
      {
        id: 'decision-recent-match',
        prompt: 'The guard captain asks for help',
        choiceText: 'Offer to investigate',
        choiceType: 'helpful',
        timestamp: oneHourAgo,
        sessionId: 'session-1',
        worldId: 'world-1',
        context: {
          location: 'Town Square',
          situation: 'Investigation',
          charactersPresent: ['Guard Captain']
        }
      },
      {
        id: 'decision-old-no-match',
        prompt: 'You find a treasure chest',
        choiceText: 'Open the chest',
        choiceType: 'neutral',
        timestamp: sevenDaysAgo,
        sessionId: 'session-2',
        worldId: 'world-2',
        context: {
          location: 'Dark Cave',
          situation: 'Exploration',
          charactersPresent: []
        }
      },
      {
        id: 'decision-medium-partial-match',
        prompt: 'A merchant offers a deal',
        choiceText: 'Negotiate the price',
        choiceType: 'diplomatic',
        timestamp: oneDayAgo,
        sessionId: 'session-1',
        worldId: 'world-1',
        context: {
          location: 'Market District',
          situation: 'Trade negotiation',
          charactersPresent: ['Merchant']
        }
      }
    ];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Acceptance Criterion 1: Composite relevance score between 0.0 and 1.0', () => {
    test('all scores are within valid range', () => {
      mockDecisions.forEach(decision => {
        const score = calculator.calculateRelevanceScore(decision, mockCurrentContext);
        
        expect(score.overallScore).toBeGreaterThanOrEqual(0.0);
        expect(score.overallScore).toBeLessThanOrEqual(1.0);
        expect(typeof score.overallScore).toBe('number');
        expect(isNaN(score.overallScore)).toBe(false);
      });
    });

    test('extreme cases still produce valid scores', () => {
      // Future decision (1 hour ahead)
      jest.setSystemTime(new Date('2025-01-15T13:00:00Z'));
      const futureTimestamp = getTimestamp();

      // Very old decision (1 year ago)
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      const veryOldTimestamp = getTimestamp();

      // Reset to now
      jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

      const futureDecision: PlayerDecision = {
        ...mockDecisions[0],
        timestamp: futureTimestamp
      };

      const veryOldDecision: PlayerDecision = {
        ...mockDecisions[0],
        timestamp: veryOldTimestamp
      };

      [futureDecision, veryOldDecision].forEach(decision => {
        const score = calculator.calculateRelevanceScore(decision, mockCurrentContext);
        expect(score.overallScore).toBeGreaterThanOrEqual(0.0);
        expect(score.overallScore).toBeLessThanOrEqual(1.0);
      });
    });
  });

  describe('Acceptance Criterion 2: Multi-factor algorithm', () => {
    test('considers recency factor', () => {
      const recentScore = calculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);
      const oldScore = calculator.calculateRelevanceScore(mockDecisions[1], mockCurrentContext);

      expect(recentScore.recencyScore).toBeGreaterThan(oldScore.recencyScore);
      expect(recentScore.recencyScore).toBeGreaterThanOrEqual(0.0);
      expect(recentScore.recencyScore).toBeLessThanOrEqual(1.0);
    });

    test('considers context matching factor', () => {
      const matchingScore = calculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);
      const nonMatchingScore = calculator.calculateRelevanceScore(mockDecisions[1], mockCurrentContext);

      expect(matchingScore.contextScore).toBeGreaterThan(nonMatchingScore.contextScore);
      expect(matchingScore.contextScore).toBeGreaterThanOrEqual(0.0);
      expect(matchingScore.contextScore).toBeLessThanOrEqual(1.0);
    });

    test('considers impact factor', () => {
      mockDecisions.forEach(decision => {
        const score = calculator.calculateRelevanceScore(decision, mockCurrentContext);
        expect(score.impactScore).toBeGreaterThanOrEqual(0.0);
        expect(score.impactScore).toBeLessThanOrEqual(1.0);
      });

      // Aggressive choices should have higher impact than neutral
      const aggressiveDecision = { ...mockDecisions[0], choiceType: 'aggressive' as const };
      const neutralDecision = { ...mockDecisions[0], choiceType: 'neutral' as const };

      const aggressiveScore = calculator.calculateRelevanceScore(aggressiveDecision, mockCurrentContext);
      const neutralScore = calculator.calculateRelevanceScore(neutralDecision, mockCurrentContext);

      expect(aggressiveScore.impactScore).toBeGreaterThan(neutralScore.impactScore);
    });

    test('considers tag matching factor', () => {
      // Test with context that has active tags
      const contextWithTags = {
        ...mockCurrentContext,
        activeTags: ['social', 'investigation']
      };

      mockDecisions.forEach(decision => {
        const score = calculator.calculateRelevanceScore(decision, contextWithTags);
        expect(score.tagMatchScore).toBeGreaterThanOrEqual(0.0);
        expect(score.tagMatchScore).toBeLessThanOrEqual(1.0);
      });
    });

    test('combines multiple factors in overall score', () => {
      const scores = mockDecisions.map(decision => 
        calculator.calculateRelevanceScore(decision, mockCurrentContext)
      );

      scores.forEach(score => {
        // Overall score should be influenced by all factors
        expect(score.overallScore).toBeGreaterThan(0);
        expect(score.overallScore).toBeLessThanOrEqual(1);
        
        // Verify all component scores exist
        expect(score.recencyScore).toBeDefined();
        expect(score.contextScore).toBeDefined();
        expect(score.impactScore).toBeDefined();
        expect(score.tagMatchScore).toBeDefined();
        expect(score.characterScore).toBeDefined();
      });
    });
  });

  describe('Acceptance Criterion 3: DecisionRelevanceScore object storage', () => {
    test('stores all required score components', () => {
      const score = calculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);

      // Verify all required fields are present
      expect(score.decisionId).toBe(mockDecisions[0].id);
      expect(typeof score.overallScore).toBe('number');
      expect(typeof score.recencyScore).toBe('number');
      expect(typeof score.contextScore).toBe('number');
      expect(typeof score.impactScore).toBe('number');
      expect(typeof score.tagMatchScore).toBe('number');
      expect(typeof score.characterScore).toBe('number');
      expect(typeof score.calculatedAt).toBe('string');
      
      // Verify calculatedAt is valid ISO string
      expect(new Date(score.calculatedAt).getTime()).toBeGreaterThan(0);
    });

    test('includes debugging metadata', () => {
      const score = calculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);

      expect(score.metadata).toBeDefined();
      expect(typeof score.metadata!.daysSinceDecision).toBe('number');
      expect(Array.isArray(score.metadata!.matchedTags)).toBe(true);
      expect(typeof score.metadata!.contextSimilarity).toBe('number');
      expect(typeof score.metadata!.impactCategory).toBe('string');
    });

    test('score objects are consistent across multiple calculations', () => {
      const score1 = calculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);
      
      // Small delay to ensure different timestamp
      setTimeout(() => {
        const score2 = calculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);
        
        // Core scores should be identical for same input
        expect(score1.overallScore).toBeCloseTo(score2.overallScore, 5);
        expect(score1.recencyScore).toBeCloseTo(score2.recencyScore, 5);
        expect(score1.contextScore).toBe(score2.contextScore);
        expect(score1.impactScore).toBe(score2.impactScore);
      }, 10);
    });
  });

  describe('Acceptance Criterion 4: Higher scoring decisions prioritized', () => {
    test('getMostRelevantDecisions returns decisions in score order', () => {
      const rankedDecisions = calculator.getMostRelevantDecisions(
        mockDecisions, 
        mockCurrentContext, 
        mockDecisions.length
      );

      // Calculate individual scores for comparison
      const scores = mockDecisions.map(decision => ({
        decision,
        score: calculator.calculateRelevanceScore(decision, mockCurrentContext)
      }));

      scores.sort((a, b) => b.score.overallScore - a.score.overallScore);
      const expectedOrder = scores.map(item => item.decision.id);
      const actualOrder = rankedDecisions.map(decision => decision.id);

      expect(actualOrder).toEqual(expectedOrder);
    });

    test('most relevant decision has highest score', () => {
      const rankedDecisions = calculator.getMostRelevantDecisions(
        mockDecisions, 
        mockCurrentContext, 
        mockDecisions.length
      );

      if (rankedDecisions.length > 1) {
        const topScore = calculator.calculateRelevanceScore(rankedDecisions[0], mockCurrentContext);
        const secondScore = calculator.calculateRelevanceScore(rankedDecisions[1], mockCurrentContext);

        expect(topScore.overallScore).toBeGreaterThanOrEqual(secondScore.overallScore);
      }
    });

    test('analyzeDecisionRelevance provides comprehensive ranking', () => {
      const analysis = calculator.analyzeDecisionRelevance(mockDecisions, mockCurrentContext);

      expect(analysis.rankedDecisions).toHaveLength(mockDecisions.length);
      expect(analysis.totalDecisions).toBe(mockDecisions.length);
      expect(analysis.averageScore).toBeGreaterThanOrEqual(0);
      expect(analysis.averageScore).toBeLessThanOrEqual(1);

      // Verify ranking order
      for (let i = 1; i < analysis.rankedDecisions.length; i++) {
        const current = analysis.rankedDecisions[i - 1];
        const next = analysis.rankedDecisions[i];
        expect(current.score.overallScore).toBeGreaterThanOrEqual(next.score.overallScore);
      }
    });
  });

  describe('Integration with AI Context Requirements', () => {
    test('performance suitable for real-time AI context building', () => {
      // Create timestamps for 100 decisions spread over hours
      const timestamps = Array.from({ length: 100 }, (_, i) => {
        jest.setSystemTime(new Date('2025-01-15T12:00:00Z').getTime() - i * 1000 * 60 * 60);
        return getTimestamp();
      });
      jest.setSystemTime(new Date('2025-01-15T12:00:00Z')); // Reset to now

      const largeDecisionSet = timestamps.map((timestamp, i) => ({
        ...mockDecisions[0],
        id: `decision-${i}`,
        timestamp
      }));

      const startTime = performance.now();
      const analysis = calculator.analyzeDecisionRelevance(largeDecisionSet, mockCurrentContext);
      const endTime = performance.now();

      expect(analysis.rankedDecisions).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect(analysis.scoringMetadata.processingTimeMs).toBeLessThan(100);
    });

    test('supports configurable relevance thresholds', () => {
      const customCalculator = new DecisionRelevanceCalculator({
        minRelevanceScore: 0.5,
        weights: {
          recency: 0.4,
          context: 0.3,
          impact: 0.2,
          tagMatch: 0.05,
          character: 0.05
        },
        recencyDecayRate: 0.05,
        maxDaysRelevant: 60
      });

      const analysis = customCalculator.analyzeDecisionRelevance(mockDecisions, mockCurrentContext);
      expect(analysis.scoringMetadata.config.minRelevanceScore).toBe(0.5);
      expect(analysis.scoringMetadata.config.weights.recency).toBe(0.4);
    });
  });
});