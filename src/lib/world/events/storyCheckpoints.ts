import { WorldState, StoryCheckpoint } from '@/types/world-state.types';
import { EntityID } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils/timestamp';
import { dedupeStrings, dedupeEntityIds, ensureState, mergeCheckpoints } from '../utils';

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
