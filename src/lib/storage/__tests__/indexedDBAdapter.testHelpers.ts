/**
 * Test helpers for IndexedDBAdapter tests
 * Provides reusable mock factories to reduce test duplication
 */

export interface MockRequest {
  onsuccess: ((ev: Event) => void) | null;
  onerror: ((ev: Event) => void) | null;
  result?: unknown;
}

export interface MockStore {
  get: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
}

export interface MockTransaction {
  objectStore: jest.Mock;
  oncomplete: (() => void) | null;
  onerror: ((ev: Event) => void) | null;
}

export interface MockDB {
  transaction: jest.Mock;
  close: jest.Mock;
  objectStoreNames: { contains: jest.Mock };
  createObjectStore: jest.Mock;
}

/**
 * Creates a mock IndexedDB database instance
 */
export const createMockDB = (): MockDB => ({
  transaction: jest.fn(),
  close: jest.fn(),
  objectStoreNames: { contains: jest.fn(() => true) },
  createObjectStore: jest.fn(() => ({ name: 'narraitor-store' }))
});

/**
 * Creates a mock object store
 */
export const createMockStore = (): MockStore => ({
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
});

/**
 * Creates a mock transaction
 */
const createMockTransaction = (store: MockStore): MockTransaction => ({
  objectStore: jest.fn(() => store),
  oncomplete: null,
  onerror: null
});

/**
 * Creates a mock IDB request
 */
export const createMockRequest = <T = unknown>(result?: T): MockRequest => ({
  onsuccess: null,
  onerror: null,
  result
});

/**
 * Sets up a successful IDB open request that resolves with the given database
 */
export const setupSuccessfulOpen = (
  mockIDB: { open: jest.Mock },
  mockDB: MockDB
): void => {
  mockIDB.open.mockImplementation(() => {
    const openRequest = createMockRequest(mockDB);

    setTimeout(() => {
      if (openRequest.onsuccess) {
        openRequest.onsuccess({ target: { result: mockDB } } as unknown as Event);
      }
    }, 0);

    return openRequest;
  });
};

/**
 * Triggers the success callback on a mock request after a delay
 */
export const triggerSuccess = <T>(
  request: MockRequest,
  result?: T
): void => {
  setTimeout(() => {
    if (request.onsuccess) {
      request.onsuccess({ target: { result } } as unknown as Event);
    }
  }, 0);
};


/**
 * Sets up a mock database with a transaction that returns the given store
 */
export const setupMockTransaction = (
  mockDB: MockDB,
  mockStore: MockStore
): MockTransaction => {
  const mockTransaction = createMockTransaction(mockStore);
  mockDB.transaction.mockReturnValue(mockTransaction);
  return mockTransaction;
};

/**
 * Creates a mock IDB instance for global setup
 */
export const createMockIDB = () => ({
  open: jest.fn(),
  deleteDatabase: jest.fn()
});
