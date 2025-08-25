/**
 * RecoveryNotification component
 * Displays recovery alert when data recovery is available with data preview
 */

import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { formatDateTime } from '@/lib/utils';

interface RecoveryData {
  name?: string;
  currentStep?: number;
  lastSaved?: string;
  hasAttributes?: boolean;
  hasSkills?: boolean;
  hasBackground?: boolean;
  selectedSkillCount?: number;
  totalAttributePoints?: number;
}

interface RecoveryNotificationProps {
  isVisible: boolean;
  lastSaved?: string;
  recoveryData?: RecoveryData;
  hasCurrentData?: boolean;
  onRecover: () => void;
  onDismiss: () => void;
}

export function RecoveryNotification({
  isVisible,
  lastSaved,
  recoveryData,
  hasCurrentData = false,
  onRecover,
  onDismiss,
}: RecoveryNotificationProps) {
  const recoverButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isVisible && recoverButtonRef.current) {
      recoverButtonRef.current.focus();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const formattedDate = lastSaved ? formatDateTime(lastSaved) : null;
  const validDate = formattedDate && formattedDate !== 'Invalid date' ? formattedDate : null;

  // Generate step description
  const getStepDescription = (step?: number) => {
    const stepNames = ['Basic Info', 'Attributes', 'Skills', 'Background', 'Portrait'];
    if (step !== undefined && step >= 0 && step < stepNames.length) {
      return `${stepNames[step]} step`;
    }
    return 'Unknown step';
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="alertdialog"
      aria-labelledby="recovery-title"
      aria-describedby="recovery-description"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
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
              Character Creation Progress Found
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
          <p className="text-sm text-gray-600 mb-4">
            Found saved character creation progress from a previous session.
            {hasCurrentData && (
              <span className="block mt-2 text-amber-600 font-medium">
                ⚠️ Recovering will replace any current form data you&apos;ve entered.
              </span>
            )}
          </p>

          {/* Recovery Data Preview */}
          {recoveryData && (
            <div className="bg-gray-50 rounded-md p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Saved Progress Preview:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {recoveryData.name && (
                  <div>Character name: <span className="font-medium">{recoveryData.name}</span></div>
                )}
                {recoveryData.currentStep !== undefined && (
                  <div>Progress: <span className="font-medium">{getStepDescription(recoveryData.currentStep)}</span></div>
                )}
                {recoveryData.hasAttributes && recoveryData.totalAttributePoints !== undefined && (
                  <div>Attribute points allocated: <span className="font-medium">{recoveryData.totalAttributePoints}</span></div>
                )}
                {recoveryData.hasSkills && recoveryData.selectedSkillCount !== undefined && (
                  <div>Skills selected: <span className="font-medium">{recoveryData.selectedSkillCount}</span></div>
                )}
                {recoveryData.hasBackground && (
                  <div>Background: <span className="font-medium">Completed</span></div>
                )}
              </div>
            </div>
          )}

          {validDate && (
            <p className="text-xs text-gray-500 mb-3">
              Last saved: {validDate}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            ref={recoverButtonRef}
            onClick={onRecover}
            className="flex-1"
          >
            Recover Progress
          </Button>
          <Button
            onClick={onDismiss}
            variant="outline"
            className="flex-1"
          >
            Start Fresh
          </Button>
        </div>
      </div>
    </div>
  );
}