import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeText, NORM_DESC, getTimestamp } from '@/lib/utils';
import { UserFriendlyError, createStoreError } from '@/lib/utils/errorUtils';
import {
  WorldThread,
  WorldThreadKind,
  WorldThreadExtractionResult,
  WorldClockSegmentNote,
} from '../types/worldThread.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { MIN_DUE_HORIZON_TURNS, selectDueNowThread } from '@/lib/narrative/worldClock';
import { createIndexedDBStorage } from './persistence';
import {
  storeEvents,
  StoreEventTypes,
  type WorldDeletedEvent,
  type SessionFreshStartEvent,
} from '@/lib/state/storePubSub';
import { shouldExposeStoreOnWindow } from '@/lib/utils/shouldExposeStoreOnWindow';
import { CrudStore } from './crudStore.types';

/** Summaries (not ids) of what one reconciliation did — the part of the segment note the store can fill. */
export type AppliedExtraction = Pick<WorldClockSegmentNote, 'opened' | 'advanced' | 'resolved'>;

export interface WorldThreadStore extends CrudStore<WorldThread> {
  threads: Record<EntityID, WorldThread>;
  /**
   * The presence of a session's key means its ledger has been seeded, even
   * when the list is empty. Never delete the key just because it emptied —
   * that would make the next turn re-seed a ledger the model already judged.
   */
  sessionThreads: Record<EntityID, EntityID[]>;
  error: UserFriendlyError | null;
  loading: boolean;

  getOpenThreadsBySession: (sessionId: EntityID) => WorldThread[];
  hasSessionLedger: (sessionId: EntityID) => boolean;
  applyExtraction: (
    sessionId: EntityID,
    worldId: EntityID,
    result: WorldThreadExtractionResult,
    currentTurn: number
  ) => AppliedExtraction;
  clearSessionThreads: (sessionId: EntityID) => void;
  clearWorldThreads: (worldId: EntityID) => void;
}

const THREAD_KINDS: readonly WorldThreadKind[] = ['consequence', 'actor', 'deadline'];

const getInitialState = () => ({
  threads: {} as Record<EntityID, WorldThread>,
  entities: {} as Record<EntityID, WorldThread>,
  sessionThreads: {} as Record<EntityID, EntityID[]>,
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
});

const validateThreadData = (data: Partial<WorldThread>): void => {
  if (!normalizeText(data.summary || '', NORM_DESC)) {
    throw new Error('Thread summary is required');
  }
  if (!data.sessionId) {
    throw new Error('Session ID is required');
  }
  if (!data.worldId) {
    throw new Error('World ID is required');
  }
  if (!data.kind || !THREAD_KINDS.includes(data.kind)) {
    throw new Error('Thread kind must be consequence, actor, or deadline');
  }
};

