/**
 * Minimal error handling utilities
 * Simple, focused functions for common error scenarios
 */

/**
 * Error type categories for consistent error handling throughout the application
 */
export enum ErrorType {
  NETWORK = 'network',
  SERVICE = 'service',
  VALIDATION = 'validation',
  AUTH = 'auth',
  UNKNOWN = 'unknown'
}

/**
 * User-facing severity, ordered from most to least prominent.
 * Drives how prominently an error is displayed (see ErrorDisplay):
 * critical is the most attention-grabbing, info the least intrusive.
 */
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface UserFriendlyError {
  title: string;
  message: string;
  /** Plain-language next step the user can take to resolve the issue. */
  suggestion?: string;
  actionLabel?: string;
  retryable: boolean;
  type: ErrorType;
  severity: ErrorSeverity;
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
 * Maps technical errors to user-friendly messages with categorization
 *
 * Categorizes errors by type to enable conditional error handling logic:
 * - NETWORK: Connection, timeout, and network-related errors
 * - SERVICE: Rate limiting and service availability errors
 * - AUTH: Authentication and authorization errors
 * - VALIDATION: Input validation and data format errors
 * - UNKNOWN: Unrecognized or generic errors
 *
 * This function provides generic user-friendly messages without exposing
 * raw error details. For domain-specific error handling (e.g., AI providers),
 * use the domain-specific wrapper functions that can safely append provider context.
 *
 * @param error - The error to map
 * @returns User-friendly error object with type categorization
 */
export function getUserFriendlyError(error: Error): UserFriendlyError {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect. Please check your internet connection.',
      suggestion: 'Make sure you are online, then try again.',
      actionLabel: 'Try Again',
      retryable: true,
      type: ErrorType.NETWORK,
      severity: 'error'
    };
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return {
      title: 'Request Timed Out',
      message: 'The request is taking too long. Please try again.',
      suggestion: 'This is usually temporary — wait a moment and try again.',
      actionLabel: 'Try Again',
      retryable: true,
      type: ErrorType.NETWORK,
      severity: 'warning'
    };
  }

  // Rate limit errors
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      title: 'Too Many Requests',
      message: 'Too many requests. Please wait a moment before trying again.',
      suggestion: 'Wait a minute or so before trying again.',
      actionLabel: 'Try Again Later',
      retryable: true,
      type: ErrorType.SERVICE,
      severity: 'warning'
    };
  }

  // Authentication errors
  if (message.includes('401') || message.includes('unauthorized')) {
    return {
      title: 'Authentication Error',
      message: 'Authentication failed. Please check your credentials.',
      suggestion: 'Check that your API key is set correctly in Settings.',
      retryable: false,
      type: ErrorType.AUTH,
      severity: 'critical'
    };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') ||
      message.includes('malformed') || message.includes('bad request') ||
      message.includes('400')) {
    return {
      title: 'Validation Error',
      message: 'The provided data is invalid. Please check your input and try again.',
      suggestion: 'Review the highlighted fields and correct any invalid entries.',
      retryable: false,
      type: ErrorType.VALIDATION,
      severity: 'warning'
    };
  }

  // Default for unknown errors
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    suggestion: 'If this keeps happening, try reloading the page.',
    actionLabel: 'Try Again',
    retryable: isRetryableError(error),
    type: ErrorType.UNKNOWN,
    severity: 'error'
  };
}

/**
 * Creates a standardized UserFriendlyError for store operations
 *
 * Used across all Zustand stores for consistent error handling.
 * Consolidates duplicate error factory functions from individual stores.
 *
 * @param title - Short error title (e.g., "World Not Found")
 * @param message - Detailed error message for user
 * @param type - Error type category (defaults to VALIDATION)
 * @param retryable - Whether the operation can be retried (defaults to false)
 * @param options - Optional severity and suggested next step
 * @returns UserFriendlyError object
 *
 * @example
 * ```ts
 * // In a store
 * if (!entity) {
 *   set({ error: createStoreError('Entity Not Found', 'The specified entity could not be found') });
 *   return;
 * }
 * ```
 */
export function createStoreError(
  title: string,
  message: string,
  type: ErrorType = ErrorType.VALIDATION,
  retryable = false,
  options: { severity?: ErrorSeverity; suggestion?: string } = {}
): UserFriendlyError {
  return {
    title,
    message,
    retryable,
    type,
    severity: options.severity ?? 'error',
    ...(options.suggestion && { suggestion: options.suggestion }),
  };
}
