/**
 * SaveIndicator component - Shows auto-save status and controls
 */

import React from 'react';
import { SaveTriggerReason } from '@/lib/services/autoSaveService';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingState } from '@/components/ui/LoadingState';
import { cn } from '@/lib/utils';

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
  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Invalid time';
    }
  };

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