// src/types/session.types.ts

import { EntityID, ISODateString } from './common.types';

export type SessionLifecycleStatus = 'active' | 'ended' | 'abandoned';

export interface SessionLifecycleMetadata {
  id: EntityID;
  worldId: EntityID;
  characterId: EntityID;
  status: SessionLifecycleStatus;
  lastActivity: ISODateString;
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
