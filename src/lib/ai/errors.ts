// src/lib/ai/errors.ts

import { AIServiceError } from './types';

/**
 * Determines if an error is retryable
 * @param error - The error to check
 * @returns True if the error is retryable
 */
export const isRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  
  // Network and timeout errors
  if (
    message.includes('network') || 
    message.includes('timeout') ||
    message.includes('429') ||
    message.includes('rate limit')
  ) {
    return true;
  }
  
  // Authentication and invalid key errors are not retryable
  if (
    message.includes('401') ||
    message.includes('invalid api key') ||
    message.includes('unauthorized')
  ) {
    return false;
  }
  
  // Default to non-retryable
  return false;
};

/**
 * Creates a standardized error object
 * @param code - Error code
 * @param message - Human-readable error message
 * @param retryable - Whether this error can be retried
 * @returns Standardized error object
 */
export const createError = (
  code: string,
  message: string,
  retryable: boolean
): AIServiceError => {
  return { code, message, retryable };
};
