import React from 'react';
import { clsx } from 'clsx';
import { errorStyles } from '@/styles/errorStyles';

export type ErrorVariant = 'inline' | 'section' | 'page' | 'toast';
export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorDisplayProps {
  variant?: ErrorVariant;
  severity?: ErrorSeverity;
  title?: string;
  message?: string;
  messages?: string[];
  showRetry?: boolean;
  onRetry?: () => void;
  showDismiss?: boolean;
  onDismiss?: () => void;
  className?: string;
  fieldName?: string;
}

const renderMessages = (
  message: string | undefined,
  messages: string[] | undefined,
  paragraphClassName?: string
): React.ReactNode => {
  if (messages && messages.length > 0) {
    return messages.map((entry, index) => (
      <p key={index} className={paragraphClassName}>
        {entry}
      </p>
    ));
  }
  return message ? <p className={paragraphClassName}>{message}</p> : null;
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  variant = 'section',
  severity: _severity = 'error',
  title,
  message,
  messages,
  showRetry = false,
  onRetry,
  showDismiss = false,
  onDismiss,
  className,
  fieldName,
}) => {
  if (variant === 'inline') {
    const inlineClass = className ?? errorStyles.message;
    if (messages && messages.length > 0) {
      return (
        <div
          className={errorStyles.list.container}
          role="alert"
          aria-live="polite"
          {...(fieldName && { id: `${fieldName}-error` })}
        >
          {messages.map((entry, index) => (
            <p key={index} className={inlineClass}>
              {entry}
            </p>
          ))}
        </div>
      );
    }
    return (
      <p
        className={inlineClass}
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
      <div className={className} role="alert" aria-live="polite">
        {title && <h1>{title}</h1>}
        {renderMessages(message, messages)}
        {(showRetry || showDismiss) && (
          <div>
            {showRetry && onRetry && (
              <button onClick={onRetry}>Try Again</button>
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
      <div className={className} role="alert" aria-live="assertive">
        <div>
          <div>
            {title && <h3>{title}</h3>}
            {renderMessages(message, messages)}
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

  return (
    <div
      className={clsx('error-display', 'error-display-section', className)}
      role="alert"
      aria-live="polite"
    >
      {title && <h2 className="error-display-title">{title}</h2>}
      {renderMessages(message, messages, 'error-display-message')}
      {(showRetry || showDismiss) && (
        <div className="error-display-actions">
          {showRetry && onRetry && (
            <button className="error-display-retry" onClick={onRetry}>
              Try Again
            </button>
          )}
          {showDismiss && onDismiss && (
            <button className="error-display-dismiss" onClick={onDismiss}>
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};
