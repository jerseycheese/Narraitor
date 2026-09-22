import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';

export interface SessionMetrics {
  startTime: Date;
  segmentCount: number;
  decisionCount: number;
  elapsedTimeMs: number;
  elapsedMinutes: number;
}

export interface UseSessionPacingOptions {
  segmentCount?: number;
  decisionCount?: number;
  milestoneInterval?: number;
  breakIntervalMs?: number;
  startTime?: Date;
  enabled?: boolean;
}

export interface UseSessionPacingReturn {
  showBreakPrompt: boolean;
  dismissBreakPrompt: () => void;
  continueReading: () => void;
  metrics: SessionMetrics;
}

const DEFAULT_MILESTONE_INTERVAL = 5;
const DEFAULT_BREAK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Hook to manage session pacing, milestone toasts, and soft break prompts.
 * Deduplicates milestone toasts so each fires only once per threshold.
 */
export function useSessionPacing(options: UseSessionPacingOptions = {}): UseSessionPacingReturn {
  const {
    segmentCount = 0,
    decisionCount = 0,
    milestoneInterval = DEFAULT_MILESTONE_INTERVAL,
    breakIntervalMs = DEFAULT_BREAK_INTERVAL_MS,
    startTime,
    enabled = true,
  } = options;

  const toast = useToast();
  const count = segmentCount;
  const startTimeRef = useRef<Date>(startTime ?? new Date());
  const firedMilestonesRef = useRef<Set<number>>(new Set());
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);

  // Track and fire milestone toasts every milestoneInterval segments
  useEffect(() => {
    if (!enabled || milestoneInterval <= 0) return;

    for (let threshold = milestoneInterval; threshold <= count; threshold += milestoneInterval) {
      if (!firedMilestonesRef.current.has(threshold)) {
        firedMilestonesRef.current.add(threshold);
        toast.info(`${threshold} story beats in`);
      }
    }
  }, [count, milestoneInterval, enabled, toast]);

  // Schedule break prompts at regular intervals once reading begins. Keyed on
  // hasStartedReading, not count: a new segment must not restart the wait, or
  // a player who keeps reading would never see the prompt.
  const hasStartedReading = count > 0;
  useEffect(() => {
    if (!enabled || !hasStartedReading || showBreakPrompt || breakIntervalMs <= 0) return;

    const timer = setTimeout(() => {
      setShowBreakPrompt(true);
    }, breakIntervalMs);

    return () => clearTimeout(timer);
  }, [enabled, hasStartedReading, showBreakPrompt, breakIntervalMs]);

  const handleCloseBreakPrompt = useCallback(() => {
    setShowBreakPrompt(false);
  }, []);

  const metrics = useMemo<SessionMetrics>(() => {
    // Recompute elapsed time when the break prompt fires so elapsedMinutes
    // reflects the prompt trigger time rather than the last segment's timestamp.
    void showBreakPrompt;
    const elapsedMs = Math.max(0, Date.now() - startTimeRef.current.getTime());
    return {
      startTime: startTimeRef.current,
      segmentCount: count,
      decisionCount,
      elapsedTimeMs: elapsedMs,
      elapsedMinutes: Math.floor(elapsedMs / 60000),
    };
  }, [count, decisionCount, showBreakPrompt]);

  return {
    showBreakPrompt,
    dismissBreakPrompt: handleCloseBreakPrompt,
    continueReading: handleCloseBreakPrompt,
    metrics,
  };
}
