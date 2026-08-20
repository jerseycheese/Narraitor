import { NarrativeSegment, NarrativeMetadata } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId, getTimestamp, safeTrim } from '../lib/utils';
import { logger } from '../lib/utils/logger';
import { normalizeText, NORM_DESC } from '../lib/utils/textNormalization';
import { applyWorldStateThreadUpdates } from '../lib/narrative/applyWorldStateThreadUpdates';
import { applyWorldClockUpdates } from '../lib/narrative/applyWorldClockUpdates';
import { formatDecisionText } from '../lib/narrative/formatDecisionText';
import { useSessionStore } from './sessionStore';
import { trackFunnelStep } from '@/lib/analytics/trackFunnelStep';
import type { NarrativeStoreSet, NarrativeStoreGet } from './narrativeStore.types';

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
      pacingEscalationRequested: metadata?.pacingEscalationRequested,
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

    // One post-segment extraction call covers goals and the world clock's
    // ledger. Fire-and-forget: nothing in this turn's UI waits on it. The
    // ledger note is stamped back onto the segment once reconciled so the
    // per-turn record survives reloads and the playtest harness can read it.
    const currentTurn = (get().sessionSegments[sessionId] || []).length;
    void Promise.resolve().then(async () => {
      try {
        // characterIds lists the NPCs in the scene; the player is the session's character.
        const session = useSessionStore.getState();
        const notes = await applyWorldClockUpdates({
          segment: newSegment,
          sessionId,
          characterId: segmentData.metadata?.characterIds?.[0],
          playerCharacterId: session.id === sessionId ? session.characterId ?? undefined : undefined,
          currentTurn,
        });
        const current = get().segments[segmentId];
        if (notes && current) {
          // A death the extractor read in the prose becomes the fatal-outcome
          // tag, which is what the controller and isSessionEndingSegment
          // already look for; until now nothing wrote it.
          const currentTags = current.metadata?.tags ?? [];
          const tags =
            notes.worldCost?.fatal && !currentTags.includes('fatal-outcome')
              ? [...currentTags, 'fatal-outcome']
              : currentTags;
          get().updateSegment(segmentId, {
            metadata: { ...current.metadata, ...notes, tags },
          });
        }
      } catch {
        // Silently fail extraction — not critical for narrative
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
