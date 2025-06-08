import React from 'react';
import { cn } from '@/lib/utils';

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

const severityStyles = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    title: 'text-red-700',
    message: 'text-red-600',
    button: 'bg-red-100 hover:bg-red-200 text-red-700',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    title: 'text-yellow-700',
    message: 'text-yellow-600',
    button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    title: 'text-blue-700',
    message: 'text-blue-600',
    button: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
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

  if (variant === 'inline') {
    return (
      <p 
        className={cn('text-sm mt-1', styles.message, className)}
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
        className={cn('flex flex-col items-center justify-center min-h-[400px] p-4 sm:p-8', className)}
        role="alert"
        aria-live="polite"
      >
        {title && (
          <h1 className={cn('text-2xl font-bold mb-4', styles.title)}>
            {title}
          </h1>
        )}
        <p className={cn('text-lg mb-6 text-center max-w-md', styles.message)}>
          {message}
        </p>
        {(showRetry || showDismiss) && (
          <div className="flex gap-4">
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className={cn(
                  'px-6 py-2 rounded-lg font-medium transition-colors',
                  styles.button
                )}
              >
                Try Again
              </button>
            )}
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className="px-6 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
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
        className={cn(
          'fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-lg border animate-slide-up',
          styles.container,
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {title && (
              <h3 className={cn('font-semibold mb-1', styles.title)}>
                {title}
              </h3>
            )}
            <p className={cn('text-sm', styles.message)}>{message}</p>
          </div>
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-4 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default: section variant
  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        styles.container,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {title && (
        <h2 className={cn('text-lg font-semibold mb-2', styles.title)}>
          {title}
        </h2>
      )}
      <p className={styles.message}>{message}</p>
      {(showRetry || showDismiss) && (
        <div className="mt-4 flex gap-2">
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                styles.button
              )}
            >
              Try Again
            </button>
          )}
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
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
  <ErrorDisplay variant="inline" {...props} />
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
