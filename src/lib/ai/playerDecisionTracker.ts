/**
 * Tracks and analyzes player decision patterns for narrative personalization:
 * validated/sanitized recording, persistent storage with limits, and
 * session/world-scoped pattern analysis.
 */

import {
  PlayerDecision,
  ChoiceTypePreference
} from '@/types/personalization.types';
import { EntityID } from '@/types/common.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import { getTimestamp } from '@/lib/utils';
import {
  getMostRelevantDecisions as getSimpleMostRelevantDecisions,
  type SimpleNarrativeContext
} from './simpleDecisionRelevance';

import Logger from '@/lib/utils/logger';
const logger = new Logger('PlayerDecisionTracker');

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
 * Maintains a persistent, validated record of player choices and provides
 * pattern analysis over them.
 */
export class PlayerDecisionTracker {
  private config: DecisionTrackerConfig;
  private decisions: PlayerDecision[] = [];

  constructor(config: Partial<DecisionTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadDecisions();
  }

  /**
   * Records a player decision with input validation
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
    // Validate and sanitize inputs
    const validatedData = this.validateDecisionInput({
      prompt,
      choiceText,
      choiceType,
      sessionId,
      worldId,
      context
    });

    const decision: PlayerDecision = {
      id: generateUniqueId(),
      prompt: validatedData.prompt,
      choiceText: validatedData.choiceText,
      choiceType: validatedData.choiceType,
      timestamp: getTimestamp(),
      sessionId: validatedData.sessionId,
      worldId: validatedData.worldId,
      context: validatedData.context
    };

    this.decisions.unshift(decision);
    this.trimDecisions();
    this.saveDecisions();

    return decision;
  }

  /**
   * Validates and sanitizes decision input data
   */
  private validateDecisionInput(input: {
    prompt: string;
    choiceText: string;
    choiceType: ChoiceTypePreference;
    sessionId: EntityID;
    worldId: EntityID;
    context?: {
      location?: string;
      situation?: string;
      charactersPresent?: string[];
    };
  }): {
    prompt: string;
    choiceText: string;
    choiceType: ChoiceTypePreference;
    sessionId: EntityID;
    worldId: EntityID;
    context: {
      location?: string;
      situation?: string;
      charactersPresent?: string[];
    };
  } {
    // Validate required string inputs
    if (!input.prompt || typeof input.prompt !== 'string') {
      throw new Error('Decision prompt is required and must be a string');
    }
    if (!input.choiceText || typeof input.choiceText !== 'string') {
      throw new Error('Choice text is required and must be a string');
    }
    if (!input.sessionId || typeof input.sessionId !== 'string') {
      throw new Error('Session ID is required and must be a string');
    }
    if (!input.worldId || typeof input.worldId !== 'string') {
      throw new Error('World ID is required and must be a string');
    }

    // Validate choice type
    const validChoiceTypes: ChoiceTypePreference[] = [
      'diplomatic', 'aggressive', 'stealthy', 'helpful',
      'selfish', 'lawful', 'chaotic', 'neutral'
    ];
    if (!validChoiceTypes.includes(input.choiceType)) {
      throw new Error(`Invalid choice type: ${input.choiceType}`);
    }

    // Sanitize string inputs
    const sanitizeString = (str: string, maxLength: number = 500): string => {
      return str
        .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
        .substring(0, maxLength)
        .trim();
    };

    // Validate and sanitize context
    const sanitizedContext: {
      location?: string;
      situation?: string;
      charactersPresent?: string[];
    } = {};

    if (input.context) {
      if (input.context.location && typeof input.context.location === 'string') {
        const sanitized = sanitizeString(input.context.location, 100);
        if (sanitized) sanitizedContext.location = sanitized;
      }

      if (input.context.situation && typeof input.context.situation === 'string') {
        const sanitized = sanitizeString(input.context.situation, 200);
        if (sanitized) sanitizedContext.situation = sanitized;
      }

      if (Array.isArray(input.context.charactersPresent)) {
        const sanitizedCharacters = input.context.charactersPresent
          .filter(char => typeof char === 'string')
          .map(char => sanitizeString(char, 50))
          .filter(char => char.length > 0)
          .slice(0, 10); // Limit to 10 characters
        
        if (sanitizedCharacters.length > 0) {
          sanitizedContext.charactersPresent = sanitizedCharacters;
        }
      }
    }

    return {
      prompt: sanitizeString(input.prompt, 500),
      choiceText: sanitizeString(input.choiceText, 300),
      choiceType: input.choiceType,
      sessionId: sanitizeString(input.sessionId, 50),
      worldId: sanitizeString(input.worldId, 50),
      context: sanitizedContext
    };
  }

  getSessionDecisions(sessionId: EntityID): PlayerDecision[] {
    return this.decisions.filter(decision => decision.sessionId === sessionId);
  }

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

  getAllDecisions(): PlayerDecision[] {
    return [...this.decisions];
  }

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

  clearDecisions(): void {
    this.decisions = [];
    this.saveDecisions();
  }

  clearSessionDecisions(sessionId: EntityID): void {
    this.decisions = this.decisions.filter(decision => decision.sessionId !== sessionId);
    this.saveDecisions();
  }

  /**
   * Gets most relevant decisions based on current narrative context
   * Uses simple recency-based filtering
   */
  getRelevantDecisions(
    currentContext: SimpleNarrativeContext,
    maxDecisions: number = 10,
    filters?: {
      worldId?: EntityID;
      sessionId?: EntityID;
    }
  ): PlayerDecision[] {
    const candidates = this.getFilteredDecisionsForRelevance(filters);

    if (candidates.length === 0) {
      return [];
    }

    return getSimpleMostRelevantDecisions(
      candidates,
      currentContext,
      maxDecisions
    );
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
   * Filters decisions before scoring to avoid cross-session/world bleed
   */
  private getFilteredDecisionsForRelevance(filters?: {
    worldId?: EntityID;
    sessionId?: EntityID;
  }): PlayerDecision[] {
    if (!filters || (!filters.worldId && !filters.sessionId)) {
      return [...this.decisions];
    }

    const allDecisions = [...this.decisions];
    let candidates = allDecisions;

    if (filters.sessionId) {
      const sessionMatches = allDecisions.filter(
        decision => decision.sessionId === filters.sessionId
      );

      // Prefer exact session matches when available, even if a world filter is provided
      if (sessionMatches.length > 0) {
        return sessionMatches;
      }

      candidates = allDecisions;
    }

    if (filters.worldId) {
      candidates = candidates.filter(
        decision => decision.worldId === filters.worldId
      );
    }

    return candidates;
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
      logger.warn('Failed to load decisions:', error);
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
      logger.warn('Failed to save decisions:', error);
    }
  }
}

/**
 * Singleton instance
 */
export const playerDecisionTracker = new PlayerDecisionTracker();
