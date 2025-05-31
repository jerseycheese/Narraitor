// src/types/narrative.types.ts

import { EntityID, TimestampedEntity } from './common.types';

/**
 * Represents a segment of narrative in the game
 */
export interface NarrativeSegment extends TimestampedEntity {
  id: EntityID;
  worldId?: EntityID;
  sessionId?: EntityID;
  content: string;
  type: 'scene' | 'dialogue' | 'action' | 'transition';
  characterIds?: EntityID[];
  decisions?: Decision[];
  metadata: NarrativeMetadata;
  timestamp: Date;
}

/**
 * Represents a decision point in the narrative
 */
export interface Decision {
  id: EntityID;
  prompt: string;
  options: DecisionOption[];
  selectedOptionId?: EntityID;
  consequences?: Consequence[];
}

/**
 * Represents an option within a decision
 */
export interface DecisionOption {
  id: EntityID;
  text: string;
  requirements?: DecisionRequirement[];
  hint?: string;
  // Custom input support
  isCustomInput?: boolean;
  customText?: string;
}

/**
 * Represents a requirement for a decision option
 */
export interface DecisionRequirement {
  type: 'attribute' | 'skill' | 'item' | 'relationship';
  targetId: EntityID;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: number | string;
}

/**
 * Represents a consequence of a decision
 */
export interface Consequence {
  type: 'attribute' | 'skill' | 'item' | 'relationship' | 'narrative';
  action: 'add' | 'remove' | 'modify';
  targetId: EntityID;
  value: string | number | boolean | Record<string, unknown>;
  description?: string;
}

/**
 * Metadata for narrative segments (simplified for MVP)
 */
export interface NarrativeMetadata {
  mood?: 'tense' | 'relaxed' | 'mysterious' | 'action' | 'emotional' | 'neutral';
  tags: string[];
  location?: string;
  characterIds?: EntityID[];
}

/**
 * Represents a narrative generation request
 */
export interface NarrativeGenerationRequest {
  worldId: EntityID;
  sessionId: EntityID;
  characterIds: EntityID[];
  narrativeContext?: NarrativeContext;
  generationParameters?: GenerationParameters;
}

/**
 * Represents narrative context for generation
 */
export interface NarrativeContext {
  worldId: EntityID;
  currentSceneId: EntityID;
  characterIds: EntityID[];
  /** All narrative segments in the current session */
  previousSegments: NarrativeSegment[];
  currentTags: string[];
  sessionId: EntityID;
  /** Most recent segments (typically last 3-5) for immediate context. Subset of previousSegments */
  recentSegments?: NarrativeSegment[];
  currentLocation?: string;
  currentSituation?: string;
  importantEntities?: Array<{
    id: EntityID;
    type: string;
    name: string;
  }>;
}

/**
 * Parameters for narrative generation
 */
export interface GenerationParameters {
  desiredLength?: 'short' | 'medium' | 'long';
  tone?: string;
  segmentType?: 'scene' | 'dialogue' | 'action' | 'transition';
  includedTopics?: string[];
  excludedTopics?: string[];
}

/**
 * Result of narrative generation
 */
export interface NarrativeGenerationResult {
  content: string;
  segmentType: 'scene' | 'dialogue' | 'action' | 'transition';
  metadata: {
    characterIds: EntityID[];
    location?: string;
    mood?: 'tense' | 'relaxed' | 'mysterious' | 'action' | 'emotional' | 'neutral';
    tags: string[];
    timestamp?: string;
  };
  choices?: Array<{
    text: string;
    outcome?: string;
    tags?: string[];
  }>;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}