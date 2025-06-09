// src/lib/ai/userFriendlyErrors.ts

import { getUserFriendlyError as getUnifiedUserFriendlyError, userFriendlyError as unifiedUserFriendlyError } from '@/lib/utils/errorHandling';

// Re-export the unified interface for backward compatibility
export interface UserFriendlyError {
  title: string;
  message: string;
  actionLabel?: string;
  retryable: boolean;
}

/**
 * Maps technical errors to user-friendly messages
 * Now uses the unified error handling system
 * @param error - The error to map
 * @returns User-friendly error object
 * @deprecated Use processError from @/lib/utils/errorHandling for new code
 */
export function getUserFriendlyError(error: Error): UserFriendlyError {
  // Use the unified error handling system
  const unifiedResult = getUnifiedUserFriendlyError(error);
  
  // Convert to legacy format for backward compatibility
  return {
    title: unifiedResult.title,
    message: unifiedResult.message,
    actionLabel: unifiedResult.actionLabel,
    retryable: unifiedResult.retryable
  };
}

/**
 * Simple function that returns just the user-friendly message
 * Now uses the unified error handling system
 * @param error - The error to map
 * @returns User-friendly error message string
 * @deprecated Use userFriendlyError from @/lib/utils/errorHandling for new code
 */
export function userFriendlyError(error: Error): string {
  // Use the unified error handling system
  return unifiedUserFriendlyError(error);
}
