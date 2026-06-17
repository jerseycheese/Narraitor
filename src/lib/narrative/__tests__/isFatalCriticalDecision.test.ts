// Guards the rebalanced lethality rule (issue #1426): a CRITICAL decision is
// fatal only on a true critical-failure roll (natural 1), not on an ordinary
// missed roll, and lower-weight decisions are never instantly fatal.

import { isFatalCriticalDecision } from '../evaluateDecisionSkillChecks';

const critFail = { isCriticalFailure: true };
const ordinaryFail = { isCriticalFailure: false };

describe('isFatalCriticalDecision', () => {
  it('is fatal when a critical decision has a critical-failure roll (nat 1)', () => {
    expect(isFatalCriticalDecision('critical', [critFail])).toBe(true);
  });

  it('is fatal when any roll on a critical decision is a critical failure', () => {
    expect(
      isFatalCriticalDecision('critical', [ordinaryFail, critFail])
    ).toBe(true);
  });

  it('is NOT fatal on an ordinary missed roll on a critical decision', () => {
    expect(isFatalCriticalDecision('critical', [ordinaryFail])).toBe(false);
  });

  it('is NOT fatal for non-critical weights even on a critical-failure roll', () => {
    expect(isFatalCriticalDecision('major', [critFail])).toBe(false);
    expect(isFatalCriticalDecision('minor', [critFail])).toBe(false);
    expect(isFatalCriticalDecision(undefined, [critFail])).toBe(false);
  });

  it('is NOT fatal when there are no rolls', () => {
    expect(isFatalCriticalDecision('critical', [])).toBe(false);
  });
});
