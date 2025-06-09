/**
 * Retry logic with exponential backoff
 * Implements intelligent retry strategies for recoverable errors
 */

import { RetryConfig, RetryResult } from './types';
import { isRetryableError } from './core';

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: Error, attempt: number) => {
    // Don't retry on the last attempt
    if (attempt >= DEFAULT_RETRY_CONFIG.maxAttempts) {
      return false;
    }
    return isRetryableError(error);
  }
};

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * exponentialDelay;
  const delayWithJitter = exponentialDelay + jitter;
  
  return Math.min(delayWithJitter, config.maxDelay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts: attempt,
        totalTime: Date.now() - startTime
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      const shouldRetry = finalConfig.shouldRetry 
        ? finalConfig.shouldRetry(lastError, attempt)
        : isRetryableError(lastError);
      
      // If this is the last attempt or shouldn't retry, throw the error
      if (attempt >= finalConfig.maxAttempts || !shouldRetry) {
        break;
      }
      
      // Calculate delay and wait before next attempt
      const delay = calculateDelay(attempt, finalConfig);
      await sleep(delay);
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts: finalConfig.maxAttempts,
    totalTime: Date.now() - startTime
  };
}

/**
 * Create a retryable version of a function
 */
export function makeRetryable<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  config: Partial<RetryConfig> = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    const result = await withRetry(() => fn(...args), config);
    
    if (result.success && result.data !== undefined) {
      return result.data;
    }
    
    throw result.error || new Error('Operation failed after retries');
  };
}

/**
 * Retry configuration presets for common scenarios
 */
export const RETRY_PRESETS = {
  /**
   * Quick retry for UI operations
   */
  QUICK: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 2
  } as RetryConfig,

  /**
   * Standard retry for API calls
   */
  STANDARD: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  } as RetryConfig,

  /**
   * Aggressive retry for critical operations
   */
  AGGRESSIVE: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2
  } as RetryConfig,

  /**
   * Patient retry for background operations
   */
  PATIENT: {
    maxAttempts: 10,
    baseDelay: 5000,
    maxDelay: 300000, // 5 minutes
    backoffMultiplier: 1.5
  } as RetryConfig
};

/**
 * Check if an operation result indicates it should be retried
 */
export function shouldRetryResult<T>(
  result: T,
  validator?: (result: T) => boolean
): boolean {
  if (validator) {
    return !validator(result);
  }
  
  // Default validation - retry if result is null, undefined, or empty
  if (result === null || result === undefined) {
    return true;
  }
  
  if (Array.isArray(result) && result.length === 0) {
    return true;
  }
  
  if (typeof result === 'string' && result.trim() === '') {
    return true;
  }
  
  return false;
}

/**
 * Execute an operation with retry logic that also validates the result
 */
export async function withRetryAndValidation<T>(
  operation: () => Promise<T>,
  validator: (result: T) => boolean,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // Validate the result
      if (validator(result)) {
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime: Date.now() - startTime
        };
      }
      
      // Result is invalid, treat as retriable error if not last attempt
      if (attempt >= finalConfig.maxAttempts) {
        break;
      }
      
      // Wait before next attempt
      const delay = calculateDelay(attempt, finalConfig);
      await sleep(delay);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      const shouldRetry = finalConfig.shouldRetry 
        ? finalConfig.shouldRetry(lastError, attempt)
        : isRetryableError(lastError);
      
      if (attempt >= finalConfig.maxAttempts || !shouldRetry) {
        break;
      }
      
      const delay = calculateDelay(attempt, finalConfig);
      await sleep(delay);
    }
  }
  
  return {
    success: false,
    error: lastError || new Error('Operation result failed validation'),
    attempts: finalConfig.maxAttempts,
    totalTime: Date.now() - startTime
  };
}