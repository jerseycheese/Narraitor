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
import type { SaveTriggerReason } from '@/types/game.types';

export type { SaveTriggerReason };

export const useAutoSave = () => {
  const autoSaveState = useSessionStore((state) => state.autoSave);
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
    } else {
      // The removed snapshot service persisted transient statuses into sessionStore,
      // and nothing here will replace them, so settle them on a healthy start.
      const { status, lastSaveTime } = useSessionStore.getState().autoSave;
      if (status === 'saving' || status === 'error') {
        useSessionStore.getState().updateAutoSaveStatus(lastSaveTime ? 'saved' : 'idle');
      }
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

      // Stores persist themselves through the persist middleware, so a healthy
      // storage layer means the change is already written: record the time only.
      useSessionStore.getState().recordAutoSave(getTimestamp());
      if (reason === 'manual') {
        toast.success('Game saved successfully', 'Your progress has been saved');
      }
    },
    [toast]
  );

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
    status: effectiveStatus,
    lastSaveTime: autoSaveState.lastSaveTime,
    errorMessage: effectiveErrorMessage,
    totalSaves: autoSaveState.totalSaves,

    // Actions
    triggerSave,
    retry,
  };
};

export type UseAutoSaveReturn = ReturnType<typeof useAutoSave>;
