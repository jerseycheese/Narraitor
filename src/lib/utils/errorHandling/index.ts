/**
 * Unified Error Handling System
 * 
 * This module consolidates error handling patterns from across the application
 * and provides a unified approach to error processing, user messaging, and recovery.
 * 
 * Key Features:
 * - Unified error context with technical and user-friendly information
 * - Automatic error mapping based on error patterns
 * - Retry logic with exponential backoff
 * - Domain-specific error handlers (storage, AI, network, validation)
 * - Configurable recovery strategies
 * 
 * Usage:
 * ```typescript
 * import { processError, withRetry, setupErrorHandling } from '@/lib/utils/errorHandling';
 * 
 * // Process any error through the unified system
 * const errorContext = processError(error);
 * console.log(errorContext.userError.message); // User-friendly message
 * 
 * // Use retry logic for operations
 * const result = await withRetry(async () => {
 *   return await someApiCall();
 * });
 * 
 * // Setup domain-specific error handling
 * setupErrorHandling();
 * ```
 */

// Core functionality
export {
  processError,
  createErrorContext,
  isRetryableError,
  extractErrorDetails,
  errorMapperRegistry
} from './core';

// Retry functionality
export {
  withRetry,
  makeRetryable,
  withRetryAndValidation,
  shouldRetryResult,
  DEFAULT_RETRY_CONFIG,
  RETRY_PRESETS
} from './retry';

// Error mappers
export {
  storageErrorMapper,
  aiErrorMapper,
  networkErrorMapper,
  validationErrorMapper
} from './mappers';

// Types
export type {
  BaseError,
  UserFriendlyError,
  ErrorRecovery,
  ErrorContext,
  ErrorMapper,
  ErrorMatcher,
  RetryConfig,
  RetryResult
} from './types';

/**
 * Setup error handling for the application
 * Simplified for KISS principle
 */
export function setupErrorHandling(): void {
  // Simplified setup - complex setup removed for KISS principle
  console.log('Error handling system initialized');
}

/**
 * Convenience function to get just the user-friendly error message
 * Compatible with existing userFriendlyError function usage
 */
export function userFriendlyError(error: Error): string {
  // Simplified implementation following KISS principle
  return error.message || 'An unexpected error occurred';
}

/**
 * Convenience function to get user-friendly error object
 * Compatible with existing getUserFriendlyError function usage
 */
export function getUserFriendlyError(error: Error) {
  // Handle specific error types for backward compatibility
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('connection')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the AI service. Please check your internet connection.',
      actionLabel: 'Try Again',
      retryable: true
    };
  }
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      title: 'Request Timed Out',
      message: 'The AI service is taking too long to respond. Please try again.',
      actionLabel: 'Try Again',
      retryable: true
    };
  }
  
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      title: 'Too Many Requests',
      message: 'You have made too many requests. Please wait a moment before trying again.',
      actionLabel: 'Try Again Later',
      retryable: true
    };
  }
  
  if (message.includes('401') || message.includes('unauthorized') || message.includes('authentication')) {
    return {
      title: 'Authentication Error',
      message: 'Unable to authenticate with the AI service. Please check your API key.',
      retryable: false
    };
  }
  
  // Default case
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    actionLabel: 'Try Again',
    retryable: false
  };
}