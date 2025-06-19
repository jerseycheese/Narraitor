/**
 * Persistence configuration for the Narraitor application.
 * Provides configuration for IndexedDB persistence middleware.
 */

import { PersistStorage } from 'zustand/middleware';
import { IndexedDBAdapter } from '../lib/storage/indexedDBAdapter';
import { isStorageAvailable, handleStorageError } from '../utils/storageHelpers';

/**
 * Single adapter instance with lazy initialization pattern.
 * This avoids race conditions during initialization.
 */
let adapterPromise: Promise<IndexedDBAdapter> | null = null;

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
    } catch (error) {
      const storageError = handleStorageError(error as Error);
      if (storageError.shouldNotify) {
        // In production, this should be replaced with a proper notification system
        // Note: Storage error occurred but app will continue without persistence
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
 * Check if persistence is available
 */
export const checkPersistenceAvailable = async (): Promise<boolean> => {
  return await isStorageAvailable();
};
