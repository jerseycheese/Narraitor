import { useJournalStore } from '@/state/journalStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import type { PlayerCharacterThreadUpdate, CharacterRelationshipRemoval, WorldStateUpdate } from '@/types/world-state.types';

/**
 * Service layer for character deletion that handles related data cleanup
 * This decouples the character store from the journal store
 */
export class CharacterDeletionService {
  /**
   * Deletes a character and all related journal entries.
   *
   * This method attempts to clean up all journal entries associated with the given character.
   * If an error occurs during journal cleanup, a warning is logged, but the character will still be deleted.
   * This ensures that character deletion proceeds even if related journal entries cannot be fully cleaned up.
   *
   * @param characterId - The ID of the character to delete.
   * @returns Promise<void>
   */
  static async deleteCharacterWithCleanup(characterId: string): Promise<void> {
    try {
      // Clean up related journal entries
      const journalStore = useJournalStore.getState();
      
      // Find all journal entries for this character using the characterId field
      const allEntries = Object.values(journalStore.entries);
      const characterSessions = new Set<string>();
      
      // Find sessions that have entries for this character
      allEntries.forEach((entry) => {
        if (entry.characterId === characterId) {
          characterSessions.add(entry.sessionId);
        }
      });
      
      // Delete all sessions for this character
      characterSessions.forEach(sessionId => {
        try {
          journalStore.deleteSessionEntries(sessionId);
        } catch (error) {
          console.warn('Failed to clean up journal session:', sessionId, error);
        }
      });
    } catch (error) {
      console.warn('Failed to clean up journal entries for character:', characterId, error);
      // Continue with deletion even if journal cleanup fails
    }

    // Delete character from character store and clean related world state
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
        console.warn('Failed to clean up world state for character:', characterId, error);
      }
    }

    await characterStore.deleteCharacter(characterId);
  }
}
