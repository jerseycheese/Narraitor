// src/components/Narrative/__tests__/useEndingDetection.frequency.test.ts
//
// Covers the ending-check frequency gating (issue #992 opt #3): routine
// segments are throttled to every Nth segment, while high-signal segments
// (major events, critical decision outcomes) always run the AI check.

import { renderHook } from '@testing-library/react';
import { useEndingDetection } from '../useEndingDetection';
import { getTimestamp } from '@/lib/utils/timestamp';
import type { NarrativeSegment } from '@/types/narrative.types';

const mockGenerateContent = jest.fn();
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => ({ generateContent: mockGenerateContent }),
}));

const segment = (
  id: string,
  metadata: Partial<NarrativeSegment['metadata']> = {}
): NarrativeSegment => ({
  id,
  content: `Segment ${id} content.`,
  type: 'scene',
  timestamp: new Date(),
  sessionId: 'test-session',
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
  metadata: { tags: [], ...metadata },
});

const makeSegments = (count: number) =>
  Array.from({ length: count }, (_, i) => segment(String(i + 1)));

const renderDetection = (segments: NarrativeSegment[]) => {
  const onEndingSuggested = jest.fn();
  const { result } = renderHook(() =>
    useEndingDetection({
      sessionId: 'test-session',
      worldId: 'test-world',
      segments,
      onEndingSuggested,
    })
  );
  return { result, onEndingSuggested };
};

describe('useEndingDetection frequency gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateContent.mockResolvedValue({
      content: JSON.stringify({
        suggestEnding: false,
        confidence: 'low',
        endingType: 'none',
        reason: 'Story continues',
      }),
    });
  });

  it('runs the AI check on the first eligible segment', async () => {
    // 2 prior + 1 new = 3 total (the minimum, on-interval)
    const { result } = renderDetection(makeSegments(2));
    await result.current.checkForEndingIndicators(segment('3'));

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('skips routine segments that fall between check intervals', async () => {
    // 3 prior + 1 new = 4 total -> (4 - 3) % 3 = 1, not an interval boundary
    const { result } = renderDetection(makeSegments(3));
    await result.current.checkForEndingIndicators(segment('4'));

    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('always runs on a major-event segment even off-interval', async () => {
    const { result } = renderDetection(makeSegments(3));
    await result.current.checkForEndingIndicators(
      segment('4', { majorEvent: 'The kingdom falls' })
    );

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('does NOT treat a critical decision outcome as high-signal (throttles like routine)', async () => {
    // Under the rebalanced lethality (#1426) a critical failure is usually a
    // survivable setback, so it no longer forces an off-interval ending check.
    const { result } = renderDetection(makeSegments(4)); // total 5 -> off-interval
    await result.current.checkForEndingIndicators(
      segment('5', { decisionOutcome: 'critical-failure' })
    );

    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('runs again once the routine interval comes back around', async () => {
    // 5 prior + 1 new = 6 total -> (6 - 3) % 3 = 0
    const { result } = renderDetection(makeSegments(5));
    await result.current.checkForEndingIndicators(segment('6'));

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
