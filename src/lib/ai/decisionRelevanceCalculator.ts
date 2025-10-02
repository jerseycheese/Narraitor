/**
 * DecisionRelevanceCalculator - Multi-Factor Decision Relevance Scoring System
 * 
 * Calculates relevance scores for player decisions based on multiple factors including
 * recency, context similarity, decision impact, tag matching, and character involvement.
 * Used to prioritize the most relevant past decisions for AI context inclusion.
 * 
 * Key Features:
 * - Multi-factor scoring algorithm with configurable weights
 * - Exponential recency decay for time-based relevance
 * - Context similarity matching (location, situation, characters)
 * - Decision impact scoring based on choice types
 * - Tag matching for thematic relevance
 * - Performance optimized for real-time scoring
 * 
 * @author Narraitor AI System
 * @since 1.0.0
 */

import { PlayerDecision } from '@/types/personalization.types';
import { 
  DecisionRelevanceScore, 
  CurrentNarrativeContext, 
  RelevanceScoringConfig,
  DecisionRelevanceResult
} from '@/types/relevance.types';

/**
 * Default configuration for relevance scoring
 */
const DEFAULT_CONFIG: RelevanceScoringConfig = {
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

/**
 * Impact categories for different choice types
 */
const CHOICE_IMPACT_MAP: Record<string, number> = {
  'aggressive': 0.9,     // High impact - combat/confrontation
  'diplomatic': 0.8,     // High impact - major social choices
  'stealthy': 0.7,       // Medium-high impact - tactical choices
  'helpful': 0.6,        // Medium impact - prosocial choices
  'selfish': 0.6,        // Medium impact - self-interested choices
  'lawful': 0.5,         // Medium impact - rule-following
  'chaotic': 0.8,        // High impact - disruptive choices
  'neutral': 0.3         // Low impact - safe/neutral choices
};

/**
 * Calculates multi-factor relevance scores for player decisions
 */
export class DecisionRelevanceCalculator {
  private config: RelevanceScoringConfig;

  constructor(config?: Partial<RelevanceScoringConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validateConfig();
  }

  /**
   * Calculates relevance score for a single decision
   */
  calculateRelevanceScore(
    decision: PlayerDecision,
    currentContext: CurrentNarrativeContext
  ): DecisionRelevanceScore {
    const recencyScore = this.calculateRecencyScore(decision);
    const contextScore = this.calculateContextScore(decision, currentContext);
    const impactScore = this.calculateImpactScore(decision);
    const tagMatchScore = this.calculateTagMatchScore(decision, currentContext);
    const characterScore = this.calculateCharacterScore(decision, currentContext);

    const overallScore = this.calculateWeightedScore({
      recency: recencyScore,
      context: contextScore,
      impact: impactScore,
      tagMatch: tagMatchScore,
      character: characterScore
    });

    const daysSinceDecision = this.getDaysSinceDecision(decision);

    return {
      decisionId: decision.id,
      overallScore: this.normalizeScore(overallScore),
      recencyScore,
      contextScore,
      impactScore,
      tagMatchScore,
      characterScore,
      calculatedAt: getTimestamp(),
      metadata: {
        daysSinceDecision,
        matchedTags: this.getMatchedTags(decision, currentContext),
        contextSimilarity: contextScore,
        impactCategory: this.getImpactCategory(decision.choiceType)
      }
    };
  }

  /**
   * Scores multiple decisions and returns results
   */
  scoreDecisions(
    decisions: PlayerDecision[],
    currentContext: CurrentNarrativeContext
  ): DecisionRelevanceScore[] {
    if (decisions.length === 0) return [];

    return decisions.map(decision => 
      this.calculateRelevanceScore(decision, currentContext)
    );
  }

  /**
   * Gets the most relevant decisions sorted by score
   */
  getMostRelevantDecisions(
    decisions: PlayerDecision[],
    currentContext: CurrentNarrativeContext,
    topN: number
  ): PlayerDecision[] {
    if (decisions.length === 0) return [];

    const scores = this.scoreDecisions(decisions, currentContext);
    
    // Create decision-score pairs and sort by relevance
    const scoredDecisions = decisions.map((decision, index) => ({
      decision,
      score: scores[index]
    }));

    scoredDecisions.sort((a, b) => b.score.overallScore - a.score.overallScore);

    return scoredDecisions
      .slice(0, Math.min(topN, scoredDecisions.length))
      .map(item => item.decision);
  }

  /**
   * Gets detailed relevance analysis results
   */
  analyzeDecisionRelevance(
    decisions: PlayerDecision[],
    currentContext: CurrentNarrativeContext
  ): DecisionRelevanceResult {
    const startTime = performance.now();
    const scores = this.scoreDecisions(decisions, currentContext);
    const endTime = performance.now();

    const scoredDecisions = decisions.map((decision, index) => ({
      decision,
      score: scores[index]
    }));

    scoredDecisions.sort((a, b) => b.score.overallScore - a.score.overallScore);

    const relevantDecisions = scoredDecisions.filter(
      item => item.score.overallScore >= this.config.minRelevanceScore
    ).length;

    const totalScore = scores.reduce((sum, score) => sum + score.overallScore, 0);
    const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

    return {
      rankedDecisions: scoredDecisions,
      totalDecisions: decisions.length,
      relevantDecisions,
      averageScore,
      scoringMetadata: {
        config: this.config,
        context: currentContext,
        processingTimeMs: endTime - startTime
      }
    };
  }

  /**
   * Calculates recency score with exponential decay
   */
  private calculateRecencyScore(decision: PlayerDecision): number {
    const daysSince = this.getDaysSinceDecision(decision);
    
    // Handle future dates gracefully
    if (daysSince < 0) return 1.0;
    
    // Exponential decay: e^(-λ × days)
    const score = Math.exp(-this.config.recencyDecayRate * daysSince);
    
    // Boost for very recent decisions (< 1 hour)
    const hoursSince = (Date.now() - new Date(decision.timestamp).getTime()) / (1000 * 60 * 60);
    const boost = hoursSince < 1 ? 1.5 : 1.0;
    
    return this.normalizeScore(score * boost);
  }

  /**
   * Calculates context similarity score
   */
  private calculateContextScore(
    decision: PlayerDecision,
    currentContext: CurrentNarrativeContext
  ): number {
    let score = 0;
    let factors = 0;

    // Location matching (40% of context score)
    if (decision.context.location && currentContext.location) {
      const locationMatch = this.calculateStringSimilarity(
        decision.context.location,
        currentContext.location
      );
      score += locationMatch * 0.4;
      factors += 0.4;
    }

    // Character overlap (30% of context score)
    if (decision.context.charactersPresent && currentContext.charactersPresent) {
      const characterOverlap = this.calculateArrayOverlap(
        decision.context.charactersPresent,
        currentContext.charactersPresent
      );
      score += characterOverlap * 0.3;
      factors += 0.3;
    }

    // Situation similarity (30% of context score)
    if (decision.context.situation && currentContext.situation) {
      const situationMatch = this.calculateStringSimilarity(
        decision.context.situation,
        currentContext.situation
      );
      score += situationMatch * 0.3;
      factors += 0.3;
    }

    // Session and world matching (bonus)
    if (decision.sessionId === currentContext.sessionId) {
      score += 0.1; // 10% bonus for same session
    }
    
    if (decision.worldId === currentContext.worldId) {
      score += 0.05; // 5% bonus for same world
    }

    // Normalize by factors considered
    return factors > 0 ? this.normalizeScore(score) : 0;
  }

  /**
   * Calculates decision impact score based on choice type
   */
  private calculateImpactScore(decision: PlayerDecision): number {
    const baseImpact = CHOICE_IMPACT_MAP[decision.choiceType] || 0.3;
    return this.normalizeScore(baseImpact);
  }

  /**
   * Calculates tag matching score
   */
  private calculateTagMatchScore(
    decision: PlayerDecision,
    currentContext: CurrentNarrativeContext
  ): number {
    if (!currentContext.activeTags || currentContext.activeTags.length === 0) {
      return 0;
    }

    // Extract tags from decision context (simplified approach)
    const decisionTags = this.extractDecisionTags(decision);
    
    const matchingTags = currentContext.activeTags.filter(tag =>
      decisionTags.includes(tag.toLowerCase())
    );

    const matchRatio = matchingTags.length / Math.max(currentContext.activeTags.length, 1);
    return this.normalizeScore(matchRatio);
  }

  /**
   * Calculates character relevance score
   */
  private calculateCharacterScore(
    decision: PlayerDecision,
    currentContext: CurrentNarrativeContext
  ): number {
    if (!decision.context.charactersPresent || !currentContext.charactersPresent) {
      return 0;
    }

    const overlap = this.calculateArrayOverlap(
      decision.context.charactersPresent,
      currentContext.charactersPresent
    );

    return this.normalizeScore(overlap);
  }

  /**
   * Calculates weighted overall score
   */
  private calculateWeightedScore(scores: Record<string, number>): number {
    const weights = this.config.weights;
    
    return (
      scores.recency * weights.recency +
      scores.context * weights.context +
      scores.impact * weights.impact +
      scores.tagMatch * weights.tagMatch +
      scores.character * weights.character
    );
  }

  /**
   * Normalizes score to 0.0-1.0 range
   */
  private normalizeScore(score: number): number {
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculates days since decision was made
   */
  private getDaysSinceDecision(decision: PlayerDecision): number {
    const now = Date.now();
    const decisionTime = new Date(decision.timestamp).getTime();
    return (now - decisionTime) / (1000 * 60 * 60 * 24);
  }

  /**
   * Calculates string similarity using simple approach
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Simple word overlap check
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    if (commonWords.length === 0) return 0;
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Calculates overlap between two arrays
   */
  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
    
    const set1 = new Set(arr1.map(item => item.toLowerCase()));
    const set2 = new Set(arr2.map(item => item.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Extracts relevant tags from decision for matching
   */
  private extractDecisionTags(decision: PlayerDecision): string[] {
    const tags: string[] = [];
    
    // Add choice type as tag
    tags.push(decision.choiceType);
    
    // Extract tags from context
    if (decision.context.situation) {
      const situation = decision.context.situation.toLowerCase();
      if (situation.includes('combat')) tags.push('combat');
      if (situation.includes('social')) tags.push('social');
      if (situation.includes('investigation')) tags.push('investigation');
      if (situation.includes('exploration')) tags.push('exploration');
      if (situation.includes('mystery')) tags.push('mystery');
    }
    
    return tags;
  }

  /**
   * Gets matched tags between decision and current context
   */
  private getMatchedTags(
    decision: PlayerDecision,
    currentContext: CurrentNarrativeContext
  ): string[] {
    const decisionTags = this.extractDecisionTags(decision);
    const activeTags = currentContext.activeTags.map(tag => tag.toLowerCase());
    
    return decisionTags.filter(tag => activeTags.includes(tag));
  }

  /**
   * Gets impact category description for choice type
   */
  private getImpactCategory(choiceType: string): string {
    const impact = CHOICE_IMPACT_MAP[choiceType] || 0.3;
    
    if (impact >= 0.8) return 'high';
    if (impact >= 0.6) return 'medium';
    if (impact >= 0.4) return 'low';
    return 'minimal';
  }

  /**
   * Validates scoring configuration
   */
  private validateConfig(): void {
    const weights = this.config.weights;
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      console.warn(`DecisionRelevanceCalculator: Weights sum to ${totalWeight}, expected 1.0`);
    }
    
    if (this.config.recencyDecayRate <= 0) {
      throw new Error('Recency decay rate must be positive');
    }
    
    if (this.config.maxDaysRelevant <= 0) {
      throw new Error('Max relevant days must be positive');
    }
  }
}