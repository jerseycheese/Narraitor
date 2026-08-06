import { renderHook, act } from '@testing-library/react';
import { useBufferedNarrativeSegments } from '../useBufferedNarrativeSegments';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { createMockNarrativeSegment } from '@/lib/test-utils';

jest.mock('@/lib/featureFlags');

const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<typeof isFeatureEnabled>;

describe('useBufferedNarrativeSegments', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockIsFeatureEnabled.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const segments = [
    createMockNarrativeSegment({ id: 'seg-1', content: 'First segment.' }),
  ];

  it('returns segments unchanged when BUFFERED_STREAMING is disabled', () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const { result } = renderHook(() => useBufferedNarrativeSegments(segments));

    expect(result.current.renderedSegments).toEqual(segments);
    expect(result.current.isBuffering).toBe(false);
  });

  it('buffers latest segment when BUFFERED_STREAMING is enabled', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const initialSegments = [segments[0]];

    const { result, rerender } = renderHook(
      ({ segs }) => useBufferedNarrativeSegments(segs),
      { initialProps: { segs: initialSegments } }
    );

    // Initial segments are already revealed (in the revealedSegmentIds set)
    expect(result.current.renderedSegments[0].content).toBe('First segment.');

    // Add a new segment
    const newSegments = [
      ...initialSegments,
      createMockNarrativeSegment({ id: 'seg-2', content: 'Streaming content.' }),
    ];

    act(() => {
      rerender({ segs: newSegments });
    });

    // New segment should start with empty content (buffering)
    expect(result.current.renderedSegments[1].content).toBe('');
    expect(result.current.isBuffering).toBe(true);

    // Advance timers to reveal chunks progressively
    for (let i = 0; i < 20; i++) {
      act(() => {
        jest.advanceTimersByTime(100);
      });
    }

    // After enough time, the full content should be revealed
    expect(result.current.renderedSegments[1].content).toBe('Streaming content.');
    expect(result.current.isBuffering).toBe(false);
  });

  it('reveals a realistic-length segment within the same fast timer budget as a short one', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const initialSegments = [segments[0]];
    // ~1600 chars, in line with a typical 3-4 paragraph narrative beat.
    const longContent = 'The old stone bridge creaked underfoot as you crossed into the market square. '.repeat(20);

    const { result, rerender } = renderHook(
      ({ segs }) => useBufferedNarrativeSegments(segs),
      { initialProps: { segs: initialSegments } }
    );

    const newSegments = [
      ...initialSegments,
      createMockNarrativeSegment({ id: 'seg-2', content: longContent }),
    ];

    act(() => {
      rerender({ segs: newSegments });
    });

    expect(result.current.renderedSegments[1].content).toBe('');

    // 40 ticks is comfortably enough for production pacing to finish this
    // content, but nowhere near the ~290 ticks the old CLS-testing pacing
    // (chunkSize 2, 75ms interval) would have needed for the same length.
    for (let i = 0; i < 40; i++) {
      act(() => {
        jest.advanceTimersByTime(100);
      });
    }

    expect(result.current.renderedSegments[1].content).toBe(longContent);
    expect(result.current.isBuffering).toBe(false);
  });

  it('does not re-buffer already-revealed segments', () => {
    mockIsFeatureEnabled.mockReturnValue(true);

    const twoSegments = [
      createMockNarrativeSegment({ id: 'seg-1', content: 'First.' }),
      createMockNarrativeSegment({ id: 'seg-2', content: 'Second.' }),
    ];

    const { result, rerender } = renderHook(
      ({ segs }) => useBufferedNarrativeSegments(segs),
      { initialProps: { segs: twoSegments } }
    );

    // Both segments are in the initial set, so they're already revealed
    expect(result.current.renderedSegments[0].content).toBe('First.');
    expect(result.current.renderedSegments[1].content).toBe('Second.');

    // Re-render with same segments
    act(() => {
      rerender({ segs: twoSegments });
    });

    // Should still show full content
    expect(result.current.renderedSegments[0].content).toBe('First.');
    expect(result.current.renderedSegments[1].content).toBe('Second.');
  });
});
