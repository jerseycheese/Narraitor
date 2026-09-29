'use client';

import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Decision } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ActiveGameSessionEffects');

interface UseActiveGameSessionEffectsOptions {
  sessionId: string;
  worldId: string;
  controllerKey?: string;
  initialized: boolean;
  isGenerating: boolean;
  segmentCount: number;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  setInitialized: Dispatch<SetStateAction<boolean>>;
  setIsGeneratingChoices: Dispatch<SetStateAction<boolean>>;
  setCurrentDecision?: Dispatch<SetStateAction<Decision | null>>;
  choiceGenerationTimeoutRef?: MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Drives session initialization and narrativeStore synchronization.
 * Scene fallbacks are owned exclusively by NarrativeController, and choice
 * fallbacks are owned exclusively by usePlayerChoices / narrativeStore.
 */
export const useActiveGameSessionEffects = ({
  sessionId,
  controllerKey,
  setIsGenerating,
  setInitialized,
  setCurrentDecision,
  setIsGeneratingChoices,
  choiceGenerationTimeoutRef,
}: UseActiveGameSessionEffectsOptions) => {
  // Initialize the narrative session state once per session
  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    const setupNarrative = async () => {
      try {
        const { useNarrativeStore } = await import('@/state/narrativeStore');
        if (!isMounted) return;

        const existingSegments = useNarrativeStore.getState().getSessionSegments(sessionId);
        const hasInitialScene = existingSegments.some((seg) =>
          seg.metadata?.tags?.includes('intro')
        );

        const existingDecisions = useNarrativeStore.getState().getSessionDecisions(sessionId);
        if (existingDecisions.length > 0 && setCurrentDecision) {
          const latestDecision = existingDecisions[existingDecisions.length - 1];
          setCurrentDecision(latestDecision);
        }

        if (hasInitialScene || existingSegments.length > 0) {
          setInitialized(true);
          setIsGenerating(false);
        } else {
          setInitialized(true);
          setIsGenerating(true);
        }
      } catch (error) {
        logger.error('Failed to set up narrative', error);
        setInitialized(true);
        setIsGenerating(false);
      }
    };

    setupNarrative();

    return () => {
      isMounted = false;
      if (choiceGenerationTimeoutRef?.current) {
        clearTimeout(choiceGenerationTimeoutRef.current);
        choiceGenerationTimeoutRef.current = null;
      }
    };
  }, [sessionId, controllerKey, setIsGenerating, setInitialized, setCurrentDecision, choiceGenerationTimeoutRef]);

  // Keep isGeneratingChoices and decisions synchronized with narrativeStore
  useEffect(() => {
    let initialized = false;
    let prevDecisionIds: unknown;
    let prevLatestDecision: unknown;

    const unsubscribe = useNarrativeStore.subscribe((state) => {
      const decisionIds = state.sessionDecisions[sessionId];
      const ids = decisionIds || [];
      const latestId = ids[ids.length - 1];
      const latestDecision = latestId ? (state.decisions[latestId] || null) : null;

      if (
        initialized &&
        decisionIds === prevDecisionIds &&
        latestDecision === prevLatestDecision
      ) {
        return;
      }
      initialized = true;
      prevDecisionIds = decisionIds;
      prevLatestDecision = latestDecision;

      if (latestId) {
        if (setCurrentDecision) {
          setCurrentDecision(latestDecision);
        }
        setIsGeneratingChoices(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, setCurrentDecision, setIsGeneratingChoices]);

  // Collapsed: choice fallback is owned by usePlayerChoices
  const scheduleChoiceFallback = () => {};

  return {
    scheduleChoiceFallback,
  };
};
