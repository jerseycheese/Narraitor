/**
 * DecisionFormatter - Edge Cases Tests
 * Tests error handling and edge case scenarios
 */

import { DecisionFormatter } from '../decisionFormatter';
import { createTestDecision, createTestScore } from './decisionFormatter.testHelpers';

describe('DecisionFormatter - Edge Cases', () => {
  let formatter: DecisionFormatter;

  beforeEach(() => {
    formatter = new DecisionFormatter();
  });

  it('returns empty string for empty decision list', () => {
    const result = formatter.formatDecisions([], [], 500);
    expect(result).toBe('');
  });

  it('returns empty string when token budget is zero', () => {
    const decision = createTestDecision({
      id: 'dec-1',
      prompt: 'Test',
      choiceText: 'Test choice'
    });

    const score = createTestScore({
      decisionId: 'dec-1',
      overallScore: 0.5
    });

    const result = formatter.formatDecisions([decision], [score], 0);
    expect(result).toBe('');
  });

  it('handles mismatched decisions and scores gracefully', () => {
    const decision = createTestDecision({
      id: 'dec-1',
      prompt: 'Test',
      choiceText: 'Test choice'
    });

    const score = createTestScore({
      decisionId: 'dec-2', // Different ID
      overallScore: 0.5
    });

    // Should not throw, should handle gracefully
    expect(() => {
      formatter.formatDecisions([decision], [score], 500);
    }).not.toThrow();
  });

  it('continues checking decisions after one exceeds budget', () => {
    // Test case: First decision is huge, but smaller decisions should still fit
    const decisions = [
      createTestDecision({
        id: 'dec-huge',
        prompt: 'A'.repeat(500),
        choiceText: 'B'.repeat(500),
        location: 'Very long location name'.repeat(20)
      }),
      createTestDecision({
        id: 'dec-small1',
        prompt: 'Quick choice',
        choiceText: 'Go left',
        location: 'Forest'
      }),
      createTestDecision({
        id: 'dec-small2',
        prompt: 'Another choice',
        choiceText: 'Wait',
        location: 'Cave'
      })
    ];

    const scores = decisions.map(d => createTestScore({
      decisionId: d.id,
      overallScore: 0.5
    }));

    const result = formatter.formatDecisions(decisions, scores, 100);

    // Should include at least one of the small decisions
    const hasSmallDecision = result.toLowerCase().includes('left') ||
                             result.toLowerCase().includes('wait');
    expect(hasSmallDecision).toBe(true);

    // Should not include the huge decision (too big for budget)
    expect(result.toLowerCase()).not.toContain('very long location');
  });
});
