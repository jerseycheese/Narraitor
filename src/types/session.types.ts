// src/types/session.types.ts

import { EntityID, TimestampedEntity, ISODateString } from './common.types';

export type SessionLifecycleStatus = 'active' | 'ended' | 'abandoned';

export type SessionStatus = SessionLifecycleStatus | 'paused' | 'completed';

export interface SessionLifecycleMetadata {
  id: EntityID;
  worldId: EntityID;
  characterId: EntityID;
  status: SessionLifecycleStatus;
  lastActivity: ISODateString;
}

/**
 * Represents a game session
 */
export interface GameSession extends TimestampedEntity {
  id: EntityID;
  worldId: EntityID;
  characterId: EntityID;
  state: SessionState;
  narrativeHistory: EntityID[]; // NarrativeSegment IDs
  currentContext: NarrativeContext;
}

/**
 * State of a game session
 */
export interface SessionState {
  status: SessionStatus;
  lastActivity: ISODateString;
  savePoint?: SavePoint;
}

/**
 * Represents a save point in the game
 */
export interface SavePoint {
  narrativeSegmentId: EntityID;
  timestamp: ISODateString;
  description: string;
}

/**
 * Current narrative context for AI processing
 */
export interface NarrativeContext {
  recentSegments: EntityID[]; // Last 5-10 segments
  activeCharacters: EntityID[];
  currentLocation?: string;
  activeQuests?: string[];
  mood?: string;
}
