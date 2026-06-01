import { create } from 'zustand';
import type { TokenBudgetSnapshot } from '@/lib/promptContext/tokenBudgetManager';

/**
 * Maximum number of request snapshots retained for the DevTools panel. This is
 * ephemeral, dev-only observability data so the history is intentionally small
 * and never persisted.
 */
const MAX_SNAPSHOTS = 25;

interface CalibrationState {
  /** Captured request snapshots, oldest first. Newest is `snapshots.at(-1)`. */
  snapshots: TokenBudgetSnapshot[];
  /** Record a new snapshot, trimming history to the most recent MAX_SNAPSHOTS. */
  recordSnapshot: (snapshot: TokenBudgetSnapshot) => void;
  /** Clear all captured snapshots. */
  clear: () => void;
}

/**
 * Holds token-budget snapshots captured after each narrative generation so the
 * DevTools TokenBudgetPanel can read live usage and calibration data. Populated
 * client-side by `publishBudgetSnapshot` in `narrativeGenerator.budget.ts`.
 */
export const useCalibrationStore = create<CalibrationState>((set) => ({
  snapshots: [],
  recordSnapshot: (snapshot) =>
    set((state) => ({
      snapshots: [...state.snapshots, snapshot].slice(-MAX_SNAPSHOTS),
    })),
  clear: () => set({ snapshots: [] }),
}));
