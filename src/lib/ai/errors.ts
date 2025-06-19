// src/lib/ai/errors.ts

import { AIServiceError } from './types';
import { isRetryableError } from '@/lib/utils/errorUtils';

// Re-export the shared utility for backward compatibility
export { isRetryableError };

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
