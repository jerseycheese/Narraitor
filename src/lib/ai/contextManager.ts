import { EndingGenerationRequest, NarrativeSegment } from '@/types/narrative.types';
import { World } from '@/types/world.types';
import { JournalEntry } from '@/types/journal.types';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useJournalStore } from '@/state/journalStore';
import { useSessionStore } from '@/state/sessionStore';

type StoreCharacter = ReturnType<typeof useCharacterStore.getState>['characters'][string];

export interface EndingContext {
  world: World;
  character: StoreCharacter;
  narrativeSegments: NarrativeSegment[];
  journalEntries: JournalEntry[];
  sessionStartTime?: Date;
}

/**
 * Builds the full context needed for ending generation by stitching together
 * the relevant world, character, and session data.
 */
export async function buildEndingContext(
  request: EndingGenerationRequest
): Promise<EndingContext> {
  const world =
    request.world || useWorldStore.getState().worlds[request.worldId];
  if (!world) {
    throw new Error(`World not found: ${request.worldId}`);
  }

  const character =
    request.character || useCharacterStore.getState().characters[request.characterId];
  if (!character) {
    throw new Error(`Character not found: ${request.characterId}`);
  }

  const narrativeSegments = Object.values(useNarrativeStore.getState().segments)
    .filter(segment => segment.sessionId === request.sessionId)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  const journalState = useJournalStore.getState();
  const journalEntries = journalState.entries
    ? Object.values(journalState.entries).filter(
        entry => entry.sessionId === request.sessionId
      )
    : [];

  const session = useSessionStore.getState().savedSessions[request.sessionId];
  const sessionStartTime = session?.lastPlayed
    ? new Date(session.lastPlayed)
    : undefined;

  return {
    world,
    character,
    narrativeSegments,
    journalEntries,
    sessionStartTime,
  };
}
