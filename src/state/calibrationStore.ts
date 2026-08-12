import { create } from 'zustand';
import type { PromptCalibrationSnapshot } from '@/lib/promptContext/promptCalibration';

/**
 * Maximum number of request snapshots retained for the DevTools panel. This is
 * ephemeral, dev-only observability data so the history is intentionally small
 * and never persisted.
 */
const MAX_SNAPSHOTS = 25;

interface CalibrationState {
  /** Captured request snapshots, oldest first. Newest is `snapshots.at(-1)`. */
  snapshots: PromptCalibrationSnapshot[];
  /** Record a new snapshot, trimming history to the most recent MAX_SNAPSHOTS. */
  recordSnapshot: (snapshot: PromptCalibrationSnapshot) => void;
  /** Clear all captured snapshots. */
  clear: () => void;
}

/**
 * Holds prompt-size snapshots captured after each narrative generation so the
 * DevTools TokenBudgetPanel can read live prompt sizes and calibration data. Populated
 * client-side by `recordRequestCalibration` in `narrativeGenerator.calibration.ts`.
 */
export const useCalibrationStore = create<CalibrationState>((set) => ({
  snapshots: [],
  recordSnapshot: (snapshot) =>
    set((state) => ({
      snapshots: [...state.snapshots, snapshot].slice(-MAX_SNAPSHOTS),
    })),
  clear: () => set({ snapshots: [] }),
}));
