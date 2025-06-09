/**
 * Minimal error handling utilities
 * Simple, focused functions for common error scenarios
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  actionLabel?: string;
  retryable: boolean;
}

/**
 * Determines if an error should be retryable based on common patterns
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Network, timeout, and rate limit errors are retryable
  return message.includes('network') || 
         message.includes('timeout') ||
         message.includes('429') ||
         message.includes('rate limit');
}

/**
 * Maps technical errors to user-friendly messages
 */
export function getUserFriendlyError(error: Error): UserFriendlyError {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect. Please check your internet connection.',
      actionLabel: 'Try Again',
      retryable: true
    };
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return {
      title: 'Request Timed Out', 
      message: 'The request is taking too long. Please try again.',
      actionLabel: 'Try Again',
      retryable: true
    };
  }

  // Rate limit errors
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      title: 'Too Many Requests',
      message: 'Too many requests. Please wait a moment before trying again.',
      actionLabel: 'Try Again Later',
      retryable: true
    };
  }

  // Authentication errors
  if (message.includes('401') || message.includes('unauthorized')) {
    return {
      title: 'Authentication Error',
      message: 'Authentication failed. Please check your credentials.',
      retryable: false
    };
  }

  // Default for unknown errors
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    actionLabel: 'Try Again',
    retryable: isRetryableError(error)
  };
}

/**
 * Simple function that returns just the user-friendly message text
 */
export function userFriendlyErrorMessage(error: Error): string {
  return getUserFriendlyError(error).message;
}