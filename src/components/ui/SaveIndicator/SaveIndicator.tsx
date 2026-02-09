/**
 * SaveIndicator component - Shows auto-save status and controls
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { SaveTriggerReason } from '@/lib/services/autoSaveService';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { cssClasses, formatTime } from '@/lib/utils';

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
      return `Saved at${formatTime(lastSaveTime)}`;
    }
    return 'Saved';
  };

  // Handle error state with ErrorDisplay component
  if (status === 'error') {
    return (
      <div className={cssClasses('', className)}>
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

  // Handle saving state with LoadingState component
  if (status === 'saving') {
    return (
      <div className={cssClasses('', className)}>
        <LoadingState
          variant="spinner"
          size="sm"
          theme="light"
          message={compact ? undefined : 'Saving...'}
          inline={true}
          centered={false}
        />
        {onManualSave && (
          <button
            disabled={true}
            
          >
            Save Now
          </button>
        )}
      </div>
    );
  }

  // Handle idle/saved states
  return (
    <div className={cssClasses('', className)}>
      <div >
        <CheckCircle  aria-hidden="true" />
        
        <div >
          <span >{getStatusText()}</span>
          
          {totalSaves > 0 && !compact && (
            <span >
              {totalSaves} saves
            </span>
          )}
        </div>
      </div>

      {onManualSave && (
        <button
          onClick={() => onManualSave('manual')}
          
        >
          Save Now
        </button>
      )}
    </div>
  );
};
