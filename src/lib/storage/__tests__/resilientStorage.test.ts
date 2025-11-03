/**
 * Test suite for resilient storage middleware
 * Tests retry logic, fallback mechanisms, and recovery detection
 */

import { ResilientStorageMiddleware, StorageStatus } from '../resilientStorage';
import { IndexedDBAdapter } from '../indexedDBAdapter';
import { handleStorageError } from '../../../utils/storageHelpers';

// Mock IndexedDBAdapter
jest.mock('../indexedDBAdapter');
jest.mock('../../../utils/storageHelpers');

const mockIndexedDBAdapter = IndexedDBAdapter as jest.MockedClass<typeof IndexedDBAdapter>;
const mockHandleStorageError = handleStorageError as jest.MockedFunction<typeof handleStorageError>;

describe('ResilientStorageMiddleware', () => {
  let resilientStorage: ResilientStorageMiddleware;
  let mockAdapter: jest.Mocked<IndexedDBAdapter>;
  let mockNotificationCallback: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAdapter = {
      initialize: jest.fn(),
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      dbName: 'test-db',
      version: 1,
      storeName: 'test-store',
      db: null
    } as jest.Mocked<IndexedDBAdapter>;
    
    // Ensure the static create method returns our mock adapter
    mockIndexedDBAdapter.create = jest.fn().mockResolvedValue(mockAdapter);
    
    mockNotificationCallback = jest.fn();
    
    resilientStorage = new ResilientStorageMiddleware({
      onStatusChange: mockNotificationCallback,
      retryAttempts: 3,
      baseDelay: 100, // Shorter delays for testing
    });
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  describe('Retry Logic', () => {
    it('should retry operations with exponential backoff on failure', async () => {
      const quotaError = new DOMException('QuotaExceededError');
      mockAdapter.setItem
        .mockRejectedValueOnce(quotaError)
        .mockRejectedValueOnce(quotaError)
        .mockResolvedValueOnce(undefined);

      mockHandleStorageError.mockReturnValue({
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      });

      const startTime = Date.now();
      await resilientStorage.setItem('test-key', 'test-value');
      const endTime = Date.now();

      // Should have made 3 attempts (2 failures + 1 success)
      expect(mockAdapter.setItem).toHaveBeenCalledTimes(3);
      
      // Should have waited for retries (100ms + 200ms = ~300ms minimum)
      expect(endTime - startTime).toBeGreaterThan(200);
    });

    it('should fall back to memory-only mode after max retries', async () => {
      const quotaError = new DOMException('QuotaExceededError');
      mockAdapter.setItem.mockRejectedValue(quotaError);

      mockHandleStorageError.mockReturnValue({
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      });

      await resilientStorage.setItem('test-key', 'test-value');

      // Should have attempted max retries
      expect(mockAdapter.setItem).toHaveBeenCalledTimes(3);
      
      // Should notify about fallback to memory-only mode
      expect(mockNotificationCallback).toHaveBeenCalledWith(
        StorageStatus.UNAVAILABLE,
        expect.objectContaining({
          userMessage: expect.stringContaining('memory-only'),
        })
      );
    });

    it('should not retry on non-recoverable errors', async () => {
      const securityError = new DOMException('SecurityError');
      mockAdapter.setItem.mockRejectedValue(securityError);

      mockHandleStorageError.mockReturnValue({
        userMessage: 'Storage unavailable in private browsing',
        technicalMessage: 'SecurityError',
        isRecoverable: false,
        shouldNotify: true,
      });

      await resilientStorage.setItem('test-key', 'test-value');

      // Should only attempt once for non-recoverable errors
      expect(mockAdapter.setItem).toHaveBeenCalledTimes(1);
      
      // Should immediately fall back to memory-only mode
      expect(mockNotificationCallback).toHaveBeenCalledWith(
        StorageStatus.UNAVAILABLE,
        expect.objectContaining({
          isRecoverable: false,
        })
      );
    });
  });

  describe('Memory Fallback', () => {
    beforeEach(() => {
      // Set up storage to fail
      const quotaError = new DOMException('QuotaExceededError');
      mockAdapter.setItem.mockRejectedValue(quotaError);
      mockAdapter.getItem.mockRejectedValue(quotaError);
      
      mockHandleStorageError.mockReturnValue({
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      });
    });

    it('should store data in memory when storage fails', async () => {
      await resilientStorage.setItem('test-key', 'test-value');
      
      // Storage should have failed, falling back to memory
      expect(resilientStorage.getStorageStatus()).toBe(StorageStatus.UNAVAILABLE);
      
      // Should still be able to retrieve from memory
      const result = await resilientStorage.getItem('test-key');
      expect(result).toBe('test-value');
    });

    it('should maintain functionality across multiple operations in memory-only mode', async () => {
      // Store multiple items
      await resilientStorage.setItem('key1', 'value1');
      await resilientStorage.setItem('key2', 'value2');
      
      // Should retrieve correct values
      expect(await resilientStorage.getItem('key1')).toBe('value1');
      expect(await resilientStorage.getItem('key2')).toBe('value2');
      
      // Should handle removal
      await resilientStorage.removeItem('key1');
      expect(await resilientStorage.getItem('key1')).toBeNull();
      expect(await resilientStorage.getItem('key2')).toBe('value2');
    });
  });

  describe('Recovery Detection', () => {
    it('should detect when storage becomes available again', async () => {
      // Start with failing storage
      const quotaError = new DOMException('QuotaExceededError');
      mockAdapter.setItem.mockRejectedValue(quotaError);
      
      mockHandleStorageError.mockReturnValue({
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      });

      // Fail storage and fall back to memory
      await resilientStorage.setItem('test-key', 'test-value');
      expect(resilientStorage.getStorageStatus()).toBe(StorageStatus.UNAVAILABLE);

      // Now make storage work again
      let lastSetValue: string | undefined;
      mockAdapter.setItem.mockImplementation((key: string, value: string) => {
        if (key === '__narraitor_health_check__') {
          lastSetValue = value;
        }
        return Promise.resolve();
      });
      mockAdapter.getItem.mockImplementation((key: string) => {
        if (key === '__narraitor_health_check__') {
          return Promise.resolve(lastSetValue || null);
        }
        return Promise.resolve('test-value');
      });
      mockAdapter.removeItem.mockResolvedValue(undefined);

      // Trigger recovery check
      await resilientStorage.checkStorageHealth();

      // Should detect recovery
      expect(resilientStorage.getStorageStatus()).toBe(StorageStatus.HEALTHY);
      expect(mockNotificationCallback).toHaveBeenCalledWith(
        StorageStatus.HEALTHY,
        expect.objectContaining({
          userMessage: expect.stringContaining('restored'),
        })
      );
    });

    it('should sync memory data to storage when recovering', async () => {
      // Set up initial failure
      const quotaError = new DOMException('QuotaExceededError');
      mockAdapter.setItem.mockRejectedValue(quotaError);
      
      mockHandleStorageError.mockReturnValue({
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      });

      // Store data in memory-only mode
      await resilientStorage.setItem('key1', 'value1');
      await resilientStorage.setItem('key2', 'value2');

      // Enable storage recovery
      let lastSetValue: string | undefined;
      mockAdapter.setItem.mockImplementation((key: string, value: string) => {
        if (key === '__narraitor_health_check__') {
          lastSetValue = value;
        }
        return Promise.resolve();
      });
      mockAdapter.getItem.mockImplementation((key: string) => {
        if (key === '__narraitor_health_check__') {
          return Promise.resolve(lastSetValue || null);
        }
        return Promise.resolve(null);
      });
      mockAdapter.removeItem.mockResolvedValue(undefined);

      // Trigger recovery
      await resilientStorage.checkStorageHealth();

      // Should have synced memory data to storage
      expect(mockAdapter.setItem).toHaveBeenCalledWith('key1', 'value1');
      expect(mockAdapter.setItem).toHaveBeenCalledWith('key2', 'value2');
    });
  });

  describe('Storage Status Tracking', () => {
    it('should track storage status transitions', async () => {
      // Start healthy
      expect(resilientStorage.getStorageStatus()).toBe(StorageStatus.HEALTHY);

      // Cause storage failure
      const quotaError = new DOMException('QuotaExceededError');
      mockAdapter.setItem.mockRejectedValue(quotaError);
      
      mockHandleStorageError.mockReturnValue({
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      });

      await resilientStorage.setItem('test-key', 'test-value');

      // Should transition to unavailable
      expect(resilientStorage.getStorageStatus()).toBe(StorageStatus.UNAVAILABLE);

      // Restore storage
      let lastSetValue: string | undefined;
      mockAdapter.setItem.mockImplementation((key: string, value: string) => {
        if (key === '__narraitor_health_check__') {
          lastSetValue = value;
        }
        return Promise.resolve();
      });
      mockAdapter.getItem.mockImplementation((key: string) => {
        if (key === '__narraitor_health_check__') {
          return Promise.resolve(lastSetValue || null);
        }
        return Promise.resolve('test-value');
      });
      mockAdapter.removeItem.mockResolvedValue(undefined);
      await resilientStorage.checkStorageHealth();

      // Should transition back to healthy
      expect(resilientStorage.getStorageStatus()).toBe(StorageStatus.HEALTHY);
    });

    it('should provide storage error information', async () => {
      const quotaError = new DOMException('QuotaExceededError');
      mockAdapter.setItem.mockRejectedValue(quotaError);
      
      const mockError = {
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };
      mockHandleStorageError.mockReturnValue(mockError);

      await resilientStorage.setItem('test-key', 'test-value');

      expect(resilientStorage.getLastError()).toEqual(expect.objectContaining({
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
        userMessage: expect.stringContaining('temporarily unavailable')
      }));
    });
  });

  describe('Health Monitoring', () => {
    it('should periodically check storage health', async () => {
      const healthCheck = jest.spyOn(resilientStorage, 'checkStorageHealth');
      resilientStorage.startHealthMonitoring(50); // 50ms intervals for testing

      // Wait for a few health checks
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(healthCheck.mock.calls.length).toBeGreaterThan(1);

      resilientStorage.stopHealthMonitoring();
    });

    it('should stop health monitoring when requested', async () => {
      const healthCheck = jest.spyOn(resilientStorage, 'checkStorageHealth');
      resilientStorage.startHealthMonitoring(50);

      await new Promise(resolve => setTimeout(resolve, 75));
      resilientStorage.stopHealthMonitoring();
      
      const callCountAfterStop = healthCheck.mock.calls.length;
      
      // Wait additional time and verify no new calls
      await new Promise(resolve => setTimeout(resolve, 75));
      expect(healthCheck).toHaveBeenCalledTimes(callCountAfterStop);
    });
  });
});