// src/lib/ai/userFriendlyErrors.ts

import { 
  getUserFriendlyError as getUserFriendlyErrorUtil,
  UserFriendlyError 
} from '@/lib/utils/errorUtils';

// Re-export the shared utilities with AI-specific customization
export type { UserFriendlyError } from '@/lib/utils/errorUtils';

/**
 * Maps technical errors to user-friendly messages with AI-specific context
 *
 * Includes provider error details to help users understand what went wrong
 * with the AI service.
 *
 * @param error - The error to map
 * @returns User-friendly error object
 */
export function getUserFriendlyError(error: Error): UserFriendlyError {
  const baseError = getUserFriendlyErrorUtil(error);

  // Add AI-specific context to certain error messages
  const message = error.message.toLowerCase();
  const originalMessage = error.message;

  if (message.includes('network')) {
    return {
      ...baseError,
      message: `AI service connection error: ${originalMessage}`
    };
  }

  if (message.includes('timeout')) {
    return {
      ...baseError,
      message: `AI service timeout: ${originalMessage}`
    };
  }

  if (message.includes('429') || message.includes('rate limit')) {
    return {
      ...baseError,
      message: `AI service rate limit: ${originalMessage}`
    };
  }

  if (message.includes('401') || message.includes('unauthorized')) {
    return {
      ...baseError,
      message: `AI service authentication error: ${originalMessage}`
    };
  }

  return baseError;
}

/**
 * Simple function that returns just the user-friendly message
 * Used by components that just need the error message text
 * @param error - The error to map
 * @returns User-friendly error message string
 */
export function userFriendlyError(error: Error): string {
  return getUserFriendlyError(error).message;
}

// Note: isRetryableError is not re-exported here to avoid naming conflicts with utils module
// Components should import isRetryableError from '@/lib/utils' instead
