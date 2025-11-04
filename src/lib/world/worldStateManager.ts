// src/lib/world/worldStateManager.ts

import { EntityID, ISODateString } from '@/types/common.types';
import {
  WorldState,
  WorldStateUpdate,
  NPCRelationshipState,
  NPCRelationshipUpdate,
  WorldStateMajorEvent,
} from '@/types/world-state.types';
import { SessionLifecycleStatus } from '@/types/session.types';
import { createEmptyWorldState } from '@/types/world-state.types';
import { getTimestamp } from '@/lib/utils/timestamp';
import Logger from '@/lib/utils/logger';

const logger = new Logger('WorldStateManager');

type SessionStatusLookup = (sessionId: EntityID) => SessionLifecycleStatus | undefined;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const compareTimestamps = (a: ISODateString, b: ISODateString): number =>
  a.localeCompare(b);

const ensureState = (state: WorldState | undefined, worldId: EntityID): WorldState => {
  if (state) {
    return state;
  }

  logger.debug('Creating empty world state for world:', worldId);
  return createEmptyWorldState(worldId);
};

const normalizeRelationship = (
  base: NPCRelationshipState | undefined,
  update: NPCRelationshipUpdate,
  sessionId: EntityID,
): NPCRelationshipState => {
  const now = update.lastInteraction ?? getTimestamp();

  const sentimentBase = base?.sentiment ?? 0;
  const trustBase = base?.trust ?? 50;

  let sentiment = sentimentBase;
  if (typeof update.sentiment === 'number') {
    sentiment = update.sentiment;
  }
  if (typeof update.sentimentDelta === 'number') {
    sentiment += update.sentimentDelta;
  }
  sentiment = clamp(sentiment, -100, 100);

  let trust = trustBase;
  if (typeof update.trust === 'number') {
    trust = update.trust;
  }
  if (typeof update.trustDelta === 'number') {
    trust += update.trustDelta;
  }
  trust = clamp(trust, 0, 100);

  return {
    sentiment,
    trust,
    lastInteraction: now,
    sessionId,
  };
};

const mergeRelationships = (
  current: Record<EntityID, NPCRelationshipState>,
  incoming: Record<EntityID, NPCRelationshipState>,
): Record<EntityID, NPCRelationshipState> => {
  const merged = { ...current };

  for (const [npcId, next] of Object.entries(incoming)) {
    const existing = merged[npcId];
    if (!existing || compareTimestamps(next.lastInteraction, existing.lastInteraction) >= 0) {
      merged[npcId] = next;
    }
  }

  return merged;
};

const mergeEvents = (
  current: WorldStateMajorEvent[],
  incoming: WorldStateMajorEvent[],
): WorldStateMajorEvent[] => {
  const byId = new Map<EntityID, WorldStateMajorEvent>();

  for (const event of current) {
    const existing = byId.get(event.id);
    if (!existing || compareTimestamps(event.timestamp, existing.timestamp) >= 0) {
      byId.set(event.id, event);
    }
  }

  for (const event of incoming) {
    const existing = byId.get(event.id);
    if (!existing || compareTimestamps(event.timestamp, existing.timestamp) >= 0) {
      byId.set(event.id, event);
    }
  }

  return Array.from(byId.values()).sort((a, b) => compareTimestamps(b.timestamp, a.timestamp));
};

export const updateNPCRelationship = (
  worldId: EntityID,
  state: WorldState | undefined,
  npcId: EntityID,
  changes: NPCRelationshipUpdate,
  sessionId: EntityID,
): WorldState => {
  const currentState = ensureState(state, worldId);
  const normalized = normalizeRelationship(currentState.npcRelationships[npcId], changes, sessionId);
  const lastModified = getTimestamp();

  const nextState: WorldState = {
    ...currentState,
    version: currentState.version + 1,
    lastModified,
    npcRelationships: {
      ...currentState.npcRelationships,
      [npcId]: normalized,
    },
  };

  logger.debug('Updated NPC relationship', { worldId, npcId, sessionId, lastModified });
  return nextState;
};

export const recordMajorEvent = (
  worldId: EntityID,
  state: WorldState | undefined,
  event: Omit<WorldStateMajorEvent, 'sessionId'>,
  sessionId: EntityID,
): WorldState => {
  const currentState = ensureState(state, worldId);
  const timestamp = event.timestamp ?? getTimestamp();
  const nextEvent: WorldStateMajorEvent = { ...event, timestamp, sessionId };
  const lastModified = getTimestamp();

  const nextState: WorldState = {
    ...currentState,
    version: currentState.version + 1,
    lastModified,
    majorEvents: mergeEvents(currentState.majorEvents, [nextEvent]),
  };

  logger.debug('Recorded major event', { worldId, eventId: event.id, sessionId, timestamp });
  return nextState;
};

export const detectConflict = (currentVersion: number, incomingVersion: number): boolean =>
  incomingVersion <= currentVersion;

export const mergeState = (current: WorldState, incoming: WorldState): WorldState => {
  const version = Math.max(current.version, incoming.version);
  const lastModified =
    compareTimestamps(incoming.lastModified, current.lastModified) >= 0
      ? incoming.lastModified
      : current.lastModified;

  return {
    worldId: current.worldId,
    version,
    lastModified,
    npcRelationships: mergeRelationships(current.npcRelationships, incoming.npcRelationships),
    majorEvents: mergeEvents(current.majorEvents, incoming.majorEvents),
  };
};

export const applyWorldStateUpdate = (
  worldId: EntityID,
  state: WorldState | undefined,
  update: WorldStateUpdate,
  sessionId: EntityID,
): WorldState => {
  let workingState = ensureState(state, worldId);

  if (update.npcRelationships) {
    for (const [npcId, relationshipUpdate] of Object.entries(update.npcRelationships)) {
      workingState = updateNPCRelationship(worldId, workingState, npcId, relationshipUpdate, sessionId);
    }
  }

  if (update.majorEvents?.length) {
    for (const event of update.majorEvents) {
      workingState = recordMajorEvent(worldId, workingState, event, sessionId);
    }
  }

  return workingState;
};

export const getActiveWorldState = (
  worldId: EntityID,
  state: WorldState | undefined,
  lookupStatus?: SessionStatusLookup,
): WorldState => {
  const currentState = ensureState(state, worldId);

  if (!lookupStatus) {
    return currentState;
  }

  const activeRelationships = Object.entries(currentState.npcRelationships).reduce<
    Record<EntityID, NPCRelationshipState>
  >((acc, [npcId, relationship]) => {
    const status = lookupStatus(relationship.sessionId);
    if (!status || status === 'active') {
      acc[npcId] = relationship;
    }
    return acc;
  }, {});

  const activeEvents = currentState.majorEvents.filter(event => {
    const status = lookupStatus(event.sessionId);
    return !status || status === 'active';
  });

  return {
    ...currentState,
    npcRelationships: activeRelationships,
    majorEvents: activeEvents,
  };
};
