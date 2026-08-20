// Guards the cadence budget on lethal pivotal decisions. Critical weight is
// model-assigned and unbudgeted, so a high-tension world can mark every turn
// pivotal; without a cooldown the per-turn kill chance compounds into a
// coin-flip over a long run.

import {
  FATAL_DECISION_COOLDOWN_TURNS,
  isFatalCadenceOffCooldown,
  turnsSinceFatalRiskAllowed,
} from '../fatalDecisionCadence';
import type { NarrativeSegment } from '@/types/narrative.types';

const makeSegment = (fatalRiskAllowed?: boolean): NarrativeSegment => ({
  id: `seg-${Math.random()}`,
  content: 'The corridor narrows.',
  type: 'scene',
  sessionId: 'test-session',
  worldId: 'test-world',
  characterIds: [],
  metadata: { tags: [], fatalRiskAllowed },
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const quietTurns = (count: number) =>
  Array.from({ length: count }, () => makeSegment());

describe('turnsSinceFatalRiskAllowed', () => {
  it('counts every segment when no turn has put a fatal outcome on the table', () => {
    expect(turnsSinceFatalRiskAllowed(quietTurns(4))).toBe(4);
  });

  it('counts back only to the last turn that allowed a fatal outcome', () => {
    const segments = [
      ...quietTurns(5),
      makeSegment(true),
      ...quietTurns(2),
    ];
    expect(turnsSinceFatalRiskAllowed(segments)).toBe(2);
  });

  it('is zero on the turn straight after one that allowed a fatal outcome', () => {
    expect(turnsSinceFatalRiskAllowed([...quietTurns(3), makeSegment(true)])).toBe(0);
  });
});

describe('isFatalCadenceOffCooldown', () => {
  it('holds a fatal outcome back over the opening turns of a fresh session', () => {
    expect(isFatalCadenceOffCooldown([])).toBe(false);
    expect(
      isFatalCadenceOffCooldown(quietTurns(FATAL_DECISION_COOLDOWN_TURNS - 1))
    ).toBe(false);
  });

  it('allows a fatal outcome once the opening turns have passed', () => {
    expect(
      isFatalCadenceOffCooldown(quietTurns(FATAL_DECISION_COOLDOWN_TURNS))
    ).toBe(true);
  });

  it('holds every following pivotal decision back until the cooldown runs out', () => {
    const spent = [
      ...quietTurns(FATAL_DECISION_COOLDOWN_TURNS),
      makeSegment(true),
    ];
    expect(isFatalCadenceOffCooldown(spent)).toBe(false);
    expect(
      isFatalCadenceOffCooldown([
        ...spent,
        ...quietTurns(FATAL_DECISION_COOLDOWN_TURNS - 1),
      ])
    ).toBe(false);
  });

  it('allows another fatal outcome a full cooldown after the last one', () => {
    const segments = [
      ...quietTurns(FATAL_DECISION_COOLDOWN_TURNS),
      makeSegment(true),
      ...quietTurns(FATAL_DECISION_COOLDOWN_TURNS),
    ];
    expect(isFatalCadenceOffCooldown(segments)).toBe(true);
  });
});
