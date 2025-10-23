/**
 * DecisionFormatter - Token-Efficient Decision Formatting for AI Context
 *
 * Transforms player decisions into compact, machine-readable strings for AI prompt injection.
 * Uses adaptive formatting based on relevance scores to optimize token usage while preserving
 * critical decision context.
 *
 * Formatting Strategies:
 * - High relevance (≥0.7): Full context with situation, characters, location
 * - Medium relevance (0.4-0.69): Compact format with location and action
 * - Low relevance (<0.4): Minimal format with just action and type
 *
 * @author Narraitor AI System
 * @since 1.0.0
 */

import { PlayerDecision } from '@/types/personalization.types';
import { DecisionRelevanceScore } from '@/types/relevance.types';
import { estimateTokenCount } from '@/lib/promptContext/tokenUtils';
import { safeTrim } from '@/lib/utils';

/**
 * Critical decision types that should be prioritized in AI context
 */
const CRITICAL_DECISION_TYPES = new Set(['aggressive', 'chaotic', 'diplomatic']);

/**
 * Relevance thresholds for adaptive formatting
 */
const RELEVANCE_THRESHOLDS = {
  HIGH: 0.7,
  MEDIUM: 0.4,
} as const;

/**
 * Formats player decisions into token-efficient AI context strings
 */
export class DecisionFormatter {
  /**
   * Formats decisions with adaptive detail level based on relevance scores
   *
   * @param decisions - Player decisions to format
   * @param scores - Relevance scores corresponding to each decision
   * @param maxTokens - Maximum token budget for formatted output
   * @returns Formatted decision history string ready for AI prompt
   */
  formatDecisions(
    decisions: PlayerDecision[],
    scores: DecisionRelevanceScore[],
    maxTokens: number
  ): string {
    if (decisions.length === 0 || maxTokens <= 0) {
      return '';
    }

    // Create lookup map for scores
    const scoreMap = new Map<string, DecisionRelevanceScore>();
    scores.forEach(score => {
      scoreMap.set(score.decisionId, score);
    });

    // Pair decisions with their scores
    const scoredDecisions = decisions
      .map(decision => ({
        decision,
        score: scoreMap.get(decision.id),
      }))
      .filter(item => item.score !== undefined) as Array<{
        decision: PlayerDecision;
        score: DecisionRelevanceScore;
      }>;

    if (scoredDecisions.length === 0) {
      return '';
    }

    // Sort by priority: critical types first, then by relevance score
    scoredDecisions.sort((a, b) => {
      const aIsCritical = CRITICAL_DECISION_TYPES.has(a.decision.choiceType);
      const bIsCritical = CRITICAL_DECISION_TYPES.has(b.decision.choiceType);

      if (aIsCritical && !bIsCritical) return -1;
      if (!aIsCritical && bIsCritical) return 1;

      return b.score.overallScore - a.score.overallScore;
    });

    // Format decisions within token budget
    const formattedDecisions: string[] = [];
    let totalTokens = 0;

    for (const { decision, score } of scoredDecisions) {
      const formatted = this.formatSingleDecision(decision, score);
      const tokens = estimateTokenCount(formatted);

      if (totalTokens + tokens <= maxTokens) {
        formattedDecisions.push(formatted);
        totalTokens += tokens;
      } else {
        break; // Stop when budget exceeded
      }
    }

    if (formattedDecisions.length === 0) {
      return '';
    }

    return `\n\nRECENT PLAYER DECISIONS:\n${formattedDecisions.join('\n')}`;
  }

  /**
   * Formats a single decision with adaptive detail level
   */
  private formatSingleDecision(
    decision: PlayerDecision,
    score: DecisionRelevanceScore
  ): string {
    const relevance = score.overallScore;

    if (relevance >= RELEVANCE_THRESHOLDS.HIGH) {
      return this.formatDetailed(decision);
    } else if (relevance >= RELEVANCE_THRESHOLDS.MEDIUM) {
      return this.formatCompact(decision);
    } else {
      return this.formatMinimal(decision);
    }
  }

  /**
   * Detailed format for high-relevance decisions (≥0.7)
   * Includes: location, situation, characters, action, type
   */
  private formatDetailed(decision: PlayerDecision): string {
    const location = safeTrim(decision.context?.location) || 'Unknown location';
    const action = this.normalizeAction(decision.choiceText);
    const type = decision.choiceType;
    const situation = safeTrim(decision.context?.situation);
    const characters = decision.context?.charactersPresent || [];

    let formatted = `- At ${location}`;

    if (situation) {
      formatted += ` (${situation})`;
    }

    if (characters.length > 0) {
      formatted += ` with ${characters.join(', ')}`;
    }

    formatted += `, you ${action} (${type})`;

    return formatted;
  }

  /**
   * Compact format for medium-relevance decisions (0.4-0.69)
   * Includes: location, action, type
   */
  private formatCompact(decision: PlayerDecision): string {
    const location = safeTrim(decision.context?.location) || 'Unknown location';
    const action = this.normalizeAction(decision.choiceText);
    const type = decision.choiceType;

    return `- At ${location}, you ${action} (${type})`;
  }

  /**
   * Minimal format for low-relevance decisions (<0.4)
   * Includes: action, type only
   */
  private formatMinimal(decision: PlayerDecision): string {
    const action = this.normalizeAction(decision.choiceText);
    const type = decision.choiceType;

    return `- ${action} (${type})`;
  }

  /**
   * Normalizes action text to lowercase-first for natural sentence flow
   */
  private normalizeAction(actionText: string): string {
    const trimmed = (actionText ?? '').trim();

    if (!trimmed) {
      return 'make a choice';
    }

    const firstAlphaIndex = trimmed.search(/[A-Za-z]/);
    if (firstAlphaIndex === -1) {
      return trimmed;
    }

    const firstAlpha = trimmed[firstAlphaIndex];
    const lowerFirstAlpha = firstAlpha.toLowerCase();

    if (firstAlpha === lowerFirstAlpha) {
      return trimmed;
    }

    return (
      trimmed.slice(0, firstAlphaIndex) +
      lowerFirstAlpha +
      trimmed.slice(firstAlphaIndex + 1)
    );
  }
}
