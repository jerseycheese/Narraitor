/**
 * Persistence configuration for the Narraitor application.
 * Provides configuration for resilient IndexedDB persistence middleware.
 */

import { PersistStorage } from 'zustand/middleware';
import { ResilientStorageMiddleware } from '../lib/storage/resilientStorage';
import Logger from '@/lib/utils/logger';

const logger = new Logger('Persistence');

/**
 * Single resilient storage promise with lazy initialization pattern.
 * Avoids race conditions during initialization.
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
        onStatusChange: (status, error) => {
          if (error?.shouldNotify) {
            console.warn('[Persistence] Storage status changed:', status, error);
          }
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
 */
export const createIndexedDBStorage = (): PersistStorage<unknown> => ({
  getItem: async (name: string): Promise<{ state: unknown; version?: number } | null> => {
    try {
      const storage = await getResilientStorage();
      const result = await storage.getItem(name);
      
      if (!result) return null;
      // Parse the JSON string into a StorageValue object
      return JSON.parse(result) as { state: unknown; version?: number };
    } catch (error) {
      logger.error('Failed to get item', error);
      return null;
    }
  },
  
  setItem: async (name: string, value: { state: unknown; version?: number }): Promise<void> => {
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
