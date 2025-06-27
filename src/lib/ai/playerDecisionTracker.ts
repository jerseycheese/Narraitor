/**
 * PlayerDecisionTracker - Minimal implementation to pass MVP tests
 * Tracks and analyzes player choice patterns
 */

import { 
  PlayerDecision, 
  ChoiceTypePreference 
} from '@/types/personalization.types';
import { EntityID } from '@/types/common.types';
import { generateUniqueId } from '@/lib/utils/generateId';

/**
 * Interface for decision tracking configuration
 */
interface DecisionTrackerConfig {
  maxDecisionsPerSession: number;
  maxTotalDecisions: number;
  storageKey: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: DecisionTrackerConfig = {
  maxDecisionsPerSession: 50,
  maxTotalDecisions: 500,
  storageKey: 'narraitor_player_decisions'
};

/**
 * Tracks player decisions for personalization analysis
 */
export class PlayerDecisionTracker {
  private config: DecisionTrackerConfig;
  private decisions: PlayerDecision[] = [];

  constructor(config: Partial<DecisionTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadDecisions();
  }

  /**
   * Records a player decision
   */
  recordDecision(
    prompt: string,
    choiceText: string,
    choiceType: ChoiceTypePreference,
    sessionId: EntityID,
    worldId: EntityID,
    context?: {
      location?: string;
      situation?: string;
      charactersPresent?: string[];
    }
  ): PlayerDecision {
    const decision: PlayerDecision = {
      id: generateUniqueId(),
      prompt,
      choiceText,
      choiceType,
      timestamp: new Date().toISOString(),
      sessionId,
      worldId,
      context: context || {}
    };

    this.decisions.unshift(decision);
    this.trimDecisions();
    this.saveDecisions();

    return decision;
  }

  /**
   * Gets decisions for a specific session
   */
  getSessionDecisions(sessionId: EntityID): PlayerDecision[] {
    return this.decisions.filter(decision => decision.sessionId === sessionId);
  }

  /**
   * Gets decisions for a specific world
   */
  getWorldDecisions(worldId: EntityID): PlayerDecision[] {
    return this.decisions.filter(decision => decision.worldId === worldId);
  }

  /**
   * Gets recent decisions within specified days
   */
  getRecentDecisions(days: number = 7): PlayerDecision[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.decisions.filter(decision => 
      new Date(decision.timestamp) >= cutoffDate
    );
  }

  /**
   * Gets all decisions
   */
  getAllDecisions(): PlayerDecision[] {
    return [...this.decisions];
  }

  /**
   * Analyzes choice patterns
   */
  analyzeChoicePatterns(decisions?: PlayerDecision[]): {
    dominantChoiceTypes: ChoiceTypePreference[];
    choiceDistribution: Record<ChoiceTypePreference, number>;
    patternStrength: number;
  } {
    const analysisDecisions = decisions || this.decisions;
    
    if (analysisDecisions.length === 0) {
      return {
        dominantChoiceTypes: [],
        choiceDistribution: {} as Record<ChoiceTypePreference, number>,
        patternStrength: 0
      };
    }

    const choiceDistribution = this.calculateChoiceDistribution(analysisDecisions);
    const dominantChoiceTypes = this.getDominantChoiceTypes(choiceDistribution);
    const patternStrength = this.calculatePatternStrength(choiceDistribution, analysisDecisions.length);

    return {
      dominantChoiceTypes,
      choiceDistribution,
      patternStrength
    };
  }

  /**
   * Clears all decisions
   */
  clearDecisions(): void {
    this.decisions = [];
    this.saveDecisions();
  }

  /**
   * Clears decisions for a specific session
   */
  clearSessionDecisions(sessionId: EntityID): void {
    this.decisions = this.decisions.filter(decision => decision.sessionId !== sessionId);
    this.saveDecisions();
  }

  /**
   * Calculates choice distribution
   */
  private calculateChoiceDistribution(decisions: PlayerDecision[]): Record<ChoiceTypePreference, number> {
    const distribution: Partial<Record<ChoiceTypePreference, number>> = {};

    decisions.forEach(decision => {
      distribution[decision.choiceType] = (distribution[decision.choiceType] || 0) + 1;
    });

    return distribution as Record<ChoiceTypePreference, number>;
  }

  /**
   * Gets dominant choice types
   */
  private getDominantChoiceTypes(distribution: Record<ChoiceTypePreference, number>): ChoiceTypePreference[] {
    const entries = Object.entries(distribution) as [ChoiceTypePreference, number][];
    
    return entries
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type);
  }

  /**
   * Calculates pattern strength
   */
  private calculatePatternStrength(
    distribution: Record<ChoiceTypePreference, number>,
    totalDecisions: number
  ): number {
    if (totalDecisions === 0) return 0;

    const values = Object.values(distribution);
    if (values.length === 0) return 0;
    
    const maxCount = Math.max(...values);
    const dominanceRatio = maxCount / totalDecisions;

    // Simple pattern strength calculation
    return dominanceRatio * 100;
  }

  /**
   * Trims decisions to stay within limits
   */
  private trimDecisions(): void {
    if (this.decisions.length > this.config.maxTotalDecisions) {
      this.decisions = this.decisions.slice(0, this.config.maxTotalDecisions);
    }
  }

  /**
   * Loads decisions from storage
   */
  private loadDecisions(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored) {
          this.decisions = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.warn('Failed to load decisions:', error);
      this.decisions = [];
    }
  }

  /**
   * Saves decisions to storage
   */
  private saveDecisions(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.decisions));
      }
    } catch (error) {
      console.warn('Failed to save decisions:', error);
    }
  }
}

/**
 * Singleton instance
 */
export const playerDecisionTracker = new PlayerDecisionTracker();