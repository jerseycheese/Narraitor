/**
 * Resilient Storage Middleware for Narraitor
 *
 * Tries IndexedDB first, falls back to memory storage if it fails.
 * Keeps the game playable even when browser storage isn't available.
 */

import { IndexedDBAdapter } from './indexedDBAdapter';

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
      this.status = StorageStatus.HEALTHY;
    } catch (error) {
      console.warn('[Storage] IndexedDB unavailable, using memory storage:', error);
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
        console.warn('[Storage] IndexedDB read failed, switching to memory:', error);
        this.adapter = null;
        this.status = StorageStatus.UNAVAILABLE;
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
        console.warn('[Storage] IndexedDB write failed, switching to memory:', error);
        this.adapter = null;
        this.status = StorageStatus.UNAVAILABLE;
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
   * Start health monitoring (no-op for backward compatibility)
   */
  startHealthMonitoring(_intervalMs: number = 30000): void {
    // No-op
  }

  /**
   * Stop health monitoring (no-op for backward compatibility)
   */
  stopHealthMonitoring(): void {
    // No-op
  }

  /**
   * Get current storage status
   */
  getStorageStatus(): StorageStatus {
    return this.status;
  }
}
