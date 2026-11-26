/**
 * Record in the same store listing a fingerprint of every key a guarded adapter
 * has read or written, so a write can check them all without reading them all.
 */
const FINGERPRINTS_KEY = 'narraitor-write-fingerprints';

type Fingerprints = Record<string, string>;

function serializeRecord(record: { value?: unknown } | undefined): string | null {
  if (!record?.value) return null;
  // Handle both JSON and string data
  return typeof record.value === 'string' ? record.value : JSON.stringify(record.value);
}

/** Length plus 32-bit FNV-1a: tells two saved versions of a record apart. */
function fingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 0x01000193);
  }
  return `${value.length}:${hash >>> 0}`;
}

/**
 * IndexedDB adapter for Zustand persistence
 * Provides simple storage operations for MVP implementation
 * 
 * This adapter implements a basic CRUD interface for persisting state in IndexedDB.
 * It follows a factory pattern with async initialization to prevent race conditions.
 * Operations fail silently instead of throwing, so the app keeps working when
 * persistence is unavailable — it just won't save.
 */
export class IndexedDBAdapter {
  private dbName = 'narraitor-state';
  private version = 1;
  private storeName = 'narraitor-store';
  private db: IDBDatabase | null = null;
  /** Fingerprint of what this adapter last read or wrote under each key. */
  private knownFingerprints = new Map<string, string | null>();
  private readonly refuseStaleWrites: boolean;

  /**
   * @param options.refuseStaleWrites Reject every write once another tab has
   * changed any key this adapter has read or written.
   */
  constructor(options: { refuseStaleWrites?: boolean } = {}) {
    this.refuseStaleWrites = options.refuseStaleWrites ?? false;
  }

  /**
   * Check if the database is initialized
   */
  get isInitialized(): boolean {
    return this.db !== null;
  }

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
   * Returns early in environments without IndexedDB, instead of throwing
   */
  async initialize(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return; // No IndexedDB (private mode, SSR, old browsers) - skip init
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
        this.db = db;
        
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
   * @param key - The key to retrieve
   * @returns Promise resolving to the stored value or null if not found
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
        const transaction = this.db!.transaction(
          [this.storeName],
          this.refuseStaleWrites ? 'readwrite' : 'readonly'
        );
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const value = serializeRecord(request.result);
          if (!this.refuseStaleWrites) {
            resolve(value);
            return;
          }
          this.recordRead(store, key, value, () => resolve(value));
        };

        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Remembers what was read and corrects the shared fingerprint if the record
   * was last saved by something that doesn't keep one.
   */
  private recordRead(
    store: IDBObjectStore,
    key: string,
    value: string | null,
    done: () => void
  ): void {
    const read = value === null ? null : fingerprint(value);
    const request = store.get(FINGERPRINTS_KEY);
    request.onerror = done;
    request.onsuccess = () => {
      this.knownFingerprints.set(key, read);
      const shared: Fingerprints = { ...request.result?.value };
      if ((shared[key] ?? null) !== read) {
        if (read === null) delete shared[key];
        else shared[key] = read;
        store.put({ id: FINGERPRINTS_KEY, value: shared }, FINGERPRINTS_KEY);
      }
      done();
    };
  }

  /** Drops a deleted record's shared fingerprint, so other tabs see it changed. */
  private forgetFingerprint(store: IDBObjectStore, key: string): void {
    const request = store.get(FINGERPRINTS_KEY);
    request.onsuccess = () => {
      const shared: Fingerprints = { ...request.result?.value };
      delete shared[key];
      store.put({ id: FINGERPRINTS_KEY, value: shared }, FINGERPRINTS_KEY);
    };
  }

