import React from 'react';
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
  /** Show retry button */
  showRetry?: boolean;
  /** Retry button callback */
  onRetry?: () => void;
  /** Show dismiss button */
  showDismiss?: boolean;
  /** Dismiss button callback */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** For inline errors: field name to associate with */
  fieldName?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  variant = 'section',
  severity = 'error',
  title,
  message,
  suggestion,
  showRetry = false,
  onRetry,
  showDismiss = false,
  onDismiss,
  className,
  fieldName,
}) => {
  const severityClass = `error-display-${severity}`;

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
        {(showRetry || showDismiss) && (
          <div>
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
              >
                Try Again
              </button>
            )}
            {showDismiss && onDismiss && (
              <button onClick={onDismiss}>Dismiss</button>
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
      {(showRetry || showDismiss) && (
        <div className="error-display-actions">
          {showRetry && onRetry && (
            <button className="error-display-retry" onClick={onRetry}>
              Try Again
            </button>
          )}
          {showDismiss && onDismiss && (
            <button className="error-display-dismiss" onClick={onDismiss}>Dismiss</button>
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
