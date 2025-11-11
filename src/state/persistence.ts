/**
 * Persistence configuration for the Narraitor application.
 * Provides configuration for resilient IndexedDB persistence middleware.
 */

import { PersistStorage } from 'zustand/middleware';
import { ResilientStorageMiddleware } from '../lib/storage/resilientStorage';

/**
 * Single resilient storage promise with lazy initialization pattern.
 * This avoids race conditions during initialization and provides
 * retry logic, fallback mechanisms, and recovery detection.
 */
let resilientStoragePromise: Promise<ResilientStorageMiddleware> | null = null;

/**
 * Get ResilientStorageMiddleware instance with lazy initialization.
 * This ensures the middleware is only initialized once and properly shared.
 * Handles initialization failures gracefully with memory fallback.
 */
const getResilientStorage = async (): Promise<ResilientStorageMiddleware> => {
  if (!resilientStoragePromise) {
    resilientStoragePromise = (async () => {
      const storage = new ResilientStorageMiddleware({
        retryAttempts: 3,
        baseDelay: 1000,
        maxDelay: 8000,
        onStatusChange: (status, error) => {
          // Notify user about storage status changes
          if (error?.shouldNotify) {
            console.error('[Persistence] Storage status changed:', status, error);
          }
        },
      });
      
      // Start health monitoring
      storage.startHealthMonitoring(30000); // Check every 30 seconds
      return storage;
    })();
  }
  
  return resilientStoragePromise;
};

/**
 * Create resilient IndexedDB storage for Zustand persistence
 * @returns Persistence storage implementation compatible with Zustand
 */
export const createIndexedDBStorage = (): PersistStorage<unknown> => ({
  getItem: async (name: string): Promise<{ state: unknown; version?: number } | null> => {
    try {
      const storage = await getResilientStorage();
      const result = await storage.getItem(name);
      
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
      const storage = await getResilientStorage();
      // Convert the StorageValue object to a JSON string
      await storage.setItem(name, JSON.stringify(value));
    } catch {
      // Resilient storage handles errors internally with retry logic and fallback
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    try {
      const storage = await getResilientStorage();
      await storage.removeItem(name);
    } catch {
      // Resilient storage handles errors internally
    }
  }
});
