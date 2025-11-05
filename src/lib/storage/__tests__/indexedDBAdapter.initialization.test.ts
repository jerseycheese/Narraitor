import { IndexedDBAdapter } from '../indexedDBAdapter';
import {
  createMockDB,
  createMockIDB,
  createMockRequest,
  setupSuccessfulOpen
} from './indexedDBAdapter.testHelpers';

describe('IndexedDBAdapter - Initialization', () => {
  let adapter: IndexedDBAdapter;
  let mockIDB: ReturnType<typeof createMockIDB>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIDB = createMockIDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).indexedDB = mockIDB;
    adapter = new IndexedDBAdapter();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).indexedDB;
  });

  test('should create database with correct name and version', async () => {
    const mockDB = createMockDB();
    const mockRequest = createMockRequest(mockDB);

    mockIDB.open.mockImplementation((name, version) => {
      expect(name).toBe('narraitor-state');
      expect(version).toBe(1);

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
    mockDB.objectStoreNames.contains = jest.fn(() => false);

    const mockTransaction = {
      oncomplete: jest.fn()
    };

    const mockRequest = {
      ...createMockRequest(mockDB),
      onupgradeneeded: null as ((ev: IDBVersionChangeEvent) => void) | null,
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
    const mockDB = createMockDB();
    mockDB.createObjectStore = jest.fn();
    mockDB.objectStoreNames.contains = jest.fn(() => true);

    const mockTransaction = {
      oncomplete: jest.fn()
    };

    const mockRequest = {
      ...createMockRequest(mockDB),
      onupgradeneeded: null as ((ev: IDBVersionChangeEvent) => void) | null,
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

  test('should fallback gracefully when IndexedDB is unavailable', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).indexedDB;

    const localAdapter = new IndexedDBAdapter();

    await expect(localAdapter.getItem('test')).resolves.toBeNull();
    await expect(localAdapter.setItem('test', 'value')).resolves.toBeUndefined();
    await expect(localAdapter.removeItem('test')).resolves.toBeUndefined();
  });
});
