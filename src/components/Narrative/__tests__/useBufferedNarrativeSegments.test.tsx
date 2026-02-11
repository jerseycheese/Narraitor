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
    // Note: with fake timers and recursive effects, we need to advance timers and let effects run
    for (let i = 0; i < 10; i++) {
        await act(async () => {
            jest.advanceTimersByTime(100);
        });
    }
    
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
    
    for (let i = 0; i < 10; i++) {
        await act(async () => {
            jest.advanceTimersByTime(100);
        });
    }
    
    expect(result.current.renderedSegments[1].content).toBe('New content being streamed.');
    expect(result.current.isBuffering).toBe(false);
  });
});
