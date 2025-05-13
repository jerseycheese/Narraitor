// src/lib/components/ErrorMessage.tsx

import React from 'react';
import { getUserFriendlyError } from '../ai/userFriendlyErrors';

export interface ErrorMessageProps {
  error: Error | null;
  onRetry?: () => void;
  onDismiss: () => void;
}

/**
 * ErrorMessage component for displaying user-friendly error messages
 */
export default function ErrorMessage({ error, onRetry, onDismiss }: ErrorMessageProps) {
  if (!error) {
    return null;
  }

  const userFriendlyError = getUserFriendlyError(error);

  return (
    <div 
      data-testid="error-message-container"
      className="narraitor-error-container rounded-md border border-red-200 bg-red-50 p-4"
    >
      <div className="flex">
        <div className="flex-1">
          <h3 
            data-testid="error-message-title"
            className="narraitor-error-title text-sm font-medium text-red-800"
          >
            {userFriendlyError.title}
          </h3>
          <p 
            data-testid="error-message-text"
            className="narraitor-error-message mt-1 text-sm text-red-700"
          >
            {userFriendlyError.message}
          </p>
          <div className="narraitor-error-actions mt-3 flex gap-3">
            {userFriendlyError.retryable && userFriendlyError.actionLabel && (
              <button
                data-testid="error-message-retry-button"
                onClick={onRetry}
                className="narraitor-error-button rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200"
              >
                {userFriendlyError.actionLabel}
              </button>
            )}
            <button
              data-testid="error-message-dismiss-button"
              onClick={onDismiss}
              className="narraitor-error-button rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
