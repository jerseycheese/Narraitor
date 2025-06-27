/**
 * Memoization utilities for performance optimization
 * Provides lightweight caching for expensive operations
 */

interface MemoCache<T> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * Simple memoization with TTL (time-to-live) support
 */
export function memoizeWithTTL<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  ttlMs: number = 5 * 60 * 1000, // Default 5 minutes
  maxSize: number = 100
): (...args: TArgs) => TReturn {
  const cache = new Map<string, MemoCache<TReturn>>();

  return (...args: TArgs): TReturn => {
    const key = JSON.stringify(args);
    const now = Date.now();
    
    // Check if we have a valid cached result
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < ttlMs) {
      cached.hits++;
      return cached.value;
    }

    // Clean up expired entries periodically
    if (cache.size > maxSize) {
      for (const [k, v] of cache.entries()) {
        if ((now - v.timestamp) > ttlMs) {
          cache.delete(k);
        }
      }
    }

    // Compute new value
    const result = fn(...args);
    
    // Store in cache
    cache.set(key, {
      value: result,
      timestamp: now,
      hits: 0
    });

    return result;
  };
}

/**
 * Memoization for async functions with TTL
 */
export function memoizeAsyncWithTTL<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  ttlMs: number = 5 * 60 * 1000,
  maxSize: number = 100
): (...args: TArgs) => Promise<TReturn> {
  const cache = new Map<string, MemoCache<Promise<TReturn>>>();

  return async (...args: TArgs): Promise<TReturn> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    
    // Check if we have a valid cached promise
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < ttlMs) {
      cached.hits++;
      return cached.value;
    }

    // Clean up expired entries
    if (cache.size > maxSize) {
      for (const [k, v] of cache.entries()) {
        if ((now - v.timestamp) > ttlMs) {
          cache.delete(k);
        }
      }
    }

    // Create new promise and cache it
    const promise = fn(...args);
    
    cache.set(key, {
      value: promise,
      timestamp: now,
      hits: 0
    });

    return promise;
  };
}

/**
 * Simple memoization without TTL for deterministic functions
 */
export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  maxSize: number = 1000
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();

  return (...args: TArgs): TReturn => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    // Simple LRU eviction when cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  };
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  size: number;
  hits: number;
  totalEntries: number;
} {
  // This is a simplified version - in a real implementation,
  // you'd need to expose cache internals
  return {
    size: 0,
    hits: 0,
    totalEntries: 0
  };
}