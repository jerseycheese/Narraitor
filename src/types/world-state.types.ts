// src/types/world-state.types.ts

import { EntityID, ISODateString } from './common.types';
import { SessionLifecycleStatus } from './session.types';

/**
 * Relationship snapshot for an NPC within a world state.
 */
export interface NPCRelationshipState {
  sentiment: number; // Range -100 to 100
  trust: number; // Range 0 to 100
  lastInteraction: ISODateString;
  sessionId: EntityID;
}

/**
 * Major event snapshot within a world state.
 */
export interface WorldStateMajorEvent {
  id: EntityID;
  description: string;
  timestamp: ISODateString;
  characterId: EntityID;
  sessionId: EntityID;
}

/**
 * Reference to another player character within a story thread.
 */
export interface CharacterThreadReference {
  characterId: EntityID;
  summary: string;
  sessionId?: EntityID;
  lastReferencedAt: ISODateString;
}

/**
 * Ongoing narrative thread for a player-controlled character.
 */
export interface PlayerCharacterThread {
  id: EntityID;
  characterId: EntityID;
  worldId: EntityID;
  summary: string;
  highlights: string[];
  sessionIds: EntityID[];
  crossCharacterReferences: CharacterThreadReference[];
  lastUpdated: ISODateString;
}

/**
 * Relationship snapshot between two player-controlled characters.
 */
export interface CharacterRelationshipState {
  sentiment: number; // Range -100 to 100
  trust: number; // Range 0 to 100
  tension: number; // Range 0 to 100
  lastInteraction: ISODateString;
  sessionId: EntityID;
}

/**
 * Aggregate world state snapshot scoped to active sessions.
 */
export interface WorldState {
  worldId: EntityID;
  version: number;
  lastModified: ISODateString;
  npcRelationships: Record<EntityID, NPCRelationshipState>;
  majorEvents: WorldStateMajorEvent[];
  playerCharacterThreads: Record<EntityID, PlayerCharacterThread>;
  characterRelationships: Record<EntityID, Record<EntityID, CharacterRelationshipState>>;
}

/**
 * Partial update payload for world state changes.
 */
export interface WorldStateUpdate {
  npcRelationships?: Record<EntityID, NPCRelationshipUpdate>;
  majorEvents?: WorldStateMajorEventInput[];
  playerCharacterThreads?: Record<EntityID, PlayerCharacterThreadUpdate>;
  characterRelationships?: Record<EntityID, Record<EntityID, CharacterRelationshipUpdate>>;
  removePlayerCharacterThreads?: EntityID[];
  removeCharacterRelationships?: CharacterRelationshipRemoval[];
}

export interface NPCRelationshipUpdate {
  sentiment?: number;
  sentimentDelta?: number;
  trust?: number;
  trustDelta?: number;
  lastInteraction?: ISODateString;
}

export interface PlayerCharacterThreadUpdate {
  id?: EntityID;
  summary?: string;
  highlights?: string[];
  appendHighlights?: string[];
  sessionIds?: EntityID[];
  crossCharacterReferences?: CharacterThreadReference[];
  lastUpdated?: ISODateString;
  characterId?: EntityID;
  replaceCrossCharacterReferences?: boolean;
}

export interface CharacterRelationshipUpdate {
  sentiment?: number;
  sentimentDelta?: number;
  trust?: number;
  trustDelta?: number;
  tension?: number;
  tensionDelta?: number;
  lastInteraction?: ISODateString;
  sessionId?: EntityID;
}

export interface CharacterRelationshipRemoval {
  sourceId: EntityID;
  targetId: EntityID;
}

export type WorldStateMajorEventInput = Omit<WorldStateMajorEvent, 'sessionId'>;

export interface SessionLifecycleSnapshot {
  id: EntityID;
  status: SessionLifecycleStatus;
  updatedAt: ISODateString;
}

/**
 * Create an empty world state snapshot for a new world.
 */
export const createEmptyWorldState = (worldId: EntityID): WorldState => ({
  worldId,
  version: 0,
  lastModified: new Date().toISOString(),
  npcRelationships: {},
  majorEvents: [],
  playerCharacterThreads: {},
  characterRelationships: {},
});
