/**
 * SaveIndicator component - Shows auto-save status and controls
 */

import React from 'react';
import { SaveTriggerReason } from '@/lib/services/autoSaveService';

export interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaveTime?: string | null;
  errorMessage?: string | null;
  totalSaves?: number;
  onManualSave?: (reason: SaveTriggerReason) => void;
  className?: string;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  status,
  lastSaveTime,
  errorMessage,
  totalSaves = 0,
  onManualSave,
  className = '',
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

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return (
          <div 
            className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full" 
            role="status"
            aria-label="Saving"
          />
        );
      case 'saved':
        return <span className="text-green-500">✓</span>;
      case 'error':
        return <span className="text-red-500">⚠</span>;
      default:
        return <span className="text-gray-400">○</span>;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaveTime ? `Saved at ${formatTime(lastSaveTime)}` : 'Saved';
      case 'error':
        return errorMessage ? `Error: ${errorMessage}` : 'Save error';
      default:
        return 'Auto-save ready';
    }
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {getStatusIcon()}
      
      <div className="flex flex-col">
        <span className="text-gray-600">{getStatusText()}</span>
        
        {totalSaves > 0 && status !== 'saving' && (
          <span className="text-xs text-gray-400">
            {totalSaves} saves
          </span>
        )}
      </div>

      {onManualSave && (
        <button
          onClick={() => onManualSave('manual')}
          disabled={status === 'saving'}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Now
        </button>
      )}
    </div>
  );
};