import { NarrativeSegment, NarrativeMetadata, DecisionOption } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId, getTimestamp, safeTrim } from '../lib/utils';
import { logger } from '../lib/utils/logger';
import { normalizeText, NORM_DESC } from '../lib/utils/textNormalization';
import { applyWorldStateThreadUpdates } from '../lib/narrative/applyWorldStateThreadUpdates';
import { useSessionStore } from './sessionStore';
import { useGoalStore } from './goalStore';
import { trackFunnelStep } from '@/lib/analytics/trackFunnelStep';
import type { NarrativeStoreSet, NarrativeStoreGet } from './narrativeStore.types';

const normalizeDecisionText = (text: string) => {
  const trimmed = safeTrim(text);
  if (!trimmed) return '';

  const withoutYou = trimmed.replace(/^you\b\s*/i, '');
  const withoutChoose = withoutYou.replace(/^(choose|decide|decided|chose)\s+to\s+/i, '');
  const withoutTo = withoutChoose.replace(/^to\s+/i, '');
  const firstChar = withoutTo.charAt(0);
  const normalized =
    firstChar && /[A-Z]/.test(firstChar)
      ? `${firstChar.toLowerCase()}${withoutTo.slice(1)}`
      : withoutTo;

  return `You choose to ${normalized}`.trim();
};

/**
 * An offered option is a verb phrase, so it reads as "You choose to <option>".
 * A typed action is already a complete first-person sentence, and prefixing one
 * shifts person as well as case ("You choose to i walk over to the mill"), so it
 * renders as the player wrote it.
 */
const formatDecisionText = (option: DecisionOption): string => {
  if (!option.isCustomInput) {
    return normalizeDecisionText(option.text);
  }

  const typed = safeTrim(option.customText || option.text);
  if (!typed) return '';

  const firstChar = typed.charAt(0);
  return /[a-z]/.test(firstChar)
    ? `${firstChar.toUpperCase()}${typed.slice(1)}`
    : typed;
};

