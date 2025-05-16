// src/types/session.types.ts

import { EntityID, TimestampedEntity, ISODateString } from './common.types';

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
  status: 'active' | 'paused' | 'completed';
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
