/**
 * RecoveryNotification Component
 *
 * A modal dialog that presents recovery options when saved character creation data is detected.
 * Lets the player recover previous progress or start fresh, and warns when recovering would
 * overwrite data already entered in the current form.
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
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { SimpleModal } from './SimpleModal';
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
 * or starting fresh. Includes data preview and conflict warnings.
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
  const validDate =
    formattedDate && formattedDate !== 'Invalid date' ? formattedDate : null;

  /**
   * Maps step index to user-friendly step name
   * @param step - Zero-based step index
   * @returns Human-readable step description
   */
  const getStepDescription = (step?: number): string => {
    const stepNames = [
      'Basic Info',
      'Attributes',
      'Skills',
      'Background',
      'Portrait',
    ];
    if (step !== undefined && step >= 0 && step < stepNames.length) {
      return `${stepNames[step]} step`;
    }
    return 'Unknown step';
  };

  return (
    <SimpleModal
      isOpen={isVisible}
      onClose={onDismiss}
      title="Character Creation Progress Found"
      description="Found saved character creation progress from a previous session."
      showCloseButton={true}
      ariaDescribedBy="recovery-notification-content"
    >
      <div id="recovery-notification-content">
        <div>
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      </div>

      <div>
        <p>
          {hasCurrentData && (
            <span>
              <AlertTriangle aria-hidden="true" />
              <span>Warning:</span>
              <span>
                Recovering will replace any current form data you&apos;ve
                entered.
              </span>
            </span>
          )}
        </p>

        {/* Recovery Data Preview */}
        {recoveryData && (
          <div>
            <h4>Saved Progress Preview:</h4>
            <div>
              {recoveryData.name && (
                <div>
                  Character name: <span>{recoveryData.name}</span>
                </div>
              )}
              {recoveryData.currentStep !== undefined && (
                <div>
                  Progress:{' '}
                  <span>{getStepDescription(recoveryData.currentStep)}</span>
                </div>
              )}
              {recoveryData.hasAttributes &&
                recoveryData.totalAttributePoints !== undefined && (
                  <div>
                    Attribute points allocated:{' '}
                    <span>{recoveryData.totalAttributePoints}</span>
                  </div>
                )}
              {recoveryData.hasSkills &&
                recoveryData.selectedSkillCount !== undefined && (
                  <div>
                    Skills selected:{' '}
                    <span>{recoveryData.selectedSkillCount}</span>
                  </div>
                )}
              {recoveryData.hasBackground && (
                <div>
                  Background: <span>Completed</span>
                </div>
              )}
            </div>
          </div>
        )}

        {validDate && <p>Last saved: {validDate}</p>}
      </div>

      <div>
        <Button ref={recoverButtonRef} onClick={onRecover}>
          Recover Progress
        </Button>
        <Button onClick={onDismiss} variant="outline">
          Start Fresh
        </Button>
      </div>
    </SimpleModal>
  );
}
