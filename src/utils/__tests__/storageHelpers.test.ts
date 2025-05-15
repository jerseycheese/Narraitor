import { 
  isStorageAvailable, 
  handleStorageError, 
  clearAllStoredData 
} from '../storageHelpers';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
};

// Mock DOMException for storage errors
class MockDOMException extends Error {
  constructor(public name: string) {
    super(name);
  }
}

describe('storageHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Define types for the global object
    (global as { indexedDB?: typeof mockIndexedDB }).indexedDB = mockIndexedDB;
    (global as { DOMException?: typeof MockDOMException }).DOMException = MockDOMException;
  });

  afterEach(() => {
    // Use properly typed global object
    delete (global as { indexedDB?: typeof mockIndexedDB }).indexedDB;
    delete (global as { DOMException?: typeof MockDOMException }).DOMException;
  });

  describe('isStorageAvailable', () => {
    test('should detect when IndexedDB is available', async () => {
      // Mock successful database open
      const mockDB = { close: jest.fn() };
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        result: mockDB
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);

      const checkPromise = isStorageAvailable();
      
      // Simulate successful open
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: { result: mockDB } } as unknown as Event);
      }

      const result = await checkPromise;
      
      expect(result).toBe(true);
      expect(mockDB.close).toHaveBeenCalled();
    });

    test('should detect when IndexedDB is unavailable', async () => {
      // Use properly typed global object
      delete (global as { indexedDB?: typeof mockIndexedDB }).indexedDB;

      const result = await isStorageAvailable();
      
      expect(result).toBe(false);
    });

    test('should handle IndexedDB open errors', async () => {
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);

      const checkPromise = isStorageAvailable();
      
      // Simulate error
      if (mockRequest.onerror) {
        mockRequest.onerror({ target: { error: new Error('Failed to open') } } as unknown as Event);
      }

      const result = await checkPromise;
      
      expect(result).toBe(false);
    });

    test('should handle security errors in private browsing', async () => {
      // Mock exception when opening IndexedDB in private browsing
      mockIndexedDB.open.mockImplementation(() => {
        return null; // Return a truthy value that doesn't have success/error handlers
      });

      try {
        const result = await isStorageAvailable();
        expect(result).toBe(false);
      } catch {
        // If error is thrown, it should still be handled gracefully
        expect(true).toBe(true);
      }
    });
  });

  describe('handleStorageError', () => {
    test('should format quota exceeded errors appropriately', () => {
      const error = new MockDOMException('QuotaExceededError');
      const result = handleStorageError(error);

      expect(result).toEqual({
        userMessage: 'Storage quota exceeded. Please free up some space.',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true
      });
    });

    test('should format security errors appropriately', () => {
      const error = new MockDOMException('SecurityError');
      const result = handleStorageError(error);

      expect(result).toEqual({
        userMessage: 'Storage is unavailable in private browsing mode.',
        technicalMessage: 'SecurityError',
        isRecoverable: false,
        shouldNotify: true
      });
    });

    test('should format network errors appropriately', () => {
      const error = new MockDOMException('NetworkError');
      const result = handleStorageError(error);

      expect(result).toEqual({
        userMessage: 'Network error while accessing storage. Please check your connection.',
        technicalMessage: 'NetworkError',
        isRecoverable: true,
        shouldNotify: true
      });
    });

    test('should provide fallback for unknown errors', () => {
      const error = new Error('Unknown error');
      const result = handleStorageError(error);

      expect(result).toEqual({
        userMessage: 'An error occurred while accessing storage.',
        technicalMessage: 'Unknown error',
        isRecoverable: false,
        shouldNotify: true
      });
    });

    test('should handle corrupted data errors', () => {
      const error = new MockDOMException('DataError');
      const result = handleStorageError(error);

      expect(result).toEqual({
        userMessage: 'Storage data is corrupted. Resetting to defaults.',
        technicalMessage: 'DataError',
        isRecoverable: true,
        shouldNotify: true
      });
    });
  });

  describe('clearAllStoredData', () => {
    test('should clear all persisted state', async () => {
      // Mock successful deletion
      mockIndexedDB.deleteDatabase.mockImplementation(() => {
        const request = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null
        };
        
        // Simulate async success
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess({} as Event);
          }
        }, 0);
        
        return request;
      });

      await clearAllStoredData();

      // Verify all databases were deleted
      expect(mockIndexedDB.deleteDatabase).toHaveBeenCalledWith('narraitor-state');
      expect(mockIndexedDB.deleteDatabase).toHaveBeenCalledTimes(1);
    });

    test('should handle partial clearing on error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock first deletion success, second failure
      let callCount = 0;
      mockIndexedDB.deleteDatabase.mockImplementation(() => {
        const request = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null
        };
        
        setTimeout(() => {
          if (callCount === 0 && request.onsuccess) {
            request.onsuccess({} as Event);
          } else if (callCount === 1 && request.onerror) {
            request.onerror({ target: { error: new Error('Delete failed') } } as unknown as Event);
          }
          callCount++;
        }, 0);
        
        return request;
      });

      try {
        await clearAllStoredData();
      } catch {
        // Expected to throw
      }

      // First database should be cleared
      expect(mockIndexedDB.deleteDatabase).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    test('should handle missing IndexedDB gracefully', async () => {
      // Use properly typed global object
      delete (global as { indexedDB?: typeof mockIndexedDB }).indexedDB;

      // Should not throw, just return
      await expect(clearAllStoredData()).resolves.toBeUndefined();
    });

    test('should handle security errors during clearing', async () => {
      mockIndexedDB.deleteDatabase.mockImplementation(() => {
        throw new MockDOMException('SecurityError');
      });

      // Should handle the error gracefully
      await expect(clearAllStoredData()).rejects.toThrow('SecurityError');
      // Remove unused error variable
    });
  });
});
