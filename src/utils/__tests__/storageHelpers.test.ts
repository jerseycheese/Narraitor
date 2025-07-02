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
    (global as unknown as { indexedDB?: typeof mockIndexedDB }).indexedDB = mockIndexedDB;
    (global as unknown as { DOMException?: typeof MockDOMException }).DOMException = MockDOMException;
  });

  afterEach(() => {
    delete (global as unknown as { indexedDB?: typeof mockIndexedDB }).indexedDB;
    delete (global as unknown as { DOMException?: typeof MockDOMException }).DOMException;
  });

  describe('storage availability detection', () => {
    test('should correctly identify when browser supports persistent storage', async () => {
      const mockDB = { close: jest.fn() };
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        result: mockDB
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);

      const checkPromise = isStorageAvailable();
      
      // Simulate successful database connection
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: { result: mockDB } } as unknown as Event);
      }

      const result = await checkPromise;
      
      expect(result).toBe(true);
      expect(mockDB.close).toHaveBeenCalled();
    });

    test('should handle environments without IndexedDB support', async () => {
      delete (global as unknown as { indexedDB?: typeof mockIndexedDB }).indexedDB;

      const result = await isStorageAvailable();
      
      expect(result).toBe(false);
    });

    test('should handle database access failures gracefully', async () => {
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);

      const checkPromise = isStorageAvailable();
      
      // Simulate database access error
      if (mockRequest.onerror) {
        mockRequest.onerror({ target: { error: new Error('Database locked') } } as unknown as Event);
      }

      const result = await checkPromise;
      
      expect(result).toBe(false);
    });

    test('should handle private browsing mode restrictions', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const mockRequest = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null
        };
        
        setTimeout(() => {
          if (mockRequest.onerror) {
            mockRequest.onerror({ 
              target: { error: new MockDOMException('SecurityError') } 
            } as unknown as Event);
          }
        }, 0);
        
        return mockRequest;
      });

      const result = await isStorageAvailable();
      expect(result).toBe(false);
    });
  });

  describe('error handling and user communication', () => {
    test('should provide helpful guidance for storage quota issues', () => {
      const error = new MockDOMException('QuotaExceededError');
      const result = handleStorageError(error);

      expect(result).toEqual({
        userMessage: 'Storage quota exceeded. Please free up some space.',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true
      });
    });

    test('should handle private browsing limitations clearly', () => {
      const error = new MockDOMException('SecurityError');
      const result = handleStorageError(error);

      expect(result).toEqual({
        userMessage: 'Storage is unavailable in private browsing mode.',
        technicalMessage: 'SecurityError',
        isRecoverable: false,
        shouldNotify: true
      });
    });

    test('should provide actionable feedback for network-related storage issues', () => {
      const error = new MockDOMException('NetworkError');
      const result = handleStorageError(error);

      expect(result).toEqual({
        userMessage: 'Network error while accessing storage. Please check your connection.',
        technicalMessage: 'NetworkError',
        isRecoverable: true,
        shouldNotify: true
      });
    });

    test('should handle data corruption with recovery guidance', () => {
      const error = new MockDOMException('DataError');
      const result = handleStorageError(error);

      expect(result).toEqual({
        userMessage: 'Storage data is corrupted. Resetting to defaults.',
        technicalMessage: 'DataError',
        isRecoverable: true,
        shouldNotify: true
      });
    });

    test('should provide safe fallback for unexpected errors', () => {
      const error = new Error('Unexpected database error');
      const result = handleStorageError(error);

      expect(result).toEqual({
        userMessage: 'An error occurred while accessing storage.',
        technicalMessage: 'Unexpected database error',
        isRecoverable: false,
        shouldNotify: true
      });
    });
  });

  describe('data cleanup and reset functionality', () => {
    test('should successfully reset all game data when requested', async () => {
      mockIndexedDB.deleteDatabase.mockImplementation(() => {
        const request = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null
        };
        
        setTimeout(() => {
          if (request.onsuccess) {
            request.onsuccess({} as Event);
          }
        }, 0);
        
        return request;
      });

      await expect(clearAllStoredData()).resolves.toBeUndefined();
      expect(mockIndexedDB.deleteDatabase).toHaveBeenCalledWith('narraitor-state');
    });

    test('should handle cleanup failures gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockIndexedDB.deleteDatabase.mockImplementation(() => {
        const request = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null
        };
        
        setTimeout(() => {
          if (request.onerror) {
            request.onerror({ target: { error: new Error('Cleanup failed') } } as unknown as Event);
          }
        }, 0);
        
        return request;
      });

      // Should complete without throwing (errors are logged, not thrown)
      await expect(clearAllStoredData()).resolves.toBeUndefined();
      
      // Should have logged the error
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to delete database narraitor-state:', 
        expect.any(Error)
      );
      
      consoleError.mockRestore();
    });

    test('should handle environments without storage support', async () => {
      delete (global as unknown as { indexedDB?: typeof mockIndexedDB }).indexedDB;

      await expect(clearAllStoredData()).resolves.toBeUndefined();
    });

    test('should handle security restrictions during cleanup', async () => {
      mockIndexedDB.deleteDatabase.mockImplementation(() => {
        throw new MockDOMException('SecurityError');
      });

      await expect(clearAllStoredData()).rejects.toThrow('SecurityError');
    });
  });
});
