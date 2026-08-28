import type { NarrativeSegment, NarrativeMetadata } from '@/types/narrative.types';
import type { EntityID } from '@/types/common.types';
import type {
  WorldStateMajorEventInput,
  PlayerCharacterThreadUpdate,
  CharacterRelationshipUpdate,
} from '@/types/world-state.types';
import { generateUniqueId, getTimestamp } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { aiFetch } from '@/lib/ai/aiFetch';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';

const SEGMENT_SNIPPET_MAX_LENGTH = 220;

let characterStoreModule: typeof import('@/state/characterStore') | null = null;

export interface ApplyWorldStateThreadUpdatesParams {
  newSegment: NarrativeSegment;
  originalSegmentData: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'>;
  finalMetadata: NarrativeMetadata;
  sessionId: EntityID;
  isFirstSegment: boolean;
  /** When set, used as the authoritative character instead of reading the
   *  session singleton. Prevents stale reads after a session switch. */
  characterId?: EntityID;
}

export async function applyWorldStateThreadUpdates({
  newSegment,
  originalSegmentData,
  finalMetadata,
  sessionId,
  isFirstSegment,
  characterId: authoritativeCharacterId,
}: ApplyWorldStateThreadUpdatesParams): Promise<void> {
  try {
    if (!characterStoreModule) {
      characterStoreModule = await import('@/state/characterStore');
    }

    const { useCharacterStore } = characterStoreModule!;

    const sessionStore = useSessionStore.getState();
    const worldStore = useWorldStore.getState();
    const characterStore = useCharacterStore.getState();

    const effectiveWorldId =
      newSegment.worldId ??
      originalSegmentData.worldId ??
      sessionStore.worldId ??
      worldStore.currentWorldId;

    if (!effectiveWorldId) {
      return;
    }

    const activeCharacterId =
      authoritativeCharacterId ??
      sessionStore.characterId ??
      originalSegmentData.characterIds?.[0] ??
      finalMetadata.characterIds?.[0] ??
      characterStore.currentCharacterId;

    if (!activeCharacterId) {
      return;
    }

    const rosterIds = characterStore.getWorldRoster
      ? characterStore.getWorldRoster(effectiveWorldId)
      : characterStore.getCharactersByWorld
        ? characterStore.getCharactersByWorld(effectiveWorldId).map((character) => character.id)
        : Object.values(characterStore.characters || {})
            .filter((character) => character.worldId === effectiveWorldId)
            .map((character) => character.id);

    if (!Array.isArray(rosterIds) || rosterIds.length === 0) {
      return;
    }

    const referencedIds = new Set<EntityID>();
    (originalSegmentData.characterIds ?? []).forEach((id) => referencedIds.add(id));
    (finalMetadata.characterIds ?? []).forEach((id) => referencedIds.add(id));
    (finalMetadata.characters ?? []).forEach((character) => {
      if (character.id) {
        referencedIds.add(character.id);
      }
    });

    const otherPlayerCharacterIds = rosterIds.filter(
      (id) => id !== activeCharacterId && referencedIds.has(id)
    );

    const normalizedContent = newSegment.content?.trim();
    if (!normalizedContent) {
      return;
    }

    const summarySnippet = normalizedContent.length > SEGMENT_SNIPPET_MAX_LENGTH
      ? `${normalizedContent.slice(0, SEGMENT_SNIPPET_MAX_LENGTH - 3)}...`
      : normalizedContent;

    if (!summarySnippet) {
      return;
    }

    const threadId = `thread-${activeCharacterId}`;
    const crossReferences = otherPlayerCharacterIds.map((otherId) => ({
      characterId: otherId,
      summary: summarySnippet,
      sessionId,
      lastReferencedAt: getTimestamp(),
    }));

    const threadUpdate: PlayerCharacterThreadUpdate = {
      id: threadId,
      characterId: activeCharacterId,
      summary: summarySnippet,
      appendHighlights: [summarySnippet],
      sessionIds: [sessionId],
      crossCharacterReferences: crossReferences.length > 0 ? crossReferences : undefined,
    };

    let relationshipUpdates: Record<EntityID, Record<EntityID, CharacterRelationshipUpdate>> | undefined;

    if (otherPlayerCharacterIds.length > 0) {
      const timestamp = getTimestamp();
      relationshipUpdates = {};

      otherPlayerCharacterIds.forEach((otherId) => {
        if (!relationshipUpdates![activeCharacterId]) {
          relationshipUpdates![activeCharacterId] = {};
        }
        relationshipUpdates![activeCharacterId][otherId] = {
          sentimentDelta: 2,
          trustDelta: 1,
          tensionDelta: 0,
          lastInteraction: timestamp,
          sessionId,
        };

        if (!relationshipUpdates![otherId]) {
          relationshipUpdates![otherId] = {};
        }
        relationshipUpdates![otherId][activeCharacterId] = {
          sentimentDelta: 1,
          trustDelta: 1,
          tensionDelta: 0,
          lastInteraction: timestamp,
          sessionId,
        };
      });
    }

    const updatePayload: {
      playerCharacterThreads: Record<EntityID, PlayerCharacterThreadUpdate>;
      characterRelationships?: Record<EntityID, Record<EntityID, CharacterRelationshipUpdate>>;
      majorEvents?: WorldStateMajorEventInput[];
    } = {
      playerCharacterThreads: {
        [threadId]: threadUpdate,
      },
    };

    if (relationshipUpdates) {
      updatePayload.characterRelationships = relationshipUpdates;
    }

    // First segment always creates a checkpoint to ensure "The Story So Far" has content;
    // subsequent segments validate event significance via API.
    if (finalMetadata.majorEvent || isFirstSegment) {
      const eventDescription = finalMetadata.majorEvent ||
        (finalMetadata.location
          ? `Story begins at ${finalMetadata.location}`
          : 'Your adventure begins');

      if (isFirstSegment) {
        updatePayload.majorEvents = [{
          id: generateUniqueId('event'),
          description: eventDescription,
          timestamp: getTimestamp(),
          characterId: activeCharacterId,
        }];
      } else {
        try {
          const validationResponse = await aiFetch('/api/narrative/validate-event-significance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              majorEvent: finalMetadata.majorEvent,
              context: {
                location: finalMetadata.location,
                recentNarrative: newSegment.content?.substring(0, 200),
              },
            }),
          });

          if (!validationResponse.ok) {
            throw new Error(`Validation API error: ${validationResponse.status}`);
          }

          const validationResult = await validationResponse.json();

          if (validationResult.isSignificant && finalMetadata.majorEvent) {
            updatePayload.majorEvents = [{
              id: generateUniqueId('event'),
              description: finalMetadata.majorEvent,
              timestamp: getTimestamp(),
              characterId: activeCharacterId,
            }];
          }
        } catch (error) {
          // Fail open: if validation API errors, accept the event rather than dropping it.
          logger.warn('[NarrativeStore]', 'Event validation failed, accepting event', {
            error: error instanceof Error ? error.message : 'Unknown error',
            majorEvent: finalMetadata.majorEvent,
          });

          if (finalMetadata.majorEvent) {
            updatePayload.majorEvents = [{
              id: generateUniqueId('event'),
              description: finalMetadata.majorEvent,
              timestamp: getTimestamp(),
              characterId: activeCharacterId,
            }];
          }
        }
      }
    }

    worldStore.updateWorldState(effectiveWorldId, updatePayload, sessionId);
  } catch (error) {
    logger.error('[NarrativeStore]', 'Failed to apply world state thread updates', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId,
    });
  }
}
