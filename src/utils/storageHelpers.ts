/**
 * Check if IndexedDB storage is available
 * Tests IndexedDB availability by attempting to open a test database
 * @returns Promise resolving to boolean indicating if IndexedDB is available
 */
export async function isStorageAvailable(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') {
    return false;
  }

  try {
    return new Promise((resolve) => {
      const testDBName = 'narraitor-test';
      const request = indexedDB.open(testDBName);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.close();
        indexedDB.deleteDatabase(testDBName);
        resolve(true);
      };

      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
