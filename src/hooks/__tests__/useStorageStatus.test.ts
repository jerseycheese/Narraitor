import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the resilient storage implementation
const mockResilientStorage = {
  getStorageStatus: jest.fn(() => 'HEALTHY'),
  getLastError: jest.fn(() => null),
  getLastSuccessfulSync: jest.fn(() => new Date().toISOString()),
  checkStorageHealth: jest.fn().mockResolvedValue(undefined),
  startHealthMonitoring: jest.fn(),
  stopHealthMonitoring: jest.fn(),
};

// Mock the persistence module
jest.mock('../../state/persistence', () => ({
  getResilientStorageInstance: jest.fn(() => Promise.resolve(mockResilientStorage)),
}));

// Import the actual hook after mocking dependencies
import { useStorageStatus } from '../useStorageStatus';

describe('useStorageStatus Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks to healthy state
    mockResilientStorage.getStorageStatus.mockReturnValue('HEALTHY');
    mockResilientStorage.getLastError.mockReturnValue(null);
    mockResilientStorage.getLastSuccessfulSync.mockReturnValue(new Date().toISOString());
    mockResilientStorage.checkStorageHealth.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    test('should return healthy storage status initially', async () => {
      const { result } = renderHook(() => useStorageStatus());
      
      await waitFor(() => {
        expect(result.current.status).toBe('HEALTHY');
        expect(result.current.error).toBeNull();
        expect(result.current.lastSuccessfulSync).toBeDefined();
      });
    });

    test('should detect storage issues on mount', async () => {
      const mockError = {
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      mockResilientStorage.getStorageStatus.mockReturnValue('UNAVAILABLE');
      mockResilientStorage.getLastError.mockReturnValue(mockError);

      const { result } = renderHook(() => useStorageStatus());
      
      await waitFor(() => {
        expect(result.current.status).toBe('UNAVAILABLE');
        expect(result.current.error).toEqual(mockError);
      });
    });
  });

  describe('Health Check Function', () => {
    test('should perform health check when requested', async () => {
      const { result } = renderHook(() => useStorageStatus());
      
      await act(async () => {
        await result.current.checkHealth();
      });
      
      expect(mockResilientStorage.checkStorageHealth).toHaveBeenCalled();
    });

    test('should handle health check failures gracefully', async () => {
      mockResilientStorage.checkStorageHealth.mockRejectedValue(new Error('Health check failed'));
      
      const { result } = renderHook(() => useStorageStatus());
      
      await act(async () => {
        await result.current.checkHealth();
      });
      
      expect(mockResilientStorage.checkStorageHealth).toHaveBeenCalled();
      // Hook should not crash on health check failure
      expect(result.current.status).toBeDefined();
    });

    test('should set loading state during health check', async () => {
      let resolveHealthCheck: (value?: unknown) => void;
      const healthCheckPromise = new Promise((resolve) => {
        resolveHealthCheck = resolve;
      });
      
      mockResilientStorage.checkStorageHealth.mockReturnValue(healthCheckPromise);
      
      const { result } = renderHook(() => useStorageStatus());
      
      act(() => {
        result.current.checkHealth();
      });
      
      // Should be loading during health check
      expect(result.current.isLoading).toBe(true);
      
      // Complete health check
      await act(async () => {
        resolveHealthCheck();
        await healthCheckPromise;
      });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Storage Status Monitoring', () => {
    test('should monitor different storage states', async () => {
      const states = ['HEALTHY', 'DEGRADED', 'UNAVAILABLE', 'RECOVERING'];
      
      for (const state of states) {
        mockResilientStorage.getStorageStatus.mockReturnValue(state);
        
        const { result } = renderHook(() => useStorageStatus());
        
        await waitFor(() => {
          expect(result.current.status).toBe(state);
        });
      }
    });

    test('should handle error states properly', async () => {
      const mockError = {
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      mockResilientStorage.getStorageStatus.mockReturnValue('UNAVAILABLE');
      mockResilientStorage.getLastError.mockReturnValue(mockError);

      const { result } = renderHook(() => useStorageStatus());
      
      await waitFor(() => {
        expect(result.current.status).toBe('UNAVAILABLE');
        expect(result.current.error).toEqual(mockError);
      });
    });

    test('should track last successful sync time', async () => {
      const syncTime = '2023-12-01T10:00:00.000Z';
      mockResilientStorage.getLastSuccessfulSync.mockReturnValue(syncTime);

      const { result } = renderHook(() => useStorageStatus());
      
      await waitFor(() => {
        expect(result.current.lastSuccessfulSync).toBe(syncTime);
      });
    });
  });

  describe('Hook Lifecycle', () => {
    test('should initialize and cleanup properly', async () => {
      const { result, unmount } = renderHook(() => useStorageStatus());
      
      // Should initialize successfully
      await waitFor(() => {
        expect(result.current.status).toBeDefined();
        expect(result.current.lastSuccessfulSync).toBeDefined();
      });
      
      // Should cleanup without errors
      unmount();
      expect(true).toBe(true); // Test passed if no errors during unmount
    });
  });
});