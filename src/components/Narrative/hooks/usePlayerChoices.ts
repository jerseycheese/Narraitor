import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MutableRefObject,
} from 'react';
import { useNarrativeStore } from '@/state/narrativeStore';
import { truncate } from '@/lib/utils';
import { getNarrativeError } from '@/lib/narrative/narrativeErrors';
import { logger } from '@/lib/utils/logger';
import { AI_GENERATION_TIMEOUT_MS } from '@/lib/constants/timeouts';
import type { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import type { Decision, NarrativeContext } from '@/types/narrative.types';

interface UsePlayerChoicesParams {
  sessionId: string;
  worldId: string;
  characterId?: string;
  narrativeGenerator: NarrativeGenerator;
  warnMissingSessionId: (context: string) => void;
  /** Shared with the controller so unmount/skip semantics stay consistent. */
  mountedRef: MutableRefObject<boolean>;
  onChoicesGenerated?: (decision: Decision) => void;
  /** Surfaces an error message to the controller (wraps its setError). */
  onError: (message: string) => void;
}

interface UsePlayerChoicesResult {
  isGeneratingChoices: boolean;
  generatePlayerChoices: () => Promise<void>;
}

/**
 * Owns player-choice generation for the active session: the AI call (with a
 * timeout race and fallback choices), decision persistence, and the overlap
 * guard.
 */
export function usePlayerChoices({
  sessionId,
  worldId,
  characterId,
  narrativeGenerator,
  warnMissingSessionId,
  mountedRef,
  onChoicesGenerated,
  onError,
}: UsePlayerChoicesParams): UsePlayerChoicesResult {
  const [isGeneratingChoices, setIsGeneratingChoices] = useState(false);
  // Prevent overlapping choice generation (more reliable than state).
  const choiceGenerationInProgress = useRef(false);

  // Reset the overlap guard when the session changes or the component unmounts,
  // mirroring the controller's original mount-effect resets.
  useEffect(() => {
    choiceGenerationInProgress.current = false;
    return () => {
      choiceGenerationInProgress.current = false;
    };
  }, [sessionId, worldId, characterId]);

  const generatePlayerChoices = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }
    if (!sessionId) {
      warnMissingSessionId('choice');
      return;
    }

    // Prevent overlapping choice generation using ref (more reliable than state)
    if (choiceGenerationInProgress.current) {
      return;
    }

    choiceGenerationInProgress.current = true;

    // Get fresh segments from the store instead of relying on component state
    const currentSegments = useNarrativeStore
      .getState()
      .getSessionSegments(sessionId);

    if (currentSegments.length === 0) {
      choiceGenerationInProgress.current = false;
      return;
    }
    setIsGeneratingChoices(true);

    // Use recent segments for context - get from fresh data
    const recentSegments = currentSegments.slice(-5);

    // Create fallback choices upfront - we'll use these immediately if something fails
    let usedFallbackDecision = false;
    const fallbackId = `decision-fallback-${Date.now()}`;
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
      contextSummary:
        recentSegments.length > 0
          ? `${recentSegments[recentSegments.length - 1]?.metadata?.location || 'Unknown location'}: ${truncate(recentSegments[recentSegments.length - 1]?.content || 'Making a decision', 100)}`
          : 'Making a decision in an unknown location.',
    };

    try {
      const choiceCharacterIds = characterId ? [characterId] : [];
      // Create narrative context for choice generation
      const narrativeContext: NarrativeContext = {
        worldId,
        currentSceneId: `scene-${Date.now()}`,
        characterIds: choiceCharacterIds,
        previousSegments: recentSegments,
        currentTags:
          recentSegments[recentSegments.length - 1]?.metadata?.tags || [],
        sessionId,
        recentSegments,
        currentLocation:
          recentSegments[recentSegments.length - 1]?.metadata?.location ||
          undefined,
      };

      // Generate choices with a 15-second timeout for real API calls
      let decision;
      try {
        // Set up a race between the AI generation and a timeout
        const timeoutPromise = new Promise<Decision>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(`AI choice generation timed out after ${AI_GENERATION_TIMEOUT_MS}ms`)
              ),
            AI_GENERATION_TIMEOUT_MS
          );
        });

        decision = await Promise.race([
          narrativeGenerator.generatePlayerChoices(
            worldId,
            narrativeContext,
            choiceCharacterIds
          ),
          timeoutPromise,
        ]);
      } catch (error) {
        logger.warn('Choice generation failed, using fallback choices', error);
        decision = fallbackDecision;
        usedFallbackDecision = true;
      }

      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        return;
      }

      // Verify decision structure and use fallback if invalid
      if (
        !decision ||
        !decision.options ||
        (decision.options?.length || 0) === 0
      ) {
        decision = fallbackDecision;
        usedFallbackDecision = true;
      }

      // Add decision to store and get the actual stored ID
      const storedDecisionId = useNarrativeStore
        .getState()
        .addDecision(sessionId, {
          prompt: decision.prompt,
          options: decision.options,
          decisionWeight: decision.decisionWeight,
          contextSummary: decision.contextSummary,
        });

      // Update the decision with the stored ID before passing to parent
      decision.id = storedDecisionId;

      // Only notify parent component if we have AI-generated choices (not fallback)
      if (!usedFallbackDecision) {
        if (onChoicesGenerated) {
          try {
            // Create a deep copy of the decision to ensure React state updates
            const decisionCopy = structuredClone(decision);
            onChoicesGenerated(decisionCopy);
          } catch (error) {
            logger.error('Error calling onChoicesGenerated callback:', error);
          }
        }
      }
    } catch (error) {
      // Unhandled error in generatePlayerChoices
      onError(getNarrativeError(error as Error).message);

      // Even if we get an unhandled error, try to provide fallback choices

      try {
        // Only try to create fallback choices if we haven't already added any for this session
        const existingDecisions = useNarrativeStore
          .getState()
          .getSessionDecisions(sessionId);

        if (existingDecisions.length === 0 && mountedRef.current) {
          // Create and add fallback choices to the store
          const fallbackId = `decision-fallback-error-${Date.now()}`;
          const fallbackDecision: Decision = {
            id: fallbackId,
            prompt: 'What will you do now?',
            options: [
              {
                id: `option-${fallbackId}-1`,
                text: 'Investigate the situation',
                alignment: 'neutral',
              },
              {
                id: `option-${fallbackId}-2`,
                text: 'Speak with someone nearby',
                alignment: 'lawful',
              },
              {
                id: `option-${fallbackId}-3`,
                text: 'Move to a different area',
                alignment: 'neutral',
              },
            ],
            decisionWeight: 'minor',
            contextSummary: 'Error occurred during choice generation.',
          };

          // Add to store and get the actual stored ID
          const storedFallbackId = useNarrativeStore
            .getState()
            .addDecision(sessionId, {
              prompt: fallbackDecision.prompt,
              options: fallbackDecision.options,
              decisionWeight: fallbackDecision.decisionWeight,
              contextSummary: fallbackDecision.contextSummary,
            });

          // Update the fallback decision with the stored ID
          fallbackDecision.id = storedFallbackId;

          // Notify parent
          if (onChoicesGenerated && mountedRef.current) {
            const decisionCopy = structuredClone(fallbackDecision);
            onChoicesGenerated(decisionCopy);
          }
        }
      } catch {
        // Failed to provide fallback choices
      }
    } finally {
      choiceGenerationInProgress.current = false;
      if (mountedRef.current) {
        setIsGeneratingChoices(false);
      }
    }
  }, [
    sessionId,
    worldId,
    characterId,
    onChoicesGenerated,
    narrativeGenerator,
    warnMissingSessionId,
    mountedRef,
    onError,
  ]);

  return { isGeneratingChoices, generatePlayerChoices };
}
