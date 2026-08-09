import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  storeEvents,
  StoreEventTypes,
  type SessionFreshStartEvent,
} from '../lib/state/storePubSub';
import type { NarrativeStore } from './narrativeStore.types';
import { getInitialState } from './narrativeStore.state';
import { createNarrativeSegmentActions } from './narrativeStore.segments';
import { createNarrativeDecisionActions } from './narrativeStore.decisions';
import { createNarrativeEndingActions } from './narrativeStore.endings';
import { narrativePersistOptions } from './narrativeStore.persistence';
import { shouldExposeStoreOnWindow } from '@/lib/utils/shouldExposeStoreOnWindow';

const initialState = getInitialState();

// Narrative Store implementation with persistence. The store is composed
// from per-concern action factories (loreStore precedent):
// - narrativeStore.segments.ts: segment CRUD + decision linking
// - narrativeStore.decisions.ts: decisions + selectDecisionOption impacts
// - narrativeStore.endings.ts: story endings + session-ended tracking
// - narrativeStore.persistence.ts: IndexedDB persist options
export const useNarrativeStore = create<NarrativeStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      ...createNarrativeSegmentActions(set, get),
      ...createNarrativeDecisionActions(set, get),
      ...createNarrativeEndingActions(set, get),

      // State management actions
      reset: () => set(() => initialState),
      setError: (error: string | null) => set(() => ({ error })),
      clearError: () => set(() => ({ error: null })),
      setGenerationError: (generationError) => set(() => ({ generationError })),
      clearGenerationError: () => set(() => ({ generationError: null })),
      setLoading: (loading: boolean) => set(() => ({ loading })),
      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    narrativePersistOptions
  )
);

// Expose store globally in development for manual testing.
// Typed in src/types/global.d.ts; matches the pattern used by sibling stores.
if (typeof window !== 'undefined' && shouldExposeStoreOnWindow()) {
  window.useNarrativeStore = useNarrativeStore;
}

// Reset per-session narrative data when a fresh session starts. Subscribed
// here (characterStore's WORLD_DELETED pattern) so sessionStore doesn't have
// to import this store back. Old sessions' data is preserved when changing
// characters — only the incoming session's data is cleared.
storeEvents.subscribe<SessionFreshStartEvent>(
  StoreEventTypes.SESSION_FRESH_START,
  ({ sessionId, isNewSession }) => {
    if (!isNewSession) return;

    const narrativeStore = useNarrativeStore.getState();
    const existingSegments = narrativeStore.getSessionSegments(sessionId);
    if (existingSegments.length > 0) {
      narrativeStore.clearSessionSegments(sessionId);
      narrativeStore.clearSessionDecisions(sessionId);
    }

    // Always clear any global ending state
    narrativeStore.clearEnding();
  }
);
