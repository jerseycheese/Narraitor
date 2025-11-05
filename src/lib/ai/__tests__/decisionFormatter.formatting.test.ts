/**
 * DecisionFormatter - Formatting Tests
 * Tests the token-efficient formatting of player decisions with different relevance levels
 */

import { DecisionFormatter } from '../decisionFormatter';
import {
  createHighRelevanceDecision,
  createMediumRelevanceDecision,
  createLowRelevanceDecision,
  createTestDecision,
  createTestScore
} from './decisionFormatter.testHelpers';

describe('DecisionFormatter - Formatting', () => {
  let formatter: DecisionFormatter;

  beforeEach(() => {
    formatter = new DecisionFormatter();
  });

  it('formats high-relevance decisions with full detail', () => {
    const { decision, score } = createHighRelevanceDecision();

    const result = formatter.formatDecisions([decision], [score], 500);

    expect(result).toContain('Mountain Peak');
    expect(result).toContain('negotiate with the dragon');
    expect(result).toContain('diplomatic');
    expect(result).toContain('Dragon encounter');
  });

  it('formats medium-relevance decisions in compact format', () => {
    const { decision, score } = createMediumRelevanceDecision();

    const result = formatter.formatDecisions([decision], [score], 500);

    expect(result).toContain('Village Square');
    expect(result).toContain('help the villager');
    expect(result).toContain('helpful');
    // Should not include full situation details for medium relevance
    expect(result).not.toContain('encounter');
  });

  it('formats low-relevance decisions in ultra-compact format', () => {
    const { decision, score } = createLowRelevanceDecision();

    const result = formatter.formatDecisions([decision], [score], 500);

    // Ultra-compact should omit context details
    expect(result).toContain('neutral');
    // Should be very short
    const formatted = result.split('\n').find(line => line.includes('dec-low') || line.includes('left path'));
    if (formatted) {
      expect(formatted.length).toBeLessThan(50);
    }
  });

  it('respects token budget limits', () => {
    const decisions = Array.from({ length: 20 }, (_, i) => createTestDecision({
      id: `dec-${i}`,
      prompt: `Decision ${i}`,
      choiceText: `Make choice ${i}`,
      choiceType: 'neutral',
      location: 'Location'
    }));

    const scores = decisions.map(d => createTestScore({
      decisionId: d.id,
      overallScore: 0.5
    }));

    const result = formatter.formatDecisions(decisions, scores, 100);

    // Verify result doesn't exceed token budget
    const tokenCount = result.split(/\s+|[.,!?;:]+/).filter(t => t.length > 0).length;
    expect(tokenCount).toBeLessThanOrEqual(100);
  });

  it('prioritizes critical decision types', () => {
    const decisions = [
      createTestDecision({
        id: 'dec-neutral',
        prompt: 'Walk around',
        choiceText: 'Walk around',
        choiceType: 'neutral',
        location: 'Street'
      }),
      createTestDecision({
        id: 'dec-aggressive',
        prompt: 'Combat situation',
        choiceText: 'Attack the enemy',
        choiceType: 'aggressive',
        location: 'Battlefield'
      })
    ];

    const scores = [
      createTestScore({
        decisionId: 'dec-neutral',
        overallScore: 0.6,
        recency: 0.9, // More recent
        impact: 0.3
      }),
      createTestScore({
        decisionId: 'dec-aggressive',
        overallScore: 0.5,
        recency: 0.5, // Less recent
        impact: 0.9
      })
    ];

    const result = formatter.formatDecisions(decisions, scores, 50);

    // With limited budget, aggressive should be included over neutral
    expect(result).toContain('aggressive');
    expect(result).toContain('Battlefield');
  });

  it('includes context header in formatted output', () => {
    const { decision, score } = createMediumRelevanceDecision();

    const result = formatter.formatDecisions([decision], [score], 500);

    expect(result).toContain('RECENT PLAYER DECISIONS:');
  });
});
