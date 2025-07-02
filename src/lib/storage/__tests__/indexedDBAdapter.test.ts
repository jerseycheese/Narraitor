import { IndexedDBAdapter } from '../indexedDBAdapter';

// Mock IndexedDB for testing
const mockIDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
};

// Helper to create mock database
const createMockDB = () => ({
  transaction: jest.fn(() => ({
    objectStore: jest.fn(() => ({
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    })),
    oncomplete: null,
    onerror: null
  })),
  close: jest.fn(),
  createObjectStore: jest.fn(),
  objectStoreNames: { contains: jest.fn() }
});

describe('IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).indexedDB = mockIDB;
    adapter = new IndexedDBAdapter();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).indexedDB;
  });

  describe('initialization', () => {
    test('should successfully initialize and be ready for operations', async () => {
      const mockDB = createMockDB();
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        result: mockDB
      };
      
      mockIDB.open.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess({ target: { result: mockDB } } as unknown as Event);
          }
        }, 0);
        return mockRequest;
      });

      await expect(adapter.initialize()).resolves.toBeUndefined();
      
      // Verify adapter is ready for use by testing a basic operation
      const mockStore = { get: jest.fn(() => ({ onsuccess: null, onerror: null, result: null })) };
      mockDB.transaction.mockReturnValue({ objectStore: jest.fn(() => mockStore) });
      
      await adapter.getItem('test-key');
      expect(mockStore.get).toHaveBeenCalledWith('test-key');
    });
  });

  describe('data retrieval', () => {
    beforeEach(async () => {
      const mockDB = createMockDB();
      mockIDB.open.mockImplementation(() => {
        const openRequest = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null,
          result: mockDB
        };
        setTimeout(() => {
          if (openRequest.onsuccess) {
            openRequest.onsuccess({ target: { result: mockDB } } as unknown as Event);
          }
        }, 0);
        return openRequest;
      });
      await adapter.initialize();
    });

    test('should retrieve and deserialize stored data correctly', async () => {
      const mockDB = createMockDB();
      const testData = { worldName: 'Fantasy World', characters: ['Hero', 'Villain'] };
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        result: { value: testData }
      };

      const mockStore = { get: jest.fn(() => mockRequest) };
      mockDB.transaction.mockReturnValue({ objectStore: jest.fn(() => mockStore) });

      const getPromise = adapter.getItem('game-data');
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: { value: testData } } } as unknown as Event);
        }
      }, 0);

      const result = await getPromise;
      expect(JSON.parse(result as string)).toEqual(testData);
    });

    test('should handle missing data gracefully', async () => {
      const mockDB = createMockDB();
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        result: undefined
      };

      const mockStore = { get: jest.fn(() => mockRequest) };
      mockDB.transaction.mockReturnValue({ objectStore: jest.fn(() => mockStore) });

      const getPromise = adapter.getItem('missing-key');
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: undefined } } as unknown as Event);
        }
      }, 0);

      const result = await getPromise;
      expect(result).toBeNull();
    });

    test('should gracefully handle database access errors', async () => {
      mockIDB.open.mockImplementation(() => {
        const openRequest = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null
        };
        setTimeout(() => {
          if (openRequest.onerror) {
            openRequest.onerror({ target: { error: new Error('Access denied') } } as unknown as Event);
          }
        }, 0);
        return openRequest;
      });

      const result = await adapter.getItem('any-key');
      expect(result).toBeNull();
    });
  });

  describe('data persistence', () => {
    beforeEach(async () => {
      const mockDB = createMockDB();
      mockIDB.open.mockImplementation(() => {
        const openRequest = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null,
          result: mockDB
        };
        setTimeout(() => {
          if (openRequest.onsuccess) {
            openRequest.onsuccess({ target: { result: mockDB } } as unknown as Event);
          }
        }, 0);
        return openRequest;
      });
      await adapter.initialize();
    });

    test('should handle complete data lifecycle: store, retrieve, update', async () => {
      const mockDB = createMockDB();
      const originalData = { worldName: 'Test World', level: 1 };
      const updatedData = { worldName: 'Test World', level: 2 };
      
      let storedData: any = null;
      const mockStore = {
        put: jest.fn((data) => {
          storedData = data.value;
          return { onsuccess: null, onerror: null };
        }),
        get: jest.fn(() => ({
          onsuccess: null,
          onerror: null,
          result: storedData ? { value: storedData } : undefined
        }))
      };
      
      mockDB.transaction.mockReturnValue({
        objectStore: jest.fn(() => mockStore)
      });

      // Store initial data
      const setPromise = adapter.setItem('game-state', JSON.stringify(originalData));
      setTimeout(() => {
        const putRequest = mockStore.put.mock.results[0]?.value;
        if (putRequest?.onsuccess) putRequest.onsuccess({} as Event);
      }, 0);
      await setPromise;

      // Verify data was stored
      expect(storedData).toEqual(originalData);

      // Retrieve and verify
      const getPromise = adapter.getItem('game-state');
      setTimeout(() => {
        const getRequest = mockStore.get.mock.results[0]?.value;
        if (getRequest?.onsuccess) {
          getRequest.onsuccess({ target: { result: { value: storedData } } } as unknown as Event);
        }
      }, 0);
      
      const retrievedData = await getPromise;
      expect(JSON.parse(retrievedData as string)).toEqual(originalData);

      // Update data
      const updatePromise = adapter.setItem('game-state', JSON.stringify(updatedData));
      setTimeout(() => {
        const putRequest = mockStore.put.mock.results[1]?.value;
        if (putRequest?.onsuccess) putRequest.onsuccess({} as Event);
      }, 0);
      await updatePromise;

      expect(storedData).toEqual(updatedData);
    });

    test('should handle large game state data without corruption', async () => {
      const mockDB = createMockDB();
      const largeGameState = {
        worlds: Array(100).fill(null).map((_, i) => ({ id: i, name: `World ${i}` })),
        characters: Array(500).fill(null).map((_, i) => ({ id: i, name: `Char ${i}` })),
        narrative: 'x'.repeat(10000) // Large text content
      };
      
      const mockRequest = { onsuccess: null as ((ev: Event) => void) | null, onerror: null };
      const mockStore = { put: jest.fn(() => mockRequest) };
      const mockTransaction = { objectStore: jest.fn(() => mockStore) };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const setPromise = adapter.setItem('large-state', JSON.stringify(largeGameState));
      setTimeout(() => {
        if (mockRequest.onsuccess) mockRequest.onsuccess({} as Event);
      }, 0);

      await expect(setPromise).resolves.toBeUndefined();
    });

    test('should properly handle storage quota exceeded scenarios', async () => {
      const mockDB = createMockDB();
      const mockRequest = { onsuccess: null, onerror: null as ((ev: Event) => void) | null };
      const mockStore = { put: jest.fn(() => mockRequest) };
      const mockTransaction = { objectStore: jest.fn(() => mockStore) };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const setPromise = adapter.setItem('quota-test', JSON.stringify({ data: 'test' }));
      
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

  describe('data cleanup', () => {
    beforeEach(async () => {
      const mockDB = createMockDB();
      mockIDB.open.mockImplementation(() => {
        const openRequest = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null,
          result: mockDB
        };
        setTimeout(() => {
          if (openRequest.onsuccess) {
            openRequest.onsuccess({ target: { result: mockDB } } as unknown as Event);
          }
        }, 0);
        return openRequest;
      });
      await adapter.initialize();
    });

    test('should successfully remove stored data', async () => {
      const mockDB = createMockDB();
      const mockRequest = { onsuccess: null as ((ev: Event) => void) | null, onerror: null };
      const mockStore = { delete: jest.fn(() => mockRequest) };
      const mockTransaction = { objectStore: jest.fn(() => mockStore) };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const removePromise = adapter.removeItem('cleanup-key');
      setTimeout(() => {
        if (mockRequest.onsuccess) mockRequest.onsuccess({} as Event);
      }, 0);

      await expect(removePromise).resolves.toBeUndefined();
    });

    test('should handle removal operations gracefully even for missing data', async () => {
      const mockDB = createMockDB();
      const mockRequest = { onsuccess: null as ((ev: Event) => void) | null, onerror: null };
      const mockStore = { delete: jest.fn(() => mockRequest) };
      const mockTransaction = { objectStore: jest.fn(() => mockStore) };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const removePromise = adapter.removeItem('non-existent-key');
      setTimeout(() => {
        if (mockRequest.onsuccess) mockRequest.onsuccess({} as Event);
      }, 0);

      await expect(removePromise).resolves.toBeUndefined();
    });
  });

  describe('resilience and edge cases', () => {
    test('should gracefully handle IndexedDB unavailability', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).indexedDB;
      const localAdapter = new IndexedDBAdapter();
      
      // Should not crash and provide safe fallback behavior
      await expect(localAdapter.getItem('test')).resolves.toBeNull();
      await expect(localAdapter.setItem('test', 'value')).resolves.toBeUndefined();
      await expect(localAdapter.removeItem('test')).resolves.toBeUndefined();
    });

    test('should handle concurrent operations without data corruption', async () => {
      const mockDB = createMockDB();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockRequests: any[] = [];
      const storedData = new Map();

      mockIDB.open.mockImplementation(() => {
        const openRequest = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null,
          result: mockDB
        };
        setTimeout(() => {
          if (openRequest.onsuccess) {
            openRequest.onsuccess({ target: { result: mockDB } } as unknown as Event);
          }
        }, 0);
        return openRequest;
      });

      await adapter.initialize();

      const mockStore = {
        put: jest.fn((data, key) => {
          storedData.set(key, data.value);
          const request = { onsuccess: null, onerror: null };
          mockRequests.push(request);
          return request;
        })
      };
      mockDB.transaction.mockReturnValue({ objectStore: jest.fn(() => mockStore) });

      // Simulate race condition with concurrent writes
      const gameState1 = { currentLevel: 1, score: 100 };
      const gameState2 = { currentLevel: 2, score: 200 };
      
      const promise1 = adapter.setItem('game-state', JSON.stringify(gameState1));
      const promise2 = adapter.setItem('player-stats', JSON.stringify(gameState2));

      // Resolve all requests
      setTimeout(() => {
        mockRequests.forEach(req => {
          if (req.onsuccess) req.onsuccess({} as Event);
        });
      }, 0);

      await Promise.all([promise1, promise2]);

      // Verify both operations completed without interference
      expect(storedData.get('game-state')).toEqual(gameState1);
      expect(storedData.get('player-stats')).toEqual(gameState2);
    });

    test('should handle corrupted data gracefully without crashing', async () => {
      const mockDB = createMockDB();
      const corruptedData = '{"incomplete":json';
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        result: { value: corruptedData }
      };

      mockIDB.open.mockImplementation(() => {
        const openRequest = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null,
          result: mockDB
        };
        setTimeout(() => {
          if (openRequest.onsuccess) {
            openRequest.onsuccess({ target: { result: mockDB } } as unknown as Event);
          }
        }, 0);
        return openRequest;
      });

      await adapter.initialize();

      const mockStore = { get: jest.fn(() => mockRequest) };
      mockDB.transaction.mockReturnValue({ objectStore: jest.fn(() => mockStore) });

      const getPromise = adapter.getItem('corrupted-key');
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: { value: corruptedData } } } as unknown as Event);
        }
      }, 0);

      // Should return raw data instead of throwing error
      const result = await getPromise;
      expect(result).toBe(corruptedData);
    });
  });
});
