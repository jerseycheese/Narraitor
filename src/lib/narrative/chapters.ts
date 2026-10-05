import type { NarrativeSegment, ChapterContext } from '@/types/narrative.types';
import type { StoryCheckpointRequestBody } from '@/types/story-checkpoint.types';
import { isWorldClockTurnSegment } from './worldClock';

/** Derives chapter progress from persisted boundaries, keeping older prose out of the next chapter. */
export function getChapterContext(
  segments: readonly NarrativeSegment[]
): ChapterContext {
  const boundaryIndex = segments.findLastIndex((segment) =>
    Boolean(segment.metadata?.chapter)
  );
  const boundary = segments[boundaryIndex]?.metadata.chapter;
  const recentSegments = segments.slice(boundaryIndex + 1);
  const turnCount = recentSegments.filter(isWorldClockTurnSegment).length;
  return {
    number: (boundary?.number ?? 0) + 1,
    isEnding: turnCount >= 9,
    isOpening: Boolean(boundary) && turnCount === 0,
    recap: boundary?.recap,
    recentSegments,
  };
}

const RECAP_FIELDS = [
  ['previously', 'Previously'],
  ['whereItStopped', 'Where it stopped'],
  ['cast', 'Cast'],
  ['holding', 'Holding'],
  ['openThreads', 'Open threads'],
] as const;

/** Keeps every label and line even when a provider exceeds the recap budget. */
export function formatChapterRecap(recap: Record<string, unknown>): string {
  const labelChars = RECAP_FIELDS.reduce(
    (sum, [, label]) => sum + label.length + 2,
    4
  );
  const fieldLimit = Math.floor((850 - labelChars) / RECAP_FIELDS.length);
  return RECAP_FIELDS.map(([key, label]) => {
    const value =
      typeof recap[key] === 'string'
        ? recap[key].trim().replace(/\s+/g, ' ')
        : '';
    return `${label}: ${(value || 'Not recorded.').slice(0, fieldLimit)}`;
  }).join('\n');
}

/** A failed recap request can preserve recorded canon without a second generation. */
export function fallbackChapterRecap(
  payload: StoryCheckpointRequestBody
): string {
  return formatChapterRecap({
    previously: payload.events.map((event) => event.description).join('; '),
    whereItStopped: [payload.currentLocation, payload.previousSegments?.at(-1)]
      .filter(Boolean)
      .join(': '),
    cast: payload.cast?.join('; ') || payload.characterName,
    holding: payload.holding?.join('; ') || 'None recorded.',
    openThreads: payload.openThreads?.join('; ') || 'None recorded.',
  });
}
