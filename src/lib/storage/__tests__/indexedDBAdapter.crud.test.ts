import { IndexedDBAdapter } from '../indexedDBAdapter';
import {
  createMockDB,
  createMockIDB,
  createMockStore,
  createMockRequest,
  setupSuccessfulOpen,
  setupMockTransaction,
  triggerSuccess
} from './indexedDBAdapter.testHelpers';

describe('IndexedDBAdapter - CRUD Operations', () => {
  let adapter: IndexedDBAdapter;
  let mockIDB: ReturnType<typeof createMockIDB>;
  let mockDB: ReturnType<typeof createMockDB>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockIDB = createMockIDB();
    mockDB = createMockDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).indexedDB = mockIDB;

    setupSuccessfulOpen(mockIDB, mockDB);
    adapter = new IndexedDBAdapter();
    await adapter.initialize();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).indexedDB;
  });

  describe('getItem', () => {
    test('should retrieve stored value by key', async () => {
      const mockValue = { data: 'test-value' };
      const mockRequest = createMockRequest({ value: mockValue });
      const mockStore = createMockStore();
      mockStore.get.mockReturnValue(mockRequest);

      setupMockTransaction(mockDB, mockStore);

      const getPromise = adapter.getItem('test-key');
      triggerSuccess(mockRequest, { value: mockValue });

      const result = await getPromise;

      expect(mockStore.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(JSON.stringify(mockValue));
    });

    test('should return null for non-existent key', async () => {
      const mockRequest = createMockRequest(undefined);
      const mockStore = createMockStore();
      mockStore.get.mockReturnValue(mockRequest);

      setupMockTransaction(mockDB, mockStore);

      const getPromise = adapter.getItem('non-existent-key');
      triggerSuccess(mockRequest, undefined);

      const result = await getPromise;
      expect(result).toBeNull();
    });

    test('should handle IndexedDB errors gracefully', async () => {
      const mockIDB2 = createMockIDB();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).indexedDB = mockIDB2;

      mockIDB2.open.mockImplementation(() => {
        const openRequest = createMockRequest();

        setTimeout(() => {
          if (openRequest.onerror) {
            openRequest.onerror({ target: { error: new Error('DB Error') } } as unknown as Event);
          }
        }, 0);

        return openRequest;
      });

      const localAdapter = new IndexedDBAdapter();
      const result = await localAdapter.getItem('test-key');
      expect(result).toBeNull();
    });
  });

  describe('setItem', () => {
    test('should store value with key', async () => {
      const testData = { name: 'Test World' };
      const mockRequest = createMockRequest();
      const mockStore = createMockStore();
      mockStore.put.mockReturnValue(mockRequest);

      setupMockTransaction(mockDB, mockStore);

      const setPromise = adapter.setItem('test-key', JSON.stringify(testData));
      triggerSuccess(mockRequest);

      await setPromise;

      expect(mockStore.put).toHaveBeenCalledWith(
        {
          id: 'test-key',
          value: testData
        },
        'test-key'
      );
    });

    test('should overwrite existing value', async () => {
      const newData = { name: 'Updated World' };
      const mockRequest = createMockRequest();
      const mockStore = createMockStore();
      mockStore.put.mockReturnValue(mockRequest);

      setupMockTransaction(mockDB, mockStore);

      const setPromise = adapter.setItem('existing-key', JSON.stringify(newData));
      triggerSuccess(mockRequest);

      await setPromise;

      expect(mockStore.put).toHaveBeenCalledWith(
        {
          id: 'existing-key',
          value: newData
        },
        'existing-key'
      );
    });

    test('should handle large data (>1MB)', async () => {
      const largeData = { data: 'x'.repeat(1024 * 1024 + 1) }; // >1MB
      const mockRequest = createMockRequest();
      const mockStore = createMockStore();
      mockStore.put.mockReturnValue(mockRequest);

      setupMockTransaction(mockDB, mockStore);

      const setPromise = adapter.setItem('large-data', JSON.stringify(largeData));
      triggerSuccess(mockRequest);

      await setPromise;

      expect(mockStore.put).toHaveBeenCalled();
    });

    test('should handle IndexedDB quota exceeded error', async () => {
      const mockRequest = createMockRequest();
      const mockStore = createMockStore();
      mockStore.put.mockReturnValue(mockRequest);

      setupMockTransaction(mockDB, mockStore);

      const setPromise = adapter.setItem('test-key', JSON.stringify({ data: 'test' }));

      // Simulate quota exceeded error
      setTimeout(() => {
        if (mockRequest.onerror) {
          const quotaError = new DOMException('QuotaExceededError');
          Object.defineProperty(quotaError, 'name', { value: 'QuotaExceededError' });
          mockRequest.onerror({ target: { error: quotaError } } as unknown as Event);
        }
      }, 0);

      await expect(setPromise).rejects.toThrow('QuotaExceededError');
    });
  });

  describe('removeItem', () => {
    test('should remove stored value by key', async () => {
      const mockRequest = createMockRequest();
      const mockStore = createMockStore();
      mockStore.delete.mockReturnValue(mockRequest);

      setupMockTransaction(mockDB, mockStore);

      const removePromise = adapter.removeItem('test-key');
      triggerSuccess(mockRequest);

      await removePromise;

      expect(mockStore.delete).toHaveBeenCalledWith('test-key');
    });

    test('should handle removal of non-existent key', async () => {
      const mockRequest = createMockRequest();
      const mockStore = createMockStore();
      mockStore.delete.mockReturnValue(mockRequest);

      setupMockTransaction(mockDB, mockStore);

      const removePromise = adapter.removeItem('non-existent-key');
      triggerSuccess(mockRequest);

      await removePromise;

      expect(mockStore.delete).toHaveBeenCalledWith('non-existent-key');
    });
  });
});
