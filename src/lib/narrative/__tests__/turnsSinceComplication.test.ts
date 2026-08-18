import { computeTurnsSinceComplication, isPacingStale } from '../turnsSinceComplication';
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

  it('keeps counting through majorEvent segments, which mark plot movement rather than setbacks', () => {
    const segments = [
      makeSegment({ majorEvent: 'Discovered they are wanted by the authorities' }),
      makeSegment({ majorEvent: 'Reached the far side of the ridge' }),
      makeSegment({ majorEvent: 'Struck a bargain with the ferryman' }),
      makeSegment({ decisionOutcome: 'success' }),
    ];
    expect(computeTurnsSinceComplication(segments)).toBe(4);
  });

  it('counts a cautious run of successes and majorEvents that used to read 0', () => {
    const segments = [
      makeSegment({ decisionOutcome: 'success', majorEvent: 'Found leaves pressed flat' }),
      makeSegment({ decisionOutcome: 'success', majorEvent: 'Followed the furrow uphill' }),
      makeSegment({ decisionOutcome: 'critical-success', majorEvent: 'Found an abandoned stretcher' }),
      makeSegment({ decisionOutcome: 'success', majorEvent: 'Picked up a locket in the grass' }),
    ];
    expect(computeTurnsSinceComplication(segments)).toBe(4);
  });

  it('resets when the pacing guard asked this segment to escalate', () => {
    const segments = [
      makeSegment({ pacingEscalationRequested: true }),
      makeSegment(),
      makeSegment(),
    ];
    expect(computeTurnsSinceComplication(segments)).toBe(2);
  });

  it('lets the streak climb back to the threshold after an escalation', () => {
    const segments = [
      makeSegment(),
      makeSegment(),
      makeSegment({ pacingEscalationRequested: true }),
      makeSegment(),
      makeSegment(),
      makeSegment(),
    ];
    expect(computeTurnsSinceComplication(segments)).toBe(3);
  });

  it('does not reset on a segment the guard left alone', () => {
    const segments = [
      makeSegment({ pacingEscalationRequested: false }),
      makeSegment(),
    ];
    expect(computeTurnsSinceComplication(segments)).toBe(2);
  });
});

describe('isPacingStale', () => {
  it('is quiet below three uneventful turns', () => {
    expect(isPacingStale(0)).toBe(false);
    expect(isPacingStale(2)).toBe(false);
  });

  it('fires at three and stays fired above it', () => {
    expect(isPacingStale(3)).toBe(true);
    expect(isPacingStale(9)).toBe(true);
  });

  it('treats an untracked streak as quiet', () => {
    expect(isPacingStale(undefined)).toBe(false);
  });
});
