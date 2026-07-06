/**
 * Resilient Storage Middleware for Narraitor
 *
 * Tries IndexedDB first, falls back to memory storage if it fails.
 * Keeps the game playable even when browser storage isn't available.
 */

import { IndexedDBAdapter } from './indexedDBAdapter';

import Logger from '@/lib/utils/logger';
const logger = new Logger('ResilientStorage');

/**
 * Storage health status
 */
export enum StorageStatus {
  /** Storage is working (IndexedDB available) */
  HEALTHY = 'healthy',
  /** Using memory-only fallback */
  UNAVAILABLE = 'unavailable',
}

/**
 * Storage error information
 */
export interface StorageError {
  userMessage: string;
  technicalMessage: string;
  isRecoverable: boolean;
  shouldNotify: boolean;
}

/**
 * Configuration options for resilient storage
 */
export interface ResilientStorageConfig {
  /** Callback invoked when storage status changes */
  onStatusChange?: (status: StorageStatus, error?: StorageError | null) => void;
}

/**
 * Resilient storage that tries IndexedDB, falls back to memory
 */
export class ResilientStorageMiddleware {
  private adapter: IndexedDBAdapter | null = null;
  private memoryStorage: Map<string, string> = new Map();
  private status: StorageStatus = StorageStatus.HEALTHY;
  private readonly onStatusChange: (status: StorageStatus, error?: StorageError | null) => void;

  constructor(config: ResilientStorageConfig = {}) {
    this.onStatusChange = config.onStatusChange ?? (() => {});
    this.initializeAdapter();
  }

  /**
   * Try to initialize IndexedDB, fall back to memory if it fails
   */
  private async initializeAdapter(): Promise<void> {
    try {
      this.adapter = new IndexedDBAdapter();
      await this.adapter.initialize();

      // Check if IndexedDB is actually available (not just that initialize didn't throw)
      if (!this.adapter.isInitialized) {
        logger.warn('[Storage] IndexedDB not available, using memory storage');
        this.adapter = null;
        this.status = StorageStatus.UNAVAILABLE;
        this.onStatusChange(StorageStatus.UNAVAILABLE, {
          userMessage: 'Game progress will not persist between sessions',
          technicalMessage: 'IndexedDB not available in this environment',
          isRecoverable: false,
          shouldNotify: true
        });
        return;
      }

      this.status = StorageStatus.HEALTHY;
    } catch (error) {
      logger.warn('[Storage] IndexedDB unavailable, using memory storage:', error);
      this.adapter = null;
      this.status = StorageStatus.UNAVAILABLE;
      this.onStatusChange(StorageStatus.UNAVAILABLE, {
        userMessage: 'Game progress will not persist between sessions',
        technicalMessage: `IndexedDB initialization failed: ${error}`,
        isRecoverable: false,
        shouldNotify: true
      });
    }
  }

  /**
   * Get item from storage (IndexedDB or memory fallback)
   */
  async getItem(key: string): Promise<string | null> {
    // Try IndexedDB first
    if (this.adapter) {
      try {
        return await this.adapter.getItem(key);
      } catch (error) {
        logger.warn('[Storage] IndexedDB read failed, switching to memory:', error);
        this.adapter = null;
        this.status = StorageStatus.UNAVAILABLE;
        this.onStatusChange(StorageStatus.UNAVAILABLE, {
          userMessage: 'Storage issues detected, using temporary session storage',
          technicalMessage: `IndexedDB read failed: ${error}`,
          isRecoverable: false,
          shouldNotify: true
        });
      }
    }

    // Use memory fallback
    return this.memoryStorage.get(key) ?? null;
  }

  /**
   * Set item in storage (IndexedDB or memory fallback)
   */
  async setItem(key: string, value: string): Promise<void> {
    // Try IndexedDB first
    if (this.adapter) {
      try {
        await this.adapter.setItem(key, value);
        // Also save to memory as backup
        this.memoryStorage.set(key, value);
        return;
      } catch (error) {
        logger.warn('[Storage] IndexedDB write failed, switching to memory:', error);
        this.adapter = null;
        this.status = StorageStatus.UNAVAILABLE;
        this.onStatusChange(StorageStatus.UNAVAILABLE, {
          userMessage: 'Storage issues detected, using temporary session storage',
          technicalMessage: `IndexedDB write failed: ${error}`,
          isRecoverable: false,
          shouldNotify: true
        });
      }
    }

    // Use memory fallback
    this.memoryStorage.set(key, value);
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    if (this.adapter) {
      try {
        await this.adapter.removeItem(key);
      } catch {
        // Silently fail - not critical
      }
    }
    this.memoryStorage.delete(key);
  }

  /**
   * Get current storage status
   */
  getStorageStatus(): StorageStatus {
    return this.status;
  }
}
