import React from 'react';
import { X } from 'lucide-react';
import { cssClasses } from '@/lib/utils';

export type ErrorVariant = '' | 'section' | 'page' | 'toast';
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

const severityStyles = {
  error: {
    container: '',
    title: '',
    message: '',
    button: '',
  },
  warning: {
    container: '',
    title: '',
    message: '',
    button: '',
  },
  info: {
    container: '',
    title: '',
    message: '',
    button: '',
  },
};

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
  const styles = severityStyles[severity];

  if (variant === '') {
    return (
      <p 
        className={cssClasses('', styles.message, className)}
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
        className={cssClasses('', className)}
        role="alert"
        aria-live="polite"
      >
        {title && (
          <h1 className={cssClasses('', styles.title)}>
            {title}
          </h1>
        )}
        <p className={cssClasses('', styles.message)}>
          {message}
        </p>
        {(showRetry || showDismiss) && (
          <div >
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className={cssClasses(
                  '',
                  styles.button
                )}
              >
                Try Again
              </button>
            )}
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'toast') {
    return (
      <div
        className={cssClasses(
          '',
          styles.container,
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <div >
          <div >
            {title && (
              <h3 className={cssClasses('', styles.title)}>
                {title}
              </h3>
            )}
            <p className={cssClasses('', styles.message)}>{message}</p>
          </div>
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              
              aria-label="Dismiss"
            >
              <X  aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default: section variant
  return (
    <div
      className={cssClasses(
        '',
        styles.container,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {title && (
        <h2 className={cssClasses('', styles.title)}>
          {title}
        </h2>
      )}
      <p className={styles.message}>{message}</p>
      {(showRetry || showDismiss) && (
        <div >
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className={cssClasses(
                '',
                styles.button
              )}
            >
              Try Again
            </button>
          )}
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Preset components for common use cases
export const InlineError: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (props) => (
  <ErrorDisplay variant="" {...props} />
);

export const SectionError: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (props) => (
  <ErrorDisplay variant="section" {...props} />
);

export const PageError: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (props) => (
  <ErrorDisplay variant="page" {...props} />
);

export const ToastError: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (props) => (
  <ErrorDisplay variant="toast" {...props} />
);
