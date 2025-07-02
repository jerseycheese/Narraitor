/**
 * Hook for accessing storage status and health information
 * Provides real-time monitoring of storage health with polling
 * @returns StorageStatusHook interface with status, error, and health check capabilities
 */

import { useState, useEffect } from 'react';
import { StorageStatus, StorageError } from '../lib/storage/resilientStorage';
import { getResilientStorageInstance } from '../state/persistence';

export interface StorageStatusHook {
  status: StorageStatus;
  error: StorageError | null;
  lastSuccessfulSync: string | null;
  checkHealth: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook to monitor storage status and provide health check capabilities
 * Automatically polls storage status every 5 seconds and provides manual health check
 * @returns StorageStatusHook interface with current status and health management
 */
export function useStorageStatus(): StorageStatusHook {
  const [status, setStatus] = useState<StorageStatus>(StorageStatus.HEALTHY);
  const [error, setError] = useState<StorageError | null>(null);
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async () => {
    try {
      const storage = await getResilientStorageInstance();
      setStatus(storage.getStorageStatus());
      setError(storage.getLastError());
      setLastSuccessfulSync(storage.getLastSuccessfulSync());
    } catch (err) {
      console.warn('Failed to get storage status:', err);
    }
  };

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const storage = await getResilientStorageInstance();
      await storage.checkStorageHealth();
      await updateStatus();
    } catch (err) {
      console.warn('Storage health check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial status update
    updateStatus();

    // Set up polling for status updates
    const interval = setInterval(updateStatus, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    status,
    error,
    lastSuccessfulSync,
    checkHealth,
    isLoading,
  };
}