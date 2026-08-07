import { computeTurnsSinceComplication } from '../turnsSinceComplication';
import type { NarrativeSegment } from '@/types/narrative.types';

function makeSegment(overrides: Partial<NarrativeSegment['metadata']> = {}): NarrativeSegment {
  return {
    id: 'segment-id',
    content: 'content',
    type: 'scene',
    metadata: { tags: [], ...overrides },
    timestamp: new Date(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('computeTurnsSinceComplication', () => {
  it('returns 0 for an empty session', () => {
    expect(computeTurnsSinceComplication([])).toBe(0);
  });

  it('counts every segment when no complication ever occurred (the cautious-play chain)', () => {
    const segments = [makeSegment(), makeSegment(), makeSegment()];
    expect(computeTurnsSinceComplication(segments)).toBe(3);
  });

  it('resets to 0 right after a failed skill check', () => {
    const segments = [
      makeSegment(),
      makeSegment({ decisionOutcome: 'failure' }),
    ];
    expect(computeTurnsSinceComplication(segments)).toBe(0);
  });

  it('only counts segments after the most recent complication', () => {
    const segments = [
      makeSegment({ decisionOutcome: 'failure' }),
      makeSegment(),
      makeSegment(),
    ];
    expect(computeTurnsSinceComplication(segments)).toBe(2);
  });

  it('treats a critical-failure and a mixed outcome as complications too', () => {
    expect(
      computeTurnsSinceComplication([makeSegment({ decisionOutcome: 'critical-failure' }), makeSegment()])
    ).toBe(1);
    expect(
      computeTurnsSinceComplication([makeSegment({ decisionOutcome: 'mixed' }), makeSegment()])
    ).toBe(1);
  });

  it('does not reset on a pure success or critical success', () => {
    const segments = [
      makeSegment({ decisionOutcome: 'success' }),
      makeSegment({ decisionOutcome: 'critical-success' }),
    ];
    expect(computeTurnsSinceComplication(segments)).toBe(2);
  });

  it('resets on a segment with a majorEvent even without a skill check', () => {
    const segments = [
      makeSegment({ majorEvent: 'Discovered they are wanted by the authorities' }),
      makeSegment(),
    ];
    expect(computeTurnsSinceComplication(segments)).toBe(1);
  });
});
