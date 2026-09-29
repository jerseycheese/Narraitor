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
import type { SessionSnapshot } from '@/types/turnResolver.types';
import { assembleSessionSnapshot } from '@/lib/narrative/sessionSnapshotAssembler';

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
  generatePlayerChoices: (snapshot?: SessionSnapshot) => Promise<void>;
}

/**
 * Owns player-choice generation for the active session: the AI call with an
 * abortable signal path, single fallback owner on timeout/failure, and decision
 * persistence.
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
  // AbortController for in-flight choice generation
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Reset the overlap guard and abort in-flight requests when session changes or on unmount
  useEffect(() => {
    choiceGenerationInProgress.current = false;
    return () => {
      choiceGenerationInProgress.current = false;
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
        activeAbortControllerRef.current = null;
      }
    };
  }, [sessionId, worldId, characterId]);

  const generatePlayerChoices = useCallback(
    async (providedSnapshot?: SessionSnapshot) => {
      if (!mountedRef.current) {
        return;
      }
      const targetSessionId = providedSnapshot?.sessionId || sessionId;
      if (!targetSessionId) {
        warnMissingSessionId('choice');
        return;
      }

      // Prevent overlapping choice generation using ref (more reliable than state)
      if (choiceGenerationInProgress.current) {
        return;
      }

      choiceGenerationInProgress.current = true;

      const snapshot =
        providedSnapshot ??
        assembleSessionSnapshot(targetSessionId, {
          worldId,
          characterId: characterId || '',
        });

      if (snapshot.segments.length === 0) {
        choiceGenerationInProgress.current = false;
        return;
      }
      setIsGeneratingChoices(true);

      const recentSegments = [...snapshot.segments.slice(-5)];
      const lastSegment = recentSegments[recentSegments.length - 1];

      // Single fallback decision owner for choice failures
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
            ? `${lastSegment?.metadata?.location || 'Unknown location'}: ${truncate(lastSegment?.content || 'Making a decision', 100)}`
            : 'Making a decision in an unknown location.',
      };

      // Abort previous in-flight generation if any
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      activeAbortControllerRef.current = abortController;

      let timeoutId: NodeJS.Timeout | undefined;

      try {
        const choiceCharacterIds = snapshot.characterId
          ? [snapshot.characterId]
          : characterId
            ? [characterId]
            : [];

        // Create narrative context for choice generation
        const narrativeContext: NarrativeContext = {
          worldId: snapshot.worldId || worldId,
          currentSceneId: `scene-${Date.now()}`,
          characterIds: choiceCharacterIds,
          previousSegments: recentSegments,
          currentTags: lastSegment?.metadata?.tags || [],
          sessionId: snapshot.sessionId,
          recentSegments,
          currentLocation: lastSegment?.metadata?.location || undefined,
        };

        let decision: Decision;
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              abortController.abort();
              reject(
                new Error(
                  `AI choice generation timed out after ${AI_GENERATION_TIMEOUT_MS}ms`
                )
              );
            }, AI_GENERATION_TIMEOUT_MS);
          });

          const abortPromise = new Promise<never>((_, reject) => {
            if (abortController.signal.aborted) {
              reject(new Error('Choice generation aborted'));
            }
            abortController.signal.addEventListener('abort', () => {
              reject(new Error('Choice generation aborted'));
            });
          });

          decision = await Promise.race([
            // Pass signal in case narrativeGenerator supports it
            (narrativeGenerator as any).generatePlayerChoices(
              snapshot.worldId || worldId,
              narrativeContext,
              choiceCharacterIds,
              snapshot.sessionId,
              snapshot,
              abortController.signal
            ),
            timeoutPromise,
            abortPromise,
          ]);
        } catch (error) {
          logger.warn('Choice generation failed, using fallback choices', error);
          decision = fallbackDecision;
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
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
        }

        // Add decision to store and get the actual stored ID (stored once)
        const storedDecisionId = useNarrativeStore
          .getState()
          .addDecision(snapshot.sessionId, {
            prompt: decision.prompt,
            options: decision.options,
            decisionWeight: decision.decisionWeight,
            contextSummary: decision.contextSummary,
            debugInfo: decision.debugInfo,
          });

        decision.id = storedDecisionId;

        // Notify parent callback with the stored selectable decision
        if (onChoicesGenerated && mountedRef.current) {
          try {
            const decisionCopy = structuredClone(decision);
            onChoicesGenerated(decisionCopy);
          } catch (error) {
            logger.error('Error calling onChoicesGenerated callback:', error);
          }
        }
      } catch (error) {
        onError(getNarrativeError(error as Error).message);
      } finally {
        choiceGenerationInProgress.current = false;
        if (mountedRef.current) {
          setIsGeneratingChoices(false);
        }
      }
    },
    [
      sessionId,
      worldId,
      characterId,
      onChoicesGenerated,
      narrativeGenerator,
      warnMissingSessionId,
      mountedRef,
      onError,
    ]
  );

  return { isGeneratingChoices, generatePlayerChoices };
}
