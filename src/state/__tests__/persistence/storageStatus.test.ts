import {
  getStorageStatus,
  getStorageFallbackNotice,
  subscribeStorageStatus,
  getResilientStorage,
  _resetStorageStatusForTesting,
} from '../../persistence';
import { StorageStatus } from '@/lib/storage/resilientStorage';
import Logger from '@/lib/utils/logger';

// Mock IndexedDBAdapter
jest.mock('@/lib/storage/indexedDBAdapter', () => {
  return {
    IndexedDBAdapter: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockRejectedValue(new Error('IndexedDB blocked')),
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      isInitialized: false,
    })),
  };
});

describe('Persistence Storage Status Tracking', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    _resetStorageStatusForTesting();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    errorSpy.mockRestore();
    _resetStorageStatusForTesting();
  });

  it('initially reports null status and notice', () => {
    expect(getStorageStatus()).toBeNull();
    expect(getStorageFallbackNotice()).toBeNull();
  });

  it('notifies subscribers and logs error when storage falls back to memory', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeStorageStatus(listener);

    // Initialize resilient storage, which fails due to mocked adapter
    await getResilientStorage();
    // Allow microtasks to complete
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(getStorageStatus()).toBe(StorageStatus.UNAVAILABLE);
    expect(getStorageFallbackNotice()).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('IndexedDB initialization failed'),
      })
    );
    expect(listener).toHaveBeenCalledWith(
      StorageStatus.UNAVAILABLE,
      expect.objectContaining({
        message: expect.stringContaining('IndexedDB initialization failed'),
      })
    );
    expect(errorSpy).toHaveBeenCalledWith(
      '[Storage] IndexedDB unavailable, using memory storage:',
      expect.any(Error)
    );

    unsubscribe();
  });
});
