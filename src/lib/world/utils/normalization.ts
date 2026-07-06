import { EntityID } from '@/types/common.types';
import {
  WorldState,
  PlayerCharacterThread,
  PlayerCharacterThreadUpdate,
  CharacterRelationshipState,
  CharacterRelationshipUpdate,
  NPCRelationshipState,
  NPCRelationshipUpdate,
  createEmptyWorldState,
} from '@/types/world-state.types';
import { getTimestamp } from '@/lib/utils/timestamp';
import { dedupeStrings, dedupeEntityIds, dedupeThreadReferences } from './deduplication';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const ensureState = (state: WorldState | undefined, worldId: EntityID): WorldState => {
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

export const normalizePlayerCharacterThread = (
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

export const normalizeCharacterRelationship = (
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

export const normalizeRelationship = (
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
