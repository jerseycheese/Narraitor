import React from 'react';

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorMessage = ({ error, onRetry, onDismiss }: ErrorMessageProps) => {
  return (
    <div data-testid="game-session-error">
      {error.message || error.toString()}
      {onRetry && (
        <button data-testid="game-session-error-retry" onClick={onRetry}>
          Retry
        </button>
      )}
      {onDismiss && (
        <button data-testid="game-session-error-dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;