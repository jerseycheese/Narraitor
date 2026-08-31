import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { NarrativeHistory } from './NarrativeHistory';
import { useNarrativeGenerator } from '@/hooks/useNarrativeGenerator';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useEndingDetection } from './useEndingDetection';
import { usePlayerChoices } from './hooks/usePlayerChoices';
import {
  Decision,
  DecisionWeight,
  NarrativeSegment,
  SkillCheckRoll,
} from '@/types/narrative.types';
import { isSessionEndingSegment } from '@/lib/narrative/isSessionEndingSegment';
import { getNarrativeError } from '@/lib/narrative/narrativeErrors';
import {
  evaluateDecisionSkillChecks,
  isFatalCriticalDecision,
} from '@/lib/narrative/evaluateDecisionSkillChecks';
import { computeTurnsSinceComplication, isPacingStale } from '@/lib/narrative/turnsSinceComplication';
import { isFatalCadenceOffCooldown } from '@/lib/narrative/fatalDecisionCadence';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { logger } from '@/lib/utils/logger';
import { AI_GENERATION_TIMEOUT_MS } from '@/lib/constants/timeouts';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import { resolveTurn, resolveInitialTurn } from '@/lib/narrative/turnResolver';
import type {
  TurnCommand,
  InitialTurnCommand,
  TurnResult,
} from '@/types/turnResolver.types';
import { PARTIAL_RECONCILIATION_ERROR } from '@/lib/narrative/narrativeErrors';

const EMPTY_NPC_IDS: string[] = [];
interface NarrativeControllerProps {
  worldId: string;
  sessionId: string;
  characterId?: string;
  decisionWeight?: import('@/types/narrative.types').DecisionWeight;
  onNarrativeGenerated?: (segment: NarrativeSegment) => void;
  onChoicesGenerated?: (decision: Decision) => void;
  onEndingSuggested?: (
    reason: string,
    endingType: import('@/types/narrative.types').EndingType
  ) => void;
  onSkillCheckPerformed?: (results: SkillCheckRoll[]) => void;
  triggerGeneration?: boolean;
  choiceId?: string; // ID of the choice that triggered this narrative
  className?: string;
  generateChoices?: boolean; // Whether to generate choices after narrative
  hideHistory?: boolean; // Whether to hide the narrative history UI
  /**
   * Bumping this counter re-runs the last failed generation. Lets an external
   * surface (the choices column's Retry) drive recovery without exposing the
   * controller's internal retry handler. Ignored at its initial value.
   */
  retryToken?: number;
  /**
   * Fires with the growing narrative preview as the active generation
   * streams in, and with '' once a turn finishes. A composer
   * that renders its own visible history from the store instead of this
   * controller's own (often hidden, see hideHistory) NarrativeHistory — the
   * live play surface does this via NarrativeHistoryManager — uses this to
   * feed that display instead.
   */
  onStreamingPreviewChange?: (preview: string) => void;
}

