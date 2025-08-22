/**
 * Resilient Storage Middleware for Narraitor
 * 
 * Provides retry logic, fallback mechanisms, and recovery detection
 * for robust storage operations that maintain gameplay functionality
 * even when browser storage fails.
 */

import { IndexedDBAdapter } from './indexedDBAdapter';
import { handleStorageError } from '../../utils/storageHelpers';

/**
 * Storage health status enumeration
 * Tracks the current state of browser storage functionality
 */
export enum StorageStatus {
  /** Storage is working normally */
  HEALTHY = 'healthy',
  /** Storage has intermittent issues but is partially functional */
  DEGRADED = 'degraded', 
  /** Storage is completely unavailable, using memory-only fallback */
  UNAVAILABLE = 'unavailable',
  /** Currently syncing memory data back to recovered storage */
  RECOVERING = 'recovering',
}

/**
 * Storage error information with user-friendly messaging
 * Provides structured error data for UI display and logging
 */
export interface StorageError {
  /** User-friendly error message suitable for display */
  userMessage: string;
  /** Technical error details for debugging */
  technicalMessage: string;
  /** Whether retrying the operation might succeed */
  isRecoverable: boolean;
  /** Whether the user should be notified of this error */
  shouldNotify: boolean;
}

/**
 * Configuration options for resilient storage middleware
 */
export interface ResilientStorageConfig {
  /** Number of retry attempts for failed operations (default: 3) */
  retryAttempts?: number;
  /** Base delay in ms for exponential backoff (default: 100) */
  baseDelay?: number;
  /** Maximum delay in ms for exponential backoff (default: 1000) */
  maxDelay?: number;
  /** Callback invoked when storage status changes */
  onStatusChange?: (status: StorageStatus, error?: StorageError | null) => void;
}

/**
 * Resilient storage middleware that provides:
 * - Exponential backoff retry logic
 * - Memory fallback when storage fails
 * - Automatic recovery detection
 * - Storage health monitoring
 */
export class ResilientStorageMiddleware {
  private adapter: IndexedDBAdapter | null = null;
  private memoryStorage: Map<string, string> = new Map();
  private status: StorageStatus = StorageStatus.HEALTHY;
  private lastError: StorageError | null = null;
  private lastSuccessfulSync: string | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;
  
  private readonly config: Required<ResilientStorageConfig>;

  constructor(config: ResilientStorageConfig = {}) {
    this.config = {
      retryAttempts: config.retryAttempts ?? 3,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 8000,
      onStatusChange: config.onStatusChange ?? (() => {}),
    };
    
    // Start initialization but don't block constructor
    // getItem will ensure initialization is complete before access
    this.initializeAdapter().catch(error => {
      console.warn('[ResilientStorage] Background initialization failed:', error);
    });
  }

  /**
   * Initialize the IndexedDB adapter with error handling
   * Attempts to create an IndexedDB adapter and falls back to memory-only mode on failure
   */
  private async initializeAdapter(): Promise<void> {
    // Return existing promise if initialization is already in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    // If already initialized, return immediately
    if (this.adapter) {
      return;
    }
    
    // Create and cache the initialization promise
    this.initializationPromise = this.doInitializeAdapter();
    return this.initializationPromise;
  }

  /**
   * Internal method to perform the actual initialization
   */
  private async doInitializeAdapter(): Promise<void> {
    try {
      console.log('[ResilientStorage] Initializing IndexedDB adapter');
      this.adapter = await IndexedDBAdapter.create();
      console.log('[ResilientStorage] IndexedDB adapter initialized successfully');
      this.updateStatus(StorageStatus.HEALTHY);
    } catch (error) {
      console.warn('[ResilientStorage] Failed to initialize IndexedDB adapter:', error);
      this.handleStorageFailure(error as Error);
    }
  }

  /**
   * Get an item from storage with retry logic and fallback
   */
  async getItem(key: string): Promise<string | null> {
    // Ensure adapter is initialized before attempting access
    if (!this.adapter) {
      console.log(`[ResilientStorage] Adapter not ready for ${key}, initializing...`);
      await this.initializeAdapter();
    }

    // Try storage first if available
    if (this.status === StorageStatus.HEALTHY || this.status === StorageStatus.DEGRADED) {
      try {
        const result = await this.executeWithRetry(
          () => this.adapter?.getItem(key) ?? Promise.resolve(null)
        );
        
        if (result !== null) {
          return result;
        }
      } catch (error) {
        console.warn(`[ResilientStorage] Storage getItem failed for key ${key}:`, error);
        this.handleStorageFailure(error as Error);
      }
    }

    // Fallback to memory storage
    console.log(`[ResilientStorage] Using memory fallback for ${key}`);
    return this.memoryStorage.get(key) ?? null;
  }

  /**
   * Set an item in storage with retry logic and fallback
   */
  async setItem(key: string, value: string): Promise<void> {
    // Always store in memory as backup
    this.memoryStorage.set(key, value);

    // Try to persist to storage if available
    if (this.status === StorageStatus.HEALTHY || this.status === StorageStatus.DEGRADED) {
      try {
        await this.executeWithRetry(
          () => this.adapter?.setItem(key, value) ?? Promise.resolve()
        );
        
        this.updateLastSuccessfulSync();
        
        // If we were degraded and this succeeded, we might be recovering
        if (this.status === StorageStatus.DEGRADED) {
          this.updateStatus(StorageStatus.HEALTHY);
        }
        
        return;
      } catch (error) {
        console.warn(`Storage setItem failed for key ${key}:`, error);
        this.handleStorageFailure(error as Error);
      }
    }

    // If we reach here, we're operating in memory-only mode
    // The data is already stored in memory, so we can continue
  }

