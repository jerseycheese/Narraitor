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
 * A dropped stream surfaces as a DOM AbortError whose message ("BodyStreamBuffer
 * was aborted") contains none of the words the patterns below look for, so the
 * name has to be read alongside the message or the failure looks unrecognized.
 */
function isAbortError(error: Error): boolean {
  return error.name === 'AbortError' || error.message.toLowerCase().includes('aborted');
}

/**
 * Determines if an error should be retryable based on common patterns
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Network, abort, timeout, and rate limit errors are retryable
  return isAbortError(error) ||
         message.includes('network') ||
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

  // Timeout errors. Checked before the network branch below, which would
  // otherwise swallow them: AbortSignal.timeout raises a TimeoutError reading
  // "aborted due to timeout", and telling a player their connection is down
  // when the request merely ran long sends them to fix the wrong thing.
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

  // Network errors. An aborted stream is the same class of transport failure as
  // a dropped connection, and the player can pick the story back up either way.
  if (message.includes('network') || isAbortError(error)) {
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

  // Moderation blocks. Checked before the validation branch below, which would
  // otherwise swallow these on the word "invalid" and tell the player to review
  // their input — when the input was fine and the provider simply refused it.
  if (message.includes('blocked this content') || message.includes('content filter')) {
    return {
      title: 'Provider Blocked This',
      message: "Your provider refused to generate this. That's their moderation, not a problem with your story.",
      suggestion: 'Try the scene again, or switch to a provider whose moderation suits your world.',
      actionLabel: 'Try Again',
      retryable: true,
      type: ErrorType.SERVICE,
      severity: 'warning'
    };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') ||
      message.includes('malformed') || message.includes('bad request') ||
      message.includes('400')) {
    return {
      title: 'Check Your Input',
      message: "Some of what you entered doesn't look right.",
      suggestion: 'Review the highlighted fields and fix anything marked.',
      retryable: false,
      type: ErrorType.VALIDATION,
      severity: 'warning'
    };
  }

  // Default for unknown errors
  return {
    title: 'Something Went Wrong',
    message: "That didn't work.",
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
