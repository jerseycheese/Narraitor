'use client';

import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useNarrativeStore } from '@/state/narrativeStore';
import type { NarrativeStore } from '@/state/narrativeStore.types';
import { isAwaitingChoices } from '@/lib/narrative/isAwaitingChoices';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ActiveGameSessionEffects');

interface UseActiveGameSessionEffectsOptions {
  sessionId: string;
  controllerKey: string;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  setInitialized: Dispatch<SetStateAction<boolean>>;
  setIsGeneratingChoices: Dispatch<SetStateAction<boolean>>;
}

/**
 * Drives session initialization and keeps the choice-loading flag in step with
 * narrativeStore. The decision itself is read from the store, and fallbacks
 * have one owner each: NarrativeController for the opening scene, and
 * usePlayerChoices for choices.
 */
export const useActiveGameSessionEffects = ({
  sessionId,
  controllerKey,
  setIsGenerating,
  setInitialized,
  setIsGeneratingChoices,
}: UseActiveGameSessionEffectsOptions) => {
  // Initialize the session once instead of clearing and recreating each time
  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    const setupNarrative = async () => {
      try {
        // Imported dynamically to avoid circular dependencies
        const { useNarrativeStore } = await import('@/state/narrativeStore');
        if (!isMounted) return;

        // Any existing segments mean a resumed session; keep its history.
        const hasSegments =
          useNarrativeStore.getState().getSessionSegments(sessionId).length > 0;

        setInitialized(true);
        setIsGenerating(!hasSegments);
      } catch (error) {
        // Stop the generating state so the UI recovers instead of spinning forever.
        logger.error('Failed to set up narrative', error);
        setInitialized(true);
        setIsGenerating(false);
      }
    };

    setupNarrative();

    return () => {
      isMounted = false;
    };
  }, [sessionId, controllerKey, setIsGenerating, setInitialized]);

  // Track choice loading from the store: a passage with no choices of its own
  // is waiting on them, and a new decision ends the wait. Gated on this session's
  // decision and segment lists, since segments stream in token by token.
  useEffect(() => {
    let initialized = false;
    let prevDecisionIds: unknown;
    let prevSegmentIds: unknown;

    const syncChoiceLoading = (state: NarrativeStore) => {
      const decisionIds = state.sessionDecisions[sessionId];
      const segmentIds = state.sessionSegments[sessionId];

      if (
        initialized &&
        decisionIds === prevDecisionIds &&
        segmentIds === prevSegmentIds
      ) {
        return;
      }
      initialized = true;
      prevDecisionIds = decisionIds;
      prevSegmentIds = segmentIds;

      const latestSegmentId = segmentIds?.[segmentIds.length - 1];
      const latestDecisionId = decisionIds?.[decisionIds.length - 1];

      if (
        latestSegmentId &&
        isAwaitingChoices(state.segments[latestSegmentId], latestDecisionId)
      ) {
        setIsGeneratingChoices(true);
      } else if (latestDecisionId) {
        setIsGeneratingChoices(false);
      }
    };

    // A resumed session can mount with nothing left to change in the store.
    syncChoiceLoading(useNarrativeStore.getState());
    const unsubscribe = useNarrativeStore.subscribe(syncChoiceLoading);

    return () => {
      unsubscribe();
    };
  }, [sessionId, setIsGeneratingChoices]);
};
