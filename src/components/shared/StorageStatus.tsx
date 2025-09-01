/**
 * StorageStatus component for displaying storage health and status
 * Provides user-friendly interface for storage error states and recovery
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, RotateCcw, HelpCircle } from 'lucide-react';
import { StorageStatus as StorageStatusEnum, StorageError } from '@/lib/storage/resilientStorage';
import { getResilientStorageInstance } from '@/state/persistence';
import { formatRelativeTime } from '@/lib/utils';

interface StorageStatusProps {
  /**
   * Whether to show the component inline or as a floating indicator
   */
  variant?: 'inline' | 'floating';
  /**
   * Custom className for styling
   */
  className?: string;
}

interface StorageState {
  status: StorageStatusEnum;
  error: StorageError | null;
  lastSuccessfulSync: string | null;
}

export function StorageStatus({ variant = 'floating', className = '' }: StorageStatusProps) {
  const [storageState, setStorageState] = useState<StorageState>({
    status: StorageStatusEnum.HEALTHY,
    error: null,
    lastSuccessfulSync: null,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const updateStorageState = async () => {
      try {
        const storage = await getResilientStorageInstance();
        if (!mounted) return;

        setStorageState({
          status: storage.getStorageStatus(),
          error: storage.getLastError(),
          lastSuccessfulSync: storage.getLastSuccessfulSync(),
        });
      } catch (error) {
        console.warn('Failed to get storage status:', error);
      }
    };

    // Initial state
    updateStorageState();

    // Poll for status updates
    const interval = setInterval(updateStorageState, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleRetry = async () => {
    try {
      const storage = await getResilientStorageInstance();
      await storage.checkStorageHealth();
    } catch (error) {
      console.warn('Storage health check failed:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Memoize the formatted last sync time
  const formattedLastSync = useMemo(() => {
    if (!storageState.lastSuccessfulSync) return 'Never';
    return formatRelativeTime(storageState.lastSuccessfulSync);
  }, [storageState.lastSuccessfulSync]);

  // Don't render if healthy and not expanded (floating mode only), or if dismissed
  if ((storageState.status === StorageStatusEnum.HEALTHY && !isExpanded && variant === 'floating') || isDismissed) {
    return null;
  }

  const getStatusIcon = () => {
    const iconClass = "w-4 h-4";
    switch (storageState.status) {
      case StorageStatusEnum.HEALTHY:
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case StorageStatusEnum.DEGRADED:
        return <AlertTriangle className={`${iconClass} text-amber-500`} />;
      case StorageStatusEnum.UNAVAILABLE:
        return <XCircle className={`${iconClass} text-red-500`} />;
      case StorageStatusEnum.RECOVERING:
        return <RotateCcw className={`${iconClass} text-blue-700 animate-spin`} />;
      default:
        return <HelpCircle className={`${iconClass} text-gray-700`} />;
    }
  };

  const getStatusColor = () => {
    switch (storageState.status) {
      case StorageStatusEnum.HEALTHY:
        return 'text-green-500 bg-green-50 border-green-200';
      case StorageStatusEnum.DEGRADED:
        return 'text-amber-500 bg-amber-200 border-amber-200';
      case StorageStatusEnum.UNAVAILABLE:
        return 'text-red-500 bg-red-200 border-red-500';
      case StorageStatusEnum.RECOVERING:
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const baseClassName = `storage-status storage-status--${storageState.status} ${getStatusColor()} ${className}`;
  
  if (variant === 'floating') {
    return (
      <div
        className={`${baseClassName} fixed bottom-4 right-4 p-3 rounded-lg border shadow-lg max-w-sm z-50`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span aria-label={`Storage status: ${storageState.status}`}>
              {getStatusIcon()}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm">
                {storageState.status === StorageStatusEnum.HEALTHY && 'Storage Active'}
                {storageState.status === StorageStatusEnum.DEGRADED && 'Storage Issues'}
                {storageState.status === StorageStatusEnum.UNAVAILABLE && 'Memory-Only Mode'}
                {storageState.status === StorageStatusEnum.RECOVERING && 'Restoring Storage'}
              </h4>
              {storageState.error && (
                <p className="text-xs mt-1" role="alert">
                  {storageState.error.userMessage}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 text-gray-500 hover:text-gray-700"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>

        {storageState.status !== StorageStatusEnum.HEALTHY && (
          <div className="mt-3 flex space-x-2">
            {storageState.error?.isRecoverable && (
              <button
                onClick={handleRetry}
                className="px-3 py-1 text-xs bg-white border rounded hover:bg-gray-100"
              >
                Retry
              </button>
            )}
            <button
              onClick={toggleExpanded}
              className="px-3 py-1 text-xs bg-white border rounded hover:bg-gray-100"
            >
              {isExpanded ? 'Less' : 'Details'}
            </button>
          </div>
        )}

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-current border-opacity-20">
            <div className="text-xs space-y-1">
              <div>
                <span className="font-medium">Last saved:</span> {formattedLastSync}
              </div>
              {storageState.error && (
                <div>
                  <span className="font-medium">Technical details:</span> {storageState.error.technicalMessage}
                </div>
              )}
              {storageState.status === StorageStatusEnum.UNAVAILABLE && (
                <div className="text-xs text-gray-700 mt-2">
                  <p>Your progress is preserved in memory but will be lost if you refresh or close the browser.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {storageState.status === StorageStatusEnum.RECOVERING && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div className={`${baseClassName} p-2 rounded border`} role="status" aria-live="polite">
      <div className="flex items-center space-x-2">
        <span aria-label={`Storage status: ${storageState.status}`}>
          {getStatusIcon()}
        </span>
        <span className="text-sm">
          {storageState.status === StorageStatusEnum.HEALTHY && `Last saved: ${formattedLastSync}`}
          {storageState.status === StorageStatusEnum.DEGRADED && 'Storage issues detected'}
          {storageState.status === StorageStatusEnum.UNAVAILABLE && 'Memory-only mode'}
          {storageState.status === StorageStatusEnum.RECOVERING && 'Restoring storage...'}
        </span>
        {storageState.error?.isRecoverable && storageState.status !== StorageStatusEnum.HEALTHY && (
          <button
            onClick={handleRetry}
            className="ml-auto px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
          >
            Retry
          </button>
        )}
      </div>
      
      {storageState.error && storageState.status !== StorageStatusEnum.HEALTHY && (
        <p className="text-xs mt-1 text-gray-700" role="alert">
          {storageState.error.userMessage}
        </p>
      )}
    </div>
  );
}