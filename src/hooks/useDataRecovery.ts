/**
 * useDataRecovery hook
 * Manages data recovery state and operations
 */

import { useState, useEffect } from 'react';
import { RecoveryService, RecoveryResult } from '../lib/storage/recoveryService';
import { LocalStorageAdapter } from '../lib/storage/localStorageAdapter';
import { IndexedDBAdapter } from '../lib/storage/indexedDBAdapter';

interface UseDataRecoveryResult {
  isCheckingRecovery: boolean;
  needsRecovery: boolean;
  isRecovering: boolean;
  recoveryComplete: boolean;
  error: string | null;
  checkRecovery: () => Promise<void>;
  performRecovery: () => Promise<void>;
  dismissRecovery: () => void;
  clearError: () => void;
}

export function useDataRecovery(): UseDataRecoveryResult {
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(false);
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryComplete, setRecoveryComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize services
  const localStorageAdapter = new LocalStorageAdapter();
  const indexedDBAdapter = new IndexedDBAdapter();
  const recoveryService = new RecoveryService(localStorageAdapter, indexedDBAdapter);

  const checkRecovery = async () => {
    setIsCheckingRecovery(true);
    setError(null);

    try {
      const needsRecovery = await recoveryService.checkRecoveryNeeded();
      setNeedsRecovery(needsRecovery);
    } catch {
      setError('Failed to check for recoverable data');
      setNeedsRecovery(false);
    } finally {
      setIsCheckingRecovery(false);
    }
  };

  const performRecovery = async () => {
    setIsRecovering(true);
    setError(null);

    try {
      const result: RecoveryResult = await recoveryService.performRecovery();
      
      if (result.success) {
        setRecoveryComplete(true);
        setNeedsRecovery(false);
      } else {
        setError(result.error || 'Recovery failed');
      }
    } catch {
      setError('Recovery failed due to an unexpected error');
    } finally {
      setIsRecovering(false);
    }
  };

  const dismissRecovery = () => {
    setNeedsRecovery(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  // Check for recovery on mount
  useEffect(() => {
    checkRecovery();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isCheckingRecovery,
    needsRecovery,
    isRecovering,
    recoveryComplete,
    error,
    checkRecovery,
    performRecovery,
    dismissRecovery,
    clearError,
  };
}