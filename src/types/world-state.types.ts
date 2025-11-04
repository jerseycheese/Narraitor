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
 * Aggregate world state snapshot scoped to active sessions.
 */
export interface WorldState {
  worldId: EntityID;
  version: number;
  lastModified: ISODateString;
  npcRelationships: Record<EntityID, NPCRelationshipState>;
  majorEvents: WorldStateMajorEvent[];
}

/**
 * Partial update payload for world state changes.
 */
export interface WorldStateUpdate {
  npcRelationships?: Record<EntityID, NPCRelationshipUpdate>;
  majorEvents?: WorldStateMajorEventInput[];
}

export interface NPCRelationshipUpdate {
  sentiment?: number;
  sentimentDelta?: number;
  trust?: number;
  trustDelta?: number;
  lastInteraction?: ISODateString;
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
});
