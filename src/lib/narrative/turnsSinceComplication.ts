import type { NarrativeSegment } from '@/types/narrative.types';

/**
 * Outcomes that count as a real complication for pacing purposes. A pure
 * success (or no skill check at all, e.g. a cautious no-requirement choice)
 * doesn't reset the streak — only a segment where something actually went
 * wrong does.
 */
const COMPLICATION_OUTCOMES = new Set(['failure', 'critical-failure', 'mixed']);

/**
 * Counts how many segments in a row have passed since the last complication
 * (a failed or mixed skill-check outcome), walking backward from the most
 * recent segment. A cautious playstyle that never triggers a skill check, or
 * always succeeds, never resets this count — it just keeps climbing, giving
 * the narrative prompt a signal to escalate when a session has gone quiet
 * for too long.
 *
 * A segment's own majorEvent also resets the streak: a story-changing beat
 * (arrival, revelation, injury) is a complication in its own right even
 * without a dice roll behind it.
 */
export function computeTurnsSinceComplication(segments: NarrativeSegment[]): number {
  let count = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    const metadata = segments[i]?.metadata;
    const outcome = metadata?.decisionOutcome;
    const hadComplication = (outcome && COMPLICATION_OUTCOMES.has(outcome)) || Boolean(metadata?.majorEvent);
    if (hadComplication) {
      break;
    }
    count++;
  }
  return count;
}
