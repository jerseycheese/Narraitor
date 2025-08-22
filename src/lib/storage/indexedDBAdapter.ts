/**
 * IndexedDB adapter for Zustand persistence
 * Provides simple storage operations for MVP implementation
 * 
 * This adapter implements a basic CRUD interface for persisting state in IndexedDB.
 * It follows a factory pattern with async initialization to prevent race conditions.
 * Error handling is designed for graceful degradation - operations fail silently 
 * to allow the application to continue functioning when persistence is unavailable.
 */
export interface IIndexedDBAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  debugGetAllKeys?(): Promise<string[]>;
  debugGetAllData?(): Promise<unknown[]>;
}

export class IndexedDBAdapter implements IIndexedDBAdapter {
  private dbName = 'narraitor-state';
  private version = 1;
  private storeName = 'narraitor-store';
  private db: IDBDatabase | null = null;

  /**
   * Static factory method for creating adapter instances
   * Uses async initialization to prevent race conditions
   * @returns Promise resolving to an initialized IndexedDBAdapter
   */
  static async create(): Promise<IndexedDBAdapter> {
    const adapter = new IndexedDBAdapter();
    await adapter.initialize();
    return adapter;
  }

  /**
   * Initialize the IndexedDB database
   * Creates the database and object store if they don't exist
   * Handles environments without IndexedDB gracefully
   */
  async initialize(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.log('[IndexedDB] IndexedDB not available in this environment');
      return; // Gracefully handle environments without IndexedDB
    }

    // If already initialized, don't reinitialize
    if (this.db) {
      console.log('[IndexedDB] Database already initialized');
      return;
    }

    console.log('[IndexedDB] Starting database initialization');
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = (event) => {
          console.error('[IndexedDB] Database open failed:', event);
          resolve(); // Don't reject, just continue without persistence
        };
        
