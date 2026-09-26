/**
 * SaveIndicator component - Shows auto-save status and controls
 */

import React, { useState, useEffect } from 'react';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { clsx } from 'clsx';
import { formatTime } from '@/lib/utils';
import {
  getStorageStatus,
  getStorageFallbackNotice,
  subscribeStorageStatus,
} from '@/state/persistence';
import { StorageStatus } from '@/lib/storage/resilientStorage';

export type SaveTriggerReason = 'periodic' | 'player-choice' | 'scene-change' | 'manual';

export interface SaveIndicatorProps {
  status?: 'idle' | 'saving' | 'saved' | 'error';
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
  status = 'idle',
  lastSaveTime,
  errorMessage,
  totalSaves = 0,
  onManualSave,
  onRetryError,
  retryable = false,
  className = '',
  compact = false,
}) => {
  const [resilientStatus, setResilientStatus] = useState<StorageStatus | null>(() => getStorageStatus());
  const [fallbackNotice, setFallbackNotice] = useState(() => getStorageFallbackNotice());

  useEffect(() => {
    return subscribeStorageStatus((newStatus, notice) => {
      setResilientStatus(newStatus);
      setFallbackNotice(notice);
    });
  }, []);

  const isStorageUnavailable = resilientStatus === StorageStatus.UNAVAILABLE;
  const effectiveStatus = isStorageUnavailable ? 'error' : status;
  const effectiveErrorMessage = isStorageUnavailable
    ? (fallbackNotice?.message || errorMessage || 'Storage is unavailable. Changes will not be saved across sessions.')
    : errorMessage;

  const getStatusText = () => {
    if (effectiveStatus === 'saving') {
      return 'Saving...';
    }
    if (lastSaveTime) {
      return `Saved at ${formatTime(lastSaveTime)}`;
    }
    return 'Saved';
  };

  // Handle error state with ErrorDisplay component
  if (effectiveStatus === 'error') {
    return (
      <div className={clsx('save-indicator save-indicator-error', className)}>
        <ErrorDisplay
          variant={compact ? 'inline' : 'section'}
          severity="error"
          title={compact ? undefined : 'Storage Error'}
          message={effectiveErrorMessage || "Couldn't save your progress. Your recent moves aren't stored yet."}
          showRetry={retryable && !!onRetryError}
          onRetry={onRetryError}
          showDismiss={false}
        />
      </div>
    );
  }

  // Handle saving state with LoadingState component
  if (effectiveStatus === 'saving') {
    return (
      <div className={clsx('save-indicator', compact && 'save-indicator-compact', className)}>
        <LoadingState
          variant="spinner"
          message={compact ? undefined : 'Saving...'}
        />
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
    <div className={clsx('save-indicator', compact && 'save-indicator-compact', className)}>
      <div className="save-indicator-status">
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
