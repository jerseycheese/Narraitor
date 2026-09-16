/**
 * Persistence configuration for the Narraitor application.
 * Provides configuration for resilient IndexedDB persistence middleware.
 */

import { PersistStorage } from 'zustand/middleware';
import {
  ResilientStorageMiddleware,
  StorageStatus,
  type StorageFallbackNotice,
} from '../lib/storage/resilientStorage';
import Logger from '@/lib/utils/logger';

const logger = new Logger('Persistence');

export type StorageStatusListener = (
  status: StorageStatus | null,
  notice: StorageFallbackNotice | null
) => void;

let resilientStoragePromise: Promise<ResilientStorageMiddleware> | null = null;
let currentStorageStatus: StorageStatus | null = null;
let currentFallbackNotice: StorageFallbackNotice | null = null;
const statusListeners = new Set<StorageStatusListener>();

/**
 * Active storage status, or null if storage has not reported a degraded state.
 */
export const getStorageStatus = (): StorageStatus | null => {
  if (typeof window === 'undefined') return null;
  return currentStorageStatus;
};

/**
 * Notice detailing why storage fell back to memory, or null if healthy.
 */
export const getStorageFallbackNotice = (): StorageFallbackNotice | null => {
  if (typeof window === 'undefined') return null;
  return currentFallbackNotice;
};

/**
 * Subscribes to storage status transitions (e.g. IndexedDB failure fallback).
 * Triggers lazy initialization so checks run even before the first store read.
 */
export const subscribeStorageStatus = (
  listener: StorageStatusListener
): (() => void) => {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
};

/**
 * Test-only helper to reset storage status state between tests.
 */
export const _resetStorageStatusForTesting = (): void => {
  currentStorageStatus = null;
  currentFallbackNotice = null;
  statusListeners.clear();
  resilientStoragePromise = null;
};

/**
 * Test-only helper to dispatch storage status transitions in tests.
 */
export const _setStorageStatusForTesting = (
  status: StorageStatus | null,
  notice: StorageFallbackNotice | null = null
): void => {
  currentStorageStatus = status;
  currentFallbackNotice = notice;
  statusListeners.forEach((listener) => {
    try {
      listener(currentStorageStatus, currentFallbackNotice);
    } catch (err) {
      logger.error('[Persistence] Error in test storage status listener:', err);
    }
  });
};

/**
 * Get ResilientStorageMiddleware instance with lazy initialization.
 * This ensures the middleware is only initialized once and properly shared.
 * Falls back to memory-only storage if initialization fails.
 */
export const getResilientStorage = async (): Promise<ResilientStorageMiddleware> => {
  if (!resilientStoragePromise) {
    resilientStoragePromise = (async () => {
      const storage = new ResilientStorageMiddleware({
        onStatusChange: (status, notice) => {
          currentStorageStatus = status;
          currentFallbackNotice = notice ?? null;
          // ResilientStorageMiddleware already logs the failure with the full
          // error object and stack trace. We don't duplicate logger.error here
          // to prevent double-reporting to /api/telemetry/error.
          statusListeners.forEach((listener) => {
            try {
              listener(currentStorageStatus, currentFallbackNotice);
            } catch (err) {
              logger.error('[Persistence] Error in storage status listener:', err);
            }
          });
        },
      });

      return storage;
    })();
  }

  return resilientStoragePromise;
};

/**
 * Create resilient IndexedDB storage for Zustand persistence
 * @returns Persistence storage implementation compatible with Zustand
 *
 * Generic over the persisted state shape so explicitly-typed PersistOptions
 * (e.g. narrativeStore.persistence.ts) can use it; defaults to unknown for
 * the inline-options stores.
 */
export const createIndexedDBStorage = <T = unknown>(): PersistStorage<T> => ({
  getItem: async (name: string): Promise<{ state: T; version?: number } | null> => {
    try {
      const storage = await getResilientStorage();
      const result = await storage.getItem(name);

      if (!result) return null;
      // Parse the JSON string into a StorageValue object
      return JSON.parse(result) as { state: T; version?: number };
    } catch (error) {
      logger.error('Failed to get item', error);
      return null;
    }
  },
  
  setItem: async (name: string, value: { state: T; version?: number }): Promise<void> => {
    try {
      const storage = await getResilientStorage();
      // Convert the StorageValue object to a JSON string
      await storage.setItem(name, JSON.stringify(value));
    } catch (error) {
      logger.error('Failed to set item', error);
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    try {
      const storage = await getResilientStorage();
      await storage.removeItem(name);
    } catch (error) {
      logger.error('Failed to remove item', error);
    }
  }
});

/**
 * Builds a `migrate` that keeps whatever was in storage, falling back to
 * defaults only when the browser had nothing stored under that key.
 *
 * Preserving is the deliberate choice here, not an accident. An earlier pass
 * had these stores return initial state unconditionally on a version mismatch,
 * which wiped a player's worlds and characters out from under them on
 * rehydration, so they were changed to hand the persisted object straight back.
 * The consequence is worth stating plainly: bumping `version` on a store that
 * uses this helper clears nothing for anyone who already has data. It only
 * produces a clean slate for a browser that had none.
 *
 * Which means reaching for this helper is a claim that the old persisted shape
 * is still safe to load as-is. When that stops being true, the store needs its
 * own version-gated `migrate` that transforms or drops the specific fields that
 * changed - worldStore and sessionStore are the worked examples. Discarding
 * data is something a migrate has to say out loud; a version bump on its own
 * won't do it.
 *
 * Leaving `migrate` off entirely is the trap this replaces. Zustand logs a
 * console error on a version mismatch and drops the whole record, so a store
 * with no migrate loses its data the first time someone bumps its version.
 *
 * @param getFallbackState Returns the defaults to use when storage was empty.
 */
export const createPreserveMigrate =
  <T>(getFallbackState: () => T) =>
  (persistedState: unknown): T =>
    (persistedState || getFallbackState()) as T;
