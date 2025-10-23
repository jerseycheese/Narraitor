/**
 * DecisionFormatter Test Suite
 *
 * Tests the token-efficient formatting of player decisions for AI context.
 * Focuses on adaptive formatting based on relevance scores and token budget enforcement.
 */

import { DecisionFormatter } from '../decisionFormatter';
import { PlayerDecision } from '@/types/personalization.types';
import { DecisionRelevanceScore } from '@/types/relevance.types';

describe('DecisionFormatter', () => {
  let formatter: DecisionFormatter;

  beforeEach(() => {
    formatter = new DecisionFormatter();
  });

  describe('formatDecisions', () => {
    it('formats high-relevance decisions with full detail', () => {
      const decisions: PlayerDecision[] = [{
        id: 'dec-1',
        prompt: 'A dragon appears',
        choiceText: 'Negotiate with the dragon',
        choiceType: 'diplomatic',
        timestamp: '2024-01-01T12:00:00Z',
        sessionId: 'sess-1',
        worldId: 'world-1',
        context: {
          location: 'Mountain Peak',
          situation: 'Dragon encounter',
          charactersPresent: ['Dragon', 'Knight']
        }
      }];

      const scores: DecisionRelevanceScore[] = [{
        decisionId: 'dec-1',
        overallScore: 0.85,
        recencyScore: 0.9,
        contextScore: 0.8,
        impactScore: 0.85,
        tagMatchScore: 0.8,
        characterScore: 0.9,
        calculatedAt: '2024-01-01T12:00:00Z'
      }];

      const result = formatter.formatDecisions(decisions, scores, 500);

      expect(result).toContain('Mountain Peak');
      expect(result).toContain('negotiate with the dragon');
      expect(result).toContain('diplomatic');
      expect(result).toContain('Dragon encounter');
    });

    it('formats medium-relevance decisions in compact format', () => {
      const decisions: PlayerDecision[] = [{
        id: 'dec-2',
        prompt: 'What do you do?',
        choiceText: 'Help the villager',
        choiceType: 'helpful',
        timestamp: '2024-01-01T11:00:00Z',
        sessionId: 'sess-1',
        worldId: 'world-1',
        context: {
          location: 'Village Square'
        }
      }];

      const scores: DecisionRelevanceScore[] = [{
        decisionId: 'dec-2',
        overallScore: 0.55,
        recencyScore: 0.6,
        contextScore: 0.5,
        impactScore: 0.6,
        tagMatchScore: 0.5,
        characterScore: 0.5,
        calculatedAt: '2024-01-01T12:00:00Z'
      }];

      const result = formatter.formatDecisions(decisions, scores, 500);

      expect(result).toContain('Village Square');
      expect(result).toContain('help the villager');
      expect(result).toContain('helpful');
      // Should not include full situation details for medium relevance
      expect(result).not.toContain('encounter');
    });

    it('formats low-relevance decisions in ultra-compact format', () => {
      const decisions: PlayerDecision[] = [{
        id: 'dec-3',
        prompt: 'Pick a path',
        choiceText: 'Take the left path',
        choiceType: 'neutral',
        timestamp: '2024-01-01T10:00:00Z',
        sessionId: 'sess-1',
        worldId: 'world-1',
        context: {
          location: 'Forest'
        }
      }];

      const scores: DecisionRelevanceScore[] = [{
        decisionId: 'dec-3',
        overallScore: 0.25,
        recencyScore: 0.3,
        contextScore: 0.2,
        impactScore: 0.3,
        tagMatchScore: 0.2,
        characterScore: 0.2,
        calculatedAt: '2024-01-01T12:00:00Z'
      }];

      const result = formatter.formatDecisions(decisions, scores, 500);

      // Ultra-compact should omit context details
      expect(result).toContain('neutral');
      // Should be very short
      const formatted = result.split('\n').find(line => line.includes('dec-3') || line.includes('left path'));
      if (formatted) {
        expect(formatted.length).toBeLessThan(50);
      }
    });

    it('respects token budget limits', () => {
      const decisions: PlayerDecision[] = Array.from({ length: 20 }, (_, i) => ({
        id: `dec-${i}`,
        prompt: `Decision ${i}`,
        choiceText: `Make choice ${i}`,
        choiceType: 'neutral' as const,
        timestamp: '2024-01-01T12:00:00Z',
        sessionId: 'sess-1',
        worldId: 'world-1',
        context: { location: 'Location' }
      }));

      const scores: DecisionRelevanceScore[] = decisions.map(d => ({
        decisionId: d.id,
        overallScore: 0.5,
        recencyScore: 0.5,
        contextScore: 0.5,
        impactScore: 0.5,
        tagMatchScore: 0.5,
        characterScore: 0.5,
        calculatedAt: '2024-01-01T12:00:00Z'
      }));

      const result = formatter.formatDecisions(decisions, scores, 100);

      // Verify result doesn't exceed token budget
      const tokenCount = result.split(/\s+|[.,!?;:]+/).filter(t => t.length > 0).length;
      expect(tokenCount).toBeLessThanOrEqual(100);
    });

    it('prioritizes critical decision types', () => {
      const decisions: PlayerDecision[] = [
        {
          id: 'dec-neutral',
          prompt: 'Walk around',
          choiceText: 'Walk around',
          choiceType: 'neutral',
          timestamp: '2024-01-01T12:00:00Z',
          sessionId: 'sess-1',
          worldId: 'world-1',
          context: { location: 'Street' }
        },
        {
          id: 'dec-aggressive',
          prompt: 'Combat situation',
          choiceText: 'Attack the enemy',
          choiceType: 'aggressive',
          timestamp: '2024-01-01T11:00:00Z',
          sessionId: 'sess-1',
          worldId: 'world-1',
          context: { location: 'Battlefield' }
        }
      ];

      const scores: DecisionRelevanceScore[] = [
        {
          decisionId: 'dec-neutral',
          overallScore: 0.6,
          recencyScore: 0.9, // More recent
          contextScore: 0.6,
          impactScore: 0.3,
          tagMatchScore: 0.5,
          characterScore: 0.5,
          calculatedAt: '2024-01-01T12:00:00Z'
        },
        {
          decisionId: 'dec-aggressive',
          overallScore: 0.5,
          recencyScore: 0.5, // Less recent
          contextScore: 0.5,
          impactScore: 0.9,
          tagMatchScore: 0.5,
          characterScore: 0.5,
          calculatedAt: '2024-01-01T12:00:00Z'
        }
      ];

      const result = formatter.formatDecisions(decisions, scores, 50);

      // With limited budget, aggressive should be included over neutral
      expect(result).toContain('aggressive');
      expect(result).toContain('Battlefield');
    });

    it('returns empty string for empty decision list', () => {
      const result = formatter.formatDecisions([], [], 500);
      expect(result).toBe('');
    });

    it('returns empty string when token budget is zero', () => {
      const decisions: PlayerDecision[] = [{
        id: 'dec-1',
        prompt: 'Test',
        choiceText: 'Test choice',
        choiceType: 'neutral',
        timestamp: '2024-01-01T12:00:00Z',
        sessionId: 'sess-1',
        worldId: 'world-1',
        context: {}
      }];

      const scores: DecisionRelevanceScore[] = [{
        decisionId: 'dec-1',
        overallScore: 0.5,
        recencyScore: 0.5,
        contextScore: 0.5,
        impactScore: 0.5,
        tagMatchScore: 0.5,
        characterScore: 0.5,
        calculatedAt: '2024-01-01T12:00:00Z'
      }];

      const result = formatter.formatDecisions(decisions, scores, 0);
      expect(result).toBe('');
    });

    it('handles mismatched decisions and scores gracefully', () => {
      const decisions: PlayerDecision[] = [{
        id: 'dec-1',
        prompt: 'Test',
        choiceText: 'Test choice',
        choiceType: 'neutral',
        timestamp: '2024-01-01T12:00:00Z',
        sessionId: 'sess-1',
        worldId: 'world-1',
        context: {}
      }];

      const scores: DecisionRelevanceScore[] = [{
        decisionId: 'dec-2', // Different ID
        overallScore: 0.5,
        recencyScore: 0.5,
        contextScore: 0.5,
        impactScore: 0.5,
        tagMatchScore: 0.5,
        characterScore: 0.5,
        calculatedAt: '2024-01-01T12:00:00Z'
      }];

      // Should not throw, should handle gracefully
      expect(() => {
        formatter.formatDecisions(decisions, scores, 500);
      }).not.toThrow();
    });

    it('includes context header in formatted output', () => {
      const decisions: PlayerDecision[] = [{
        id: 'dec-1',
        prompt: 'Test',
        choiceText: 'Test choice',
        choiceType: 'neutral',
        timestamp: '2024-01-01T12:00:00Z',
        sessionId: 'sess-1',
        worldId: 'world-1',
        context: { location: 'Test Location' }
      }];

      const scores: DecisionRelevanceScore[] = [{
        decisionId: 'dec-1',
        overallScore: 0.5,
        recencyScore: 0.5,
        contextScore: 0.5,
        impactScore: 0.5,
        tagMatchScore: 0.5,
        characterScore: 0.5,
        calculatedAt: '2024-01-01T12:00:00Z'
      }];

      const result = formatter.formatDecisions(decisions, scores, 500);

      expect(result).toContain('RECENT PLAYER DECISIONS:');
    });

    it('continues checking decisions after one exceeds budget', () => {
      // Test case: First decision is huge, but smaller decisions should still fit
      const decisions: PlayerDecision[] = [
        {
          id: 'dec-huge',
          prompt: 'Huge decision',
          choiceText: 'Make a very long and detailed choice with lots of explanation',
          choiceType: 'diplomatic',
          timestamp: '2024-01-01T12:00:00Z',
          sessionId: 'sess-1',
          worldId: 'world-1',
          context: {
            location: 'Very Long Location Name With Many Details',
            situation: 'Extremely complex situation with multiple factors',
            charactersPresent: ['Character One', 'Character Two', 'Character Three']
          }
        },
        {
          id: 'dec-small-1',
          prompt: 'Small',
          choiceText: 'Go left',
          choiceType: 'neutral',
          timestamp: '2024-01-01T11:00:00Z',
          sessionId: 'sess-1',
          worldId: 'world-1',
          context: { location: 'Path' }
        },
        {
          id: 'dec-small-2',
          prompt: 'Small',
          choiceText: 'Wait',
          choiceType: 'neutral',
          timestamp: '2024-01-01T10:00:00Z',
          sessionId: 'sess-1',
          worldId: 'world-1',
          context: { location: 'Path' }
        }
      ];

      const scores: DecisionRelevanceScore[] = [
        {
          decisionId: 'dec-huge',
          overallScore: 0.9, // High score but too large
          recencyScore: 0.9,
          contextScore: 0.9,
          impactScore: 0.9,
          tagMatchScore: 0.9,
          characterScore: 0.9,
          calculatedAt: '2024-01-01T12:00:00Z'
        },
        {
          decisionId: 'dec-small-1',
          overallScore: 0.3,
          recencyScore: 0.3,
          contextScore: 0.3,
          impactScore: 0.3,
          tagMatchScore: 0.3,
          characterScore: 0.3,
          calculatedAt: '2024-01-01T12:00:00Z'
        },
        {
          decisionId: 'dec-small-2',
          overallScore: 0.2,
          recencyScore: 0.2,
          contextScore: 0.2,
          impactScore: 0.2,
          tagMatchScore: 0.2,
          characterScore: 0.2,
          calculatedAt: '2024-01-01T12:00:00Z'
        }
      ];

      // Very tight budget - only 15 tokens
      // The huge decision with full detail takes ~40+ tokens
      // Each small minimal-format decision takes ~5 tokens
      const result = formatter.formatDecisions(decisions, scores, 15);

      // Should not be empty - small decisions should still be included
      expect(result).not.toBe('');
      expect(result).toContain('RECENT PLAYER DECISIONS:');

      // Should include at least one small decision
      const hasSmallDecision = result.toLowerCase().includes('left') ||
                               result.toLowerCase().includes('wait');
      expect(hasSmallDecision).toBe(true);

      // Should not include the huge decision (too big for budget)
      expect(result.toLowerCase()).not.toContain('very long location');
    });
  });

  describe('adaptive formatting levels', () => {
    it('uses detailed format for scores >= 0.7', () => {
      const decision: PlayerDecision = {
        id: 'dec-1',
        prompt: 'Dragon appears',
        choiceText: 'Negotiate peacefully',
        choiceType: 'diplomatic',
        timestamp: '2024-01-01T12:00:00Z',
        sessionId: 'sess-1',
        worldId: 'world-1',
        context: {
          location: 'Dragon Lair',
          situation: 'Tense negotiation',
          charactersPresent: ['Ancient Dragon', 'Wise Sage']
        }
      };

      const score: DecisionRelevanceScore = {
        decisionId: 'dec-1',
        overallScore: 0.75,
        recencyScore: 0.8,
        contextScore: 0.7,
        impactScore: 0.8,
        tagMatchScore: 0.7,
        characterScore: 0.8,
        calculatedAt: '2024-01-01T12:00:00Z'
      };

      const result = formatter.formatDecisions([decision], [score], 500);

      // Detailed format should include situation
      expect(result).toContain('Tense negotiation');
      expect(result).toContain('Ancient Dragon');
    });

    it('uses compact format for scores 0.4-0.69', () => {
      const decision: PlayerDecision = {
        id: 'dec-1',
        prompt: 'What do you do?',
        choiceText: 'Help the merchant',
        choiceType: 'helpful',
        timestamp: '2024-01-01T12:00:00Z',
        sessionId: 'sess-1',
        worldId: 'world-1',
        context: {
          location: 'Market',
          situation: 'Merchant needs help',
          charactersPresent: ['Merchant']
        }
      };

      const score: DecisionRelevanceScore = {
        decisionId: 'dec-1',
        overallScore: 0.55,
        recencyScore: 0.6,
        contextScore: 0.5,
        impactScore: 0.6,
        tagMatchScore: 0.5,
        characterScore: 0.5,
        calculatedAt: '2024-01-01T12:00:00Z'
      };

      const result = formatter.formatDecisions([decision], [score], 500);

      // Compact format should skip situation details
      expect(result).not.toContain('Merchant needs help');
      expect(result).toContain('Market');
      expect(result).toContain('help the merchant');
    });

    it('uses minimal format for scores < 0.4', () => {
      const decision: PlayerDecision = {
        id: 'dec-1',
        prompt: 'Choose a path',
        choiceText: 'Go left',
        choiceType: 'neutral',
        timestamp: '2024-01-01T12:00:00Z',
        sessionId: 'sess-1',
        worldId: 'world-1',
        context: {
          location: 'Crossroads',
          situation: 'Two paths diverge'
        }
      };

      const score: DecisionRelevanceScore = {
        decisionId: 'dec-1',
        overallScore: 0.3,
        recencyScore: 0.3,
        contextScore: 0.3,
        impactScore: 0.3,
        tagMatchScore: 0.3,
        characterScore: 0.3,
        calculatedAt: '2024-01-01T12:00:00Z'
      };

      const result = formatter.formatDecisions([decision], [score], 500);

      // Minimal format should be very brief
      const lines = result.split('\n').filter(line => line.trim() && !line.includes('RECENT'));
      expect(lines.length).toBe(1);
      expect(lines[0].length).toBeLessThan(40);
    });
  });
});
