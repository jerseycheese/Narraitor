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
  type: 'scene' | 'dialogue' | 'action' | 'transition' | 'ending';
  characterIds?: EntityID[];
  decisions?: Decision[];
  metadata: NarrativeMetadata;
  timestamp: Date;
  // Enhanced fields for decision point indication
  triggersDecision?: boolean;
  decisionId?: EntityID;
}

/**
 * Decision weight types for visual prominence
 */
export type DecisionWeight = 'minor' | 'major' | 'critical';

/**
 * Represents a decision point in the narrative
 */
export interface Decision {
  id: EntityID;
  prompt: string;
  options: DecisionOption[];
  selectedOptionId?: EntityID;
  consequences?: Consequence[];
  // Enhanced fields for better decision presentation
  contextSummary?: string;
  decisionWeight?: DecisionWeight;
  narrativeSegmentId?: EntityID;
}

/**
 * Choice alignment types for personality-based variety
 */
export type ChoiceAlignment = 'lawful' | 'chaotic' | 'neutral';

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
  // Choice alignment for personality-based variety
  alignment?: ChoiceAlignment;
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
  // Ending-specific metadata
  endingId?: string;
  endingData?: StoryEnding;
  tone?: EndingTone;
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

/**
 * Types of story endings
 */
export type EndingType = 'player-choice' | 'story-complete' | 'session-limit' | 'character-retirement';

/**
 * Emotional tone of story endings
 */
export type EndingTone = 'triumphant' | 'bittersweet' | 'mysterious' | 'tragic' | 'hopeful';

/**
 * Represents a complete story ending with narrative closure
 */
export interface StoryEnding extends TimestampedEntity {
  id: EntityID;
  sessionId: EntityID;
  characterId: EntityID;
  worldId: EntityID;
  type: EndingType;
  tone: EndingTone;
  epilogue: string;
  characterLegacy: string;
  worldImpact: string;
  timestamp: Date;
  journalSummary?: string;
  achievements?: string[];
  playTime?: number;
}

/**
 * Request to generate a story ending
 */
export interface EndingGenerationRequest {
  sessionId: EntityID;
  characterId: EntityID;
  worldId: EntityID;
  endingType: EndingType;
  desiredTone?: EndingTone;
  customPrompt?: string;
}

/**
 * Result of ending generation
 */
export interface EndingGenerationResult {
  epilogue: string;
  characterLegacy: string;
  worldImpact: string;
  tone: EndingTone;
  achievements: string[];
  playTime?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
