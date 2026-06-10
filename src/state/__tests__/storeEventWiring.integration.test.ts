/**
 * Full session-lifecycle through the REAL event wiring (#1406 follow-up).
 *
 * Imports the wiring once, then drives sessionStore.initializeSession /
 * endSession and asserts the composed result: exactly one journal entry per
 * boundary (no double-registration), the forced-fresh path clears inventory,
 * a new session clears its own stale narrative while preserving others, and a
 * throwing subscriber doesn't abort initializeSession.
 */
import '@/state/storeEventWiring';
import { useSessionStore } from '@/state/sessionStore';
import { useJournalStore } from '@/state/journalStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useInventoryStore } from '@/state/inventoryStore';
import {
  storeEvents,
  StoreEventTypes,
  type SessionStartedEvent,
} from '@/lib/state/storePubSub';
import type { NarrativeSegment } from '@/types/narrative.types';
import type { InventoryItem } from '@/types/inventory.types';

const ensureInventoryHydrated = async (): Promise<void> => {
  const persistApi = (useInventoryStore as unknown as {
    persist?: {
      hasHydrated?: () => boolean;
      onFinishHydration?: (cb: () => void) => () => void;
      rehydrate?: () => Promise<void> | void;
    };
  }).persist;
  if (persistApi?.hasHydrated?.()) return;
  await new Promise<void>((resolve) => {
    persistApi?.onFinishHydration?.(() => resolve());
    void persistApi?.rehydrate?.();
  });
};

const seedInventoryItem = (characterId: string, itemId: string): void => {
  const item = { id: itemId, name: 'Seeded Blade', quantity: 1, stackable: false } as unknown as InventoryItem;
  useInventoryStore.setState((state) => ({
    items: { ...state.items, [itemId]: item },
    entities: { ...state.entities, [itemId]: item },
    characterInventories: {
      ...state.characterInventories,
      [characterId]: [...(state.characterInventories[characterId] ?? []), itemId],
    },
  }));
};

const seedNarrativeForSession = (sessionId: string): void => {
  const segment = {
    id: `seg-${sessionId}`,
    sessionId,
    worldId: 'world-1',
    content: 'Stale prologue',
    type: 'scene',
    metadata: { tags: [] },
    timestamp: new Date(),
    createdAt: new Date().toISOString(),
  } as unknown as NarrativeSegment;
  useNarrativeStore.setState((state) => ({
    segments: { ...state.segments, [segment.id]: segment },
    sessionSegments: { ...state.sessionSegments, [sessionId]: [segment.id] },
  }));
};

const countEntries = (sessionId: string, type: string): number =>
  useJournalStore
    .getState()
    .getSessionEntries(sessionId)
    .filter((entry) => entry.type === type).length;

const resetStores = () => {
  useJournalStore.setState({ entries: {}, sessionEntries: {} });
  useNarrativeStore.setState({ segments: {}, sessionSegments: {}, decisions: {}, sessionDecisions: {}, currentEnding: null });
  useInventoryStore.setState({ items: {}, entities: {}, characterInventories: {} });
  useSessionStore.setState({
    id: null,
    status: 'initializing',
    worldId: null,
    characterId: null,
    savedSessions: {},
    sessionLifecycle: {},
    error: null,
  });
};

describe('session lifecycle through real store wiring', () => {
  beforeEach(async () => {
    await ensureInventoryHydrated();
    resetStores();
  });

  it('produces exactly one start and one end journal entry across the lifecycle', async () => {
    await useSessionStore.getState().initializeSession('world-1', 'char-hero');
    const sessionId = useSessionStore.getState().id as string;

    expect(useSessionStore.getState().status).toBe('active');
    expect(countEntries(sessionId, 'session_start')).toBe(1);

    await useSessionStore.getState().endSession();

    expect(countEntries(sessionId, 'session_end')).toBe(1);
    // The start entry isn't duplicated by the end flow.
    expect(countEntries(sessionId, 'session_start')).toBe(1);
  });

  it('clears the character inventory on a forced-fresh init', async () => {
    seedInventoryItem('char-hero', 'item-1');
    expect(useInventoryStore.getState().getCharacterItems('char-hero')).toHaveLength(1);

    await useSessionStore.getState().initializeSession('world-1', 'char-hero', undefined, true);

    expect(useInventoryStore.getState().getCharacterItems('char-hero')).toHaveLength(0);
  });

  it('clears the new session’s stale narrative but preserves unrelated sessions', async () => {
    seedNarrativeForSession('other-session');

    await useSessionStore.getState().initializeSession('world-1', 'char-hero');
    const sessionId = useSessionStore.getState().id as string;
    // Stale data happened to share the freshly-generated id (defensive clear).
    seedNarrativeForSession(sessionId);
    await storeEvents.emit(StoreEventTypes.SESSION_FRESH_START, {
      sessionId,
      worldId: 'world-1',
      characterId: 'char-hero',
      isNewSession: true,
      isForcedFresh: false,
    });

    expect(useNarrativeStore.getState().getSessionSegments(sessionId)).toHaveLength(0);
    expect(useNarrativeStore.getState().getSessionSegments('other-session')).toHaveLength(1);
  });

  it('completes initializeSession even if a SESSION_STARTED subscriber throws', async () => {
    const rogue = storeEvents.subscribe<SessionStartedEvent>(StoreEventTypes.SESSION_STARTED, () => {
      throw new Error('rogue subscriber');
    });

    try {
      await expect(useSessionStore.getState().initializeSession('world-1', 'char-hero')).resolves.toBeUndefined();
    } finally {
      rogue.unsubscribe();
    }

    const sessionId = useSessionStore.getState().id as string;
    expect(useSessionStore.getState().status).toBe('active');
    // The real journal handler still ran despite the rogue sibling throwing.
    expect(countEntries(sessionId, 'session_start')).toBe(1);
  });
});
