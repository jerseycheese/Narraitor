import { FIRST_SEGMENT_LOCATION } from '@/types/narrative.types';
import type { NarrativeSegment } from '@/types/narrative.types';
import type { CompletedSceneBeat } from '@/types/scene.types';
import { isWorldClockTurnSegment } from './worldClock';

// Five quiet turns leave room for conversation while intervening before
// the turn-15 staging collapse reported in the September playtests.
export const SCENE_STALL_QUIET_TURNS = 5;

/** Counts committed story turns since the last recorded transition or beat. */
export function countQuietSceneTurns(
  segments: readonly NarrativeSegment[],
  completedBeats: readonly Readonly<CompletedSceneBeat>[] = []
): number {
  const totalTurns = segments.filter(isWorldClockTurnSegment).length;
  const lastBeatTurn = completedBeats.reduce(
    (latest, beat) => Math.max(latest, beat.turnIndex), 0
  );
  const turnsSinceBeat = Math.max(0, totalTurns - lastBeatTurn);
  let quietTurns = 0;
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    const target = segment.metadata.sceneTransition?.to?.trim();
    if (target && target !== FIRST_SEGMENT_LOCATION) break;
    if (isWorldClockTurnSegment(segment)) quietTurns += 1;
  }
  return Math.min(quietTurns, turnsSinceBeat);
}
