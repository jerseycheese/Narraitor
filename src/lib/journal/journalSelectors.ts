import type { EntityID } from '@/types/common.types';
import type { JournalEntry } from '@/types/journal.types';

type JournalStoreState = {
  entries: Record<EntityID, JournalEntry>;
  sessionEntries: Record<EntityID, EntityID[]>;
};

export const selectSessionEntries = (
  state: JournalStoreState,
  sessionId: EntityID | null | undefined,
  characterId?: EntityID | null
): JournalEntry[] => {
  if (!sessionId) {
    return [];
  }

  const entryIds = state.sessionEntries[sessionId] || [];
  const filtered = entryIds
    .map((id) => state.entries[id])
    .filter((entry): entry is JournalEntry => {
      if (!entry) return false;
      if (!characterId) return true;
      return entry.characterId === characterId;
    });

  const sorted = filtered.sort((a, b) => {
    const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return a.id.localeCompare(b.id);
  });

  const latestSessionStart = sorted.find((entry) => entry.type === 'session_start');
  if (!latestSessionStart) {
    return sorted;
  }

  const startTimestamp = new Date(latestSessionStart.createdAt).getTime();
  if (Number.isNaN(startTimestamp)) {
    return sorted;
  }

  return sorted.filter(
    (entry) => new Date(entry.createdAt).getTime() >= startTimestamp
  );
};
