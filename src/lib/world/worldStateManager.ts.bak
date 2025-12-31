// src/lib/world/worldStateManager.ts

import { EntityID, ISODateString } from '@/types/common.types';
import {
  WorldState,
  WorldStateUpdate,
  NPCRelationshipState,
  NPCRelationshipUpdate,
  WorldStateMajorEvent,
  StoryCheckpoint,
  PlayerCharacterThread,
  PlayerCharacterThreadUpdate,
  CharacterRelationshipState,
  CharacterRelationshipUpdate,
  CharacterThreadReference,
  CharacterRelationshipRemoval,
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

const dedupeStrings = (values: Array<string | null | undefined>): string[] => {
  const result: string[] = [];
  const seen = new Set<string>();

  values.forEach((raw) => {
    if (!raw) {
      return;
    }
    const value = raw.trim();
    if (!value) {
      return;
    }
    const key = value.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(value);
  });

  return result;
};

const dedupeEntityIds = (values: EntityID[]): EntityID[] => {
  const seen = new Set<EntityID>();
  const result: EntityID[] = [];

  values.forEach((id) => {
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    result.push(id);
  });

  return result;
};

const dedupeThreadReferences = (
  references: CharacterThreadReference[],
): CharacterThreadReference[] => {
  const map = new Map<string, CharacterThreadReference>();

  references.forEach((reference) => {
    if (!reference.characterId) {
      return;
    }

    const summary = reference.summary?.trim();
    if (!summary) {
      return;
    }

    const lastReferencedAt = reference.lastReferencedAt ?? getTimestamp();
    const key = `${reference.characterId}|${summary.toLowerCase()}`;
    const existing = map.get(key);

    if (!existing || compareTimestamps(lastReferencedAt, existing.lastReferencedAt) >= 0) {
      map.set(key, {
        ...reference,
        summary,
        lastReferencedAt,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => compareTimestamps(b.lastReferencedAt, a.lastReferencedAt));
};

const STORY_CHECKPOINT_LIMIT = 25;

const ensureState = (state: WorldState | undefined, worldId: EntityID): WorldState => {
  if (state) {
    if (state.playerCharacterThreads && state.characterRelationships) {
      return {
        ...state,
        storyCheckpoints: state.storyCheckpoints ?? [],
      };
    }

    return {
      ...state,
      playerCharacterThreads: state.playerCharacterThreads ?? {},
      characterRelationships: state.characterRelationships ?? {},
      storyCheckpoints: state.storyCheckpoints ?? [],
    };
  }

  return createEmptyWorldState(worldId);
};

const normalizePlayerCharacterThread = (
  base: PlayerCharacterThread | undefined,
  update: PlayerCharacterThreadUpdate,
  worldId: EntityID,
  characterId: EntityID,
  fallbackSessionId: EntityID,
): PlayerCharacterThread => {
  const now = update.lastUpdated ?? getTimestamp();
  const threadId = update.id ?? base?.id ?? `thread-${characterId}`;
  const summary = update.summary ?? base?.summary ?? '';

  const highlightSources = [
    ...(base?.highlights ?? []),
    ...(update.highlights ?? []),
    ...(update.appendHighlights ?? []),
  ];

  const mergedHighlights = dedupeStrings(highlightSources);

  const sessionIds = dedupeEntityIds([
    ...(base?.sessionIds ?? []),
    ...(update.sessionIds ?? []),
    fallbackSessionId,
  ]);

  const baseReferences = update.replaceCrossCharacterReferences
    ? []
    : (base?.crossCharacterReferences ?? []);

  const crossReferences = dedupeThreadReferences([
    ...baseReferences,
    ...((update.crossCharacterReferences ?? []).map((reference) => ({
      ...reference,
      lastReferencedAt: reference.lastReferencedAt ?? now,
    }))),
  ]);

  return {
    id: threadId,
    characterId,
    worldId,
    summary,
    highlights: mergedHighlights,
    sessionIds,
    crossCharacterReferences: crossReferences,
    lastUpdated: now,
  };
};

const normalizeCharacterRelationship = (
  base: CharacterRelationshipState | undefined,
  update: CharacterRelationshipUpdate,
  fallbackSessionId: EntityID,
): CharacterRelationshipState => {
  const now = update.lastInteraction ?? getTimestamp();

  const sentimentBase = base?.sentiment ?? 0;
  let sentiment = sentimentBase;
  if (typeof update.sentiment === 'number') {
    sentiment = update.sentiment;
  }
  if (typeof update.sentimentDelta === 'number') {
    sentiment += update.sentimentDelta;
  }
  sentiment = clamp(sentiment, -100, 100);

  const trustBase = base?.trust ?? 50;
  let trust = trustBase;
  if (typeof update.trust === 'number') {
    trust = update.trust;
  }
  if (typeof update.trustDelta === 'number') {
    trust += update.trustDelta;
  }
  trust = clamp(trust, 0, 100);

  const tensionBase = base?.tension ?? 0;
  let tension = tensionBase;
  if (typeof update.tension === 'number') {
    tension = update.tension;
  }
  if (typeof update.tensionDelta === 'number') {
    tension += update.tensionDelta;
  }
  tension = clamp(tension, 0, 100);

  return {
    sentiment,
    trust,
    tension,
    lastInteraction: now,
    sessionId: update.sessionId ?? base?.sessionId ?? fallbackSessionId,
  };
};

const mergePlayerCharacterThreads = (
  current: Record<EntityID, PlayerCharacterThread>,
  incoming: Record<EntityID, PlayerCharacterThread>,
): Record<EntityID, PlayerCharacterThread> => {
  const merged: Record<EntityID, PlayerCharacterThread> = { ...current };

  for (const [threadId, thread] of Object.entries(incoming)) {
    const existing = merged[threadId];
    if (!existing || compareTimestamps(thread.lastUpdated, existing.lastUpdated) >= 0) {
      merged[threadId] = {
        ...thread,
        highlights: dedupeStrings(thread.highlights),
        sessionIds: dedupeEntityIds(thread.sessionIds),
        crossCharacterReferences: dedupeThreadReferences(thread.crossCharacterReferences),
      };
    }
  }

  return merged;
};

const mergeCharacterRelationships = (
  current: Record<EntityID, Record<EntityID, CharacterRelationshipState>>,
  incoming: Record<EntityID, Record<EntityID, CharacterRelationshipState>>,
): Record<EntityID, Record<EntityID, CharacterRelationshipState>> => {
  const merged: Record<EntityID, Record<EntityID, CharacterRelationshipState>> = { ...current };

  for (const [sourceId, relationships] of Object.entries(incoming)) {
    const existingRelationships = merged[sourceId] ?? {};
    const nextRelationships: Record<EntityID, CharacterRelationshipState> = { ...existingRelationships };

    for (const [targetId, relationship] of Object.entries(relationships)) {
      const currentRelationship = existingRelationships[targetId];
      if (!currentRelationship || compareTimestamps(relationship.lastInteraction, currentRelationship.lastInteraction) >= 0) {
        nextRelationships[targetId] = relationship;
      }
    }

    merged[sourceId] = nextRelationships;
  }

  return merged;
};

const updatePlayerCharacterThread = (
  worldId: EntityID,
  state: WorldState | undefined,
  threadKey: EntityID,
  update: PlayerCharacterThreadUpdate,
  sessionId: EntityID,
): WorldState => {
  const currentState = ensureState(state, worldId);

  const existingThread = currentState.playerCharacterThreads[threadKey];
  const characterId =
    update.characterId ??
    existingThread?.characterId ??
    threadKey;

  if (!characterId) {
    logger.warn('Unable to update player character thread: missing characterId', { worldId, threadKey });
    return currentState;
  }

  const normalizedThread = normalizePlayerCharacterThread(
    existingThread,
    {
      ...update,
      id: update.id ?? existingThread?.id ?? threadKey,
    },
    worldId,
    characterId,
    sessionId,
  );

  const threadId = normalizedThread.id;
  const lastModified = getTimestamp();

  return {
    ...currentState,
    version: currentState.version + 1,
    lastModified,
    playerCharacterThreads: {
      ...currentState.playerCharacterThreads,
      [threadId]: normalizedThread,
    },
  };
};

const updateCharacterRelationship = (
  worldId: EntityID,
  state: WorldState | undefined,
  sourceCharacterId: EntityID,
  targetCharacterId: EntityID,
  update: CharacterRelationshipUpdate,
  sessionId: EntityID,
): WorldState => {
  const currentState = ensureState(state, worldId);

  const existingRelationship =
    currentState.characterRelationships[sourceCharacterId]?.[targetCharacterId];

  const normalizedRelationship = normalizeCharacterRelationship(
    existingRelationship,
    update,
    sessionId,
  );

  const lastModified = getTimestamp();

  const nextSourceRelationships: Record<EntityID, CharacterRelationshipState> = {
    ...(currentState.characterRelationships[sourceCharacterId] ?? {}),
    [targetCharacterId]: normalizedRelationship,
  };

  return {
    ...currentState,
    version: currentState.version + 1,
    lastModified,
    characterRelationships: {
      ...currentState.characterRelationships,
      [sourceCharacterId]: nextSourceRelationships,
    },
  };
};

const removePlayerCharacterThreads = (
  worldId: EntityID,
  state: WorldState | undefined,
  threadIds: EntityID[] | undefined,
): WorldState => {
  if (!threadIds || threadIds.length === 0) {
    return ensureState(state, worldId);
  }

  const currentState = ensureState(state, worldId);
  const nextThreads = { ...currentState.playerCharacterThreads };
  let modified = false;

  threadIds.forEach((threadId) => {
    if (threadId && nextThreads[threadId]) {
      delete nextThreads[threadId];
      modified = true;
    }
  });

  if (!modified) {
    return currentState;
  }

  return {
    ...currentState,
    version: currentState.version + 1,
    lastModified: getTimestamp(),
    playerCharacterThreads: nextThreads,
  };
};

const removeCharacterRelationshipEdges = (
  worldId: EntityID,
  state: WorldState | undefined,
  removals: CharacterRelationshipRemoval[] | undefined,
): WorldState => {
  if (!removals || removals.length === 0) {
    return ensureState(state, worldId);
  }

  const currentState = ensureState(state, worldId);
  const nextRelationships: Record<EntityID, Record<EntityID, CharacterRelationshipState>> = {
    ...currentState.characterRelationships,
  };
  let modified = false;

  removals.forEach(({ sourceId, targetId }) => {
    if (!sourceId || !targetId) {
      return;
    }

    const sourceRelationships = nextRelationships[sourceId];
    if (!sourceRelationships || !sourceRelationships[targetId]) {
      return;
    }

    const remaining = { ...sourceRelationships };
    delete remaining[targetId];
    modified = true;

    if (Object.keys(remaining).length === 0) {
      delete nextRelationships[sourceId];
    } else {
      nextRelationships[sourceId] = remaining;
    }
  });

  if (!modified) {
    return currentState;
  }

  return {
    ...currentState,
    version: currentState.version + 1,
    lastModified: getTimestamp(),
    characterRelationships: nextRelationships,
  };
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

const mergeCheckpoints = (
  current: StoryCheckpoint[],
  incoming: StoryCheckpoint[],
): StoryCheckpoint[] => {
  const byId = new Map<EntityID, StoryCheckpoint>();

  for (const checkpoint of current) {
    if (!checkpoint.id) {
      continue;
    }
    const existing = byId.get(checkpoint.id);
    if (!existing || compareTimestamps(checkpoint.createdAt, existing.createdAt) >= 0) {
      byId.set(checkpoint.id, checkpoint);
    }
  }

  for (const checkpoint of incoming) {
    if (!checkpoint.id) {
      continue;
    }
    const existing = byId.get(checkpoint.id);
    if (!existing || compareTimestamps(checkpoint.createdAt, existing.createdAt) >= 0) {
      byId.set(checkpoint.id, checkpoint);
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => compareTimestamps(b.createdAt, a.createdAt))
    .slice(0, STORY_CHECKPOINT_LIMIT);
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

  return nextState;
};

export const recordStoryCheckpoint = (
  worldId: EntityID,
  state: WorldState | undefined,
  checkpoint: Partial<StoryCheckpoint>,
  sessionId: EntityID,
): WorldState => {
  const currentState = ensureState(state, worldId);
  const timestamp = checkpoint.createdAt ?? getTimestamp();
  const checkpointId = checkpoint.id ?? `checkpoint-${timestamp}`;
  const segment = checkpoint.segment?.trim();

  if (!segment) {
    throw new Error('Story checkpoint segment is required');
  }

  const highlights = dedupeStrings(checkpoint.highlights ?? []).slice(0, 6);
  const eventIds = dedupeEntityIds(checkpoint.eventIds ?? []);
  const decisionIds = checkpoint.decisionIds
    ? dedupeEntityIds(checkpoint.decisionIds)
    : undefined;

  const normalized: StoryCheckpoint = {
    id: checkpointId,
    sessionId: checkpoint.sessionId ?? sessionId,
    characterId: checkpoint.characterId,
    createdAt: timestamp,
    segment,
    highlights,
    eventIds,
    decisionIds,
    metadata: checkpoint.metadata,
  };

  const lastModified = getTimestamp();
  const nextState: WorldState = {
    ...currentState,
    version: currentState.version + 1,
    lastModified,
    storyCheckpoints: mergeCheckpoints(currentState.storyCheckpoints, [normalized]),
  };


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
    storyCheckpoints: mergeCheckpoints(current.storyCheckpoints ?? [], incoming.storyCheckpoints ?? []),
    playerCharacterThreads: mergePlayerCharacterThreads(
      current.playerCharacterThreads ?? {},
      incoming.playerCharacterThreads ?? {},
    ),
    characterRelationships: mergeCharacterRelationships(
      current.characterRelationships ?? {},
      incoming.characterRelationships ?? {},
    ),
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

  if (update.storyCheckpoints?.length) {
    for (const checkpoint of update.storyCheckpoints) {
      workingState = recordStoryCheckpoint(worldId, workingState, checkpoint, sessionId);
    }
  }

  if (update.playerCharacterThreads) {
    for (const [threadKey, threadUpdate] of Object.entries(update.playerCharacterThreads)) {
      workingState = updatePlayerCharacterThread(worldId, workingState, threadKey, threadUpdate, sessionId);
    }
  }

  if (update.characterRelationships) {
    for (const [sourceCharacterId, relationships] of Object.entries(update.characterRelationships)) {
      for (const [targetCharacterId, relationshipUpdate] of Object.entries(relationships)) {
        workingState = updateCharacterRelationship(
          worldId,
          workingState,
          sourceCharacterId,
          targetCharacterId,
          relationshipUpdate,
          sessionId,
        );
      }
    }
  }

  if (update.removePlayerCharacterThreads?.length) {
    workingState = removePlayerCharacterThreads(worldId, workingState, update.removePlayerCharacterThreads);
  }

  if (update.removeCharacterRelationships?.length) {
    workingState = removeCharacterRelationshipEdges(worldId, workingState, update.removeCharacterRelationships);
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
  const activeCheckpoints = currentState.storyCheckpoints.filter(checkpoint => {
    const status = lookupStatus(checkpoint.sessionId);
    return !status || status === 'active';
  });

  return {
    ...currentState,
    npcRelationships: activeRelationships,
    majorEvents: activeEvents,
    storyCheckpoints: activeCheckpoints,
  };
};
