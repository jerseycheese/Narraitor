/**
 * SaveIndicator component - Shows auto-save status and controls
 */

import React from 'react';
import { SaveTriggerReason } from '@/lib/services/autoSaveService';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { clsx } from 'clsx';
import { formatTime } from '@/lib/utils';

export interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaveTime?: string | null;
  errorMessage?: string | null;
  totalSaves?: number;
  onManualSave?: (reason: SaveTriggerReason) => void;
  onRetryError?: () => void;
  retryable?: boolean;
  className?: string;
  compact?: boolean;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  status,
  lastSaveTime,
  errorMessage,
  totalSaves = 0,
  onManualSave,
  onRetryError,
  retryable = false,
  className = '',
  compact = false,
}) => {
  const getStatusText = () => {
    if (status === 'saving') {
      return 'Saving...';
    }
    if (lastSaveTime) {
      return `Saved at ${formatTime(lastSaveTime)}`;
    }
    return 'Saved';
  };

  // Handle error state with ErrorDisplay component
  if (status === 'error') {
    return (
      <div className={clsx('save-indicator save-indicator-error', className)}>
        <ErrorDisplay
          variant={compact ? 'inline' : 'section'}
          severity="error"
          title={compact ? undefined : 'Auto-Save Error'}
          message={errorMessage || 'Failed to save game progress'}
          showRetry={retryable && !!onRetryError}
          onRetry={onRetryError}
          showDismiss={false}
        />
      </div>
    );
  }

  // Handle saving state with LoadingState component. The compact form skips
  // this: swapping a status dot for a spinner resizes whatever toolbar it sits
  // in, and in the session HUD that shoved the narrative down the page every
  // time an auto-save fired. Compact saving reads on the dot instead.
  if (status === 'saving' && !compact) {
    return (
      <div className={clsx('save-indicator', className)} data-status={status}>
        <LoadingState variant="spinner" message="Saving..." />
        {onManualSave && (
          <button className="save-indicator-button" disabled={true} type="button">
            Save Now
          </button>
        )}
      </div>
    );
  }

  // Handle idle/saved states
  return (
    <div className={clsx('save-indicator', compact && 'save-indicator-compact', className)} data-status={status}>
      <div className="save-indicator-status" role="status" aria-label={getStatusText()}>
        <div className="save-indicator-copy">
          <span className="save-indicator-text">{getStatusText()}</span>

          {totalSaves > 0 && !compact && <span className="save-indicator-meta">{totalSaves} saves</span>}
        </div>
      </div>

      {onManualSave && (
        <button className="save-indicator-button" onClick={() => onManualSave('manual')} type="button">
          Save Now
        </button>
      )}
    </div>
  );
};
