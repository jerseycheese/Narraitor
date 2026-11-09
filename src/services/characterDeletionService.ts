import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import type { PlayerCharacterThreadUpdate, CharacterRelationshipRemoval, WorldStateUpdate } from '@/types/world-state.types';

import Logger from '@/lib/utils/logger';
const logger = new Logger('CharacterDeletionService');

/**
 * Deletes a character and its world-state thread and relationships.
 *
 * Its sessions (story, journal, goals, lore) go through the CHARACTER_DELETED
 * cleanup in sessionCleanup.ts, which finds older sessions by the journal
 * entries that carry the characterId, so nothing here may delete those first.
 */
export async function deleteCharacterWithCleanup(characterId: string): Promise<void> {
  const characterStore = useCharacterStore.getState();
  const character = characterStore.characters[characterId];
  const worldId = character?.worldId;

  if (worldId) {
    try {
      const worldStore = useWorldStore.getState();
      const worldState = worldStore.worldStates?.[worldId];

      const threadKey = Object.entries(worldState?.playerCharacterThreads ?? {}).find(
        ([, thread]) => thread.characterId === characterId
      )?.[0];

      const relatedCharacterIds = Object.keys(
        worldState?.characterRelationships?.[characterId] ?? {}
      );

      const relationshipRemovals: CharacterRelationshipRemoval[] = relatedCharacterIds.flatMap((otherId) => ([
        { sourceId: characterId, targetId: otherId },
        { sourceId: otherId, targetId: characterId },
      ]));

      const impactedThreadsUpdates: Record<string, PlayerCharacterThreadUpdate> = {};

      Object.values(worldState?.playerCharacterThreads ?? {}).forEach((thread) => {
        if (!thread || thread.characterId === characterId) {
          return;
        }

        const filteredReferences = (thread.crossCharacterReferences ?? []).filter(
          (reference) => reference.characterId !== characterId
        );

        if (filteredReferences.length !== (thread.crossCharacterReferences?.length ?? 0)) {
          impactedThreadsUpdates[thread.id] = {
            id: thread.id,
            characterId: thread.characterId,
            crossCharacterReferences: filteredReferences,
            replaceCrossCharacterReferences: true,
          };
        }
      });

      const updatePayload: WorldStateUpdate = {};

      if (threadKey) {
        updatePayload.removePlayerCharacterThreads = [threadKey];
      }
      if (relationshipRemovals.length > 0) {
        updatePayload.removeCharacterRelationships = relationshipRemovals;
      }
      if (Object.keys(impactedThreadsUpdates).length > 0) {
        updatePayload.playerCharacterThreads = impactedThreadsUpdates;
      }

      if (Object.keys(updatePayload).length > 0) {
        worldStore.updateWorldState(worldId, updatePayload, 'system-cleanup');
      }
    } catch (error) {
      logger.warn('Failed to clean up world state for character:', characterId, error);
    }
  }

  await characterStore.deleteCharacter(characterId);
}
