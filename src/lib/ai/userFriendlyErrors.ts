// src/lib/ai/userFriendlyErrors.ts

import { 
  getUserFriendlyError as getUserFriendlyErrorUtil,
  UserFriendlyError 
} from '@/lib/utils/errorUtils';

// Re-export the shared utilities with AI-specific customization
export type { UserFriendlyError } from '@/lib/utils/errorUtils';

/**
 * Maps technical errors to user-friendly messages with AI-specific context
 * @param error - The error to map
 * @returns User-friendly error object
 */
export function getUserFriendlyError(error: Error): UserFriendlyError {
  const baseError = getUserFriendlyErrorUtil(error);
  
  // Add AI-specific context to certain error messages
  const message = error.message.toLowerCase();
  
  if (message.includes('network')) {
    return {
      ...baseError,
      message: 'Unable to connect to the AI service. Please check your internet connection.'
    };
  }
  
  if (message.includes('timeout')) {
    return {
      ...baseError,
      message: 'The AI service is taking too long to respond. Please try again.'
    };
  }
  
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      ...baseError,
      message: 'You have made too many requests. Please wait a moment before trying again.'
    };
  }
  
  if (message.includes('401') || message.includes('unauthorized')) {
    return {
      ...baseError,
      message: 'Unable to authenticate with the AI service. Please check your API key.'
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

// Re-export for backward compatibility (avoid exporting to prevent naming conflict with utils)
// Components can import isRetryableError from '@/lib/utils' instead