  /**
   * Set an item in storage
   * @param key - The key to store the value under
   * @param value - The value to store (as JSON string)
   * @throws DOMException for quota exceeded or other storage errors, and a
   * `StaleWriteError` one when stale writes are refused
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
        let forgetUncommitted = () => {};

        // A successful request can still abort at commit (e.g. a full disk),
        // so only a completed transaction counts as written.
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => {
          forgetUncommitted();
          reject(transaction.error ?? new DOMException('Transaction aborted', 'AbortError'));
        };

        // Parse the value to store as object
        let dataToStore: unknown;
        try {
          dataToStore = JSON.parse(value);
        } catch {
          dataToStore = value;
        }

        const put = () => {
          const request = store.put({
            id: key,
            value: dataToStore
          }, key);

          request.onerror = (event) => {
            const error = (event.target as IDBRequest).error;
            if (error?.name === 'QuotaExceededError') {
              reject(new DOMException('QuotaExceededError'));
            } else {
              reject(error);
            }
          };
        };

        if (!this.refuseStaleWrites) {
          put();
          return;
        }

        // Compare and write inside one transaction, so no other tab can write
        // in between.
        const next = fingerprint(value);
        const read = store.get(FINGERPRINTS_KEY);
        read.onerror = () => reject(read.error);
        read.onsuccess = () => {
          // Nothing changed in this tab, so there is nothing to save, and a
          // newer value from another tab must not be overwritten.
          if (this.knownFingerprints.get(key) === next) {
            resolve();
            return;
          }
          const shared: Fingerprints = { ...read.result?.value };
          const changed = Array.from(this.knownFingerprints).find(([name, known]) => {
            const current = shared[name] ?? null;
            return current !== known && !(name === key && current === next);
          });
          if (changed) {
            reject(
              new DOMException(`${changed[0]} was changed in another tab`, 'StaleWriteError')
            );
            return;
          }
          const previous = this.knownFingerprints.get(key);
          this.knownFingerprints.set(key, next);
          // An aborted write must not make the writes queued behind it look
          // like another tab changed this record.
          forgetUncommitted = () => {
            if (previous === undefined) this.knownFingerprints.delete(key);
            else this.knownFingerprints.set(key, previous);
          };
          shared[key] = next;
          try {
            store.put({ id: FINGERPRINTS_KEY, value: shared }, FINGERPRINTS_KEY);
            put();
          } catch (error) {
            reject(error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Remove an item from storage
   * @param key - The key to remove
   * @returns Promise that resolves whether removal succeeds or fails - failures are swallowed, not thrown
   */
  async removeItem(key: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    
    if (!this.db || typeof indexedDB === 'undefined') {
      return;
    }

    this.knownFingerprints.delete(key);

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => resolve(); // Don't fail on deletion errors

        if (this.refuseStaleWrites) {
          this.forgetFingerprint(store, key);
        }
        
        transaction.oncomplete = () => {
          // Already resolved in onsuccess
        };
      } catch {
        resolve();
      }
    });
  }

  /**
   * Remove legacy auto-save snapshot keys starting with 'auto-save-'
   * @returns Promise resolving to the number of swept snapshot keys
   */
  async sweepAutoSaveSnapshots(): Promise<number> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db || typeof indexedDB === 'undefined') {
      return 0;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        if (typeof store.getAllKeys === 'function') {
          const request = store.getAllKeys();
          request.onsuccess = () => {
            const keys = (request.result || []) as IDBValidKey[];
            let deletedCount = 0;
            for (const key of keys) {
              if (typeof key === 'string' && key.startsWith('auto-save-')) {
                store.delete(key);
                deletedCount++;
              }
            }
            resolve(deletedCount);
          };
          request.onerror = () => resolve(0);
        } else if (typeof store.openCursor === 'function') {
          let deletedCount = 0;
          const request = store.openCursor();
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
            if (cursor) {
              const key = cursor.key;
              if (typeof key === 'string' && key.startsWith('auto-save-')) {
                cursor.delete();
                deletedCount++;
              }
              cursor.continue();
            } else {
              resolve(deletedCount);
            }
          };
          request.onerror = () => resolve(deletedCount);
        } else {
          resolve(0);
        }
      } catch {
        resolve(0);
      }
    });
  }
}

