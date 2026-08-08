'use client';

import { useCallback, useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Decision, NarrativeSegment } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import Logger from '@/lib/utils/logger';
import {
  INITIAL_GENERATION_MAX_WAIT_MS,
  CHOICE_FALLBACK_DELAY_MS,
  BOOTSTRAP_FALLBACK_DELAY_MS,
} from '@/lib/constants/timeouts';

const logger = new Logger('ActiveGameSessionEffects');

interface UseActiveGameSessionEffectsOptions {
  sessionId: string;
  worldId: string;
  controllerKey: string;
  initialized: boolean;
  isGenerating: boolean;
  segmentCount: number;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  setInitialized: Dispatch<SetStateAction<boolean>>;
  setCurrentDecision: Dispatch<SetStateAction<Decision | null>>;
  setIsGeneratingChoices: Dispatch<SetStateAction<boolean>>;
  choiceGenerationTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * Drives session lifecycle side effects (init, fallbacks, store sync).
 * Returns only the choice fallback scheduler; the rest runs automatically.
 */
export const useActiveGameSessionEffects = ({
  sessionId,
  worldId,
  controllerKey,
  initialized,
  isGenerating,
  segmentCount,
  setIsGenerating,
  setInitialized,
  setCurrentDecision,
  setIsGeneratingChoices,
  choiceGenerationTimeoutRef,
}: UseActiveGameSessionEffectsOptions) => {
  // Safety net: if no narrative segment arrives within a reasonable window,
  // inject a minimal fallback scene so the UI can progress.
  // Only trigger if we're not actively generating content.
  useEffect(() => {
    if (!initialized) return;
    if (segmentCount > 0) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      // Don't inject fallback if AI generation is still in progress
      if (isGenerating) return;

      try {
        const now = new Date();
        const fallback: NarrativeSegment = {
          id: `seg-${sessionId}-bootstrap-${now.getTime()}`,
          content: 'You take a breath as your adventure begins. The world awaits your first move.',
          type: 'scene',
          metadata: { location: 'Starting Location', tags: ['intro', 'bootstrap'] },
          sessionId,
          worldId,
          timestamp: now,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        } as NarrativeSegment;
        // Add to store only; NarrativeHistoryManager reads from store
        useNarrativeStore.getState().addSegment(sessionId, {
          content: fallback.content,
          type: fallback.type,
          characterIds: [],
          metadata: fallback.metadata,
          worldId: fallback.worldId,
          updatedAt: fallback.updatedAt,
          timestamp: fallback.timestamp,
        });
        // Begin generating choices after bootstrap
        setIsGeneratingChoices(true);
      } catch (error) {
        // Controller may be mid-flight; surface it so the failure isn't silent.
        logger.error('Failed to inject bootstrap fallback scene', error);
      }
    }, BOOTSTRAP_FALLBACK_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [initialized, segmentCount, sessionId, worldId, isGenerating, setIsGeneratingChoices]);

  // Ensure we eventually release the generating flag to allow safety fallbacks
  useEffect(() => {
    if (!initialized) return;
    if (segmentCount > 0) return;
    if (!isGenerating) return;

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setIsGenerating(false);
    }, INITIAL_GENERATION_MAX_WAIT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [initialized, segmentCount, isGenerating, setIsGenerating]);

  // Initialize the narrative only once per session
  // instead of clearing and recreating each time
  useEffect(() => {
    // Initialize session with unique controller key
    let isMounted = true;

    // Set initial loading state
    setIsGenerating(true);

    // Function to check existing narrative and set up if needed
    const setupNarrative = async () => {
      try {
        // Dynamically import the narrativeStore to avoid circular dependencies
        const { useNarrativeStore } = await import('@/state/narrativeStore');

        // Only proceed if still mounted
        if (!isMounted) return;

        // Check if we already have segments for this session
        const existingSegments = useNarrativeStore.getState().getSessionSegments(sessionId);
        // Check for 'intro' tag which is more stable than checking specific location strings
        const hasInitialScene = existingSegments.some(seg =>
          seg.metadata?.tags?.includes('intro')
        );

        // Check for existing decisions in the store
        const existingDecisions = useNarrativeStore.getState().getSessionDecisions(sessionId);

        // If we have existing decisions, use the latest one
        if (existingDecisions.length > 0) {
          const latestDecision = existingDecisions[existingDecisions.length - 1];
          setCurrentDecision(latestDecision);
        }

        if (hasInitialScene || existingSegments.length > 0) {
          // If we have any segments at all, use them
          // Don't clear existing narrative history
          setInitialized(true);
          setIsGenerating(false);
          // Choice generation will be triggered by NarrativeController after narrative generation
        }
        else {
          // No segments at all - normal case for new session
          // Keep UI in generating state until first segment arrives or we explicitly fallback
          setInitialized(true);
          setIsGenerating(true);
        }
      } catch (error) {
        // Narrative setup failed. Surface the error and stop the generating
        // state so the fallback-scene effect can recover the UI instead of
        // leaving the player on an indefinite spinner.
        logger.error('Failed to set up narrative', error);
        setInitialized(true);
        setIsGenerating(false);
      }
    };

    // Check existing narrative and set up if needed
    setupNarrative();

    return () => {
      // Mark component as unmounted to prevent state updates after unmounting
      isMounted = false;

      // Clear any pending choice generation timeout
      if (choiceGenerationTimeoutRef.current) {
        clearTimeout(choiceGenerationTimeoutRef.current);
        choiceGenerationTimeoutRef.current = null;
      }
    };
  }, [sessionId, worldId, controllerKey, setIsGenerating, setInitialized, setCurrentDecision, choiceGenerationTimeoutRef]);

  // Keep currentDecision synchronized with store updates (supports external generators like item usage)
  useEffect(() => {
    // Only react when this session's decisions or segments actually change,
    // rather than on every narrative-store write (segments stream in
    // token-by-token during play). The body is a pure function of these three
    // references, so gating on them preserves behavior; the first store event
    // always runs so the initial sync matches the prior behavior (issue #1358).
    let initialized = false;
    let prevDecisionIds: unknown;
    let prevSegmentIds: unknown;
    let prevLatestDecision: unknown;

    const unsubscribe = useNarrativeStore.subscribe((state) => {
      const decisionIds = state.sessionDecisions[sessionId];
      const ids = decisionIds || [];
      const latestId = ids[ids.length - 1];
      const latestDecision = latestId ? (state.decisions[latestId] || null) : null;
      const segmentIds = state.sessionSegments[sessionId];

      if (
        initialized &&
        decisionIds === prevDecisionIds &&
        latestDecision === prevLatestDecision &&
        segmentIds === prevSegmentIds
      ) {
        return;
      }
      initialized = true;
      prevDecisionIds = decisionIds;
      prevLatestDecision = latestDecision;
      prevSegmentIds = segmentIds;

      if (latestId) {
        setCurrentDecision(latestDecision);
        setIsGeneratingChoices(false);
      } else {
        setCurrentDecision(null);
        // If narrative already exists, surface a loading state while choices regenerate
        const hasSegments = (segmentIds?.length ?? 0) > 0;
        if (hasSegments) {
          setIsGeneratingChoices(true);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, setCurrentDecision, setIsGeneratingChoices]);

  const scheduleChoiceFallback = useCallback(() => {
    const timeoutId = setTimeout(() => {
      // If we're still generating choices after delay, create fallback choices
      setIsGeneratingChoices(prev => {
        if (!prev) return prev;

        const { decisions, sessionDecisions } = useNarrativeStore.getState();
        const decisionIds = sessionDecisions[sessionId] || [];
        const latestDecisionId = decisionIds[decisionIds.length - 1];
        const currentDecision = latestDecisionId ? decisions[latestDecisionId] : null;

        if (!currentDecision) {
          const fallbackId = `decision-timeout-${Date.now()}`;
          const fallbackDecision: Decision = {
            id: fallbackId,
            prompt: 'What will you do?',
            options: [
              {
                id: `option-${fallbackId}-1`,
                text: 'Investigate further',
                alignment: 'neutral',
              },
              {
                id: `option-${fallbackId}-2`,
                text: 'Talk to nearby characters',
                alignment: 'lawful',
              },
              {
                id: `option-${fallbackId}-3`,
                text: 'Move to a new location',
                alignment: 'neutral',
              },
            ],
            decisionWeight: 'minor',
            contextSummary: 'Waiting for player action (timeout fallback).',
          };

          setCurrentDecision(fallbackDecision);
          return false; // Stop generating
        }
        return false;
      });
    }, CHOICE_FALLBACK_DELAY_MS);

    choiceGenerationTimeoutRef.current = timeoutId;
  }, [choiceGenerationTimeoutRef, sessionId, setCurrentDecision, setIsGeneratingChoices]);

  return {
    scheduleChoiceFallback,
  };
};
