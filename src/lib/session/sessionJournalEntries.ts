import { useJournalStore } from '@/state/journalStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { formatSessionDuration, calculateNextSessionNumber } from '@/lib/utils/sessionUtils';
import type { SessionStartedEvent, SessionEndedEvent } from '@/lib/state/storePubSub';

/**
 * Session-boundary journal entries (Issue #176).
 *
 * Relocated out of sessionStore so it doesn't import sibling stores —
 * sessionStore emits SESSION_STARTED / SESSION_ENDED and these handlers
 * (subscribed in src/state/storeEventWiring.ts) do the cross-store reads.
 */

export const handleSessionStarted = ({ sessionId, worldId, characterId, startedAt }: SessionStartedEvent): void => {
  const journalStore = useJournalStore.getState();
  const world = useWorldStore.getState().worlds[worldId];
  const character = useCharacterStore.getState().characters[characterId];

  // Get all journal entries to calculate session number
  const allEntries = Object.values(journalStore.entries).flat();
  const sessionNumber = calculateNextSessionNumber(allEntries);

  journalStore.addEntry(sessionId, {
    type: 'session_start',
    worldId,
    characterId,
    title: 'Adventure Begins',
    content: `A new journey starts${world ? ` in ${world.name}` : ''}`,
    significance: 'minor' as const,
    isRead: false,
    relatedEntities: [],
    metadata: {
      tags: ['system', 'session'],
      automaticEntry: true,
      sessionStartTime: startedAt,
      sessionContext: {
        worldName: world?.name || 'Unknown World',
        characterName: character?.name || 'Unknown Character',
        sessionNumber
      }
    },
    updatedAt: startedAt
  });
};

export const handleSessionEnded = ({ sessionId, worldId, characterId, endedAt }: SessionEndedEvent): void => {
  const journalStore = useJournalStore.getState();
  const sessionEntries = journalStore.getSessionEntries(sessionId);

  // Calculate session duration by looking for the session start entry
  let sessionDuration = 0;
  const sessionStartEntry = sessionEntries.find(entry => entry.type === 'session_start');
  if (sessionStartEntry?.metadata.sessionStartTime) {
    const startTime = new Date(sessionStartEntry.metadata.sessionStartTime);
    const endTime = new Date(endedAt);
    sessionDuration = endTime.getTime() - startTime.getTime();
  }

  const world = useWorldStore.getState().worlds[worldId];
  const character = useCharacterStore.getState().characters[characterId];
  const narrativeSegments = useNarrativeStore.getState().getSessionSegments(sessionId);

  const durationText = sessionDuration > 0 ? formatSessionDuration(sessionDuration) : 'unknown duration';
  const segmentCount = narrativeSegments.length;

  journalStore.addEntry(sessionId, {
    type: 'session_end',
    worldId,
    characterId,
    title: 'Adventure Concluded',
    content: `Session completed after ${durationText}${segmentCount > 0 ? ` with ${segmentCount} story segment${segmentCount !== 1 ? 's' : ''}` : ''}`,
    significance: 'minor' as const,
    isRead: false,
    relatedEntities: [],
    metadata: {
      tags: ['system', 'session'],
      automaticEntry: true,
      sessionDuration,
      sessionContext: {
        worldName: world?.name || 'Unknown World',
        characterName: character?.name || 'Unknown Character',
        sessionNumber: sessionStartEntry?.metadata.sessionContext?.sessionNumber ?? calculateNextSessionNumber(Object.values(journalStore.entries).flat())
      }
    },
    updatedAt: endedAt
  });
};