const normalizeLocationKey = (value: string): string =>
  safeTrim(value)
    .replace(/[“”"‘’'`´]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();

export const createNarrativeSegmentActions = (
  set: NarrativeStoreSet,
  get: NarrativeStoreGet
) => ({
  // Add segment
  addSegment: (sessionId: EntityID, segmentData: Omit<NarrativeSegment, 'id' | 'sessionId' | 'createdAt'>): EntityID => {
    const normalizedContent = normalizeText(segmentData.content || '', NORM_DESC);
    if (!normalizedContent) {
      throw new Error('Segment content is required');
    }

    // Prevent adding segments to ended sessions
    if (get().isSessionEnded(sessionId)) {
      throw new Error('Cannot add segments to an ended session');
    }

    const segmentId = generateUniqueId('segment');
    const now = getTimestamp();

    const sessionSegmentIds = get().sessionSegments[sessionId] || [];
    const previousSegmentId =
      sessionSegmentIds.length > 0
        ? sessionSegmentIds[sessionSegmentIds.length - 1]
        : null;
    const previousSegment = previousSegmentId
      ? get().segments[previousSegmentId]
      : undefined;

    let metadata = segmentData.metadata
      ? { ...segmentData.metadata }
      : undefined;

    if (metadata?.location) {
      const cleanedLocation = safeTrim(metadata.location).replace(/\s+/g, ' ');

      if (!cleanedLocation) {
        const nextMetadata = { ...metadata };
        delete nextMetadata.location;
        metadata = Object.keys(nextMetadata).length > 0 ? nextMetadata : undefined;
      } else {
        const previousLocation = previousSegment?.metadata?.location;

        if (
          previousLocation &&
          normalizeLocationKey(previousLocation) === normalizeLocationKey(
            cleanedLocation
          )
        ) {
          metadata = {
            ...metadata,
            location: previousLocation,
          };
        } else {
          metadata = {
            ...metadata,
            location: cleanedLocation,
          };
        }
      }
    }

    // Link to the most recent decision (if any) - Issue #971
    const sessionDecisionIds = get().sessionDecisions[sessionId] || [];
    const latestDecisionId = sessionDecisionIds[sessionDecisionIds.length - 1];

    let causedByDecisionId: EntityID | undefined = metadata?.causedByDecisionId;
    let causedByDecisionText: string | undefined = metadata?.causedByDecisionText;

    if (latestDecisionId && !metadata?.causedByDecisionId) {
      const latestDecision = get().decisions[latestDecisionId];
      const selectedOption = latestDecision?.options.find(
        opt => opt.id === latestDecision.selectedOptionId
      );

      if (selectedOption?.text) {
        causedByDecisionId = latestDecisionId;
        causedByDecisionText = formatDecisionText(selectedOption);
      }
    }

    const finalMetadata: NarrativeMetadata = {
      mood: metadata?.mood,
      tags: metadata?.tags ?? [],
      location: metadata?.location,
      characterIds: metadata?.characterIds,
      characters: metadata?.characters,
      speakerId: metadata?.speakerId,
      itemsAcquired: metadata?.itemsAcquired,
      itemsLost: metadata?.itemsLost,
      endingId: metadata?.endingId,
      endingData: metadata?.endingData,
      tone: metadata?.tone,
      majorEvent: metadata?.majorEvent,
      causedByDecisionId,
      causedByDecisionText,
      decisionOutcome: metadata?.decisionOutcome,
      continuity: metadata?.continuity,
      debugInfo: metadata?.debugInfo, // Preserve debug info from AI generation
    };

    const newSegment: NarrativeSegment = {
      ...segmentData,
      metadata: finalMetadata,
      content: normalizeText(segmentData.content, NORM_DESC),
      id: segmentId,
      sessionId,
      createdAt: now,
    };

    // Check if this is the first segment BEFORE updating state
    const sessionSegmentsBeforeAdd = get().sessionSegments[sessionId] || [];
    const isFirstSegment = sessionSegmentsBeforeAdd.length === 0;

    set((state) => {
      // Initialize session segments if not exists
      const sessionSegments = state.sessionSegments[sessionId] || [];

      return {
        segments: {
          ...state.segments,
          [segmentId]: newSegment,
        },
        sessionSegments: {
          ...state.sessionSegments,
          [sessionId]: [...sessionSegments, segmentId],
        },
      };
    });

    // A generated narrative segment just landed in state and is on its way
    // to the player - this is the turn-level play-depth signal.
    trackFunnelStep('narrative-turn');

    // Update the saved session's narrative count
    try {
      const sessionSegments = get().sessionSegments[sessionId] || [];
      useSessionStore.getState().updateSavedSessionNarrativeCount(sessionId, sessionSegments.length);
    } catch (error) {
      logger.error('[NarrativeStore]', 'Failed to update session narrative count:', error);
    }

    // Process the segment for goal extraction asynchronously.
    // Passing segment + sessionId in avoids the goalStore needing to read
    // back from narrativeStore (which previously required a dynamic import
    // to dodge a circular dependency).
    void Promise.resolve().then(async () => {
      try {
        await useGoalStore.getState().processSegmentForGoals(
          newSegment,
          sessionId,
          segmentData.metadata?.characterIds?.[0]
        );
      } catch {
        // Silently fail goal processing — not critical for narrative
      }
    });

    void applyWorldStateThreadUpdates({
      newSegment,
      originalSegmentData: segmentData,
      finalMetadata,
      sessionId,
      isFirstSegment,
    });

    return segmentId;
  },

  // Update segment
  updateSegment: (segmentId: EntityID, updates: Partial<NarrativeSegment>) => set((state) => {
    if (!state.segments[segmentId]) {
      return { error: 'Segment not found' };
    }

    const updatedSegment: NarrativeSegment = {
      ...state.segments[segmentId],
      ...updates,
    };

    return {
      segments: {
        ...state.segments,
        [segmentId]: updatedSegment,
      },
      error: null,
    };
  }),

  // Delete segment
  deleteSegment: (segmentId: EntityID) => set((state) => {
    const segment = state.segments[segmentId];
    if (!segment) {
      return state;
    }

    const { [segmentId]: _deletedSegment, ...remainingSegments } = state.segments;

    // Remove from session segments
    const sessionId = segment.sessionId;
    const updatedSessionSegments = sessionId ? (state.sessionSegments[sessionId]?.filter(
      (id) => id !== segmentId
    ) || []) : [];

    return {
      segments: remainingSegments,
      sessionSegments: sessionId ? {
        ...state.sessionSegments,
        [sessionId]: updatedSessionSegments,
      } : state.sessionSegments,
    };
  }),

  // Get session segments
  getSessionSegments: (sessionId: EntityID): NarrativeSegment[] => {
    const state = get();
    const segmentIds = state.sessionSegments[sessionId] || [];
    return segmentIds.map((id) => state.segments[id]).filter(Boolean);
  },

  // Clear a specific session's segments
  clearSessionSegments: (sessionId: EntityID) => {
    const state = get();
    const segmentIdsToRemove = state.sessionSegments[sessionId] || [];

    if (segmentIdsToRemove.length === 0) return;

    // Remove segments from the segments record
    const updatedSegments = { ...state.segments };
    segmentIdsToRemove.forEach(id => {
      delete updatedSegments[id];
    });

    // Remove session from sessionSegments
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [sessionId]: removedSession, ...remainingSessionSegments } = state.sessionSegments;

    set({
      segments: updatedSegments,
      sessionSegments: remainingSessionSegments
    });
  },
});
