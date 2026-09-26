/**
 * useAutoSave hook - Provides save status and controls for game components.
 *
 * Game state stores persist directly to IndexedDB via Zustand's persist middleware.
 * This hook surfaces storage health to the save indicator, provides manual save
 * triggers with toast feedback, and reflects fallback mode if browser storage fails.
 */

import { useEffect, useCallback } from 'react';
import { useSessionStore } from '@/state/sessionStore';
import { getTimestamp } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  getStorageStatus,
  getStorageFallbackNotice,
  subscribeStorageStatus,
} from '@/state/persistence';
import { StorageStatus } from '@/lib/storage/resilientStorage';
import type { SaveTriggerReason } from '@/components/ui/SaveIndicator';

export type { SaveTriggerReason };

export const useAutoSave = () => {
  const autoSaveState = useSessionStore((state) => state.autoSave);
  const sessionStatus = useSessionStore((state) => state.status);
  const toast = useToast();

  // Keep session store autoSave status aligned with resilient storage health
  useEffect(() => {
    const handleStorageUpdate = (status: StorageStatus | null, notice: { message: string } | null) => {
      if (status === StorageStatus.UNAVAILABLE) {
        useSessionStore.getState().updateAutoSaveStatus(
          'error',
          notice?.message || 'Storage unavailable'
        );
      } else if (useSessionStore.getState().autoSave.status === 'error') {
        useSessionStore.getState().updateAutoSaveStatus('idle');
      }
    };

    const initialStatus = getStorageStatus();
    if (initialStatus === StorageStatus.UNAVAILABLE) {
      const notice = getStorageFallbackNotice();
      handleStorageUpdate(initialStatus, notice);
    }

    return subscribeStorageStatus(handleStorageUpdate);
  }, []);

  const triggerSave = useCallback(
    async (reason: SaveTriggerReason = 'manual') => {
      const currentStorageStatus = getStorageStatus();
      if (currentStorageStatus === StorageStatus.UNAVAILABLE) {
        const message = getStorageFallbackNotice()?.message || 'Storage unavailable';
        useSessionStore.getState().updateAutoSaveStatus('error', message);
        toast.error('Save failed', message);
        return;
      }

      if (reason === 'manual') {
        useSessionStore.getState().updateAutoSaveStatus('saving');
        const timestamp = getTimestamp();
        useSessionStore.getState().recordAutoSave(timestamp);
        toast.success('Game saved successfully', 'Your progress has been saved');
      }
    },
    [toast]
  );

  const setEnabled = useCallback((enabled: boolean) => {
    useSessionStore.getState().setAutoSaveEnabled(enabled);
  }, []);

  const start = useCallback(() => {
    useSessionStore.getState().setAutoSaveEnabled(true);
  }, []);

  const stop = useCallback(() => {
    useSessionStore.getState().setAutoSaveEnabled(false);
  }, []);

  const retry = useCallback(async () => {
    return triggerSave('manual');
  }, [triggerSave]);

  const isStorageUnavailable = getStorageStatus() === StorageStatus.UNAVAILABLE;
  const effectiveStatus = isStorageUnavailable ? 'error' : autoSaveState.status;
  const effectiveErrorMessage = isStorageUnavailable
    ? (getStorageFallbackNotice()?.message || autoSaveState.errorMessage || 'Storage unavailable')
    : autoSaveState.errorMessage;

  return {
    // State
    isEnabled: autoSaveState.enabled,
    status: effectiveStatus,
    lastSaveTime: autoSaveState.lastSaveTime,
    errorMessage: effectiveErrorMessage,
    totalSaves: autoSaveState.totalSaves,
    isRunning: autoSaveState.enabled && sessionStatus === 'active' && !isStorageUnavailable,

    // Actions
    start,
    stop,
    triggerSave,
    setEnabled,
    retry,
  };
};

export type UseAutoSaveReturn = ReturnType<typeof useAutoSave>;
