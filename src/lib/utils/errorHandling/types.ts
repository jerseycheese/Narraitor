/**
 * Unified error handling types for the application
 * Consolidates error patterns from storage, AI, and API domains
 */

/**
 * Base error interface that all error types extend
 */
export interface BaseError {
  /** Unique error code for programmatic handling */
  code: string;
  /** Technical error message for logging */
  message: string;
  /** Whether this error can be retried */
  retryable: boolean;
  /** Original error that caused this error */
  cause?: Error;
  /** Additional context about the error */
  context?: Record<string, unknown>;
}

/**
 * User-facing error information
 */
export interface UserFriendlyError {
  /** Short title for the error */
  title: string;
  /** User-friendly description of the error */
  message: string;
  /** Label for retry action (if retryable) */
  actionLabel?: string;
  /** Whether the user can retry this operation */
  retryable: boolean;
  /** Whether to show a notification to the user */
  shouldNotify: boolean;
}

/**
 * Error recovery strategy information
 */
export interface ErrorRecovery {
  /** Whether recovery is possible */
  canRecover: boolean;
  /** Recovery strategy to attempt */
  strategy?: 'retry' | 'fallback' | 'reset' | 'manual';
  /** Additional data needed for recovery */
  recoveryData?: Record<string, unknown>;
}

/**
 * Complete error context with all information
 */
export interface ErrorContext extends BaseError {
  /** User-friendly error information */
  userError: UserFriendlyError;
  /** Recovery strategy information */
  recovery: ErrorRecovery;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Domain where error occurred */
  domain: 'storage' | 'ai' | 'api' | 'network' | 'validation' | 'unknown';
}

/**
 * Error mapping function type
 */
export type ErrorMapper<T extends Error = Error> = (error: T) => ErrorContext;

/**
 * Error matcher function type for conditional error handling
 */
export type ErrorMatcher = (error: Error) => boolean;

/**
 * Retry configuration for error recovery
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Function to determine if an error should be retried */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Retry result information
 */
export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Final error if all retries failed */
  error?: Error;
  /** Number of attempts made */
  attempts: number;
  /** Total time spent retrying in milliseconds */
  totalTime: number;
}