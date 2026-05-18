import React from 'react';
import { clsx } from 'clsx';

export type ErrorVariant = 'inline' | 'section' | 'page' | 'toast';
export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorDisplayProps {
  /** The variant of error display */
  variant?: ErrorVariant;
  /** Severity level of the error */
  severity?: ErrorSeverity;
  /** Error title (for section and page variants) */
  title?: string;
  /** Error message */
  message: string;
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
  showRetry = false,
  onRetry,
  showDismiss = false,
  onDismiss,
  className,
  fieldName,
}) => {
  if (variant === 'inline') {
    return (
      <p
        className={className}
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
        className={className}
        role="alert"
        aria-live="polite"
      >
        {title && <h1>{title}</h1>}
        <p>{message}</p>
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
        className={className}
        role="alert"
        aria-live="assertive"
      >
        <div>
          <div>
            {title && <h3>{title}</h3>}
            <p>{message}</p>
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
      className={clsx('error-display', 'error-display-section', className)}
      role="alert"
      aria-live="polite"
    >
      {title && <h2 className="error-display-title">{title}</h2>}
      <p className="error-display-message">{message}</p>
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
export const InlineError: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (
  props
) => <ErrorDisplay variant="inline" {...props} />;

export const SectionError: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (
  props
) => <ErrorDisplay variant="section" {...props} />;

export const PageError: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (
  props
) => <ErrorDisplay variant="page" {...props} />;

export const ToastError: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (
  props
) => <ErrorDisplay variant="toast" {...props} />;
