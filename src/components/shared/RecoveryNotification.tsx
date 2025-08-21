/**
 * RecoveryNotification Component
 * 
 * Displays a modal dialog when auto-save recovery data is detected.
 * Provides users with the choice to recover their previous session data
 * or dismiss it and start fresh.
 * 
 * Features:
 * - Modal overlay with focus management
 * - Accessible dialog with ARIA labels
 * - Formatted last save timestamp
 * - Auto-focus on primary action (Recover)
 * - Keyboard navigation support
 * 
 * @example
 * ```tsx
 * <RecoveryNotification
 *   isVisible={hasRecoveryData}
 *   lastSaved="2024-01-15T10:30:00.000Z"
 *   onRecover={() => {
 *     // Keep existing data and hide dialog
 *     setShowRecoveryDialog(false);
 *   }}
 *   onDismiss={() => {
 *     // Clear saved data and hide dialog
 *     clearAutoSave();
 *     setShowRecoveryDialog(false);
 *   }}
 * />
 * ```
 */

import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { formatDateTime } from '@/lib/utils';

/**
 * Props for the RecoveryNotification component
 */
interface RecoveryNotificationProps {
  /** Whether the recovery dialog should be visible */
  isVisible: boolean;
  /** ISO timestamp of when the data was last saved */
  lastSaved?: string;
  /** Callback when user chooses to recover the data */
  onRecover: () => void;
  /** Callback when user chooses to dismiss the recovery data */
  onDismiss: () => void;
}

/**
 * RecoveryNotification component implementation
 */
export function RecoveryNotification({
  isVisible,
  lastSaved,
  onRecover,
  onDismiss,
}: RecoveryNotificationProps) {
  /** Reference to the recover button for focus management */
  const recoverButtonRef = useRef<HTMLButtonElement>(null);

  /** Auto-focus the recover button when dialog becomes visible */
  useEffect(() => {
    if (isVisible && recoverButtonRef.current) {
      recoverButtonRef.current.focus();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  /** Format the last saved timestamp for display */
  const formattedDate = lastSaved ? formatDateTime(lastSaved) : null;
  /** Only show valid formatted dates */
  const validDate = formattedDate && formattedDate !== 'Invalid date' ? formattedDate : null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="alertdialog"
      aria-labelledby="recovery-title"
      aria-describedby="recovery-description"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 id="recovery-title" className="ml-3 text-lg font-medium text-gray-900">
              Data Recovery Available
            </h3>
          </div>
          <button
            onClick={onDismiss}
            className="ml-3 flex-shrink-0 rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div id="recovery-description" className="mb-6">
          <p className="text-sm text-gray-600 mb-3">
            We detected that your game data may have been cleared, but we found a backup of your progress.
          </p>
          {validDate && (
            <p className="text-sm text-gray-500">
              <strong>Last saved:</strong> {validDate}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-3">
            Would you like to recover your previous game state? You can also manually import a backup file if you have one.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            ref={recoverButtonRef}
            onClick={onRecover}
            className="flex-1"
          >
            Recover Data
          </Button>
          <Button
            onClick={onDismiss}
            variant="outline"
            className="flex-1"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}