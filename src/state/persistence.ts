/**
 * Persistence configuration for the Narraitor application.
 * Provides configuration for IndexedDB persistence middleware with LocalStorage backup.
 */

import { PersistStorage } from 'zustand/middleware';
import { IndexedDBAdapter } from '../lib/storage/indexedDBAdapter';
import { LocalStorageAdapter } from '../lib/storage/localStorageAdapter';
import { isStorageAvailable, handleStorageError } from '../utils/storageHelpers';

/**
 * Single adapter instance with lazy initialization pattern.
 * This avoids race conditions during initialization.
 */
let adapterPromise: Promise<IndexedDBAdapter> | null = null;
let localStorageAdapter: LocalStorageAdapter | null = null;

/**
 * Get IndexedDBAdapter instance with lazy initialization.
 * This ensures the adapter is only initialized once and properly shared.
 * Handles initialization failures gracefully by returning a fallback adapter.
 */
const getAdapter = async (): Promise<IndexedDBAdapter> => {
  if (!adapterPromise) {
    adapterPromise = IndexedDBAdapter.create()
      .catch(() => {
        // Return a fallback adapter for error cases
        return new IndexedDBAdapter();
      });
  }
  
  return adapterPromise;
};

/**
 * Get LocalStorageAdapter instance with lazy initialization.
 */
const getLocalStorageAdapter = (): LocalStorageAdapter => {
  if (!localStorageAdapter) {
    localStorageAdapter = new LocalStorageAdapter();
  }
  
  return localStorageAdapter;
};

/**
 * Create IndexedDB storage for Zustand persistence
 * @returns Persistence storage implementation compatible with Zustand
 */
export const createIndexedDBStorage = (): PersistStorage<unknown> => ({
  getItem: async (name: string): Promise<{ state: unknown; version?: number } | null> => {
    try {
      const db = await getAdapter();
      const result = await db.getItem(name);
      
      if (!result) return null;
      // Parse the JSON string into a StorageValue object
      return JSON.parse(result) as { state: unknown; version?: number };
    } catch {
      // Gracefully handle retrieval errors by returning null
      return null;
    }
  },
  
  setItem: async (name: string, value: { state: unknown; version?: number }): Promise<void> => {
    try {
      const db = await getAdapter();
      // Convert the StorageValue object to a JSON string
      await db.setItem(name, JSON.stringify(value));
      
      // Also backup critical state to LocalStorage
      await backupCriticalState(name, value.state);
    } catch (error) {
      const storageError = handleStorageError(error as Error);
      if (storageError.shouldNotify) {
        // In production, this should be replaced with a proper notification system
        console.error(storageError.userMessage);
      }
      // Don't throw - allow app to continue without persistence
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await getAdapter();
      await db.removeItem(name);
    } catch {
      // Silently handle removal errors, allowing app to continue
    }
  }
});

/**
 * Persistence configuration for stores
 */
export const persistConfig = { 
  name: 'narraitor-state',
  storage: createIndexedDBStorage()
};

/**
 * Backup critical state to LocalStorage
 * Extracts important IDs and references for recovery purposes
 */
const backupCriticalState = async (storeName: string, state: unknown): Promise<void> => {
  try {
    const localAdapter = getLocalStorageAdapter();
    
    if (!localAdapter.isAvailable()) {
      return;
    }

    // Extract critical state based on store type
    const criticalState: Record<string, unknown> = {};

    if (storeName.includes('world') && state && typeof state === 'object') {
      const worldState = state as Record<string, unknown>;
      if (worldState.currentWorldId) {
        criticalState.activeWorldId = worldState.currentWorldId;
      }
    }

    if (storeName.includes('character') && state && typeof state === 'object') {
      const characterState = state as Record<string, unknown>;
      if (characterState.currentCharacterId) {
        criticalState.activeCharacterId = characterState.currentCharacterId;
      }
    }

    if (storeName.includes('session') && state && typeof state === 'object') {
      const sessionState = state as Record<string, unknown>;
      if (sessionState.activeSession) {
        criticalState.activeSessionId = sessionState.activeSession;
      }
    }

    // Only update if we have critical data
    if (Object.keys(criticalState).length > 0) {
      await localAdapter.updateCriticalState(criticalState);
    }
  } catch {
    // Fail silently - don't disrupt main persistence
  }
};

/**
 * Check if persistence is available
 */
export const checkPersistenceAvailable = async (): Promise<boolean> => {
  return await isStorageAvailable();
};

/**
 * Get LocalStorage adapter for external use
 */
export const getLocalStorageBackup = (): LocalStorageAdapter => {
  return getLocalStorageAdapter();
};
