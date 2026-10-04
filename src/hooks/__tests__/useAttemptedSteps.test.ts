import { renderHook, act } from '@testing-library/react';
import { useAttemptedSteps } from '../useAttemptedSteps';

describe('useAttemptedSteps', () => {
  it('tracks marked steps and resets them', () => {
    const { result } = renderHook(() => useAttemptedSteps());

    expect(result.current.has(0)).toBe(false);
    expect(result.current.has(1)).toBe(false);

    act(() => {
      result.current.mark(0);
    });

    expect(result.current.has(0)).toBe(true);
    expect(result.current.has(1)).toBe(false);

    // Idempotent
    act(() => {
      result.current.mark(0);
    });
    expect(result.current.has(0)).toBe(true);

    act(() => {
      result.current.mark(1);
    });
    expect(result.current.has(0)).toBe(true);
    expect(result.current.has(1)).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.has(0)).toBe(false);
    expect(result.current.has(1)).toBe(false);
  });
});
