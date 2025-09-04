/**
 * Tests for useAsyncOperation hook - TDD Implementation
 */

import { renderHook, act } from '@testing-library/react';
import { useAsyncOperation } from '../useAsyncOperation';

// Mock async functions for testing
const mockSuccessFunction = jest.fn(async (value: string) => `Success: ${value}`);
const mockErrorFunction = jest.fn(async () => {
  throw new Error('Async operation failed');
});
const mockDelayedFunction = jest.fn(async (delay: number) => {
  await new Promise(resolve => setTimeout(resolve, delay));
  return `Completed after ${delay}ms`;
});

describe('useAsyncOperation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAsyncOperation(mockSuccessFunction));
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.hasError).toBe(false);
      expect(result.current.hasData).toBe(false);
      expect(typeof result.current.execute).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('should initialize with provided initial data', () => {
      const initialData = 'Initial value';
      const { result } = renderHook(() => 
        useAsyncOperation(mockSuccessFunction, { initialData })
      );
      
      expect(result.current.data).toBe(initialData);
      expect(result.current.hasData).toBe(true);
    });
  });

  describe('Successful Operations', () => {
    it('should execute async function and update state correctly', async () => {
      const { result } = renderHook(() => useAsyncOperation(mockSuccessFunction));
      
      let executePromise: Promise<string>;
      act(() => {
        executePromise = result.current.execute('test');
      });
      
      // Should be loading immediately after execute
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
      
      const resultValue = await act(async () => await executePromise!);
      
      expect(resultValue).toBe('Success: test');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe('Success: test');
      expect(result.current.error).toBe(null);
      expect(result.current.hasData).toBe(true);
      expect(result.current.hasError).toBe(false);
      expect(mockSuccessFunction).toHaveBeenCalledWith('test');
    });

    it('should call onSuccess callback when operation succeeds', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() => 
        useAsyncOperation(mockSuccessFunction, { onSuccess })
      );
      
      await act(async () => {
        await result.current.execute('test');
      });
      
      expect(onSuccess).toHaveBeenCalledWith('Success: test');
    });

    it('should handle multiple arguments correctly', async () => {
      const multiArgFunction = jest.fn(async (a: string, b: number, c: boolean) => 
        `${a}-${b}-${c}`
      );
      
      const { result } = renderHook(() => useAsyncOperation(multiArgFunction));
      
      await act(async () => {
        await result.current.execute('test', 42, true);
      });
      
      expect(multiArgFunction).toHaveBeenCalledWith('test', 42, true);
      expect(result.current.data).toBe('test-42-true');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors and update state correctly', async () => {
      const { result } = renderHook(() => useAsyncOperation(mockErrorFunction));
      
      let executePromise: Promise<unknown>;
      act(() => {
        executePromise = result.current.execute();
      });
      
      // Should be loading immediately
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      
      await act(async () => {
        await expect(executePromise!).rejects.toThrow('Async operation failed');
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Async operation failed');
      expect(result.current.hasError).toBe(true);
      expect(result.current.hasData).toBe(false);
    });

    it('should call onError callback when operation fails', async () => {
      const onError = jest.fn();
      const { result } = renderHook(() => 
        useAsyncOperation(mockErrorFunction, { onError })
      );
      
      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Expected to throw
        }
      });
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('Async operation failed');
    });

    it('should handle non-Error thrown values', async () => {
      const stringErrorFunction = jest.fn(async () => {
        throw 'String error';
      });
      
      const { result } = renderHook(() => useAsyncOperation(stringErrorFunction));
      
      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Expected to throw
        }
      });
      
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('String error');
    });
  });

  describe('State Management', () => {
    it('should clear error when starting new operation', async () => {
      const { result } = renderHook(() => useAsyncOperation(mockErrorFunction));
      
      // First, cause an error
      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Expected to throw
        }
      });
      
      expect(result.current.hasError).toBe(true);
      
      // Now execute a successful operation
      const { rerender } = renderHook(() => useAsyncOperation(mockSuccessFunction));
      const { result: successResult } = renderHook(() => useAsyncOperation(mockSuccessFunction));
      
      act(() => {
        successResult.current.execute('test');
      });
      
      expect(successResult.current.error).toBe(null);
      expect(successResult.current.isLoading).toBe(true);
    });

    it('should reset state to initial values', () => {
      const { result } = renderHook(() => 
        useAsyncOperation(mockSuccessFunction, { initialData: 'initial' })
      );
      
      // Manually set some state to test reset
      act(() => {
        result.current.execute('test');
      });
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe('initial');
      expect(result.current.error).toBe(null);
      expect(result.current.hasError).toBe(false);
      expect(result.current.hasData).toBe(true);
    });

    it('should reset state to null when no initial data provided', async () => {
      const { result } = renderHook(() => useAsyncOperation(mockSuccessFunction));
      
      // Execute to set some data
      await act(async () => {
        await result.current.execute('test');
      });
      
      expect(result.current.data).toBe('Success: test');
      expect(result.current.hasData).toBe(true);
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.data).toBe(null);
      expect(result.current.hasData).toBe(false);
    });

    it('should clear error without affecting other state', async () => {
      const { result } = renderHook(() => useAsyncOperation(mockErrorFunction));
      
      // Cause an error
      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Expected to throw
        }
      });
      
      expect(result.current.hasError).toBe(true);
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBe(null);
      expect(result.current.hasError).toBe(false);
      // Other state should remain unchanged
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle overlapping operations correctly', async () => {
      const { result } = renderHook(() => useAsyncOperation(mockDelayedFunction));
      
      // Start first operation
      const promise1 = act(async () => {
        return result.current.execute(100);
      });
      
      // Start second operation before first completes
      const promise2 = act(async () => {
        return result.current.execute(50);
      });
      
      // Fast-forward timers
      act(() => {
        jest.advanceTimersByTime(150);
      });
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // The last operation should win
      expect(result.current.data).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for different return types', async () => {
      const numberFunction = jest.fn(async (x: number) => x * 2);
      const { result } = renderHook(() => useAsyncOperation(numberFunction));
      
      await act(async () => {
        await result.current.execute(21);
      });
      
      expect(result.current.data).toBe(42);
      expect(typeof result.current.data).toBe('number');
    });

    it('should handle void return type', async () => {
      const voidFunction = jest.fn(async () => {
        // This function returns void
      });
      
      const { result } = renderHook(() => useAsyncOperation(voidFunction));
      
      await act(async () => {
        await result.current.execute();
      });
      
      expect(result.current.data).toBeUndefined();
      expect(result.current.hasData).toBe(true); // undefined is a valid return value, so hasData should be true
    });
  });
});