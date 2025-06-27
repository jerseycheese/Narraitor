// src/lib/utils/__tests__/memoization.test.ts

import { memoize, memoizeWithTTL } from '../memoization';

describe('Memoization Utilities', () => {
  describe('memoize', () => {
    it('should cache function results', () => {
      let callCount = 0;
      const expensiveFunction = (x: number) => {
        callCount++;
        return x * x;
      };

      const memoizedFn = memoize(expensiveFunction);

      // First call
      expect(memoizedFn(5)).toBe(25);
      expect(callCount).toBe(1);

      // Second call with same input - should use cache
      expect(memoizedFn(5)).toBe(25);
      expect(callCount).toBe(1);

      // Different input - should call function
      expect(memoizedFn(3)).toBe(9);
      expect(callCount).toBe(2);
    });

    it('should respect cache size limit', () => {
      let callCount = 0;
      const fn = (x: number) => {
        callCount++;
        return x;
      };

      const memoizedFn = memoize(fn, 2); // Max size 2

      memoizedFn(1);
      memoizedFn(2);
      memoizedFn(3); // Should evict first entry

      // First entry should be evicted
      memoizedFn(1);
      expect(callCount).toBe(4); // 1, 2, 3, 1 again
    });
  });

  describe('memoizeWithTTL', () => {
    it('should cache results with TTL', () => {
      let callCount = 0;
      const fn = (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoizedFn = memoizeWithTTL(fn, 1000); // 1 second TTL

      expect(memoizedFn(5)).toBe(10);
      expect(callCount).toBe(1);

      // Should use cache immediately
      expect(memoizedFn(5)).toBe(10);
      expect(callCount).toBe(1);
    });

    it('should expire cache after TTL', async () => {
      let callCount = 0;
      const fn = (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoizedFn = memoizeWithTTL(fn, 10); // 10ms TTL

      expect(memoizedFn(5)).toBe(10);
      expect(callCount).toBe(1);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 15));

      // Should call function again
      expect(memoizedFn(5)).toBe(10);
      expect(callCount).toBe(2);
    });
  });
});