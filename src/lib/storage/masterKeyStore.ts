/**
 * Master-key store for API-key encryption.
 *
 * Holds the single non-extractable AES-GCM CryptoKey used to encrypt/decrypt
 * provider API keys. The key lives in its OWN IndexedDB database
 * (`narraitor-secure`) rather than the app state DB, because the app's
 * IndexedDBAdapter JSON-serializes everything and a CryptoKey only survives a
 * structured clone. Keeping it separate also means a `forget provider` wipe can
 * drop the whole secure DB without touching game state.
 *
 * The CryptoKey is stored with `extractable: false`, so even if hostile script
 * gets a reference it cannot `exportKey` the raw bytes out of the browser.
 *
 * With no IndexedDB (private mode, SSR, old browsers), load/clear are no-ops
 * and the caller falls back to an in-memory key for the session.
 */

const DB_NAME = 'narraitor-secure';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const MASTER_KEY_ID = 'master';

const hasIndexedDB = (): boolean => typeof indexedDB !== 'undefined';

function openDb(): Promise<IDBDatabase | null> {
  if (!hasIndexedDB()) return Promise.resolve(null);

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => resolve(null);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Load the stored master key, or null if none exists / storage is unavailable.
 */
export async function loadMasterKey(): Promise<CryptoKey | null> {
  const db = await openDb();
  if (!db) return null;

  try {
    return await new Promise<CryptoKey | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(MASTER_KEY_ID);
      request.onsuccess = () => {
        const value = request.result;
        resolve(value instanceof CryptoKey ? value : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  } finally {
    db.close();
  }
}

/**
 * Persist the master key. No-op when storage is unavailable.
 */
export async function saveMasterKey(key: CryptoKey): Promise<void> {
  const db = await openDb();
  if (!db) return;

  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(key, MASTER_KEY_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    // Swallow — a missing master key just means we regenerate next session.
  } finally {
    db.close();
  }
}

/**
 * Delete the master key entirely. Part of the `forget provider` wipe.
 */
export async function clearMasterKey(): Promise<void> {
  const db = await openDb();
  if (!db) return;

  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(MASTER_KEY_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    // Non-critical.
  } finally {
    db.close();
  }
}
