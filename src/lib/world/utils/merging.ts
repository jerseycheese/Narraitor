import { EntityID } from '@/types/common.types';
import {
  PlayerCharacterThread,
  CharacterRelationshipState,
  NPCRelationshipState,
  WorldStateMajorEvent,
  StoryCheckpoint,
} from '@/types/world-state.types';
import {
  dedupeStrings,
  dedupeEntityIds,
  dedupeThreadReferences,
  compareTimestamps,
} from './deduplication';

const STORY_CHECKPOINT_LIMIT = 25;

export const mergePlayerCharacterThreads = (
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

export const mergeCharacterRelationships = (
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

export const mergeRelationships = (
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

export const mergeEvents = (
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

export const mergeCheckpoints = (
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
