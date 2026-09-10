import { renderHook, act } from '@testing-library/react';
import { useSessionPacing } from '../useSessionPacing';

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

jest.mock('@/components/ui/toast', () => ({
  useToast: () => mockToast,
}));

describe('useSessionPacing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires milestone toasts once at threshold and deduplicates on re-render', () => {
    const { rerender } = renderHook(
      ({ count }) =>
        useSessionPacing({
          segmentCount: count,
          milestoneInterval: 5,
        }),
      { initialProps: { count: 4 } }
    );

    expect(mockToast.info).not.toHaveBeenCalled();

    // Cross first threshold (5)
    act(() => {
      rerender({ count: 5 });
    });
    expect(mockToast.info).toHaveBeenCalledTimes(1);
    expect(mockToast.info).toHaveBeenCalledWith('5 story beats in');

    // Re-render at 5 should not re-fire
    act(() => {
      rerender({ count: 5 });
    });
    expect(mockToast.info).toHaveBeenCalledTimes(1);

    // Increment before next threshold
    act(() => {
      rerender({ count: 7 });
    });
    expect(mockToast.info).toHaveBeenCalledTimes(1);

    // Cross second threshold (10)
    act(() => {
      rerender({ count: 10 });
    });
    expect(mockToast.info).toHaveBeenCalledTimes(2);
    expect(mockToast.info).toHaveBeenLastCalledWith('10 story beats in');
  });

  it('triggers soft break prompt at time threshold', () => {
    const breakIntervalMs = 10 * 60 * 1000; // 10 minutes
    const { result } = renderHook(() =>
      useSessionPacing({
        segmentCount: 2,
        breakIntervalMs,
      })
    );

    expect(result.current.showBreakPrompt).toBe(false);

    // Advance right before threshold
    act(() => {
      jest.advanceTimersByTime(breakIntervalMs - 1000);
    });
    expect(result.current.showBreakPrompt).toBe(false);

    // Reach threshold
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.showBreakPrompt).toBe(true);
  });

  it('dismissing break prompt keeps session going and schedules next break', () => {
    const breakIntervalMs = 15 * 60 * 1000;
    const { result } = renderHook(() =>
      useSessionPacing({
        segmentCount: 5,
        breakIntervalMs,
      })
    );

    // Trigger first break prompt
    act(() => {
      jest.advanceTimersByTime(breakIntervalMs);
    });
    expect(result.current.showBreakPrompt).toBe(true);

    // Dismiss prompt
    act(() => {
      result.current.dismissBreakPrompt();
    });
    expect(result.current.showBreakPrompt).toBe(false);

    // Advance another interval
    act(() => {
      jest.advanceTimersByTime(breakIntervalMs);
    });
    expect(result.current.showBreakPrompt).toBe(true);
  });

  it('tracks session metrics including start time, segment count, and decision count', () => {
    const fixedStartTime = new Date('2026-09-10T12:00:00Z');
    const { result } = renderHook(() =>
      useSessionPacing({
        segmentCount: 8,
        decisionCount: 3,
        startTime: fixedStartTime,
      })
    );

    expect(result.current.metrics.startTime).toBe(fixedStartTime);
    expect(result.current.metrics.segmentCount).toBe(8);
    expect(result.current.metrics.decisionCount).toBe(3);
  });
});
