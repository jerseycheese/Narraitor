import {
  WorldState,
  PlayerCharacterThreadUpdate,
  CharacterRelationshipUpdate,
  CharacterRelationshipState,
  CharacterRelationshipRemoval,
} from '@/types/world-state.types';
import { EntityID } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils/timestamp';
import Logger from '@/lib/utils/logger';
import {
  normalizeCharacterRelationship,
  normalizePlayerCharacterThread,
  ensureState,
} from '../utils';

const logger = new Logger('WorldStateManager');

export const updatePlayerCharacterThread = (
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

export const updateCharacterRelationship = (
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

export const removePlayerCharacterThreads = (
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

export const removeCharacterRelationshipEdges = (
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
