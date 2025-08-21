/**
 * SaveIndicator Component
 * 
 * Displays the current auto-save status with visual feedback and optional manual controls.
 * Shows save state, timestamps, error handling, and provides manual save triggers.
 * 
 * Features:
 * - Status indicator with icons (✓ for saved, ○ for idle)
 * - Formatted timestamp display
 * - Error state with retry functionality
 * - Loading state with spinner
 * - Manual save button option
 * - Compact and full display modes
 * - Save count tracking
 * 
 * @example
 * ```tsx
 * // Basic usage with auto-save hook
 * <SaveIndicator
 *   status={saveStatus}
 *   lastSaveTime={data?.lastSaved}
 *   compact={true}
 * />
 * 
 * // With manual save capability
 * <SaveIndicator
 *   status={saveStatus}
 *   lastSaveTime={lastSaveTime}
 *   errorMessage={error}
 *   totalSaves={saveCount}
 *   onManualSave={(reason) => triggerSave(reason)}
 *   retryable={true}
 *   onRetryError={() => retrySave()}
 * />
 * ```
 */

import React from 'react';
import { SaveTriggerReason } from '@/lib/services/autoSaveService';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { cn, formatTime } from '@/lib/utils';

/**
 * Props for the SaveIndicator component
 */
export interface SaveIndicatorProps {
  /** Current save operation status */
  status: 'idle' | 'saving' | 'saved' | 'error';
  /** ISO timestamp of last successful save */
  lastSaveTime?: string | null;
  /** Error message to display when status is 'error' */
  errorMessage?: string | null;
  /** Total number of saves performed (for statistics) */
  totalSaves?: number;
  /** Callback for manual save trigger */
  onManualSave?: (reason: SaveTriggerReason) => void;
  /** Callback for retrying failed save operations */
  onRetryError?: () => void;
  /** Whether the error state allows retry attempts */
  retryable?: boolean;
  /** Additional CSS classes to apply */
  className?: string;
  /** Whether to show compact version without detailed info */
  compact?: boolean;
}

/**
 * SaveIndicator component implementation
 */
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
  /**
   * Generates appropriate status text based on current state
   */
  const getStatusText = () => {
    switch (status) {
      case 'saved':
        return lastSaveTime ? `Saved at ${formatTime(lastSaveTime)}` : 'Saved';
      case 'idle':
        return 'Auto-save ready';
      default:
        return '';
    }
  };

  // Handle error state with ErrorDisplay component
  if (status === 'error') {
    return (
      <div className={cn('max-w-sm', className)}>
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
      <div className={cn('flex items-center gap-2', className)}>
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
            className="px-2 py-1 text-xs bg-gray-300 text-gray-500 rounded cursor-not-allowed"
          >
            Save Now
          </button>
        )}
      </div>
    );
  }

  // Handle idle/saved states
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <div className="flex items-center gap-1">
        {status === 'saved' ? (
          <span className="text-green-500 text-sm">✓</span>
        ) : (
          <span className="text-gray-400 text-sm">○</span>
        )}
        
        <div className="flex flex-col">
          <span className="text-gray-600">{getStatusText()}</span>
          
          {totalSaves > 0 && !compact && (
            <span className="text-xs text-gray-400">
              {totalSaves} saves
            </span>
          )}
        </div>
      </div>

      {onManualSave && (
        <button
          onClick={() => onManualSave('manual')}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Save Now
        </button>
      )}
    </div>
  );
};