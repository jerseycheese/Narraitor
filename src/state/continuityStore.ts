import { create } from 'zustand';
import type { ContinuityValidationResult } from '@/types/continuity.types';

/**
 * Maximum number of validation results retained for the DevTools panel. This
 * is ephemeral, dev-only observability data so the history is intentionally
 * small and never persisted.
 */
const MAX_RESULTS = 25;

interface ContinuityState {
  /** Captured validation results, oldest first. Newest is `results.at(-1)`. */
  results: ContinuityValidationResult[];
  /** Record a new result, trimming history to the most recent MAX_RESULTS. */
  recordResult: (result: ContinuityValidationResult) => void;
  /** Clear all captured results. */
  clear: () => void;
}

/**
 * Holds continuity-guardrail validation results captured after each narrative
 * generation so the DevTools ConsistencyValidationSection can show live
 * detection/correction outcomes (#409/#412). Populated client-side by
 * `applyContinuityGuardrail` in `narrativeGenerator.continuity.ts`.
 */
export const useContinuityStore = create<ContinuityState>((set) => ({
  results: [],
  recordResult: (result) =>
    set((state) => ({
      results: [...state.results, result].slice(-MAX_RESULTS),
    })),
  clear: () => set({ results: [] }),
}));