export const useWorldThreadStore = create<WorldThreadStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      create: (threadData) => {
        validateThreadData(threadData);

        const threadId = generateUniqueId('thread');
        const now = getTimestamp();

        const newThread: WorldThread = {
          ...threadData,
          id: threadId,
          summary: normalizeText(threadData.summary, NORM_DESC),
          notes: threadData.notes ?? [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          const sessionThreads = state.sessionThreads[newThread.sessionId] || [];
          return {
            threads: { ...state.threads, [threadId]: newThread },
            entities: { ...state.entities, [threadId]: newThread },
            sessionThreads: {
              ...state.sessionThreads,
              [newThread.sessionId]: [...sessionThreads, threadId],
            },
            error: null,
          };
        });

        return threadId;
      },

      update: (threadId, updates) => {
        const existingThread = get().threads[threadId];
        if (!existingThread) {
          set({ error: createStoreError('Thread Not Found', 'The specified thread could not be found.') });
          return;
        }

        const normalizedUpdates: Partial<WorldThread> = { ...updates };
        if (updates.summary) {
          normalizedUpdates.summary = normalizeText(updates.summary, NORM_DESC);
        }

        const previousSessionId = existingThread.sessionId;
        const nextSessionId = updates.sessionId ?? previousSessionId;

        const updatedThread: WorldThread = {
          ...existingThread,
          ...normalizedUpdates,
          sessionId: nextSessionId,
          updatedAt: getTimestamp(),
        };

        set((state) => {
          const nextSessionThreads = { ...state.sessionThreads };

          if (previousSessionId !== nextSessionId) {
            const previousList = nextSessionThreads[previousSessionId] || [];
            nextSessionThreads[previousSessionId] = previousList.filter((id) => id !== threadId);

            const nextList = nextSessionThreads[nextSessionId] || [];
            nextSessionThreads[nextSessionId] = [...nextList, threadId];
          }

          return {
            threads: { ...state.threads, [threadId]: updatedThread },
            entities: { ...state.entities, [threadId]: updatedThread },
            sessionThreads: nextSessionThreads,
            error: null,
          };
        });
      },

      delete: (threadId) => {
        const existingThread = get().threads[threadId];
        if (!existingThread) {
          return;
        }

        set((state) => {
          const { [threadId]: _removedThread, ...remainingThreads } = state.threads;
          const { [threadId]: _removedEntity, ...remainingEntities } = state.entities;

          const sessionThreads = state.sessionThreads[existingThread.sessionId] || [];

          // The session key stays even when its list empties: an empty ledger
          // is still a seeded ledger.
          return {
            threads: remainingThreads,
            entities: remainingEntities,
            sessionThreads: {
              ...state.sessionThreads,
              [existingThread.sessionId]: sessionThreads.filter((id) => id !== threadId),
            },
            currentEntityId: state.currentEntityId === threadId ? null : state.currentEntityId,
            error: null,
          };
        });
      },

      setCurrent: (id) => {
        if (id && !get().threads[id]) {
          set({
            error: createStoreError('Thread Not Found', 'The specified thread could not be found.'),
            currentEntityId: null,
          });
          return;
        }

        set({ currentEntityId: id ?? null, error: null });
      },

      getById: (id) => get().threads[id],
      getAll: () => Object.values(get().threads),

      reset: () => set(getInitialState()),

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ loading }),

      getOpenThreadsBySession: (sessionId) => {
        const state = get();
        const threadIds = state.sessionThreads[sessionId] || [];
        return threadIds
          .map((id) => state.threads[id])
          .filter((thread): thread is WorldThread => Boolean(thread && thread.status === 'open'));
      },

      hasSessionLedger: (sessionId) => sessionId in get().sessionThreads,

      applyExtraction: (sessionId, worldId, result, currentTurn) => {
        const applied: AppliedExtraction = { opened: [], advanced: [], resolved: [] };

        // Seed the session key first so an all-empty result still marks the
        // ledger as seeded and the next turn doesn't re-run the seed prompt.
        set((state) => ({
          sessionThreads: {
            ...state.sessionThreads,
            [sessionId]: state.sessionThreads[sessionId] || [],
          },
        }));

        // Only this session's open threads may move; the model can echo a
        // stale or foreign id and it must not touch another session's ledger.
        const openThreadOf = (id: EntityID): WorldThread | undefined => {
          const thread = get().threads[id];
          return thread && thread.sessionId === sessionId && thread.status === 'open'
            ? thread
            : undefined;
        };

        // A due nearer than the horizon is this scene, not a deadline; floor
        // it rather than lose the thread or its due.
        const floorDue = (dueByTurn: number | undefined): number | undefined =>
          dueByTurn !== undefined ? Math.max(dueByTurn, currentTurn + MIN_DUE_HORIZON_TURNS) : undefined;

        // The pick the scene block rendered for this segment, read before any
        // of this turn's changes land: an advance on it is the landing the
        // block asked for, so the thread fires and is never asked to arrive
        // again.
        const dueNowId = selectDueNowThread(get().getOpenThreadsBySession(sessionId), currentTurn)?.id;

        for (const entry of result.opened) {
          // An arrival that is an open thread landing refines that thread
          // instead of opening it again under a new name: the specific event
          // replaces the vague one, and a fresh due clears its DUE NOW pick.
          const covered = entry.covers ? openThreadOf(entry.covers) : undefined;
          if (covered) {
            get().update(covered.id, {
              kind: entry.kind,
              summary: entry.summary,
              lastAdvancedAtTurn: currentTurn,
              firedAtTurn: covered.firedAtTurn ?? currentTurn,
              notes: [...covered.notes, `${entry.summary} (was: ${covered.summary})`],
              ...(entry.dueByTurn !== undefined ? { dueByTurn: floorDue(entry.dueByTurn) } : {}),
            });
            applied.advanced.push(covered.summary);
            continue;
          }
          try {
            get().create({
              sessionId,
              worldId,
              kind: entry.kind,
              summary: entry.summary,
              dueByTurn: floorDue(entry.dueByTurn),
              openedAtTurn: currentTurn,
              lastAdvancedAtTurn: currentTurn,
              status: 'open',
              notes: [],
            });
            applied.opened.push(entry.summary);
          } catch {
            // An invalid entry from the model is dropped, not fatal.
          }
        }

        for (const entry of result.advanced) {
          const thread = openThreadOf(entry.id);
          if (!thread) continue;
          get().update(thread.id, {
            lastAdvancedAtTurn: currentTurn,
            notes: [...thread.notes, entry.changed],
            ...(thread.id === dueNowId && thread.firedAtTurn === undefined ? { firedAtTurn: currentTurn } : {}),
          });
          applied.advanced.push(thread.summary);
        }

        for (const entry of result.resolved) {
          const thread = openThreadOf(entry.id);
          if (!thread) continue;
          get().update(thread.id, {
            status: entry.outcome,
            resolution: entry.resolution,
            lastAdvancedAtTurn: currentTurn,
          });
          applied.resolved.push(thread.summary);
        }

        return applied;
      },

      clearSessionThreads: (sessionId) => {
        const threadIds = get().sessionThreads[sessionId] || [];
        threadIds.forEach((threadId) => get().delete(threadId));

        // Dropping the key (unlike delete) is what lets a fresh session re-seed.
        set((state) => {
          const { [sessionId]: _removedSession, ...remainingSessionThreads } = state.sessionThreads;
          return { sessionThreads: remainingSessionThreads };
        });
      },

      clearWorldThreads: (worldId) => {
        Object.values(get().threads)
          .filter((thread) => thread.worldId === worldId)
          .forEach((thread) => get().delete(thread.id));
      },
    }),
    {
      name: 'narraitor-world-thread-store',
      storage: createIndexedDBStorage(),
      version: 1,
      partialize: (state) => ({
        threads: state.threads,
        sessionThreads: state.sessionThreads,
      }),
      migrate: (persistedState) => persistedState || getInitialState(),
    }
  )
);

// Expose store globally in development for manual testing.
// Typed in src/types/global.d.ts; matches the pattern used by sibling stores.
if (typeof window !== 'undefined' && shouldExposeStoreOnWindow()) {
  window.useWorldThreadStore = useWorldThreadStore;
}

// Cascade cleanup: deleting a world orphans its threads otherwise (mirrors
// goalStore's WORLD_DELETED subscription). Plain subscribe — the handler
// only clears data, so a double-fire is a no-op.
storeEvents.subscribe<WorldDeletedEvent>(
  StoreEventTypes.WORLD_DELETED,
  ({ worldId }) => {
    useWorldThreadStore.getState().clearWorldThreads(worldId);
  }
);

// A fresh session starts with an unseeded ledger. Subscribed here (the
// narrativeStore pattern) so sessionStore doesn't have to import this store.
storeEvents.subscribe<SessionFreshStartEvent>(
  StoreEventTypes.SESSION_FRESH_START,
  ({ sessionId, isNewSession }) => {
    if (!isNewSession) return;
    useWorldThreadStore.getState().clearSessionThreads(sessionId);
  }
);
