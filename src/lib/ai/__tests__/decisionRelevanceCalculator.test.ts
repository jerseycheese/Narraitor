/**
 * Test suite for DecisionRelevanceCalculator
 * Tests multi-factor relevance scoring algorithm for player decisions
 */

import { DecisionRelevanceCalculator } from '../decisionRelevanceCalculator';
import { PlayerDecision, ChoiceTypePreference } from '@/types/personalization.types';
import {
  CurrentNarrativeContext,
  RelevanceScoringConfig
} from '@/types/relevance.types';
import { getTimestamp } from '@/lib/utils';

describe('DecisionRelevanceCalculator', () => {
  let calculator: DecisionRelevanceCalculator;
  let mockDecisions: PlayerDecision[];
  let mockCurrentContext: CurrentNarrativeContext;
  let mockConfig: RelevanceScoringConfig;

  beforeEach(() => {
    mockConfig = {
      weights: {
        recency: 0.25,
        context: 0.30,
        impact: 0.20,
        tagMatch: 0.15,
        character: 0.10
      },
      recencyDecayRate: 0.1,
      maxDaysRelevant: 30,
      minRelevanceScore: 0.1
    };

    calculator = new DecisionRelevanceCalculator(mockConfig);

    mockCurrentContext = {
      location: 'Tavern',
      charactersPresent: ['Innkeeper', 'Mysterious Stranger'],
      situation: 'Gathering information',
      recentEvents: ['Arrived in town', 'Asked about rumors'],
      activeTags: ['social', 'investigation'],
      worldId: 'world-1',
      sessionId: 'session-1',
      timestamp: getTimestamp()
    };

    mockDecisions = [
      {
        id: 'decision-1',
        prompt: 'A stranger offers you information for gold',
        choiceText: 'Pay the stranger for information',
        choiceType: 'helpful' as ChoiceTypePreference,
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        sessionId: 'session-1',
        worldId: 'world-1',
        context: {
          location: 'Tavern',
          situation: 'Gathering information',
          charactersPresent: ['Mysterious Stranger']
        }
      },
      {
        id: 'decision-2',
        prompt: 'You encounter bandits on the road',
        choiceText: 'Fight the bandits',
        choiceType: 'aggressive' as ChoiceTypePreference,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        sessionId: 'session-1',
        worldId: 'world-1',
        context: {
          location: 'Forest Road',
          situation: 'Combat encounter',
          charactersPresent: ['Bandits']
        }
      }
    ];
  });

  describe('calculateRelevanceScore', () => {
    test('calculates overall score between 0.0 and 1.0', () => {
      const result = calculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0.0);
      expect(result.overallScore).toBeLessThanOrEqual(1.0);
      expect(result.decisionId).toBe(mockDecisions[0].id);
    });

    test('stores all required score components', () => {
      const result = calculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);
      
      expect(result).toHaveProperty('recencyScore');
      expect(result).toHaveProperty('contextScore');
      expect(result).toHaveProperty('impactScore');
      expect(result).toHaveProperty('tagMatchScore');
      expect(result).toHaveProperty('characterScore');
      expect(result).toHaveProperty('calculatedAt');
      
      expect(result.recencyScore).toBeGreaterThanOrEqual(0.0);
      expect(result.recencyScore).toBeLessThanOrEqual(1.0);
    });

    test('recent decisions score higher than old decisions', () => {
      const recentScore = calculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);
      const oldScore = calculator.calculateRelevanceScore(mockDecisions[1], mockCurrentContext);
      
      expect(recentScore.recencyScore).toBeGreaterThan(oldScore.recencyScore);
    });

    test('context matching increases relevance score', () => {
      const matchingDecision = mockDecisions[0]; // Same location and character
      const nonMatchingDecision = mockDecisions[1]; // Different location and characters
      
      const matchingScore = calculator.calculateRelevanceScore(matchingDecision, mockCurrentContext);
      const nonMatchingScore = calculator.calculateRelevanceScore(nonMatchingDecision, mockCurrentContext);
      
      expect(matchingScore.contextScore).toBeGreaterThan(nonMatchingScore.contextScore);
    });
  });

  describe('scoreDecisions', () => {
    test('returns scores for all decisions', () => {
      const results = calculator.scoreDecisions(mockDecisions, mockCurrentContext);
      
      expect(results).toHaveLength(mockDecisions.length);
      results.forEach(result => {
        expect(result.overallScore).toBeGreaterThanOrEqual(0.0);
        expect(result.overallScore).toBeLessThanOrEqual(1.0);
      });
    });

    test('handles empty decision array', () => {
      const results = calculator.scoreDecisions([], mockCurrentContext);
      expect(results).toEqual([]);
    });
  });

  describe('getMostRelevantDecisions', () => {
    test('returns decisions sorted by relevance score', () => {
      const results = calculator.getMostRelevantDecisions(mockDecisions, mockCurrentContext, 2);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      
      // First result should have higher or equal score than second
      const firstScore = calculator.calculateRelevanceScore(results[0], mockCurrentContext);
      const secondScore = calculator.calculateRelevanceScore(results[1], mockCurrentContext);
      expect(firstScore.overallScore).toBeGreaterThanOrEqual(secondScore.overallScore);
    });

    test('limits results to requested number', () => {
      const results = calculator.getMostRelevantDecisions(mockDecisions, mockCurrentContext, 1);
      expect(results).toHaveLength(1);
    });

    test('returns all decisions when limit exceeds array length', () => {
      const results = calculator.getMostRelevantDecisions(mockDecisions, mockCurrentContext, 10);
      expect(results).toHaveLength(mockDecisions.length);
    });
  });

  describe('configuration validation', () => {
    test('uses default config when none provided', () => {
      const defaultCalculator = new DecisionRelevanceCalculator();
      const result = defaultCalculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0.0);
      expect(result.overallScore).toBeLessThanOrEqual(1.0);
    });

    test('applies custom weight configuration', () => {
      const customConfig: RelevanceScoringConfig = {
        weights: {
          recency: 0.5,   // Higher recency weight
          context: 0.2,
          impact: 0.1,
          tagMatch: 0.1,
          character: 0.1
        },
        recencyDecayRate: 0.05, // Slower decay
        maxDaysRelevant: 60,
        minRelevanceScore: 0.05
      };
      
      const customCalculator = new DecisionRelevanceCalculator(customConfig);
      const result = customCalculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0.0);
      expect(result.overallScore).toBeLessThanOrEqual(1.0);
    });
  });

  describe('edge cases', () => {
    test('handles decisions with minimal context', () => {
      const minimalDecision: PlayerDecision = {
        id: 'minimal-1',
        prompt: 'What do you do?',
        choiceText: 'Continue',
        choiceType: 'neutral' as ChoiceTypePreference,
        timestamp: getTimestamp(),
        sessionId: 'session-1',
        worldId: 'world-1',
        context: {} // Minimal context
      };
      
      const result = calculator.calculateRelevanceScore(minimalDecision, mockCurrentContext);
      expect(result.overallScore).toBeGreaterThanOrEqual(0.0);
      expect(result.overallScore).toBeLessThanOrEqual(1.0);
    });

    test('handles future timestamps gracefully', () => {
      const futureDecision: PlayerDecision = {
        ...mockDecisions[0],
        timestamp: new Date(Date.now() + 1000 * 60 * 60).toISOString() // 1 hour in future
      };
      
      const result = calculator.calculateRelevanceScore(futureDecision, mockCurrentContext);
      expect(result.recencyScore).toBeGreaterThanOrEqual(0.0);
      expect(result.recencyScore).toBeLessThanOrEqual(1.0);
    });
  });

  describe('performance requirements', () => {
    test('scores large number of decisions efficiently', () => {
      // Create 100 mock decisions
      const manyDecisions = Array.from({ length: 100 }, (_, i) => ({
        ...mockDecisions[0],
        id: `decision-${i}`,
        timestamp: new Date(Date.now() - i * 1000 * 60).toISOString()
      }));
      
      const startTime = performance.now();
      const results = calculator.scoreDecisions(manyDecisions, mockCurrentContext);
      const endTime = performance.now();
      
      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('metadata tracking', () => {
    test('includes debugging metadata in scores', () => {
      const result = calculator.calculateRelevanceScore(mockDecisions[0], mockCurrentContext);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.daysSinceDecision).toBeGreaterThanOrEqual(0);
      expect(result.calculatedAt).toBeDefined();
      expect(new Date(result.calculatedAt).getTime()).toBeGreaterThan(0);
    });
  });
});