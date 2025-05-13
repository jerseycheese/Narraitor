// src/types/narrative.types.ts

import { EntityID, TimestampedEntity } from './common.types';

/**
 * Represents a segment of narrative in the game
 */
export interface NarrativeSegment extends TimestampedEntity {
  id: EntityID;
  worldId: EntityID;
  sessionId: EntityID;
  content: string;
  type: 'scene' | 'dialogue' | 'action' | 'transition';
  characterIds: EntityID[];
  decisions?: Decision[];
  metadata: NarrativeMetadata;
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
  mood?: 'tense' | 'relaxed' | 'mysterious' | 'action' | 'emotional';
  tags: string[];
}
