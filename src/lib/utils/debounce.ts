/**
 * Debounce utility - Shared debouncing functionality
 * Prevents excessive function calls by delaying execution
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): Promise<ReturnType<T>>;
  cancel: () => void;
  flush: () => Promise<ReturnType<T>> | undefined;
};

/**
 * Creates a debounced version of the provided function
 * @param func The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced function with cancel and flush methods
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastResolve: ((value: ReturnType<T>) => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastReject: ((reason?: any) => void) | null = null;

  const debouncedFn = (...args: Parameters<T>): Promise<ReturnType<T>> => {
    lastArgs = args;

    return new Promise<ReturnType<T>>((resolve, reject) => {
      lastResolve = resolve;
      lastReject = reject;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          timeoutId = null;
          lastArgs = null;
          lastResolve = null;
          lastReject = null;
        }
      }, delay);
    });
  };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // Silently cancel without throwing - better for cleanup scenarios
    lastArgs = null;
    lastResolve = null;
    lastReject = null;
  };

  debouncedFn.flush = (): Promise<ReturnType<T>> | undefined => {
    if (timeoutId && lastArgs && lastResolve) {
      clearTimeout(timeoutId);
      timeoutId = null;
      
      const args = lastArgs;
      const resolve = lastResolve;
      const reject = lastReject;
      
      lastArgs = null;
      lastResolve = null;
      lastReject = null;

      return Promise.resolve().then(async () => {
        try {
          const result = await func(...args);
          resolve(result);
          return result;
        } catch (error) {
          if (reject) reject(error);
          throw error;
        }
      });
    }
    return undefined;
  };

  return debouncedFn;
}

/**
 * Simple throttle function - limits function calls to once per interval
 * @param func The function to throttle
 * @param interval The minimum interval between calls in milliseconds
 * @returns A throttled function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= interval) {
      // Execute immediately
      lastCallTime = now;
      func(...args);
    } else {
      // Schedule for later
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func(...args);
      }, interval - timeSinceLastCall);
    }
  };
}

/**
 * Hook-compatible debounce for React components
 * @param callback The callback to debounce
 * @param delay The delay in milliseconds
 * @param deps Dependency array for the callback
 * @returns A stable debounced callback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): DebouncedFunction<T> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  
  return React.useMemo(() => {
    return debounce(callback, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, callback, ...deps]);
}