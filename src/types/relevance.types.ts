/**
 * Decision relevance scoring types for AI context prioritization
 * Defines interfaces for multi-factor relevance calculation system
 */

import { EntityID } from './common.types';

/**
 * Relevance score for a single decision with detailed breakdown
 */
export interface DecisionRelevanceScore {
  /** ID of the decision being scored */
  decisionId: EntityID;
  /** Overall composite relevance score (0.0 - 1.0) */
  overallScore: number;
  /** Time-based relevance score (0.0 - 1.0) */
  recencyScore: number;
  /** Context similarity score (0.0 - 1.0) */
  contextScore: number;
  /** Decision impact/importance score (0.0 - 1.0) */
  impactScore: number;
  /** Tag matching score (0.0 - 1.0) */
  tagMatchScore: number;
  /** Character relevance score (0.0 - 1.0) */
  characterScore: number;
  /** When this score was calculated */
  calculatedAt: string;
  /** Additional metadata for debugging */
  metadata?: {
    daysSinceDecision: number;
    matchedTags: string[];
    contextSimilarity: number;
    impactCategory: string;
  };
}

/**
 * Configuration for relevance scoring algorithm
 */
export interface RelevanceScoringConfig {
  /** Weights for different scoring factors (must sum to 1.0) */
  weights: {
    recency: number;      // Default: 0.25
    context: number;      // Default: 0.30  
    impact: number;       // Default: 0.20
    tagMatch: number;     // Default: 0.15
    character: number;    // Default: 0.10
  };
  /** Exponential decay rate for recency scoring */
  recencyDecayRate: number;
  /** Maximum days before decision becomes irrelevant */
  maxDaysRelevant: number;
  /** Minimum score threshold to be considered relevant */
  minRelevanceScore: number;
}

/**
 * Current narrative context for relevance calculation
 */
export interface CurrentNarrativeContext {
  /** Current location in the narrative */
  location?: string;
  /** Characters currently present */
  charactersPresent: string[];
  /** Current situation description */
  situation?: string;
  /** Recent narrative events */
  recentEvents: string[];
  /** Active narrative tags */
  activeTags: string[];
  /** World context ID */
  worldId: EntityID;
  /** Session context ID */
  sessionId: EntityID;
  /** Context timestamp */
  timestamp: string;
}

/**
 * Result of batch decision scoring
 */
export interface DecisionRelevanceResult {
  /** Scored decisions sorted by relevance (highest first) */
  rankedDecisions: Array<{
    decision: import('./personalization.types').PlayerDecision;
    score: DecisionRelevanceScore;
  }>;
  /** Total number of decisions scored */
  totalDecisions: number;
  /** Number of decisions above relevance threshold */
  relevantDecisions: number;
  /** Average relevance score */
  averageScore: number;
  /** Scoring metadata */
  scoringMetadata: {
    config: RelevanceScoringConfig;
    context: CurrentNarrativeContext;
    processingTimeMs: number;
  };
}