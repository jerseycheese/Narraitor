import type { EntityID } from '@/types/common.types';
import type { NarrativeSegment } from '@/types/narrative.types';
import { isSessionEndingSegment } from './isSessionEndingSegment';

/**
 * True when the latest passage has no choices of its own yet: the session has
 * no decision at all, or its latest decision is the one that produced the
 * passage and so has already been answered.
 */
export const isAwaitingChoices = (
  latestSegment: NarrativeSegment | undefined,
  latestDecisionId: EntityID | undefined
): boolean =>
  !!latestSegment &&
  !isSessionEndingSegment(latestSegment) &&
  (!latestDecisionId ||
    latestSegment.metadata?.causedByDecisionId === latestDecisionId);
