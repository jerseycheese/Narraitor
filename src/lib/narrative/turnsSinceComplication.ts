import type { DecisionOutcome, NarrativeSegment } from '@/types/narrative.types';

/**
 * Outcomes that count as a real complication for pacing purposes. A pure
 * success, or no skill check at all (a cautious no-requirement choice),
 * doesn't reset the streak. Only a segment where the dice went against the
 * player does, and the scene prompt now requires a failed attempt to cost
 * something concrete, so it earns the reset.
 */
const COMPLICATION_OUTCOMES: ReadonlySet<DecisionOutcome> = new Set<DecisionOutcome>([
  'failure',
  'critical-failure',
  'mixed',
]);

/**
 * Consecutive uneventful segments before the scene prompt starts pushing the
 * model to break the calm. Below this, a quiet stretch reads as normal pacing;
 * at or above it, cautious play stops being a free pass.
 */
const STALE_PACING_THRESHOLD = 3;

/**
 * Single source of truth for "the scene has gone quiet". The scene template
 * reads it to decide whether to render the rising-tension block, and the
 * controller reads it to stamp the segment that block produced. Keeping the
 * threshold in one place is what stops those two halves drifting apart.
 */
export function isPacingStale(turnsSinceComplication: number | undefined): boolean {
  return (turnsSinceComplication ?? 0) >= STALE_PACING_THRESHOLD;
}

/**
 * Counts how many segments in a row have passed since the last complication,
 * walking backward from the most recent segment. A cautious playstyle that
 * never triggers a skill check, or always succeeds, never resets this count.
 * It just keeps climbing, giving the narrative prompt a signal to escalate
 * when a session has gone quiet for too long.
 *
 * Two things reset the streak: a skill check that went against the player, and
 * a segment the pacing guard itself asked to escalate. The second is what lets
 * the guard stand down. A complication the model invented on request carries no
 * dice roll, so without a marker of its own the guidance would fire on every
 * subsequent turn forever.
 *
 * `majorEvent` deliberately does NOT reset it. That field marks plot movement
 * of any kind, and its own rules qualify revelations, alliances, arrivals and
 * milestones, which are the story going well. Measured live it came back set on
 * the large majority of segments. A signal that fires on most turns cannot mark
 * the exception.
 */
export function computeTurnsSinceComplication(segments: NarrativeSegment[]): number {
  let count = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    const metadata = segments[i]?.metadata;
    const outcome = metadata?.decisionOutcome;
    const hadComplication =
      (outcome !== undefined && COMPLICATION_OUTCOMES.has(outcome)) ||
      Boolean(metadata?.pacingEscalationRequested);
    if (hadComplication) {
      break;
    }
    count++;
  }
  return count;
}
