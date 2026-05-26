'use client';

import React, { useCallback, useState } from 'react';
import { cssClasses } from '@/lib/utils';
import type { ErrorSeverity } from '@/lib/utils/errorUtils';

type ErrorVariant = 'inline' | 'section' | 'page' | 'toast';

interface ErrorDisplayProps {
  /** The variant of error display */
  variant?: ErrorVariant;
  /** Severity level of the error — drives accent color and prominence */
  severity?: ErrorSeverity;
  /** Error title (for section and page variants) */
  title?: string;
  /** Error message */
  message: string;
  /** Plain-language suggested next step shown below the message */
  suggestion?: string;
  /** Show retry button. Only present a retry option for recoverable errors. */
  showRetry?: boolean;
  /**
   * Retry button callback. May be async — while the returned promise is
   * pending the button shows an in-progress state and is disabled.
   */
  onRetry?: () => void | Promise<void>;
  /** Label for the retry button (defaults to "Try Again"). */
  retryLabel?: string;
  /**
   * Maximum retry attempts before the retry button is replaced by the fallback
   * action. Omit for unlimited retries (no fallback).
   */
  maxRetries?: number;
  /** Message shown once retries are exhausted, pointing the user to an alternative. */
  fallbackMessage?: string;
  /** Label for the fallback action shown once retries are exhausted. */
  fallbackLabel?: string;
  /** Callback for the fallback action shown once retries are exhausted. */
  onFallback?: () => void;
  /** Show dismiss button */
  showDismiss?: boolean;
  /** Dismiss button callback */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** For inline errors: field name to associate with */
  fieldName?: string;
}

/**
 * Shared retry/fallback behavior for the variants that expose action buttons.
 * Tracks attempt count and in-progress state so a recoverable error can be
 * retried multiple times before degrading to a fallback action.
 */
function useRetryState(
  onRetry: ErrorDisplayProps['onRetry'],
  maxRetries: number | undefined
) {
  const [attempts, setAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retriesExhausted =
    maxRetries !== undefined && attempts >= maxRetries;

  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return;
    setAttempts((count) => count + 1);
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying]);

  return { isRetrying, retriesExhausted, handleRetry };
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  variant = 'section',
  severity = 'error',
  title,
  message,
  suggestion,
  showRetry = false,
  onRetry,
  retryLabel = 'Try Again',
  maxRetries,
  fallbackMessage,
  fallbackLabel = 'Get help',
  onFallback,
  showDismiss = false,
  onDismiss,
  className,
  fieldName,
}) => {
  const severityClass = `error-display-${severity}`;
  const { isRetrying, retriesExhausted, handleRetry } = useRetryState(
    onRetry,
    maxRetries
  );

  // Keep the retry button visible while the final allowed attempt is still in
  // flight, then swap it for the fallback once that attempt settles.
  const canRetry = showRetry && !!onRetry && (!retriesExhausted || isRetrying);
  const showFallback = retriesExhausted && !isRetrying;
  const hasActions =
    canRetry || (showFallback && !!onFallback) || (showDismiss && !!onDismiss);

  if (variant === 'inline') {
    return (
      <p
        className={cssClasses('error-display', 'error-display-inline', severityClass, className)}
        role="alert"
        aria-live="polite"
        {...(fieldName && { id: `${fieldName}-error` })}
      >
        {message}
      </p>
    );
  }

  // Visually-hidden live region announcing retry progress and exhaustion to
  // assistive tech without competing with the alert region's static content.
  const retryStatus = (
    <span className="sr-only" role="status" aria-live="polite">
      {isRetrying
        ? 'Retrying, please wait.'
        : showFallback
          ? 'Automatic retry is unavailable. Choose an alternative.'
          : ''}
    </span>
  );

  const retryButton = canRetry && (
    <button
      type="button"
      className="error-display-retry"
      onClick={handleRetry}
      disabled={isRetrying}
      aria-busy={isRetrying}
    >
      {isRetrying ? 'Retrying…' : retryLabel}
    </button>
  );

  const fallbackButton = showFallback && onFallback && (
    <button
      type="button"
      className="error-display-fallback-action"
      onClick={onFallback}
    >
      {fallbackLabel}
    </button>
  );

  if (variant === 'page') {
    return (
      <div
        className={cssClasses('error-display', 'error-display-page', severityClass, className)}
        role="alert"
        aria-live="polite"
      >
        {title && <h1>{title}</h1>}
        <p>{message}</p>
        {suggestion && <p className="error-display-suggestion">{suggestion}</p>}
        {showFallback && fallbackMessage && (
          <p className="error-display-fallback">{fallbackMessage}</p>
        )}
        {retryStatus}
        {hasActions && (
          <div className="error-display-actions">
            {retryButton}
            {fallbackButton}
            {showDismiss && onDismiss && (
              <button type="button" onClick={onDismiss}>Dismiss</button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'toast') {
    return (
      <div
        className={cssClasses('error-display', 'error-display-toast', severityClass, className)}
        role="alert"
        aria-live="assertive"
      >
        <div>
          <div>
            {title && <h3>{title}</h3>}
            <p>{message}</p>
            {suggestion && <p className="error-display-suggestion">{suggestion}</p>}
          </div>
          {showDismiss && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="error-display-dismiss"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default: section variant
  return (
    <div
      className={cssClasses('error-display', 'error-display-section', severityClass, className)}
      role="alert"
      aria-live="polite"
    >
      {title && <h2 className="error-display-title">{title}</h2>}
      <p className="error-display-message">{message}</p>
      {suggestion && <p className="error-display-suggestion">{suggestion}</p>}
      {showFallback && fallbackMessage && (
        <p className="error-display-fallback">{fallbackMessage}</p>
      )}
      {retryStatus}
      {hasActions && (
        <div className="error-display-actions">
          {retryButton}
          {fallbackButton}
          {showDismiss && onDismiss && (
            <button type="button" className="error-display-dismiss" onClick={onDismiss}>Dismiss</button>
          )}
        </div>
      )}
    </div>
  );
};

// Preset components for common use cases
export const PageError: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (
  props
) => <ErrorDisplay variant="page" {...props} />;