  /**
   * Remove an item from storage with fallback
   */
  async removeItem(key: string): Promise<void> {
    // Remove from memory
    this.memoryStorage.delete(key);

    // Try to remove from storage if available
    if (this.status === StorageStatus.HEALTHY || this.status === StorageStatus.DEGRADED) {
      try {
        await this.executeWithRetry(
          () => this.adapter?.removeItem(key) ?? Promise.resolve()
        );
        
        this.updateLastSuccessfulSync();
        return;
      } catch (error) {
        console.warn(`Storage removeItem failed for key ${key}:`, error);
        // Don't treat removal failures as critical - continue without error
      }
    }
  }

  /**
   * Execute an operation with exponential backoff retry logic
   * @param operation - The async operation to execute with retries
   * @returns Promise resolving to the operation result
   * @throws The last error if all retry attempts fail
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is recoverable
        const storageError = handleStorageError(error);
        
        // Don't retry non-recoverable errors
        if (!storageError.isRecoverable) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === this.config.retryAttempts) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.config.baseDelay * Math.pow(2, attempt - 1),
          this.config.maxDelay
        );
        
        console.warn(`Storage operation failed (attempt ${attempt}/${this.config.retryAttempts}), retrying in ${delay}ms:`, error);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Handle storage failure and update status
   * Categorizes errors and updates storage status based on recoverability
   * @param error - The error that occurred during storage operation
   */
  private handleStorageFailure(error: Error): void {
    const storageError = handleStorageError(error);
    this.lastError = storageError;
    
    if (storageError.isRecoverable) {
      // Retry failed but error is recoverable - switch to memory-only mode
      this.updateStatus(StorageStatus.UNAVAILABLE, {
        ...storageError,
        userMessage: 'Storage is temporarily unavailable. Running in memory-only mode. Your changes will not be saved until storage is restored.',
      });
    } else {
      // Non-recoverable error - permanent fallback to memory
      this.updateStatus(StorageStatus.UNAVAILABLE, storageError);
    }
  }

  /**
   * Check storage health and attempt recovery
   */
  async checkStorageHealth(): Promise<void> {
    if (this.status === StorageStatus.HEALTHY) {
      return; // Already healthy
    }

    try {
      // Test storage with a simple operation
      const testKey = '__narraitor_health_check__';
      const testValue = Date.now().toString();
      
      if (!this.adapter) {
        await this.initializeAdapter();
      }
      
      await this.adapter?.setItem(testKey, testValue);
      const retrieved = await this.adapter?.getItem(testKey);
      await this.adapter?.removeItem(testKey);
      
      if (retrieved === testValue) {
        // Storage is working - attempt recovery
        await this.recoverFromMemory();
        this.updateStatus(StorageStatus.HEALTHY, null);
        
        this.config.onStatusChange(StorageStatus.HEALTHY, {
          userMessage: 'Storage has been restored. Your data is now being saved.',
          technicalMessage: 'Storage recovery successful',
          isRecoverable: true,
          shouldNotify: true,
        });
      }
    } catch (error) {
      console.warn('Storage health check failed:', error);
      // Health check failed - maintain current status
    }
  }

  /**
   * Sync memory data back to storage during recovery
   */
  private async recoverFromMemory(): Promise<void> {
    if (this.memoryStorage.size === 0) {
      return;
    }

    this.updateStatus(StorageStatus.RECOVERING);
    
    try {
      // Sync all memory data back to storage
      for (const [key, value] of Array.from(this.memoryStorage.entries())) {
        await this.adapter?.setItem(key, value);
      }
      
      this.updateLastSuccessfulSync();
      console.info(`Recovered ${this.memoryStorage.size} items from memory to storage`);
    } catch (error) {
      console.error('Failed to recover data from memory:', error);
      throw error;
    }
  }

  /**
   * Start periodic health monitoring
   * Periodically checks storage health and attempts recovery when possible
   * @param intervalMs - Interval between health checks in milliseconds (default: 30000)
   */
  startHealthMonitoring(intervalMs: number = 30000): void {
    this.stopHealthMonitoring(); // Clear any existing interval
    
    this.healthCheckInterval = setInterval(() => {
      this.checkStorageHealth().catch(error => {
        console.warn('Health monitoring check failed:', error);
      });
    }, intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get current storage status
   */
  getStorageStatus(): StorageStatus {
    return this.status;
  }

  /**
   * Get last storage error
   */
  getLastError(): StorageError | null {
    return this.lastError;
  }

  /**
   * Get last successful sync time
   */
  getLastSuccessfulSync(): string | null {
    return this.lastSuccessfulSync;
  }

  /**
   * Update storage status and notify listeners
   */
  private updateStatus(status: StorageStatus, error: StorageError | null = null): void {
    const previousStatus = this.status;
    this.status = status;
    
    if (error) {
      this.lastError = error;
    } else if (status === StorageStatus.HEALTHY) {
      this.lastError = null;
    }
    
    // Notify about status changes
    if (previousStatus !== status) {
      this.config.onStatusChange(status, error);
    }
  }

  /**
   * Update last successful sync timestamp
   */
  private updateLastSuccessfulSync(): void {
    this.lastSuccessfulSync = new Date().toISOString();
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopHealthMonitoring();
    this.memoryStorage.clear();
  }
}