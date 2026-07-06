import type { NarrativeSegment } from '@/types/narrative.types';

/**
 * Returns true when a narrative segment definitively ends the session, so
 * callers can skip generating player choices that would never be shown.
 *
 * Only definitive signals count: an `ending`-type segment, a `fatal-outcome`
 * tag, or a committed ending (`endingId`/`endingData`). Soft AI ending
 * *suggestions* are intentionally excluded — the player can decline them and
 * keep playing, and would then still need choices.
 */
export const isSessionEndingSegment = (segment: NarrativeSegment): boolean => {
  if (segment.type === 'ending') return true;
  if (segment.metadata?.tags?.includes('fatal-outcome')) return true;
  if (segment.metadata?.endingId != null || segment.metadata?.endingData != null) {
    return true;
  }
  return false;
};