export const NarrativeController: React.FC<NarrativeControllerProps> = ({
  worldId,
  sessionId,
  characterId,
  onNarrativeGenerated,
  onChoicesGenerated,
  onEndingSuggested,
  onSkillCheckPerformed,
  triggerGeneration = true,
  choiceId,
  className,
  generateChoices = true,
  hideHistory = false,
  retryToken = 0,
  onStreamingPreviewChange,
}) => {
  const [segments, setSegments] = useState<NarrativeSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Live-updating preview of the segment currently generating as the real API
  // streams. streamingPreviewRef is the source of truth so
  // handleStreamChunk stays a stable callback and the post-await read in
  // generate*() below never sees a stale closure; streamingPreview mirrors it
  // into state purely to trigger the re-render NarrativeHistory needs to show
  // each new delta.
  const [streamingPreview, setStreamingPreview] = useState('');
  const streamingPreviewRef = useRef('');

  const handleStreamChunk = useCallback((delta: string) => {
    streamingPreviewRef.current += delta;
    setStreamingPreview(streamingPreviewRef.current);
    onStreamingPreviewChange?.(streamingPreviewRef.current);
  }, [onStreamingPreviewChange]);

  const resetStreamingPreview = useCallback(() => {
    streamingPreviewRef.current = '';
    setStreamingPreview('');
    onStreamingPreviewChange?.('');
  }, [onStreamingPreviewChange]);

  // Access store methods in a way that works with testing
  const addSegment = useNarrativeStore((state) => state.addSegment);
  const getSessionSegments = useNarrativeStore(
    (state) => state.getSessionSegments
  );
  const setGenerationError = useNarrativeStore(
    (state) => state.setGenerationError
  );
  const clearGenerationError = useNarrativeStore(
    (state) => state.clearGenerationError
  );
  const hasHydrated = useNarrativeStore((state) => state._hasHydrated);

  /**
   * addSegment applies the sanitization and dedupe gate, so the passage it
   * kept is the one the player must read. Taking the content back from the
   * store keeps a single gate: local state, the journal callback and ending
   * detection all read the same string the store holds, and there is no
   * second copy of the gating logic here to drift from it.
   */
  const storeSegmentAndTakeGated = useCallback(
    (segment: NarrativeSegment): NarrativeSegment => {
      const storedSegmentId = addSegment(sessionId, {
        content: segment.content,
        type: segment.type,
        characterIds: segment.characterIds || [],
        metadata: segment.metadata,
        worldId: segment.worldId,
        updatedAt: segment.updatedAt,
        timestamp: segment.timestamp,
      });

      const stored = useNarrativeStore.getState().segments[storedSegmentId];

      return stored ? { ...segment, content: stored.content } : segment;
    },
    [addSegment, sessionId]
  );

  // The fatal-outcome tag lands on a segment after the post-segment
  // extraction reads a death in the prose, seconds after the segment itself,
  // so the synchronous check after addSegment cannot see it; this does.
  // A session that already has its ending is excluded: the tag stays on the
  // dead session's segments forever, and a later mount that briefly renders
  // with that session id (rehydration before a fresh session settles) would
  // otherwise re-suggest the ending it already has - an async generation
  // that can land on the successor session.
  const sessionHasFatalSegment = useNarrativeStore((state) =>
    !state.endedSessions[sessionId] &&
    (state.sessionSegments[sessionId] ?? []).some((segmentId) =>
      state.segments[segmentId]?.metadata?.tags?.includes('fatal-outcome')
    )
  );
  const narrativeGenerator = useNarrativeGenerator();

  const npcIds = useNPCStore(
    useCallback((state) => state.worldNpcs[worldId] ?? EMPTY_NPC_IDS, [worldId])
  );
  const npcs = useNPCStore((state) => state.npcs);

  const npcRoster = useMemo(() => {
    if (!npcIds || npcIds.length === 0) {
      return [];
    }
    return npcIds
      .map((id) => npcs[id])
      .filter((npc): npc is NonNullable<(typeof npcs)[string]> => Boolean(npc));
  }, [npcIds, npcs]);

  // Track if we've already generated a narrative for this session
  const [sessionKey, setSessionKey] = useState('');
  const [initialGenerationCompleted, setInitialGenerationCompleted] =
    useState(false);
  const [processedChoices, setProcessedChoices] = useState<Set<string>>(
    new Set()
  );
  const mountedRef = useRef(false);
  const warnedMissingSessionIdRef = useRef(false);

  const warnMissingSessionId = useCallback((context: string) => {
    if (process.env.NODE_ENV === 'production') return;
    if (warnedMissingSessionIdRef.current) return;
    warnedMissingSessionIdRef.current = true;
    logger.warn(
      `[NarrativeController] Missing sessionId; skipping ${context} generation.`
    );
  }, []);
  // Use a ref to track if we've initiated generation in this component instance
  const initialGenerationInitiated = useRef(false);
  // Prevent duplicate initial-scene generation in dev StrictMode (effects can run twice across remounts)
  const initialGenerationLocksRef = useRef(new Set<string>());

  const { checkForEndingIndicators, suggestEnding } = useEndingDetection({
    sessionId,
    worldId,
    characterId,
    segments,
    onEndingSuggested,
  });

  useEffect(() => {
    if (!sessionHasFatalSegment) return;
    suggestEnding(
      'fatal: narrative segment marked the player as dead or incapacitated.',
      'story-complete'
    );
  }, [sessionHasFatalSegment, suggestEnding]);

  const { isGeneratingChoices, generatePlayerChoices } = usePlayerChoices({
    sessionId,
    worldId,
    characterId,
    narrativeGenerator,
    warnMissingSessionId,
    mountedRef,
    onChoicesGenerated,
    onError: setError,
  });

  const confirmTurnSettled = useCallback(
    (turnResult: TurnResult, context: string): boolean => {
      if (turnResult.status === 'settled') {
        return true;
      }

      logger.warn(
        `[NarrativeController] ${context} reconciliation partial:`,
        turnResult.reconciliationErrors.map((error) => error.step)
      );
      setGenerationError(PARTIAL_RECONCILIATION_ERROR);
      return false;
    },
    [setGenerationError]
  );

  // Initialize component state on mount
  useEffect(() => {
    // Create a unique session key to track this instance
    const instanceKey = `${sessionId}-${Date.now()}`;
    setSessionKey(instanceKey);

    // Reset state when session changes
    setProcessedChoices(new Set());
    setError(null);

    // Set mounted flag
    mountedRef.current = true;

    // Reset generation flags
    initialGenerationInitiated.current = false;

    return () => {
      mountedRef.current = false;
      initialGenerationInitiated.current = false; // Reset generation init flag
      // NOTE: We intentionally do NOT delete initialGenerationLocksRef here.
      // The lock is owned by the in-flight generation (released in its finally
      // block); releasing it on unmount allows a remounted instance to start a
      // duplicate generation while the original is still in flight.
    };
  }, [sessionId, worldId, characterId]);

  // Deduplicate segments by ID to ensure we don't have duplicates in localStorage
  useEffect(() => {
    if (segments.length > 0) {
      // Check for duplicates
      const ids = new Set();
      const hasDuplicates = segments.some((segment) => {
        if (ids.has(segment.id)) return true;
        ids.add(segment.id);
        return false;
      });

      if (hasDuplicates) {
        // Deduplicate by keeping only the first occurrence of each ID
        const uniqueSegments = [];
        const seenIds = new Set();

        for (const segment of segments) {
          if (!seenIds.has(segment.id)) {
            uniqueSegments.push(segment);
            seenIds.add(segment.id);
          }
        }

        // Update local state with deduplicated segments
        setSegments(uniqueSegments);
      }
    }
  }, [segments, sessionKey]);

  // Primary generation effect
  useEffect(() => {
    // Skip if component is unmounted or persistence not ready
    if (!mountedRef.current || !hasHydrated) return;
    if (!sessionId) {
      warnMissingSessionId('narrative');
      return;
    }

    // Always prefer persisted store segments before generating anything new
    const persistedSegments = useNarrativeStore
      .getState()
      .getSessionSegments(sessionId);

    if (persistedSegments.length > 0 && segments.length === 0) {
      setSegments(persistedSegments);
      setInitialGenerationCompleted(true);
      setIsLoading(false);
      return;
    }

    const isPlaywrightRuntime = isPlaywrightEnv();

    if (isPlaywrightRuntime && persistedSegments.length === 0) {
      // Visual regression tests seed data via persistence; wait for hydration
      setInitialGenerationCompleted(true);
      initialGenerationInitiated.current = true;
      setIsLoading(false);
      return;
    }

    // Generate narrative when triggered
    if (triggerGeneration && !isLoading) {
      // Initial narrative generation (only if we have no segments and haven't generated one yet)
      if (
        segments.length === 0 &&
        !initialGenerationCompleted &&
        !initialGenerationInitiated.current
      ) {
        // Set both state and refs to prevent duplicate generation
        setInitialGenerationCompleted(true);
        initialGenerationInitiated.current = true;

        generateInitialNarrative();
      }
      // Choice-based generation (only if we haven't processed this choice already)
      else if (choiceId && !processedChoices.has(choiceId)) {
        // Mark this choice as processed BEFORE generating
        // This prevents multiple generations from triggering
        setProcessedChoices((prev) => {
          const updated = new Set(prev);
          updated.add(choiceId);
          return updated;
        });

        generateNextSegment(choiceId);
      }
      // Log if we're skipping generation
      // (No action needed for other cases)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasHydrated,
    triggerGeneration,
    choiceId,
    segments.length,
    isLoading,
    sessionId,
    sessionKey,
  ]);

  // Load segments after hydration is complete
  useEffect(() => {
    if (!hasHydrated) {
      return; // Wait for persistence to load
    }

    // Load segments for the current session
    let existingSegments = getSessionSegments(sessionId);

    if (existingSegments.length === 0 && typeof window !== 'undefined') {
      const testWindow = window as typeof window & {
        __TEST_SEGMENTS__?: Record<string, NarrativeSegment>;
        __TEST_SESSION_SEGMENTS__?: Record<string, string[]>;
      };

      const seededIds = testWindow.__TEST_SESSION_SEGMENTS__?.[sessionId] || [];
      if (seededIds.length > 0) {
        const seededSegments = seededIds
          .map((segmentId) => {
            const raw = testWindow.__TEST_SEGMENTS__?.[segmentId];
            if (!raw) return null;
            return {
              ...raw,
              id: raw.id ?? segmentId,
              sessionId: raw.sessionId ?? sessionId,
              timestamp:
                raw.timestamp instanceof Date
                  ? raw.timestamp
                  : new Date(
                      typeof raw.timestamp === 'string'
                        ? raw.timestamp
                        : (raw.createdAt ?? Date.now())
                    ),
              createdAt:
                typeof raw.createdAt === 'string'
                  ? raw.createdAt
                  : new Date(
                      typeof raw.createdAt === 'string'
                        ? raw.createdAt
                        : Date.now()
                    ).toISOString(),
              updatedAt:
                typeof raw.updatedAt === 'string'
                  ? raw.updatedAt
                  : new Date(
                      typeof raw.updatedAt === 'string'
                        ? raw.updatedAt
                        : (raw.createdAt ?? Date.now())
                    ).toISOString(),
            } as NarrativeSegment;
          })
          .filter((segment): segment is NarrativeSegment => Boolean(segment));

        if (seededSegments.length > 0) {
          useNarrativeStore.setState((state) => ({
            ...state,
            segments: {
              ...state.segments,
              ...seededSegments.reduce<Record<string, NarrativeSegment>>(
                (acc, segment) => {
                  acc[segment.id] = segment;
                  return acc;
                },
                {}
              ),
            },
            sessionSegments: {
              ...state.sessionSegments,
              [sessionId]: seededIds,
            },
          }));

          existingSegments = seededSegments;
        }
      }
    }

    setSegments(existingSegments);

    // Check if we already have an initial scene by looking for the 'intro' tag
    // This is more stable than checking for a specific location string
    const hasInitialScene = existingSegments.some((segment) =>
      segment.metadata?.tags?.includes('intro')
    );

    // Critical: mark initial generation as completed if we already have an initial scene
    setInitialGenerationCompleted(hasInitialScene);

    if (hasInitialScene) {
      initialGenerationInitiated.current = true; // Prevent any attempt to generate an initial scene
    }

    // If we already have narrative content and no decisions yet, proactively generate choices
    try {
      const existingDecisions = useNarrativeStore
        .getState()
        .getSessionDecisions(sessionId);
      if (
        generateChoices &&
        existingSegments.length > 0 &&
        existingDecisions.length === 0 &&
        !isSessionEndingSegment(existingSegments[existingSegments.length - 1])
      ) {
        setTimeout(() => {
          if (mountedRef.current) {
            generatePlayerChoices();
          }
        }, 300);
      }
    } catch (error) {
      logger.warn('Non-critical error in post-hydration choice trigger', error);
    }
  }, [
    hasHydrated,
    sessionId,
    generateChoices,
    getSessionSegments,
    generatePlayerChoices,
  ]);

  const generateInitialNarrative = async () => {
    if (!hasHydrated) {
      return;
    }
    if (!sessionId) {
      warnMissingSessionId('initial scene');
      return;
    }

    const lockKey = String(sessionId);
    if (initialGenerationLocksRef.current.has(lockKey)) {
      return;
    }
    initialGenerationLocksRef.current.add(lockKey);

    let generationTimeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      // CHECK FIRST: Don't generate an initial scene if one already exists
      // Do a fresh check of the store to get the latest state
      const existingSegments = getSessionSegments(sessionId);
      const hasAnySegments = existingSegments.length > 0;

      // If we have ANY segments, this is a resumed session - don't generate initial narrative
      if (hasAnySegments) {
        setSegments(existingSegments);
        setInitialGenerationCompleted(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      resetStreamingPreview();

      // The abort signal propagates through the resolver to the underlying
      // generator call. Only the provider round-trip is timed; reconciliation
      // (store writes + world-cost extraction) runs unraced so a slow
      // reconciliation doesn't trigger a duplicate fallback segment.
      const generationAbort = new AbortController();
      generationTimeoutId = setTimeout(() => {
        generationAbort.abort();
      }, AI_GENERATION_TIMEOUT_MS);

      const initialCommand: InitialTurnCommand = {
        sessionId,
        worldId,
        characterId: characterId ?? '',
        generateChoices: generateChoices ?? true,
        signal: generationAbort.signal,
        onChunk: handleStreamChunk,
      };

      const turnResult = await resolveInitialTurn(initialCommand, narrativeGenerator);

      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        return;
      }

      // Double-check we still don't have any segments (in case another instance created one)
      const currentSegments = getSessionSegments(sessionId);
      const nowHasSegments = currentSegments.length > 0;

      // If segments appeared from another source, just adopt them
      if (nowHasSegments && !currentSegments.some(s => s.id === turnResult.segment.id)) {
        setSegments(currentSegments);
        setIsLoading(false);
        return;
      }

      const isTurnSettled = confirmTurnSettled(turnResult, 'Initial turn');

      const gatedSegment = turnResult.segment;

      // Add to local state
      setSegments((prev) => [...prev, gatedSegment]);

      if (onNarrativeGenerated) {
        onNarrativeGenerated(gatedSegment);
      }

      // Check for ending indicators. Deferred off the per-turn path: it's
      // an extra Gemini round-trip that only feeds onEndingSuggested, which
      // choice generation below doesn't wait on.
      void checkForEndingIndicators(gatedSegment);

      // Generate choices if enabled - skip when this segment already ends
      // the session. The resolver has already settled all core state, so
      // choice generation reads the post-turn revision.
      if (generateChoices && isTurnSettled && !turnResult.isEnding) {
        generatePlayerChoices();
      }
    } catch {
      // Error generating initial narrative (timeout, abort, network, etc.).
      try {
        const alreadyCommitted = getSessionSegments(sessionId);
        if (alreadyCommitted.length > 0) {
          // A post-commit failure cannot safely retry generation or advance
          // to another Decision because the stored Turn may be partial.
          setSegments(alreadyCommitted);
          if (onNarrativeGenerated) {
            onNarrativeGenerated(alreadyCommitted[0]);
          }
          setGenerationError(PARTIAL_RECONCILIATION_ERROR);
        } else {
          const now = new Date();
          const segmentId = `seg-${worldId}-fallback-${Date.now()}`;
          const fallbackSegment: NarrativeSegment = {
            id: segmentId,
            content:
              'The adventure begins. You find yourself at the edge of a new journey. What will you do next?',
            type: 'scene',
            characterIds: [],
            metadata: {
              characterIds: [],
              location: 'Starting Location',
              tags: ['intro', 'fallback'],
            },
            sessionId,
            worldId,
            timestamp: now,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          };

          const gatedFallback = storeSegmentAndTakeGated(fallbackSegment);
          setSegments((prev) => [...prev, gatedFallback]);

          if (onNarrativeGenerated) {
            onNarrativeGenerated(gatedFallback);
          }

          if (generateChoices && !isSessionEndingSegment(gatedFallback)) {
            generatePlayerChoices();
          }
        }
      } catch (error) {
        // Surface the original error if fallback insert also fails
        setError(getNarrativeError(error as Error).message);
      }
    } finally {
      clearTimeout(generationTimeoutId);
      initialGenerationLocksRef.current.delete(lockKey);
      resetStreamingPreview();
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const generateNextSegment = async (triggeringChoiceId: string) => {
    if (!sessionId) {
      warnMissingSessionId('next segment');
      return;
    }

    if (segments.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);
    clearGenerationError();
    resetStreamingPreview();

    let segmentTimeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      // Get the actual choice text from the narrative store
      const decisions = useNarrativeStore
        .getState()
        .getSessionDecisions(sessionId);
      let choiceText = triggeringChoiceId;

      // Find the decision that contains this choice
      let isCustomInput = false;
      let selectedOption = null;
      let decisionWeight: DecisionWeight | undefined;
      for (const decision of decisions) {
        const option = decision.options.find(
          (opt) => opt.id === triggeringChoiceId
        );
        if (option) {
          selectedOption = option;
          decisionWeight = decision.decisionWeight;
          choiceText =
            option.isCustomInput && option.customText
              ? option.customText
              : option.text;
          isCustomInput = option.isCustomInput || false;
          break;
        }
      }

      // Evaluate skill requirements (rolls, tags, outcome, per-roll toasts, and
      // the parent onSkillCheckPerformed notification are handled in the helper)
      const character = characterId
        ? useCharacterStore.getState().characters[characterId]
        : undefined;
      const world = useWorldStore.getState().worlds[worldId];
      const { skillCheckTags, rollResults, decisionOutcome } =
        evaluateDecisionSkillChecks({
          selectedOption,
          character,
          world,
          onSkillCheckPerformed,
        });

      // Fatal outcome check: a critical decision only ends the run on a true
      // critical-failure roll (natural 1). The cadence guard budgets it: only
      // a decision off cooldown may be fatal.
      const fatalRiskAllowed =
        decisionWeight === 'critical' && isFatalCadenceOffCooldown(segments);
      const isFatalCriticalFailure =
        fatalRiskAllowed && isFatalCriticalDecision(decisionWeight, rollResults);

      if (isFatalCriticalFailure) {
        suggestEnding(
          'fatal: a catastrophic failure on a pivotal decision left the character unable to continue.',
          'story-complete'
        );
      }

      // Pacing stamp: the resolver builds worldClock from the store but needs
      // the escalation flag from the controller's pacing evaluation.
      const hasWorldClock = isFeatureEnabled('WORLD_CLOCK');
      const pacingEscalationRequested =
        !hasWorldClock && isPacingStale(computeTurnsSinceComplication(segments));

      // The abort signal times out the provider round-trip; reconciliation
      // runs unraced so a slow side-effect pass doesn't trigger a spurious
      // error + Retry while the segment was already committed.
      const segmentAbort = new AbortController();
      segmentTimeoutId = setTimeout(() => {
        segmentAbort.abort();
      }, AI_GENERATION_TIMEOUT_MS);

      const command: TurnCommand = {
        sessionId,
        worldId,
        characterId: characterId ?? '',
        choiceId: triggeringChoiceId,
        choiceText,
        isCustomInput,
        skillCheckResults: rollResults,
        skillCheckTags,
        decisionOutcome,
        decisionWeight,
        pacingEscalationRequested,
        fatalRiskAllowed,
        isFatalCriticalFailure,
        generationParams: {
          includedTopics: [choiceText],
          desiredTone:
            decisionWeight === 'critical' &&
            rollResults.some((r) => r.isCriticalFailure)
              ? 'tragic'
              : undefined,
        },
        signal: segmentAbort.signal,
        onChunk: handleStreamChunk,
      };

      const turnResult = await resolveTurn(command, narrativeGenerator);

      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        return;
      }

      const isTurnSettled = confirmTurnSettled(turnResult, 'Turn');

      const gatedSegment = turnResult.segment;

      // Add to local state
      setSegments((prev) => [...prev, gatedSegment]);

      if (onNarrativeGenerated) {
        onNarrativeGenerated(gatedSegment);
      }

      // Check for ending indicators. Deferred off the per-turn path: it's
      // an extra Gemini round-trip that only feeds onEndingSuggested, which
      // choice generation below doesn't wait on.
      void checkForEndingIndicators(gatedSegment);

      // Generate choices if enabled - skip when the session is ending
      // (fatal/ending segment or a fatal critical-decision failure).
      // A fatal critical failure only ends the session when an ending handler
      // is wired. The resolver has already settled all core state, so choice
      // generation reads the post-turn revision — no setTimeout needed.
      const criticalFailureEndsSession =
        isFatalCriticalFailure && Boolean(onEndingSuggested);
      if (
        generateChoices &&
        isTurnSettled &&
        !turnResult.isEnding &&
        !criticalFailureEndsSession
      ) {
        generatePlayerChoices();
      }
    } catch (err) {
      // Error generating narrative. Classify the failure (transient network/
      // 429/5xx/timeout vs terminal bad-key) into shared store state so the
      // play surface can surface inline error + Retry copy. Keep the local
      // string error for the (hidden) NarrativeHistory path too.
      setError(
        'Unable to generate narrative. Please check your connection and try again.'
      );
      setGenerationError(getNarrativeError(err as Error));
    } finally {
      clearTimeout(segmentTimeoutId);
      resetStreamingPreview();
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    clearGenerationError();

    // If we have no segments, retry initial generation
    if (segments.length === 0) {
      generateInitialNarrative();
    } else if (choiceId && processedChoices.has(choiceId)) {
      // If we were trying to generate from a choice, remove it from processed and retry
      setProcessedChoices((prev) => {
        const updated = new Set(prev);
        updated.delete(choiceId);
        return updated;
      });
      generateNextSegment(choiceId);
    } else {
      // Otherwise just clear the error
      setError(null);
    }
  };

  // Re-run the failed generation when an external surface bumps retryToken
  // (e.g. the choices column's Retry button). Skips the initial 0 value so a
  // fresh mount never triggers a spurious regeneration.
  useEffect(() => {
    if (retryToken > 0) {
      handleRetry();
    }
    // handleRetry closes over the latest choiceId/segments each render; depending
    // only on retryToken keeps this a one-shot per bump.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryToken]);

  return (
    <div className={`narrative-controller ${className || ''}`}>
      {!hideHistory && (
        <NarrativeHistory
          segments={segments}
          isLoading={isLoading || isGeneratingChoices}
          error={error || undefined}
          onRetry={handleRetry}
          streamingContent={streamingPreview}
        />
      )}
      {!hideHistory && process.env.NODE_ENV !== 'production' && npcRoster.length > 0 && (
        <div>
          <p>
            NPC roster (debug)
          </p>
          <ul>
            {npcRoster.map((npc) => (
              <li key={npc.id}>
                {npc.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={npc.avatarUrl}
                    alt={npc.name}
                  />
                ) : (
                  <div>
                    {npc.name
                      .split(' ')
                      .map((segment) => segment[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div>
                  <span>
                    {npc.name}
                  </span>
                  <span>
                    {npc.id}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
