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
  close: jest.fn()
});

describe('IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock global indexedDB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).indexedDB = mockIDB;
    
    adapter = new IndexedDBAdapter();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).indexedDB;
  });

  describe('initialization', () => {
    test('should create database with correct name and version', async () => {
      const mockDB = createMockDB();
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        onupgradeneeded: null as ((ev: IDBVersionChangeEvent) => void) | null,
        result: mockDB
      };
      
      mockIDB.open.mockImplementation((name, version) => {
        expect(name).toBe('narraitor-state');
        expect(version).toBe(1);
        
        // Immediately call the success callback
        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess({ target: { result: mockDB } } as unknown as Event);
          }
        }, 0);
        
        return mockRequest;
      });

      await adapter.initialize();
    });

    test('should create object store if not exists', async () => {
      const mockDB = createMockDB();
      mockDB.objectStoreNames = { contains: jest.fn(() => false) };
      mockDB.createObjectStore = jest.fn(() => ({ name: 'narraitor-store' }));
      
      const mockTransaction = { 
        oncomplete: null as (() => void) | null 
      };
      
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        onupgradeneeded: null as ((ev: IDBVersionChangeEvent) => void) | null,
        result: mockDB,
        transaction: mockTransaction
      };
      
      mockIDB.open.mockImplementation(() => {
        // First trigger upgrade event
        setTimeout(() => {
          if (mockRequest.onupgradeneeded) {
            mockRequest.onupgradeneeded({ 
              target: { result: mockDB, transaction: mockTransaction } 
            } as unknown as IDBVersionChangeEvent);
          }
          // Then trigger transaction complete
          if (mockTransaction.oncomplete) {
            mockTransaction.oncomplete();
          }
        }, 0);
        
        return mockRequest;
      });

      await adapter.initialize();

      expect(mockDB.createObjectStore).toHaveBeenCalledWith('narraitor-store');
    });

    test('should handle database upgrade scenarios', async () => {
      const mockDB = {
        ...createMockDB(),
        createObjectStore: jest.fn(),
        objectStoreNames: { contains: jest.fn(() => true) }
      };
      
      const mockTransaction = { 
        oncomplete: null as (() => void) | null 
      };
      
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        onupgradeneeded: null as ((ev: IDBVersionChangeEvent) => void) | null,
        result: mockDB,
        transaction: mockTransaction
      };
      
      mockIDB.open.mockImplementation(() => {
        // First trigger upgrade event
        setTimeout(() => {
          if (mockRequest.onupgradeneeded) {
            mockRequest.onupgradeneeded({ 
              target: { result: mockDB, transaction: mockTransaction } 
            } as unknown as IDBVersionChangeEvent);
          }
          // Then trigger transaction complete
          if (mockTransaction.oncomplete) {
            mockTransaction.oncomplete();
          }
        }, 0);
        
        return mockRequest;
      });

      await adapter.initialize();

      expect(mockDB.createObjectStore).not.toHaveBeenCalled();
    });
  });

  describe('getItem', () => {
    test('should retrieve stored value by key', async () => {
      const mockDB = createMockDB();
      const mockValue = { data: 'test-value' };
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        result: { value: mockValue }
      };

      // Mock the open request to initialize the adapter
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

      // Initialize the adapter first
      await adapter.initialize();

      const mockStore = {
        get: jest.fn(() => mockRequest)
      };
      mockDB.transaction.mockReturnValue({
        objectStore: jest.fn(() => mockStore)
      });

      // Now test getItem
      const getPromise = adapter.getItem('test-key');

      // Simulate successful get
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: { value: mockValue } } } as unknown as Event);
        }
      }, 0);

      const result = await getPromise;

      expect(mockStore.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(JSON.stringify(mockValue));
    });

    test('should return null for non-existent key', async () => {
      const mockDB = createMockDB();
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        result: undefined
      };

      // Mock the open request to initialize the adapter
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

      // Initialize the adapter first
      await adapter.initialize();

      const mockStore = {
        get: jest.fn(() => mockRequest)
      };
      mockDB.transaction.mockReturnValue({
        objectStore: jest.fn(() => mockStore)
      });

      const getPromise = adapter.getItem('non-existent-key');

      // Simulate no result
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: undefined } } as unknown as Event);
        }
      }, 0);

      const result = await getPromise;
      expect(result).toBeNull();
    });

    test('should handle IndexedDB errors gracefully', async () => {
      mockIDB.open.mockImplementation(() => {
        const openRequest = {
          onsuccess: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null
        };
        
        setTimeout(() => {
          if (openRequest.onerror) {
            openRequest.onerror({ target: { error: new Error('DB Error') } } as unknown as Event);
          }
        }, 0);
        
        return openRequest;
      });

      const result = await adapter.getItem('test-key');
      expect(result).toBeNull();
    });
  });

  describe('setItem', () => {
    test('should store value with key', async () => {
      const mockDB = createMockDB();
      const testData = { name: 'Test World' };
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null
      };

      // Mock the open request to initialize the adapter
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

      // Initialize the adapter first
      await adapter.initialize();

      const mockStore = {
        put: jest.fn(() => mockRequest)
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore),
        oncomplete: null as (() => void) | null,
        onerror: null
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const setPromise = adapter.setItem('test-key', JSON.stringify(testData));

      // Simulate successful put
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({} as Event);
        }
      }, 0);

      await setPromise;

      expect(mockStore.put).toHaveBeenCalledWith({
        id: 'test-key',
        value: testData
      }, 'test-key');
    });

    test('should overwrite existing value', async () => {
      const mockDB = createMockDB();
      const newData = { name: 'Updated World' };
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null
      };

      // Mock the open request to initialize the adapter
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

      // Initialize the adapter first
      await adapter.initialize();

      const mockStore = {
        put: jest.fn(() => mockRequest)
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore),
        oncomplete: null as (() => void) | null,
        onerror: null
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const setPromise = adapter.setItem('existing-key', JSON.stringify(newData));

      // Simulate successful overwrite
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({} as Event);
        }
      }, 0);

      await setPromise;

      expect(mockStore.put).toHaveBeenCalledWith({
        id: 'existing-key',
        value: newData
      }, 'existing-key');
    });

    test('should handle large data (>1MB)', async () => {
      const mockDB = createMockDB();
      const largeData = { data: 'x'.repeat(1024 * 1024 + 1) }; // >1MB
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null
      };

      // Mock the open request to initialize the adapter
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

      // Initialize the adapter first
      await adapter.initialize();

      const mockStore = {
        put: jest.fn(() => mockRequest)
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore),
        oncomplete: null as (() => void) | null,
        onerror: null
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const setPromise = adapter.setItem('large-data', JSON.stringify(largeData));

      // Simulate successful large data storage
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({} as Event);
        }
      }, 0);

      await setPromise;

      expect(mockStore.put).toHaveBeenCalled();
    });

    test('should handle IndexedDB quota exceeded error', async () => {
      const mockDB = createMockDB();
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null
      };

      // Mock the open request to initialize the adapter
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

      // Initialize the adapter first
      await adapter.initialize();

      const mockStore = {
        put: jest.fn(() => mockRequest)
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore),
        oncomplete: null as (() => void) | null,
        onerror: null
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

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
      const mockDB = createMockDB();
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null
      };

      // Mock the open request to initialize the adapter
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

      // Initialize the adapter first
      await adapter.initialize();

      const mockStore = {
        delete: jest.fn(() => mockRequest)
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore),
        oncomplete: null as (() => void) | null,
        onerror: null
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const removePromise = adapter.removeItem('test-key');

      // Simulate successful deletion
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({} as Event);
        }
      }, 0);

      await removePromise;

      expect(mockStore.delete).toHaveBeenCalledWith('test-key');
    });

    test('should handle removal of non-existent key', async () => {
      const mockDB = createMockDB();
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null
      };

      // Mock the open request to initialize the adapter
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

      // Initialize the adapter first
      await adapter.initialize();

      const mockStore = {
        delete: jest.fn(() => mockRequest)
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore),
        oncomplete: null as (() => void) | null,
        onerror: null
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

      const removePromise = adapter.removeItem('non-existent-key');

      // Simulate successful deletion (even for non-existent key)
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({} as Event);
        }
      }, 0);

      await removePromise;

      expect(mockStore.delete).toHaveBeenCalledWith('non-existent-key');
    });
  });

  describe('error scenarios', () => {
    test('should fallback gracefully when IndexedDB is unavailable', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).indexedDB;

      const localAdapter = new IndexedDBAdapter();
      
      await expect(localAdapter.getItem('test')).resolves.toBeNull();
      await expect(localAdapter.setItem('test', 'value')).resolves.toBeUndefined();
      await expect(localAdapter.removeItem('test')).resolves.toBeUndefined();
    });

    test('should handle concurrent access', async () => {
      const mockDB = createMockDB();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockRequests: any[] = [];

      // Mock the open request to initialize the adapter
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

      // Initialize the adapter first
      await adapter.initialize();

      const mockStore = {
        put: jest.fn(() => {
          const request = { onsuccess: null, onerror: null };
          mockRequests.push(request);
          return request;
        })
      };
      const mockTransaction = {
        objectStore: jest.fn(() => mockStore),
        oncomplete: null as (() => void) | null,
        onerror: null
      };
      mockDB.transaction.mockReturnValue(mockTransaction);

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
      const mockDB = createMockDB();
      const corruptedData = 'invalid-json-{';
      const mockRequest = {
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        result: { value: corruptedData }
      };

      // Mock the open request to initialize the adapter
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

      // Initialize the adapter first
      await adapter.initialize();

      const mockStore = {
        get: jest.fn(() => mockRequest)
      };
      mockDB.transaction.mockReturnValue({
        objectStore: jest.fn(() => mockStore)
      });

      const getPromise = adapter.getItem('corrupt-key');

      // Simulate retrieval of corrupted data
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: { result: { value: corruptedData } } } as unknown as Event);
        }
      }, 0);

      const result = await getPromise;
      
      // Should return the raw string if JSON parsing fails
      expect(result).toBe(corruptedData);
    });
  });
});
