/**
 * IndexedDB adapter for Zustand persistence
 * Provides simple storage operations for MVP implementation
 * 
 * This adapter implements a basic CRUD interface for persisting state in IndexedDB.
 * It follows a factory pattern with async initialization to prevent race conditions.
 * Error handling is designed for graceful degradation - operations fail silently 
 * to allow the application to continue functioning when persistence is unavailable.
 */
export class IndexedDBAdapter {
  private dbName = 'narraitor-state';
  private version = 1;
  private storeName = 'narraitor-store';
  private db: IDBDatabase | null = null;

  /**
   * Static factory method for creating adapter instances
   */
  static async create(): Promise<IndexedDBAdapter> {
    const adapter = new IndexedDBAdapter();
    await adapter.initialize();
    return adapter;
  }

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return; // Gracefully handle environments without IndexedDB
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => resolve(); // Don't reject, just continue without persistence
      
      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }

        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          transaction.oncomplete = () => resolve();
        }
      };
    });
  }

  /**
   * Get an item from storage
   */
  async getItem(key: string): Promise<string | null> {
    if (!this.db) {
      await this.initialize();
    }
    
    if (!this.db || typeof indexedDB === 'undefined') {
      return null;
    }

    try {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          if (result && result.value) {
            // Handle both JSON and string data
            if (typeof result.value === 'string') {
              resolve(result.value);
            } else {
              resolve(JSON.stringify(result.value));
            }
          } else {
            resolve(null);
          }
        };

        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Set an item in storage
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

        const request = store.put({ 
          id: key, 
          value: dataToStore 
        }, key);

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
}
