import type { NarrativeSegment } from '@/types/narrative.types';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function pluralize(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 'S'} AGO`;
}

// Segment timestamps are typed as Date, but rehydrated/seeded state can hand
// back an ISO string instead (the same gap narrativeStore.persistence.ts
// works around for debugInfo/decision timestamps) — coerce defensively
// rather than assuming the type holds at runtime.
function toTime(timestamp: NarrativeSegment['timestamp']): number {
  return new Date(timestamp).getTime();
}

/**
 * Coarse session-relative label for the divider between two narrative
 * segments — a handful of buckets (MVP, not a full relative-time library),
 * derived from the gap between this segment's timestamp and the one before
 * it. Using the in-session gap rather than wall-clock "now" keeps labels
 * stable no matter when a past session is reopened.
 */
export function getSessionTimeDividerLabel(
  segment: NarrativeSegment,
  previousSegment: NarrativeSegment | null
): string {
  if (!previousSegment) {
    return 'BEGINNING OF SESSION';
  }

  // Clamp out-of-order timestamps to 0 rather than surfacing a negative gap.
  const deltaMs = Math.max(0, toTime(segment.timestamp) - toTime(previousSegment.timestamp));

  if (deltaMs < MINUTE_MS) {
    return 'JUST NOW';
  }
  if (deltaMs < HOUR_MS) {
    return pluralize(Math.floor(deltaMs / MINUTE_MS), 'MINUTE');
  }
  if (deltaMs < DAY_MS) {
    return pluralize(Math.floor(deltaMs / HOUR_MS), 'HOUR');
  }
  return pluralize(Math.floor(deltaMs / DAY_MS), 'DAY');
}
