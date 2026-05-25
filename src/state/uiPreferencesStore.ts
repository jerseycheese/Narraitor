import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * User-selectable narrative text sizes. "medium" matches the per-theme default.
 */
export type NarrativeTextSize = 'small' | 'medium' | 'large';

export const DEFAULT_NARRATIVE_TEXT_SIZE: NarrativeTextSize = 'medium';

export interface UIPreferencesState {
  narrativeTextSize: NarrativeTextSize;
  setNarrativeTextSize: (size: NarrativeTextSize) => void;
}

/**
 * Persisted display preferences that aren't tied to a single session, world, or
 * character (e.g. narrative text size). Kept separate from navigation/session
 * state so reading-comfort settings survive across sessions.
 */
export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      narrativeTextSize: DEFAULT_NARRATIVE_TEXT_SIZE,
      setNarrativeTextSize: (size) => set({ narrativeTextSize: size }),
    }),
    {
      name: 'narraitor-ui-preferences-store',
      version: 1,
      partialize: (state) => ({
        narrativeTextSize: state.narrativeTextSize,
      }),
    }
  )
);
