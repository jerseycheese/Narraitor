import type { NarrativeSegment } from '@/types/narrative.types';

/**
 * Turns that must pass before a pivotal decision may carry a fatal outcome
 * again.
 *
 * A decision's critical weight is assigned by the model, and nothing budgets
 * it: a siege or a chase can read as pivotal on every single turn. Weight plus
 * a natural 1 alone therefore works out to a flat ~5% chance of death per turn
 * in those worlds, which compounds to better-than-even odds across a long run
 * and ends most of them in the first act. Spacing the lethal moments keeps the
 * odds proportional to the story's length rather than to how tense its genre
 * reads, without softening what a natural 1 means when it lands.
 */
export const FATAL_DECISION_COOLDOWN_TURNS = 10;

/**
 * Turns since the run last let a pivotal decision be fatal, walking backward
 * from the most recent segment.
 *
 * The marker records permission, not death: a turn that was allowed to be
 * fatal and rolled well still spends the budget. That is what spaces the
 * lethal moments out instead of letting every critical decision in a tense
 * stretch take its own 5% swing.
 *
 * A session with no marker at all counts every segment, which gives the
 * opening turns of a story the same protection the cooldown gives the rest.
 */
export function turnsSinceFatalRiskAllowed(
  segments: NarrativeSegment[]
): number {
  let count = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i]?.metadata?.fatalRiskAllowed) {
      break;
    }
    count++;
  }
  return count;
}

/**
 * Whether the run may put a fatal outcome on the table this turn. The caller
 * still needs a critical-weight decision and a natural 1 for anyone to die.
 */
export function isFatalCadenceOffCooldown(
  segments: NarrativeSegment[]
): boolean {
  return turnsSinceFatalRiskAllowed(segments) >= FATAL_DECISION_COOLDOWN_TURNS;
}
