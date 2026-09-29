'use client';

import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useNarrativeStore } from '@/state/narrativeStore';
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

  // Track choice loading from the store: a decision ends it, and a session with
  // narrative but no decision is waiting on choices. Gated on this session's
  // decision and segment lists, since segments stream in token by token.
  useEffect(() => {
    let initialized = false;
    let prevDecisionIds: unknown;
    let prevSegmentIds: unknown;

    const unsubscribe = useNarrativeStore.subscribe((state) => {
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

      if ((decisionIds?.length ?? 0) > 0) {
        setIsGeneratingChoices(false);
      } else if ((segmentIds?.length ?? 0) > 0) {
        setIsGeneratingChoices(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, setIsGeneratingChoices]);
};
