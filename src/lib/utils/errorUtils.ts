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

export interface UserFriendlyError {
  title: string;
  message: string;
  actionLabel?: string;
  retryable: boolean;
  type: ErrorType;
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
 * Includes provider error details in messages to help users understand what went wrong.
 *
 * @param error - The error to map
 * @returns User-friendly error object with type categorization
 */
export function getUserFriendlyError(error: Error): UserFriendlyError {
  const message = error.message.toLowerCase();
  const originalMessage = error.message;

  // Network errors
  if (message.includes('network')) {
    return {
      title: 'Connection Problem',
      message: `Unable to connect: ${originalMessage}`,
      actionLabel: 'Try Again',
      retryable: true,
      type: ErrorType.NETWORK
    };
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return {
      title: 'Request Timed Out',
      message: `Request timed out: ${originalMessage}`,
      actionLabel: 'Try Again',
      retryable: true,
      type: ErrorType.NETWORK
    };
  }

  // Rate limit errors
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      title: 'Too Many Requests',
      message: `Rate limit exceeded: ${originalMessage}`,
      actionLabel: 'Try Again Later',
      retryable: true,
      type: ErrorType.SERVICE
    };
  }

  // Authentication errors
  if (message.includes('401') || message.includes('unauthorized')) {
    return {
      title: 'Authentication Error',
      message: `Authentication failed: ${originalMessage}`,
      retryable: false,
      type: ErrorType.AUTH
    };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') ||
      message.includes('malformed') || message.includes('bad request') ||
      message.includes('400')) {
    return {
      title: 'Validation Error',
      message: `Invalid data: ${originalMessage}`,
      retryable: false,
      type: ErrorType.VALIDATION
    };
  }

  // Default for unknown errors
  return {
    title: 'Something Went Wrong',
    message: `Error: ${originalMessage}`,
    actionLabel: 'Try Again',
    retryable: isRetryableError(error),
    type: ErrorType.UNKNOWN
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
  retryable = false
): UserFriendlyError {
  return {
    title,
    message,
    retryable,
    type,
  };
}

/**
 * Creates a standardized API error response using NextResponse
 *
 * Consolidates duplicate error response formatting across all API routes.
 * Automatically converts errors to user-friendly messages and includes
 * all necessary fields for consistent client-side error handling.
 *
 * @param error - Error object or string message to convert
 * @param status - HTTP status code (defaults to 500)
 * @param details - Optional additional details to include in response
 * @returns NextResponse with standardized error format
 *
 * @example
 * ```ts
 * // In an API route
 * return createAPIErrorResponse(
 *   new Error('400 bad request: world data is required'),
 *   400
 * );
 *
 * // With additional details
 * return createAPIErrorResponse(
 *   new Error('Service error'),
 *   500,
 *   'Specific error details here'
 * );
 * ```
 */
export function createAPIErrorResponse(
  error: Error | string,
  status = 500,
  details?: string
): Response {
  // Dynamic require is necessary to avoid importing Next.js server components in test environments
  // where Request/Response globals are not available
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextResponse } = require('next/server');

  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const friendlyError = getUserFriendlyError(errorObj);

  return NextResponse.json(
    {
      error: friendlyError.message,
      title: friendlyError.title,
      type: friendlyError.type,
      retryable: friendlyError.retryable,
      ...(friendlyError.actionLabel && { actionLabel: friendlyError.actionLabel }),
      ...(details && { details })
    },
    { status }
  );
}