// src/lib/world/worldStateManager.ts

import { EntityID } from '@/types/common.types';
import {
  WorldState,
  WorldStateUpdate,
  NPCRelationshipState,
} from '@/types/world-state.types';
import { SessionLifecycleStatus } from '@/types/session.types';
import {
  ensureState,
  mergeRelationships,
  mergeEvents,
  mergeCheckpoints,
  mergePlayerCharacterThreads,
  mergeCharacterRelationships,
  compareTimestamps,
} from './utils';
import { recordMajorEvent, recordStoryCheckpoint } from './events';
import {
  updateNPCRelationship,
  updateCharacterRelationship,
  updatePlayerCharacterThread,
  removePlayerCharacterThreads,
  removeCharacterRelationshipEdges,
} from './relationships';

type SessionStatusLookup = (sessionId: EntityID) => SessionLifecycleStatus | undefined;

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
