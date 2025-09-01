/**
 * RecoveryNotification Component
 * 
 * A modal dialog that presents recovery options when saved character creation data is detected.
 * Provides clear user choice between recovering previous progress or starting fresh with 
 * comprehensive data preview and conflict detection.
 * 
 * Key Features:
 * - Data preview with character name, progress step, and completion status
 * - Conflict warnings when current form data would be overwritten
 * - Accessible modal dialog with proper ARIA attributes and focus management
 * - Formatted timestamp display with graceful error handling
 * - Auto-focus on primary action for optimal keyboard navigation
 * 
 * @example
 * ```tsx
 * function CharacterCreationWizard() {
 *   const { hasRecoveryData, recoveryPreview, hasCurrentData, clearAutoSave } = 
 *     useCharacterCreationAutoSave(worldId);
 *   const [showDialog, setShowDialog] = useState(false);
 * 
 *   useEffect(() => {
 *     if (hasRecoveryData) setShowDialog(true);
 *   }, [hasRecoveryData]);
 * 
 *   return (
 *     <RecoveryNotification
 *       isVisible={showDialog}
 *       lastSaved={recoveryPreview?.lastSaved}
 *       recoveryData={recoveryPreview}
 *       hasCurrentData={hasCurrentData}
 *       onRecover={() => setShowDialog(false)}
 *       onDismiss={() => { clearAutoSave(); setShowDialog(false); }}
 *     />
 *   );
 * }
 * ```
 */

import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { formatDateTime } from '@/lib/utils';

/**
 * Recovery data structure containing analyzed save information for preview display
 */
interface RecoveryData {
  /** Character name from saved data */
  name?: string;
  /** Current wizard step index (0-based) */
  currentStep?: number;
  /** ISO timestamp of when data was last saved */
  lastSaved?: string;
  /** Whether character has allocated attribute points */
  hasAttributes?: boolean;
  /** Whether character has selected skills */
  hasSkills?: boolean;
  /** Whether character has completed background information */
  hasBackground?: boolean;
  /** Number of skills selected by the character */
  selectedSkillCount?: number;
  /** Total attribute points allocated across all attributes */
  totalAttributePoints?: number;
}

/**
 * Props interface for RecoveryNotification component
 */
interface RecoveryNotificationProps {
  /** Controls modal dialog visibility */
  isVisible: boolean;
  /** ISO timestamp of when data was last saved (for display purposes) */
  lastSaved?: string;
  /** Analyzed recovery data for generating user-friendly preview */
  recoveryData?: RecoveryData;
  /** Whether current form has meaningful data that would be overwritten by recovery */
  hasCurrentData?: boolean;
  /** Callback fired when user chooses to recover saved data */
  onRecover: () => void;
  /** Callback fired when user chooses to dismiss recovery and start fresh */
  onDismiss: () => void;
}

/**
 * RecoveryNotification Component
 * 
 * Renders a modal dialog allowing users to choose between recovering saved character data
 * or starting fresh. Includes comprehensive data preview and conflict warnings.
 * 
 * @param props - Component props
 * @returns JSX element or null if not visible
 */
export function RecoveryNotification({
  isVisible,
  lastSaved,
  recoveryData,
  hasCurrentData = false,
  onRecover,
  onDismiss,
}: RecoveryNotificationProps) {
  /** Reference to the recover button for focus management */
  const recoverButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Auto-focus the primary action button when dialog becomes visible
   * Ensures keyboard accessibility and proper focus flow
   */
  useEffect(() => {
    if (isVisible && recoverButtonRef.current) {
      recoverButtonRef.current.focus();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  // Format timestamp with error handling
  const formattedDate = lastSaved ? formatDateTime(lastSaved) : null;
  const validDate = formattedDate && formattedDate !== 'Invalid date' ? formattedDate : null;

  /**
   * Maps step index to user-friendly step name
   * @param step - Zero-based step index
   * @returns Human-readable step description
   */
  const getStepDescription = (step?: number): string => {
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
                className="h-6 w-6 text-amber-500"
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
            className="ml-3 flex-shrink-0 rounded-md bg-white text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <p className="text-sm text-gray-700 mb-4">
            Found saved character creation progress from a previous session.
            {hasCurrentData && (
              <span className="block mt-2 text-amber-500 font-medium">
                <span aria-hidden="true">⚠️</span>
                <span className="sr-only">Warning:</span>
                {' '}Recovering will replace any current form data you&apos;ve entered.
              </span>
            )}
          </p>

          {/* Recovery Data Preview */}
          {recoveryData && (
            <div className="bg-gray-100 rounded-md p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Saved Progress Preview:</h4>
              <div className="space-y-1 text-sm text-gray-700">
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