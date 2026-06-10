import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NarrativeStore } from './narrativeStore.types';
import { getInitialState } from './narrativeStore.state';
import { createNarrativeSegmentActions } from './narrativeStore.segments';
import { createNarrativeDecisionActions } from './narrativeStore.decisions';
import { createNarrativeEndingActions } from './narrativeStore.endings';
import { narrativePersistOptions } from './narrativeStore.persistence';

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
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.useNarrativeStore = useNarrativeStore;
}
