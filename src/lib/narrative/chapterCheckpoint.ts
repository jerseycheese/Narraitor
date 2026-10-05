import { useProviderStore } from '@/state/providerStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useNPCStore } from '@/state/npcStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { aiFetch } from '@/lib/ai/aiFetch';
import { buildStoryCheckpointPayload } from '@/lib/narrative/storyCheckpointPayload';
import { fallbackChapterRecap } from '@/lib/narrative/chapters';
import type { NarrativeSegment } from '@/types/narrative.types';

const inFlight = new Map<string, Promise<void>>();

/** Shares a chapter's checkpoint request across mounted summary and break surfaces. */
export function createChapterCheckpoint(
  boundary: NarrativeSegment,
  characterId?: string
): Promise<void> {
  const { id, sessionId, worldId } = boundary;
  if (!sessionId || !worldId) return Promise.resolve();
  const pending = inFlight.get(id);
  if (pending) return pending;
  const request = createChapterCheckpointInner(boundary, characterId);
  inFlight.set(id, request);
  void request.then(
    () => inFlight.delete(id),
    () => inFlight.delete(id)
  );
  return request;
}

async function createChapterCheckpointInner(
  boundary: NarrativeSegment,
  characterId?: string
): Promise<void> {
  await Promise.all(
    [
      useNarrativeStore,
      useWorldStore,
      useCharacterStore,
      useInventoryStore,
      useNPCStore,
      useWorldThreadStore,
      useProviderStore,
    ].map(async (store) => {
      if ('persist' in store && !store.persist.hasHydrated()) await store.persist.rehydrate();
    })
  );
  const { id, sessionId, worldId } = boundary;
  if (!sessionId || !worldId) return;
  const state = useNarrativeStore.getState();
  const chapter = state.segments[id]?.metadata.chapter;
  if (!chapter || chapter.recap) return;

  const segments = state.getSessionSegments(sessionId);
  const endIndex = segments.findIndex((segment) => segment.id === id);
  const priorBoundary = segments
    .slice(0, endIndex)
    .findLastIndex((segment) => Boolean(segment.metadata.chapter));
  const chapterSegments = segments.slice(priorBoundary + 1, endIndex + 1);
  // Player decisions don't carry narrativeSegmentId, so scope them by time.
  const chapterStart = new Date(chapterSegments[0]?.timestamp ?? 0).getTime();
  const character = characterId
    ? useCharacterStore.getState().characters[characterId]
    : undefined;
  const seenNpcIds = new Set(
    chapterSegments.flatMap((segment) => segment.metadata.characterIds ?? [])
  );
  const lastNpcIds = new Set(boundary.metadata.characterIds ?? []);
  const cast = useNPCStore
    .getState()
    .getNPCsByWorld(worldId)
    .filter((npc) => seenNpcIds.has(npc.id))
    .map(
      (npc) =>
        `${npc.name}: ${lastNpcIds.has(npc.id) ? 'last seen at the stopping point' : 'last seen earlier in this chapter'}`
    );
  if (character)
    cast.unshift(
      `${character.name}: ${character.status.conditions.join(', ') || 'no recorded conditions'}`
    );

  const payload = buildStoryCheckpointPayload({
    mode: 'chapter',
    worldId,
    sessionId,
    characterId,
    characterName: character?.name,
    events: chapterSegments.slice(-10).map((segment) => ({
      id: segment.id,
      description: segment.content,
      sessionId,
      timestamp: new Date(segment.timestamp).toISOString(),
    })),
    decisions: state
      .getSessionDecisions(sessionId)
      .filter(
        (decision) =>
          decision.selectedAt &&
          new Date(decision.selectedAt).getTime() >= chapterStart
      )
      .slice(-5)
      .map((decision) => ({
        id: decision.id,
        text:
          decision.options.find(
            (option) => option.id === decision.selectedOptionId
          )?.text ?? decision.prompt,
      })),
    currentLocation: boundary.metadata.location,
    previousChapterRecap: segments[priorBoundary]?.metadata.chapter?.recap,
    previousSegments: [boundary.content],
    cast,
    holding: characterId
      ? useInventoryStore
          .getState()
          .getCharacterItems(characterId)
          .map((item) => `${item.name} (${item.quantity})`)
      : [],
    openThreads: useWorldThreadStore
      .getState()
      .getOpenThreadsBySession(sessionId)
      .map((thread) => thread.summary),
    toneSettings: useWorldStore.getState().worlds[worldId]?.toneSettings,
  });

  const requested = chapter.recapRequested;
  state.updateSegment(id, {
    metadata: {
      ...boundary.metadata,
      chapter: { ...chapter, recapRequested: true },
    },
  });
  let recap = fallbackChapterRecap(payload);
  if (!requested) {
    try {
      const response = await aiFetch('/api/narrative/story-checkpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        const lines =
          typeof result.chapterRecap === 'string'
            ? result.chapterRecap.split('\n')
            : [];
        const labels = [
          'Previously:',
          'Where it stopped:',
          'Cast:',
          'Holding:',
          'Open threads:',
        ];
        if (
          result.chapterRecap?.length <= 850 &&
          lines.length === 5 &&
          lines.every((line: string, index: number) =>
            line.startsWith(labels[index])
          )
        ) {
          recap = result.chapterRecap;
        }
      }
    } catch {
      // Persist a canon-only fallback; one failed request must not become a retry loop.
    }
  }
  useNarrativeStore.getState().completeChapterRecap(id, recap);
}
