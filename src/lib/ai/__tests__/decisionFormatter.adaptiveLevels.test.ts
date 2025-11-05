/**
 * DecisionFormatter - Adaptive Formatting Levels Tests
 * Tests the adaptive formatting based on relevance score thresholds
 */

import { DecisionFormatter } from '../decisionFormatter';
import { createTestDecision, createTestScore } from './decisionFormatter.testHelpers';

describe('DecisionFormatter - Adaptive Formatting Levels', () => {
  let formatter: DecisionFormatter;

  beforeEach(() => {
    formatter = new DecisionFormatter();
  });

  it('uses detailed format for scores >= 0.7', () => {
    const decision = createTestDecision({
      id: 'dec-1',
      prompt: 'Dragon appears',
      choiceText: 'Negotiate peacefully',
      choiceType: 'diplomatic',
      location: 'Dragon Lair',
      situation: 'Tense negotiation',
      charactersPresent: ['Ancient Dragon', 'Wise Sage']
    });

    const score = createTestScore({
      decisionId: 'dec-1',
      overallScore: 0.75,
      recency: 0.8,
      context: 0.7,
      impact: 0.8,
      tagMatch: 0.7,
      character: 0.8
    });

    const result = formatter.formatDecisions([decision], [score], 500);

    // Detailed format should include situation
    expect(result).toContain('Tense negotiation');
    expect(result).toContain('Ancient Dragon');
  });

  it('uses compact format for scores 0.4-0.69', () => {
    const decision = createTestDecision({
      id: 'dec-1',
      prompt: 'What do you do?',
      choiceText: 'Help the merchant',
      choiceType: 'helpful',
      location: 'Market',
      situation: 'Merchant needs help',
      charactersPresent: ['Merchant']
    });

    const score = createTestScore({
      decisionId: 'dec-1',
      overallScore: 0.55,
      recency: 0.6,
      context: 0.5,
      impact: 0.6,
      tagMatch: 0.5,
      character: 0.5
    });

    const result = formatter.formatDecisions([decision], [score], 500);

    // Compact format should skip situation details
    expect(result).not.toContain('Merchant needs help');
    expect(result).toContain('Market');
    expect(result).toContain('help the merchant');
  });

  it('uses minimal format for scores < 0.4', () => {
    const decision = createTestDecision({
      id: 'dec-1',
      prompt: 'Choose a path',
      choiceText: 'Go left',
      choiceType: 'neutral',
      location: 'Crossroads',
      situation: 'Two paths diverge'
    });

    const score = createTestScore({
      decisionId: 'dec-1',
      overallScore: 0.3,
      recency: 0.3,
      context: 0.3,
      impact: 0.3,
      tagMatch: 0.3,
      character: 0.3
    });

    const result = formatter.formatDecisions([decision], [score], 500);

    // Minimal format should be very brief
    const lines = result.split('\n').filter(line => line.trim() && !line.includes('RECENT'));
    expect(lines.length).toBe(1);
    expect(lines[0].length).toBeLessThan(40);
  });
});