        request.onsuccess = (event: Event) => {
          console.log('[IndexedDB] Database opened successfully');
          this.db = (event.target as IDBOpenDBRequest).result;
          
          // Add error handler for the database connection
          this.db.onerror = (event) => {
            console.error('[IndexedDB] Database error:', event);
          };
          
          resolve();
        };

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          console.log('[IndexedDB] Database upgrade needed');
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains(this.storeName)) {
            console.log(`[IndexedDB] Creating object store: ${this.storeName}`);
            db.createObjectStore(this.storeName);
          }

          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (transaction) {
            transaction.oncomplete = () => {
              console.log('[IndexedDB] Database upgrade complete');
              resolve();
            };
            transaction.onerror = (event) => {
              console.error('[IndexedDB] Database upgrade failed:', event);
              resolve(); // Don't reject, continue without persistence
            };
          } else {
            resolve();
          }
        };

        request.onblocked = (event) => {
          console.warn('[IndexedDB] Database open blocked:', event);
          // Still try to continue - resolve after a delay
          setTimeout(() => resolve(), 100);
        };
      } catch (error) {
        console.error('[IndexedDB] Exception during initialization:', error);
        resolve(); // Don't reject, continue without persistence
      }
    });
  }

  /**
   * Get an item from storage
   * @param key - The key to retrieve
   * @returns Promise resolving to the stored value or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    console.log(`[IndexedDB] getItem called for key: ${key}`);
    
    if (!this.db) {
      console.log(`[IndexedDB] Database not initialized for ${key}, initializing...`);
      await this.initialize();
    }
    
    if (!this.db || typeof indexedDB === 'undefined') {
      console.log(`[IndexedDB] Database unavailable for ${key}:`, { 
        hasDB: !!this.db, 
        hasIndexedDB: typeof indexedDB !== 'undefined' 
      });
      return null;
    }

    try {
      console.log(`[IndexedDB] Starting transaction for ${key}`);
      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          console.log(`[IndexedDB] Transaction created for ${key}`);
          
          const store = transaction.objectStore(this.storeName);
          console.log(`[IndexedDB] Object store accessed for ${key}`);
          
          const request = store.get(key);
          console.log(`[IndexedDB] Get request initiated for ${key}`);

          request.onsuccess = () => {
            const result = request.result;
            console.log(`[IndexedDB] getItem result for ${key}:`, result);
            
            if (result && result.value) {
              console.log(`[IndexedDB] Found value for ${key}:`, result.value);
              // Handle both JSON and string data
              if (typeof result.value === 'string') {
                console.log(`[IndexedDB] Returning string value for ${key}`);
                resolve(result.value);
              } else {
                console.log(`[IndexedDB] Stringifying object value for ${key}`);
                resolve(JSON.stringify(result.value));
              }
            } else {
              console.log(`[IndexedDB] No result or no value for ${key}:`, { result, hasValue: result?.value });
              resolve(null);
            }
          };

          request.onerror = (event) => {
            console.error(`[IndexedDB] getItem request error for ${key}:`, event);
            resolve(null);
          };
          
          transaction.onerror = (event) => {
            console.error(`[IndexedDB] Transaction error for ${key}:`, event);
            resolve(null);
          };
        } catch (error) {
          console.error(`[IndexedDB] Exception in getItem transaction for ${key}:`, error);
          resolve(null);
        }
      });
    } catch (error) {
      console.error(`[IndexedDB] Exception in getItem for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set an item in storage
   * @param key - The key to store the value under
   * @param value - The value to store (as JSON string)
   * @throws DOMException for quota exceeded or other storage errors
   */
  async setItem(key: string, value: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    
    if (!this.db || typeof indexedDB === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        // Parse the value to store as object
        let dataToStore: unknown;
        try {
          dataToStore = JSON.parse(value);
        } catch {
          dataToStore = value;
        }

        const objectToStore = { 
          id: key, 
          value: dataToStore 
        };
        console.log(`[IndexedDB] setItem storing for ${key}:`, objectToStore);
        
        const request = store.put(objectToStore, key);

        request.onsuccess = () => {
          // Don't wait for oncomplete in the request handler
          resolve();
        };

        request.onerror = (event) => {
          const error = (event.target as IDBRequest).error;
          if (error?.name === 'QuotaExceededError') {
            reject(new DOMException('QuotaExceededError'));
          } else {
            reject(error);
          }
        };

        // Use transaction oncomplete
        transaction.oncomplete = () => {
          // Already resolved in onsuccess
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Remove an item from storage
   * @param key - The key to remove
   * @returns Promise that resolves when the item is removed (or if removal fails gracefully)
   */
  async removeItem(key: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    
    if (!this.db || typeof indexedDB === 'undefined') {
      return;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => resolve(); // Don't fail on deletion errors
        
        transaction.oncomplete = () => {
          // Already resolved in onsuccess
        };
      } catch {
        resolve();
      }
    });
  }

  /**
   * Debug method to inspect all keys in the database
   * @returns Promise resolving to array of all keys in storage
   */
  async debugGetAllKeys(): Promise<string[]> {
    if (!this.db) {
      await this.initialize();
    }
    
    if (!this.db || typeof indexedDB === 'undefined') {
      return [];
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();

        request.onsuccess = () => {
          const keys = request.result as string[];
          console.log('[IndexedDB] All keys in database:', keys);
          resolve(keys);
        };

        request.onerror = () => {
          console.error('[IndexedDB] Failed to get all keys');
          resolve([]);
        };
      } catch (error) {
        console.error('[IndexedDB] Exception getting all keys:', error);
        resolve([]);
      }
    });
  }

  /**
   * Debug method to inspect all data in the database
   * @returns Promise resolving to array of all stored objects
   */
  async debugGetAllData(): Promise<unknown[]> {
    if (!this.db) {
      await this.initialize();
    }
    
    if (!this.db || typeof indexedDB === 'undefined') {
      return [];
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const data = request.result;
          console.log('[IndexedDB] All data in database:', data);
          resolve(data);
        };

        request.onerror = () => {
          console.error('[IndexedDB] Failed to get all data');
          resolve([]);
        };
      } catch (error) {
        console.error('[IndexedDB] Exception getting all data:', error);
        resolve([]);
      }
    });
  }
}
