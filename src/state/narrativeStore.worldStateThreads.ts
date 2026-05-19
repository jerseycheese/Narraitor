// src/state/narrativeStore.worldStateThreads.ts
//
// Extracted from narrativeStore.ts. Applies per-segment updates to
// player-character threads, character relationships, and major events on the
// world store. Lives in its own module to keep narrativeStore.ts focused on
// the store's own slices.

import { EntityID } from '../types/common.types';
import { NarrativeSegment, NarrativeMetadata } from '../types/narrative.types';
import {
  WorldStateMajorEventInput,
  PlayerCharacterThreadUpdate,
  CharacterRelationshipUpdate,
} from '../types/world-state.types';
import { generateUniqueId, getTimestamp } from '../lib/utils';
import { logger } from '../lib/utils/logger';
import { useSessionStore } from './sessionStore';
import { useWorldStore } from './worldStore';

const SEGMENT_SNIPPET_MAX_LENGTH = 220;

// Cache the dynamic import so we don't re-resolve characterStore on every call
// (matches the original lazy pattern in narrativeStore.ts that avoided a
// static cycle between narrativeStore and characterStore).
let characterStoreModule: typeof import('./characterStore') | null = null;

export interface WorldStateUpdateParams {
  newSegment: NarrativeSegment;
  originalSegmentData: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'>;
  finalMetadata: NarrativeMetadata;
  sessionId: EntityID;
  isFirstSegment: boolean;
}

export async function applyWorldStateThreadUpdates({
  newSegment,
  originalSegmentData,
  finalMetadata,
  sessionId,
  isFirstSegment,
}: WorldStateUpdateParams): Promise<void> {
  try {
    if (!characterStoreModule) {
      characterStoreModule = await import('./characterStore');
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

    // Add major event if AI identified one OR if this is the first segment.
    // First segment always creates a checkpoint to ensure "The Story So Far"
    // has content from turn one.
    if (finalMetadata.majorEvent || isFirstSegment) {
      const eventDescription = finalMetadata.majorEvent ||
        (finalMetadata.location
          ? `Story begins at ${finalMetadata.location}`
          : 'Your adventure begins');

      if (isFirstSegment) {
        // First segment ALWAYS creates a checkpoint - skip validation
        updatePayload.majorEvents = [{
          id: generateUniqueId('event'),
          description: eventDescription,
          timestamp: getTimestamp(),
          characterId: activeCharacterId,
        }];
      } else {
        // Subsequent segments: validate event significance via API
        try {
          const validationResponse = await fetch('/api/narrative/validate-event-significance', {
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
          // Fail open: if validation API errors, still record the event.
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
    // Previously a silent empty catch. Keep failures non-fatal (this runs as
    // a background side effect of addSegment) but at least surface them.
    logger.warn('[NarrativeStore]', 'applyWorldStateThreadUpdates failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId,
    });
  }
}
