import { isStorageAvailable } from '../storageHelpers';

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
    (global as unknown as { indexedDB?: typeof mockIndexedDB }).indexedDB = mockIndexedDB;
    (global as unknown as { DOMException?: typeof MockDOMException }).DOMException = MockDOMException;
  });

  afterEach(() => {
    // Use properly typed global object
    delete (global as unknown as { indexedDB?: typeof mockIndexedDB }).indexedDB;
    delete (global as unknown as { DOMException?: typeof MockDOMException }).DOMException;
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
      delete (global as unknown as { indexedDB?: typeof mockIndexedDB }).indexedDB;

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

    test('propagates synchronous errors from indexedDB.open (e.g. private browsing SecurityError)', async () => {
      // Documents current behavior: indexedDB.open() is called inside a
      // `new Promise(...)` executor in isStorageAvailable, so a synchronous
      // throw rejects the returned promise rather than being caught by the
      // outer try/catch. Callers must handle this.
      mockIndexedDB.open.mockImplementation(() => {
        throw new MockDOMException('SecurityError');
      });

      await expect(isStorageAvailable()).rejects.toThrow('SecurityError');
    });
  });
});
