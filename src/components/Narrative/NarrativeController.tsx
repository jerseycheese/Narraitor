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
import { buildWorldClockPromptContext } from '@/lib/narrative/worldClock';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { mergeTurnTags } from '@/lib/narrative/turnTags';
import { logger } from '@/lib/utils/logger';
import { AI_GENERATION_TIMEOUT_MS } from '@/lib/constants/timeouts';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { useToast } from '@/components/ui/toast/toaster';

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
   * streams in, and with '' once a turn finishes (issue #1476). A composer
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
  const toast = useToast();

  // Live-updating preview of the segment currently generating (issue #1476:
  // real API streaming). streamingPreviewRef is the source of truth so
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
  // The fatal-outcome tag lands on a segment after the post-segment
  // extraction reads a death in the prose, seconds after the segment itself,
  // so the synchronous check after addSegment cannot see it; this does.
  const sessionHasFatalSegment = useNarrativeStore((state) =>
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

      // Race AI generation against a timeout so a slow response falls back instead of hanging.
      // Losing the race must also ABORT the generation: without the signal,
      // the abandoned request keeps running (and spending) until aiFetch's
      // ceiling, then mutates lore/inventory/NPC state when it settles.
      const generationAbort = new AbortController();
      const timeoutPromise = new Promise<never>((_, reject) => {
        generationTimeoutId = setTimeout(() => {
          generationAbort.abort();
          reject(
            new Error(`Initial generation timed out after ${AI_GENERATION_TIMEOUT_MS}ms`)
          );
        }, AI_GENERATION_TIMEOUT_MS);
      });
      const result = await Promise.race([
        narrativeGenerator.generateInitialScene(
          worldId,
          characterId ? [characterId] : [],
          sessionId,
          { signal: generationAbort.signal, onChunk: handleStreamChunk }
        ),
        timeoutPromise,
      ]);

      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        return;
      }

      // Double-check we still don't have any segments (in case another instance created one)
      const currentSegments = getSessionSegments(sessionId);
      const nowHasSegments = currentSegments.length > 0;

      if (nowHasSegments) {
        setIsLoading(false);
        return;
      }

      const segmentId = `seg-${worldId}-${Date.now()}`;
      const now = new Date();
      const newSegment: NarrativeSegment = {
        id: segmentId,
        content: result.content,
        type: result.segmentType,
        characterIds: result.metadata.characterIds || [],
        metadata: result.metadata,
        sessionId, // Explicitly set sessionId
        worldId, // Explicitly set worldId
        timestamp: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      // Add to local state
      setSegments((prev) => [...prev, newSegment]);

      // Add to store
      addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        characterIds: newSegment.characterIds || [],
        metadata: newSegment.metadata,
        worldId: newSegment.worldId,
        updatedAt: newSegment.updatedAt,
        timestamp: newSegment.timestamp,
      });

      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }

      // Check for ending indicators. Deferred off the per-turn path: it's
      // an extra Gemini round-trip that only feeds onEndingSuggested, which
      // choice generation below doesn't wait on.
      void checkForEndingIndicators(newSegment);

      // Generate choices if enabled - skip when this segment already ends the session
      if (generateChoices && !isSessionEndingSegment(newSegment)) {
        // Start generating AI choices immediately without showing fallback choices first
        setTimeout(() => {
          generatePlayerChoices();
        }, 500); // Reduced timeout since we're not showing immediate choices
      }
    } catch {
      // Error generating initial narrative — create a graceful fallback segment
      try {
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

        // Add locally and to the store to unblock the UI
        setSegments((prev) => [...prev, fallbackSegment]);
        addSegment(sessionId, {
          content: fallbackSegment.content,
          type: fallbackSegment.type,
          characterIds: fallbackSegment.characterIds || [],
          metadata: fallbackSegment.metadata,
          worldId: fallbackSegment.worldId,
          updatedAt: fallbackSegment.updatedAt,
          timestamp: fallbackSegment.timestamp,
        });

        // Notify parent so it can progress to choices skeleton + generation
        if (onNarrativeGenerated) {
          onNarrativeGenerated(fallbackSegment);
        }

        // Kick off choice generation (will provide AI or fallback choices)
        if (generateChoices && !isSessionEndingSegment(fallbackSegment)) {
          setTimeout(() => {
            generatePlayerChoices();
          }, 500);
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
      // Use recent segments for context (last 3 segments for efficiency)
      const recentSegments = segments.slice(-3);
      // Streak tracked over the whole session, not just the trimmed context
      // window above — a quiet stretch spans more than 3 segments.
      const turnsSinceComplication = computeTurnsSinceComplication(segments);
      // The turn the prompt names must match the one the store stamps after
      // this segment lands (sessionSegments length after add), and the local
      // segments state can lag the store, so read the store count directly.
      const currentTurn =
        useNarrativeStore.getState().getSessionSegments(sessionId).length + 1;
      const worldClock = isFeatureEnabled('WORLD_CLOCK')
        ? buildWorldClockPromptContext(
            useWorldThreadStore
              .getState()
              .getAll()
              .filter((thread) => thread.sessionId === sessionId),
            currentTurn
          )
        : undefined;
      // The scene prompt only carries the rising-tension block above this
      // threshold, and the complication it asks for arrives with no dice roll
      // behind it. Stamping the ask onto the segment is what lets the streak
      // reset; without it the guidance would repeat on every following turn.
      // With the world clock on, the template does not render that block, so
      // the stamp stays off too and flag-off behavior is exactly the guard's.
      const pacingEscalationRequested =
        !worldClock && isPacingStale(turnsSinceComplication);

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
          // Extract decision weight from the decision
          decisionWeight = decision.decisionWeight;
          // For custom input, use the customText, otherwise use the regular text
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
      // Read characters/worlds at call time via getState() rather than
      // subscribing — they're only needed here inside this async handler, so a
      // store subscription would re-render the controller on every character/
      // world write for no benefit (issue #1358).
      const character = characterId
        ? useCharacterStore.getState().characters[characterId]
        : undefined;
      const world = useWorldStore.getState().worlds[worldId];
      const { skillCheckTags, rollResults, decisionOutcome } =
        evaluateDecisionSkillChecks({
          selectedOption,
          character,
          world,
          toast,
          onSkillCheckPerformed,
        });

      // Fatal outcome check: a critical decision only ends the run on a true
      // critical-failure roll (natural 1). An ordinary missed roll is a
      // survivable setback the AI narrates (and can still escalate via the
      // fatal-outcome tag the extraction stamps), so one unlucky-but-ordinary
      // roll no longer ends the story (issue #1426).
      const isFatalCriticalFailure = isFatalCriticalDecision(
        decisionWeight,
        rollResults
      );

      if (isFatalCriticalFailure) {
        suggestEnding(
          'fatal: a catastrophic failure on a pivotal decision left the character unable to continue.',
          'story-complete'
        );
      }

      // Combine existing tags with skill check tags
      const existingTags =
        recentSegments[recentSegments.length - 1]?.metadata?.tags || [];
      const currentTags = mergeTurnTags(existingTags, skillCheckTags);

      // Build skill check context for the AI
      let skillCheckContext = '';
      if (rollResults.length > 0) {
        const skillResultDescriptions = rollResults.map((r) => {
          if (r.isCriticalSuccess) {
            return `${r.skillName}: CRITICAL SUCCESS (natural 20)`;
          } else if (r.isCriticalFailure) {
            return `${r.skillName}: CRITICAL FAILURE (natural 1)`;
          } else if (r.success) {
            return `${r.skillName}: SUCCESS (rolled ${r.total} vs DC ${r.dc})`;
          } else {
            return `${r.skillName}: FAILURE (rolled ${r.total} vs DC ${r.dc})`;
          }
        });
        skillCheckContext = ` [Skill checks: ${skillResultDescriptions.join(', ')}]`;
      }

      // Same contract as the initial-scene race: losing the race aborts the
      // generation at the fetch layer instead of orphaning it until aiFetch's
      // ceiling fires.
      const segmentAbort = new AbortController();
      const segmentTimeoutPromise = new Promise<never>((_, reject) => {
        segmentTimeoutId = setTimeout(() => {
          segmentAbort.abort();
          reject(
            new Error(`Segment generation timed out after ${AI_GENERATION_TIMEOUT_MS}ms`)
          );
        }, AI_GENERATION_TIMEOUT_MS);
      });
      const result = await Promise.race([
        narrativeGenerator.generateSegment(
          {
            worldId,
            sessionId,
            characterIds: characterId ? [characterId] : [],
            narrativeContext: {
              worldId,
              currentSceneId: `scene-${Date.now()}`,
              characterIds: characterId ? [characterId] : [],
              previousSegments: recentSegments,
              currentTags,
              sessionId,
              recentSegments,
              turnsSinceComplication,
              worldClock,
              currentSituation: `Player chose: "${choiceText}"${skillCheckContext}`,
            },
            generationParameters: {
              includedTopics: [choiceText],
              // No desiredLength: the template scales the beat off decisionWeight
              // so weighty moments get more room than routine ones.
              decisionWeight,
              // Critical decisions with critical failures should have tragic tone
              desiredTone:
                decisionWeight === 'critical' &&
                rollResults.some((r) => r.isCriticalFailure)
                  ? 'tragic'
                  : undefined,
            },
          },
          { signal: segmentAbort.signal, onChunk: handleStreamChunk }
        ),
        segmentTimeoutPromise,
      ]);

      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        return;
      }

      const segmentId = `seg-${worldId}-${triggeringChoiceId}-${Date.now()}`;
      const now = new Date();
      const newSegment: NarrativeSegment = {
        id: segmentId,
        content: result.content,
        type: result.segmentType,
        characterIds: result.metadata.characterIds || [],
        metadata: {
          ...result.metadata,
          // Merge skill check tags into metadata
          tags: [...(result.metadata.tags || []), ...skillCheckTags],
          decisionOutcome,
          pacingEscalationRequested,
        },
        sessionId, // Explicitly set sessionId
        worldId, // Explicitly set worldId
        timestamp: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      // Add to local state
      setSegments((prev) => [...prev, newSegment]);

      // Add to store
      addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        characterIds: newSegment.characterIds || [],
        metadata: newSegment.metadata,
        worldId: newSegment.worldId,
        updatedAt: newSegment.updatedAt,
        timestamp: newSegment.timestamp,
      });

      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }

      // Check for ending indicators. Deferred off the per-turn path: it's
      // an extra Gemini round-trip that only feeds onEndingSuggested, which
      // choice generation below doesn't wait on.
      void checkForEndingIndicators(newSegment);

      // Generate choices if enabled - skip when the session is ending
      // (fatal/ending segment or a fatal critical-decision failure).
      // A fatal critical failure only ends the session when an ending handler
      // is wired: suggestEnding() is a no-op without onEndingSuggested. Without
      // a handler, keep generating choices so a standalone controller (harness,
      // story, embedder) can still move forward instead of stalling with no
      // ending and no choices.
      const criticalFailureEndsSession =
        isFatalCriticalFailure && Boolean(onEndingSuggested);
      if (
        generateChoices &&
        !isSessionEndingSegment(newSegment) &&
        !criticalFailureEndsSession
      ) {
        if (isCustomInput) {
          // Generate choices after a longer delay to ensure custom input is fully processed
          setTimeout(() => {
            generatePlayerChoices();
          }, 2000); // Longer delay after custom input
        } else {
          // Start generating AI choices immediately without showing fallback choices first
          setTimeout(() => {
            generatePlayerChoices();
          }, 500); // Normal timeout for predefined choices
        }
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
