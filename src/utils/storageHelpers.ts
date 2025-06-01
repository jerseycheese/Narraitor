/**
 * Interface for standardized storage error objects
 * @property userMessage - User-friendly error message for display
 * @property technicalMessage - Technical error details for logging
 * @property isRecoverable - Whether the error can be recovered from
 * @property shouldNotify - Whether to notify the user of the error
 */
interface StorageError {
  userMessage: string;
  technicalMessage: string;
  isRecoverable: boolean;
  shouldNotify: boolean;
}

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

/**
 * Handle storage errors with user-friendly messages
 * Categorizes errors and provides standardized response format
 * 
 * @param error - Raw error object from storage operation
 * @returns StorageError object with user-friendly message and metadata
 * 
 * Recovery behavior:
 * - QuotaExceededError: User can free up space to recover
 * - SecurityError: Not recoverable in private browsing contexts
 * - NetworkError: May resolve when connection is restored
 * - DataError: Application resets to defaults
 */
export function handleStorageError(error: unknown): StorageError {
  // Check for specific DOMException types
  if (error instanceof Error && 'name' in error) {
    const errorName = error.name;
    
    switch (errorName) {
      case 'QuotaExceededError':
        return {
          userMessage: 'Storage quota exceeded. Please free up some space.',
          technicalMessage: 'QuotaExceededError',
          isRecoverable: true,
          shouldNotify: true
        };
      
      case 'SecurityError':
        return {
          userMessage: 'Storage is unavailable in private browsing mode.',
          technicalMessage: 'SecurityError',
          isRecoverable: false,
          shouldNotify: true
        };
      
      case 'NetworkError':
        return {
          userMessage: 'Network error while accessing storage. Please check your connection.',
          technicalMessage: 'NetworkError',
          isRecoverable: true,
          shouldNotify: true
        };
      
      case 'DataError':
        return {
          userMessage: 'Storage data is corrupted. Resetting to defaults.',
          technicalMessage: 'DataError',
          isRecoverable: true,
          shouldNotify: true
        };
      
      default:
        return {
          userMessage: 'An error occurred while accessing storage.',
          technicalMessage: error.message || 'Unknown error',
          isRecoverable: false,
          shouldNotify: true
        };
    }
  }

  // Fallback for generic errors
  return {
    userMessage: 'An error occurred while accessing storage.',
    technicalMessage: 'Unknown error',
    isRecoverable: false,
    shouldNotify: true
  };
}

/**
 * Clear all stored data from IndexedDB
 */
export async function clearAllStoredData(): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return;
  }

  const databases = ['narraitor-state'];

  for (const dbName of databases) {
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          const error = (event.target as IDBRequest).error;
          reject(error);
        };
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SecurityError') {
        throw error;
      }
      // Continue with other databases even if one fails
      console.error(`Failed to delete database ${dbName}:`, error);
    }
  }
}
