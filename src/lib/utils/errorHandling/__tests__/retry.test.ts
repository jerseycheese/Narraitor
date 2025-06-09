/**
 * Tests for retry functionality
 */

import { withRetry, makeRetryable, withRetryAndValidation, RETRY_PRESETS } from '../retry';

// Mock timers for testing delays
jest.useFakeTimers();

describe('Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('withRetry', () => {
    it('should succeed on first attempt when operation succeeds', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const resultPromise = withRetry(operation);
      
      // Fast-forward through any immediate timeouts
      jest.runAllTimers();
      
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue('success');
      
      const resultPromise = withRetry(operation, { maxAttempts: 3, baseDelay: 100 });
      
      // Fast-forward through all delays
      await jest.runAllTimersAsync();
      
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('401 Unauthorized'));
      
      const resultPromise = withRetry(operation, { maxAttempts: 3 });
      
      jest.runAllTimers();
      
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('401 Unauthorized');
      expect(result.attempts).toBe(3); // Max attempts tried but stopped early
      expect(operation).toHaveBeenCalledTimes(1); // Only called once due to non-retryable error
    });

    it('should respect maxAttempts limit', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const resultPromise = withRetry(operation, { maxAttempts: 2 });
      
      await jest.runAllTimersAsync();
      
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(2);
      expect(operation).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should use custom shouldRetry function', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Custom error'));
      const shouldRetry = jest.fn().mockReturnValue(false);
      
      const resultPromise = withRetry(operation, { 
        maxAttempts: 3, 
        shouldRetry 
      });
      
      jest.runAllTimers();
      
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should track total time correctly', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const resultPromise = withRetry(operation, { baseDelay: 1000 });
      
      // Advance timers by the expected delay
      await jest.runAllTimersAsync();
      
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.totalTime).toBeGreaterThan(0);
    }, 10000);
  });

  describe('makeRetryable', () => {
    it('should create a retryable version of a function', async () => {
      const originalFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const retryableFn = makeRetryable(originalFn, { maxAttempts: 2 });
      
      const resultPromise = retryableFn('arg1', 'arg2');
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    }, 10000);

    it('should throw error when all retries fail', async () => {
      const originalFn = jest.fn().mockRejectedValue(new Error('Persistent error'));
      const retryableFn = makeRetryable(originalFn, { maxAttempts: 2 });
      
      const resultPromise = retryableFn();
      jest.runAllTimers();

      await expect(resultPromise).rejects.toThrow('Persistent error');
    });
  });

  describe('withRetryAndValidation', () => {
    it('should retry when result fails validation', async () => {
      const operation = jest.fn()
        .mockResolvedValueOnce('') // Invalid - empty string
        .mockResolvedValueOnce('invalid') // Invalid - doesn't pass validator
        .mockResolvedValue('valid'); // Valid

      const validator = (result: string) => result === 'valid';
      
      const resultPromise = withRetryAndValidation(operation, validator, { maxAttempts: 3 });
      
      await jest.runAllTimersAsync();
      
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data).toBe('valid');
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should fail when validation never passes', async () => {
      const operation = jest.fn().mockResolvedValue('invalid');
      const validator = (result: string) => result === 'valid';
      
      const resultPromise = withRetryAndValidation(operation, validator, { maxAttempts: 2 });
      
      await jest.runAllTimersAsync();
      
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(2);
      expect(operation).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('RETRY_PRESETS', () => {
    it('should have all expected presets', () => {
      expect(RETRY_PRESETS.QUICK).toBeDefined();
      expect(RETRY_PRESETS.STANDARD).toBeDefined();
      expect(RETRY_PRESETS.AGGRESSIVE).toBeDefined();
      expect(RETRY_PRESETS.PATIENT).toBeDefined();
    });

    it('should have different configurations for each preset', () => {
      expect(RETRY_PRESETS.QUICK.maxAttempts).toBeLessThan(RETRY_PRESETS.AGGRESSIVE.maxAttempts);
      expect(RETRY_PRESETS.QUICK.baseDelay).toBeLessThan(RETRY_PRESETS.PATIENT.baseDelay);
      expect(RETRY_PRESETS.STANDARD.maxDelay).toBeLessThan(RETRY_PRESETS.PATIENT.maxDelay);
    });
  });
});