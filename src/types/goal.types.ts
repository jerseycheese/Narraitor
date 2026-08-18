// src/types/goal.types.ts

import { EntityID, TimestampedEntity } from './common.types';
import type { WorldThreadExtractionInput, WorldThreadExtractionResult } from './worldThread.types';

/**
 * Priority levels for narrative goals
 */
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Status of a narrative goal
 */
export type GoalStatus = 'active' | 'completed' | 'abandoned' | 'blocked';

/**
 * Types of narrative goals based on their nature
 */
export type GoalType = 'immediate' | 'quest' | 'exploration' | 'social' | 'mystery' | 'survival';

/**
 * Represents a narrative goal that tracks player objectives and story threads
 */
export interface NarrativeGoal extends TimestampedEntity {
  id: EntityID;
  sessionId: EntityID;
  characterId?: EntityID;
  worldId?: EntityID;
  
  // Goal details
  title: string;
  description: string;
  type: GoalType;
  priority: GoalPriority;
  status: GoalStatus;
  
  // Context information
  originSegmentId?: EntityID; // Segment where this goal was established
  targetLocation?: string;
  involvedCharacters?: EntityID[];
  requiredItems?: EntityID[];
  
  // Tracking data
  mentionCount: number; // How many times this goal has been mentioned
  lastMentionedAt?: Date;
  progressNotes?: string[];
  
  // Completion tracking
  completedAt?: Date;
  completionSegmentId?: EntityID;
  completionMethod?: 'achieved' | 'abandoned' | 'superseded';
  
  // AI context
  contextSummary?: string; // Brief summary for AI prompts
  keywords?: string[]; // Keywords for relevance matching
}

/**
 * Request to extract goals from narrative content
 */
export interface GoalExtractionRequest {
  content: string;
  sessionId: EntityID;
  segmentId: EntityID;
  characterId?: EntityID;
  worldId?: EntityID;
  existingGoals?: NarrativeGoal[];
  /** World-clock ledger context; rides along so the ledger costs no extra AI call. */
  worldThreads?: WorldThreadExtractionInput;
}

/**
 * Result of goal extraction from narrative content
 */
export interface GoalExtractionResult {
  newGoals: Omit<NarrativeGoal, 'id' | 'createdAt' | 'updatedAt'>[];
  updatedGoals: Array<{
    goalId: EntityID;
    updates: Partial<NarrativeGoal>;
  }>;
  completedGoals: EntityID[];
  confidence: number; // 0-1 confidence score
  /** Undefined when the request carried no ledger or the model returned no block. */
  worldThreads?: WorldThreadExtractionResult;
}
