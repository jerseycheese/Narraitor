import { isSessionEndingSegment } from '../isSessionEndingSegment';
import type { NarrativeSegment } from '@/types/narrative.types';

const buildSegment = (overrides: Partial<NarrativeSegment> = {}): NarrativeSegment => ({
  id: 'segment-1',
  content: 'Some narrative.',
  type: 'scene',
  metadata: { tags: [], ...overrides.metadata },
  timestamp: new Date('2025-01-01T12:00:00Z'),
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
  ...overrides,
});

describe('isSessionEndingSegment', () => {
  it('returns true for an ending-type segment', () => {
    expect(isSessionEndingSegment(buildSegment({ type: 'ending' }))).toBe(true);
  });

  it('returns true when the segment is tagged fatal-outcome', () => {
    expect(
      isSessionEndingSegment(buildSegment({ metadata: { tags: ['fatal-outcome'] } }))
    ).toBe(true);
  });

  it('returns true when the segment carries committed ending data', () => {
    expect(
      isSessionEndingSegment(buildSegment({ metadata: { tags: [], endingId: 'ending-1' } }))
    ).toBe(true);
  });

  it('returns false for a normal scene segment', () => {
    expect(isSessionEndingSegment(buildSegment())).toBe(false);
  });

  // Anti-stranding guard: a soft AI ending *suggestion* never tags the segment
  // or sets ending data, so the segment must not count as session-ending —
  // otherwise a player who declines the suggestion would be left with no choices.
  it('returns false for a segment that only triggered a soft AI ending suggestion', () => {
    expect(
      isSessionEndingSegment(buildSegment({ type: 'scene', metadata: { tags: ['climax'] } }))
    ).toBe(false);
  });

  it('does not throw when metadata is missing', () => {
    const segment = { ...buildSegment(), metadata: undefined } as unknown as NarrativeSegment;
    expect(isSessionEndingSegment(segment)).toBe(false);
  });
});
