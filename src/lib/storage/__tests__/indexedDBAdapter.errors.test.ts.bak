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

describe('IndexedDBAdapter - Error Scenarios', () => {
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

  test('should handle concurrent access', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRequests: any[] = [];

    const mockStore = createMockStore();
    mockStore.put.mockImplementation(() => {
      const request = createMockRequest();
      mockRequests.push(request);
      return request;
    });

    setupMockTransaction(mockDB, mockStore);

    // Initiate concurrent operations
    const promise1 = adapter.setItem('key1', JSON.stringify({ data: 1 }));
    const promise2 = adapter.setItem('key2', JSON.stringify({ data: 2 }));

    // Resolve all requests
    setTimeout(() => {
      mockRequests.forEach(req => {
        if (req.onsuccess) req.onsuccess({} as Event);
      });
    }, 0);

    await Promise.all([promise1, promise2]);

    expect(mockStore.put).toHaveBeenCalledTimes(2);
  });

  test('should recover from corrupted data', async () => {
    const corruptedData = 'invalid-json-{';
    const mockRequest = createMockRequest({ value: corruptedData });
    const mockStore = createMockStore();
    mockStore.get.mockReturnValue(mockRequest);

    setupMockTransaction(mockDB, mockStore);

    const getPromise = adapter.getItem('corrupt-key');
    triggerSuccess(mockRequest, { value: corruptedData });

    const result = await getPromise;

    // Should return the raw string if JSON parsing fails
    expect(result).toBe(corruptedData);
  });
});
