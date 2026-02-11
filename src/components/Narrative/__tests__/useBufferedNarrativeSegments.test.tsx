import { renderHook, act } from '@testing-library/react';
import { useBufferedNarrativeSegments } from '../hooks/useBufferedNarrativeSegments';
import { createMockNarrativeSegment } from '@/lib/test-utils';

// We need to use the actual feature flags mock to be able to change it
jest.mock('@/lib/featureFlags', () => ({
  isFeatureEnabled: jest.fn(),
}));

import { isFeatureEnabled } from '@/lib/featureFlags';

describe('useBufferedNarrativeSegments', () => {
  const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<typeof isFeatureEnabled>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockIsFeatureEnabled.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const segments = [
    createMockNarrativeSegment({ id: 'seg-1', content: 'Historical content.' }),
    createMockNarrativeSegment({ id: 'seg-2', content: 'New content being streamed.' }),
  ];

  const flushBufferTimers = async (ticks = 20, intervalMs = 100) => {
    for (let i = 0; i < ticks; i += 1) {
      await act(async () => {
        jest.advanceTimersByTime(intervalMs);
      });
    }
  };

  it('returns segments immediately when feature is disabled', () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const { result } = renderHook(() => useBufferedNarrativeSegments(segments));

    expect(result.current.renderedSegments).toEqual(segments);
    expect(result.current.isBuffering).toBe(false);
  });

  it('streams only the newest segment when feature is enabled', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { result, rerender } = renderHook(
      ({ currentSegments }) => useBufferedNarrativeSegments(currentSegments, { intervalMs: 100, chunkSize: 1 }),
      { initialProps: { currentSegments: [segments[0]] } }
    );

    // Initial segment should be full
    expect(result.current.renderedSegments[0].content).toBe('Historical content.');
    expect(result.current.isBuffering).toBe(false);

    // Add new segment
    act(() => {
      rerender({ currentSegments: segments });
    });

    // New segment should start empty
    expect(result.current.renderedSegments[0].content).toBe('Historical content.');
    expect(result.current.renderedSegments[1].content).toBe('');
    expect(result.current.isBuffering).toBe(true);

    // Fast forward to end
    await flushBufferTimers(10, 100);

    expect(result.current.renderedSegments[1].content).toBe('New content being streamed.');
    expect(result.current.isBuffering).toBe(false);
  });

  it('does not re-stream historical segments when new ones are added', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { result, rerender } = renderHook(
      ({ currentSegments }) => useBufferedNarrativeSegments(currentSegments, { intervalMs: 100 }),
      { initialProps: { currentSegments: [segments[0]] } }
    );

    // Initial segment is historical, should be full immediately
    expect(result.current.renderedSegments[0].content).toBe('Historical content.');

    // Add a new segment
    const newSegments = [...segments];
    act(() => {
      rerender({ currentSegments: newSegments });
    });

    expect(result.current.renderedSegments[1].content).toBe('');

    await flushBufferTimers(10, 100);

    expect(result.current.renderedSegments[1].content).toBe('New content being streamed.');
    expect(result.current.isBuffering).toBe(false);
  });

  it('continues buffering when the active segment grows with the same id', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);

    const initialSegments = [segments[0]];
    const firstVersion = [
      segments[0],
      createMockNarrativeSegment({ id: 'seg-stream', content: 'You step forward.' }),
    ];

    const { result, rerender } = renderHook(
      ({ currentSegments }) =>
        useBufferedNarrativeSegments(currentSegments, { intervalMs: 75, chunkSize: 1 }),
      { initialProps: { currentSegments: initialSegments } }
    );

    act(() => {
      rerender({ currentSegments: firstVersion });
    });

    await flushBufferTimers(20, 75);
    expect(result.current.renderedSegments[1].content).toBe('You step forward.');
    expect(result.current.isBuffering).toBe(false);

    const grownVersion = [
      segments[0],
      createMockNarrativeSegment({
        id: 'seg-stream',
        content: 'You step forward. The floorboards creak beneath your weight.',
      }),
    ];

    act(() => {
      rerender({ currentSegments: grownVersion });
    });

    expect(result.current.isBuffering).toBe(true);
    expect(result.current.renderedSegments[1].content).toContain('You step forward.');
    expect(result.current.renderedSegments[1].content).not.toContain('floorboards');

    await flushBufferTimers(40, 75);
    expect(result.current.renderedSegments[1].content).toBe(
      'You step forward. The floorboards creak beneath your weight.'
    );
    expect(result.current.isBuffering).toBe(false);
  });
});
