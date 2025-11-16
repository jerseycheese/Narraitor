/**
 * Test suite for resilient storage middleware
 * Tests basic fallback to memory when IndexedDB fails
 */

import { ResilientStorageMiddleware, StorageStatus } from '../resilientStorage';
import { IndexedDBAdapter } from '../indexedDBAdapter';

// Mock IndexedDBAdapter
jest.mock('../indexedDBAdapter');

const mockIndexedDBAdapter = IndexedDBAdapter as jest.MockedClass<typeof IndexedDBAdapter>;

describe('ResilientStorageMiddleware', () => {
  let mockAdapter: jest.Mocked<IndexedDBAdapter>;
  let mockNotificationCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdapter = {
      initialize: jest.fn(),
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      isInitialized: true, // Mock as initialized by default
      dbName: 'test-db',
      version: 1,
      storeName: 'test-store',
      db: null
    } as unknown as jest.Mocked<IndexedDBAdapter>;

    mockIndexedDBAdapter.mockImplementation(() => mockAdapter);
    mockNotificationCallback = jest.fn();
  });

  describe('Initialization', () => {
    it('should start in HEALTHY status when IndexedDB is available', async () => {
      mockAdapter.initialize.mockResolvedValue(undefined);

      const storage = new ResilientStorageMiddleware({
        onStatusChange: mockNotificationCallback,
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(storage.getStorageStatus()).toBe(StorageStatus.HEALTHY);
      expect(mockNotificationCallback).not.toHaveBeenCalled();
    });

    it('should switch to UNAVAILABLE when IndexedDB initialization fails', async () => {
      mockAdapter.initialize.mockRejectedValue(new Error('IndexedDB unavailable'));

      const storage = new ResilientStorageMiddleware({
        onStatusChange: mockNotificationCallback,
      });

      // Wait for initialization to fail
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(storage.getStorageStatus()).toBe(StorageStatus.UNAVAILABLE);
      expect(mockNotificationCallback).toHaveBeenCalledWith(
        StorageStatus.UNAVAILABLE,
        expect.objectContaining({
          shouldNotify: true,
          userMessage: expect.stringContaining('will not persist'),
        })
      );
    });

    it('should switch to UNAVAILABLE when IndexedDB is not initialized', async () => {
      // Create a new mock adapter with isInitialized = false
      const uninitializedAdapter = {
        ...mockAdapter,
        isInitialized: false,
      };
      mockIndexedDBAdapter.mockImplementationOnce(() => uninitializedAdapter as any);

      const storage = new ResilientStorageMiddleware({
        onStatusChange: mockNotificationCallback,
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(storage.getStorageStatus()).toBe(StorageStatus.UNAVAILABLE);
      expect(mockNotificationCallback).toHaveBeenCalledWith(
        StorageStatus.UNAVAILABLE,
        expect.objectContaining({
          shouldNotify: true,
          userMessage: expect.stringContaining('will not persist'),
          technicalMessage: 'IndexedDB not available in this environment',
        })
      );
    });
  });

  describe('Storage Operations', () => {
    it('should use IndexedDB when available', async () => {
      mockAdapter.initialize.mockResolvedValue(undefined);
      mockAdapter.setItem.mockResolvedValue(undefined);
      mockAdapter.getItem.mockResolvedValue('test-value');

      const storage = new ResilientStorageMiddleware();
      await new Promise(resolve => setTimeout(resolve, 10));

      await storage.setItem('test-key', 'test-value');
      const result = await storage.getItem('test-key');

      expect(mockAdapter.setItem).toHaveBeenCalledWith('test-key', 'test-value');
      expect(mockAdapter.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toBe('test-value');
    });

    it('should fall back to memory when IndexedDB write fails', async () => {
      mockAdapter.initialize.mockResolvedValue(undefined);
      mockAdapter.setItem.mockRejectedValue(new Error('Quota exceeded'));

      const storage = new ResilientStorageMiddleware();
      await new Promise(resolve => setTimeout(resolve, 10));

      await storage.setItem('test-key', 'test-value');

      // Should have switched to memory fallback
      expect(storage.getStorageStatus()).toBe(StorageStatus.UNAVAILABLE);

      // Should still be able to retrieve from memory
      const result = await storage.getItem('test-key');
      expect(result).toBe('test-value');
    });

    it('should fall back to memory when IndexedDB read fails', async () => {
      mockAdapter.initialize.mockResolvedValue(undefined);
      mockAdapter.getItem.mockRejectedValue(new Error('Read failed'));

      const storage = new ResilientStorageMiddleware();
      await new Promise(resolve => setTimeout(resolve, 10));

      // First operation fails and switches to memory
      const result = await storage.getItem('test-key');
      expect(result).toBeNull();
      expect(storage.getStorageStatus()).toBe(StorageStatus.UNAVAILABLE);

      // Now store in memory
      await storage.setItem('test-key', 'memory-value');
      const memoryResult = await storage.getItem('test-key');
      expect(memoryResult).toBe('memory-value');
    });
  });

  describe('Memory Fallback', () => {
    it('should maintain data across operations in memory-only mode', async () => {
      mockAdapter.initialize.mockRejectedValue(new Error('No IndexedDB'));

      const storage = new ResilientStorageMiddleware();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Store multiple items
      await storage.setItem('key1', 'value1');
      await storage.setItem('key2', 'value2');

      // Should retrieve correct values
      expect(await storage.getItem('key1')).toBe('value1');
      expect(await storage.getItem('key2')).toBe('value2');

      // Should handle removal
      await storage.removeItem('key1');
      expect(await storage.getItem('key1')).toBeNull();
      expect(await storage.getItem('key2')).toBe('value2');
    });

    it('should save to both IndexedDB and memory when IndexedDB works', async () => {
      mockAdapter.initialize.mockResolvedValue(undefined);
      mockAdapter.setItem.mockResolvedValue(undefined);
      mockAdapter.getItem.mockResolvedValue(null);

      const storage = new ResilientStorageMiddleware();
      await new Promise(resolve => setTimeout(resolve, 10));

      await storage.setItem('test-key', 'test-value');

      // Should have written to IndexedDB
      expect(mockAdapter.setItem).toHaveBeenCalledWith('test-key', 'test-value');

      // Now if IndexedDB fails, should still have it in memory
      mockAdapter.getItem.mockRejectedValue(new Error('IndexedDB failed'));
      const result = await storage.getItem('test-key');
      expect(result).toBe('test-value');
    });
  });

  describe('Backward Compatibility', () => {
    it('should accept health monitoring calls without error', () => {
      const storage = new ResilientStorageMiddleware();

      // These are no-ops now but shouldn't throw
      expect(() => storage.startHealthMonitoring(30000)).not.toThrow();
      expect(() => storage.stopHealthMonitoring()).not.toThrow();
    });
  });

  describe('Remove Operations', () => {
    it('should remove from both IndexedDB and memory', async () => {
      mockAdapter.initialize.mockResolvedValue(undefined);
      mockAdapter.setItem.mockResolvedValue(undefined);
      mockAdapter.removeItem.mockResolvedValue(undefined);
      mockAdapter.getItem.mockResolvedValue(null);

      const storage = new ResilientStorageMiddleware();
      await new Promise(resolve => setTimeout(resolve, 10));

      await storage.setItem('test-key', 'test-value');
      await storage.removeItem('test-key');

      expect(mockAdapter.removeItem).toHaveBeenCalledWith('test-key');
      expect(await storage.getItem('test-key')).toBeNull();
    });

    it('should remove from memory even if IndexedDB remove fails', async () => {
      mockAdapter.initialize.mockResolvedValue(undefined);
      mockAdapter.setItem.mockResolvedValue(undefined);
      mockAdapter.removeItem.mockRejectedValue(new Error('Remove failed'));
      // After remove fails, IndexedDB might still have the value, but we're testing memory fallback
      mockAdapter.getItem.mockRejectedValue(new Error('IndexedDB unavailable'));

      const storage = new ResilientStorageMiddleware();
      await new Promise(resolve => setTimeout(resolve, 10));

      await storage.setItem('test-key', 'test-value');
      await storage.removeItem('test-key');

      // Should still be removed from memory (even though IndexedDB remove failed)
      const result = await storage.getItem('test-key');
      expect(result).toBeNull();
    });
  });
});
