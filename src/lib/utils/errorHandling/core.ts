/**
 * Core error processing functionality
 * 
 * This module provides the central error processing engine that coordinates
 * error mapping, context creation, and recovery strategy determination.
 * 
 * @module ErrorHandlingCore
 * @version 1.0.0
 * @since MVP
 */

import { ErrorContext, ErrorMapper, ErrorMatcher, BaseError, UserFriendlyError, ErrorRecovery } from './types';

/**
 * Registry of error mappers for different error types
 * 
 * Manages the collection of error mappers and provides matching logic
 * to determine which mapper should handle a specific error.
 * 
 * @class ErrorMapperRegistry
 */
class ErrorMapperRegistry {
  private mappers: Array<{ matcher: ErrorMatcher; mapper: ErrorMapper }> = [];

  /**
   * Register an error mapper for specific error types
   * 
   * @param matcher - Function that determines if this mapper should handle the error
   * @param mapper - Function that transforms the error into an ErrorContext
   */
  register(matcher: ErrorMatcher, mapper: ErrorMapper): void {
    this.mappers.push({ matcher, mapper });
  }

  /**
   * Find and apply the appropriate mapper for an error
   * 
   * @param error - The error to map
   * @returns The mapped ErrorContext or null if no mapper matches
   */
  map(error: Error): ErrorContext | null {
    for (const { matcher, mapper } of this.mappers) {
      if (matcher(error)) {
        return mapper(error);
      }
    }
    return null;
  }

  /**
   * Clear all registered mappers (mainly for testing)
   * 
   * @internal Used primarily for test cleanup
   */
  clear(): void {
    this.mappers = [];
  }
}

/**
 * Global error mapper registry
 * 
 * Singleton instance that manages all error mappers across the application.
 * Domain-specific mappers register themselves with this registry during setup.
 * 
 * @example
 * ```typescript
 * // Register a custom error mapper
 * errorMapperRegistry.register(
 *   (error) => error.message.includes('custom'),
 *   (error) => createErrorContext({ code: 'CUSTOM_ERROR' }, { title: 'Custom Error' })
 * );
 * ```
 */
export const errorMapperRegistry = new ErrorMapperRegistry();

/**
 * Process an error through the unified error handling system
 * 
 * This is the main entry point for error processing. It attempts to find
 * a registered mapper for the error and falls back to default handling.
 * 
 * @param error - The error to process
 * @returns A complete ErrorContext with user-friendly messaging and recovery options
 * 
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   const errorContext = processError(error);
 *   showErrorToUser(errorContext.userError);
 * }
 * ```
 */
export function processError(error: Error): ErrorContext {
  // Try to find a registered mapper
  const mappedError = errorMapperRegistry.map(error);
  if (mappedError) {
    return mappedError;
  }

  // Fallback to default error handling
  return createDefaultErrorContext(error);
}

/**
 * Create a default error context for unmapped errors
 * 
 * Provides a fallback error context when no specific mapper is found.
 * Ensures all errors have consistent structure even without specific handling.
 * 
 * @param error - The unmapped error
 * @returns A default ErrorContext with generic user messaging
 * @internal
 */
function createDefaultErrorContext(error: Error): ErrorContext {
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    retryable: false,
    cause: error,
    userError: {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      actionLabel: 'Try Again',
      retryable: false,
      shouldNotify: true
    },
    recovery: {
      canRecover: false
    },
    timestamp: new Date(),
    domain: 'unknown'
  };
}

/**
 * Helper function to create standardized error contexts
 * 
 * Provides a builder-like interface for creating ErrorContext objects
 * with consistent structure and sensible defaults.
 * 
 * @param baseError - Core error information
 * @param userError - User-facing error messaging
 * @param recovery - Recovery strategy options
 * @param domain - The application domain where the error occurred
 * @returns A complete ErrorContext object
 * 
 * @example
 * ```typescript
 * const context = createErrorContext(
 *   { code: 'STORAGE_FULL', message: 'Storage quota exceeded' },
 *   { title: 'Storage Full', message: 'Please free up some space' },
 *   { canRecover: true, strategy: 'cleanup' },
 *   'storage'
 * );
 * ```
 */
export function createErrorContext(
  baseError: Partial<BaseError>,
  userError: Partial<UserFriendlyError>,
  recovery: Partial<ErrorRecovery> = {},
  domain: ErrorContext['domain'] = 'unknown'
): ErrorContext {
  return {
    code: baseError.code || 'GENERIC_ERROR',
    message: baseError.message || 'An error occurred',
    retryable: baseError.retryable ?? false,
    cause: baseError.cause,
    context: baseError.context,
    userError: {
      title: userError.title || 'Error',
      message: userError.message || 'An error occurred',
      actionLabel: userError.actionLabel,
      retryable: userError.retryable ?? false,
      shouldNotify: userError.shouldNotify ?? true
    },
    recovery: {
      canRecover: recovery.canRecover ?? false,
      strategy: recovery.strategy,
      recoveryData: recovery.recoveryData
    },
    timestamp: new Date(),
    domain
  };
}

/**
 * Check if an error is retryable based on common patterns
 * 
 * Analyzes error messages to determine if the operation that caused
 * the error could potentially succeed on retry.
 * 
 * @param error - The error to analyze
 * @returns True if the error indicates a retryable condition
 * 
 * @example
 * ```typescript
 * if (isRetryableError(error)) {
 *   setTimeout(() => retryOperation(), 1000);
 * } else {
 *   showPermanentError(error);
 * }
 * ```
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Network and timeout errors are generally retryable
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('fetch')
  ) {
    return true;
  }

  // Rate limiting is retryable after a delay
  if (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return true;
  }

  // Server errors (5xx) are generally retryable
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('internal server error') ||
    message.includes('service unavailable') ||
    message.includes('gateway timeout')
  ) {
    return true;
  }

  // Storage quota issues can be retryable after cleanup
  if (
    message.includes('quota') ||
    message.includes('storage full')
  ) {
    return true;
  }

  // Authentication and validation errors are not retryable
  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('invalid') ||
    message.includes('validation')
  ) {
    return false;
  }

  // Default to non-retryable for safety
  return false;
}

/**
 * Extract error details for logging and debugging
 * 
 * Safely extracts all relevant properties from an error object
 * for structured logging and debugging purposes.
 * 
 * @param error - The error to extract details from
 * @returns A record containing all extractable error properties
 * 
 * @example
 * ```typescript
 * const details = extractErrorDetails(error);
 * logger.error('Operation failed', details);
 * ```
 */
export function extractErrorDetails(error: Error): Record<string, unknown> {
  const details: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };

  // Add any additional properties from specific error types
  if ('code' in error && typeof error.code === 'string') {
    details.code = error.code;
  }
  if ('status' in error && typeof error.status === 'number') {
    details.status = error.status;
  }
  if ('cause' in error) {
    details.cause = error.cause;
  }

  return details;
}