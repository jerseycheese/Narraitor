// src/lib/ai/userFriendlyErrors.ts

import { 
  getUserFriendlyError as getUserFriendlyErrorUtil,
  UserFriendlyError 
} from '@/lib/utils/errorUtils';

// Re-export the shared utilities with AI-specific customization
export type { UserFriendlyError } from '@/lib/utils/errorUtils';

/**
 * Sanitizes error message for safe display to users
 * Removes potentially sensitive information and truncates long messages
 */
function sanitizeErrorMessage(message: string, maxLength = 200): string {
  // Remove common sensitive patterns
  let sanitized = message
    // Remove file paths
    .replace(/\/[\w\-./]+/g, '[path]')
    // Remove potential stack traces (lines starting with 'at ')
    .replace(/\n\s*at\s+.*/g, '')
    // Remove newlines and excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }

  return sanitized;
}

/**
 * Maps technical errors to user-friendly messages with AI-specific context
 *
 * Appends sanitized provider error details to help users understand what went
 * wrong with the AI service, while protecting against exposing sensitive information
 * like stack traces, file paths, or internal system details.
 *
 * @param error - The error to map
 * @returns User-friendly error object with sanitized provider context
 */
export function getUserFriendlyError(error: Error): UserFriendlyError {
  const baseError = getUserFriendlyErrorUtil(error);

  // Add AI-specific context with sanitized error details
  const message = error.message.toLowerCase();
  const sanitizedDetail = sanitizeErrorMessage(error.message);

  if (message.includes('network')) {
    return {
      ...baseError,
      message: `Unable to connect to AI service: ${sanitizedDetail}`
    };
  }

  if (message.includes('timeout')) {
    return {
      ...baseError,
      message: `AI service timed out: ${sanitizedDetail}`
    };
  }

  if (message.includes('429') || message.includes('rate limit')) {
    return {
      ...baseError,
      message: `AI service rate limit exceeded: ${sanitizedDetail}`
    };
  }

  if (message.includes('401') || message.includes('unauthorized')) {
    return {
      ...baseError,
      message: `AI service authentication failed: ${sanitizedDetail}`
    };
  }

  // For other AI errors, append sanitized detail to base message
  if (baseError.type === 'service' || baseError.type === 'unknown') {
    return {
      ...baseError,
      message: `${baseError.message} (${sanitizedDetail})`
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
