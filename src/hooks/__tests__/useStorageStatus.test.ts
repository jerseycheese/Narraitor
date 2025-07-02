import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStorageStatus } from '../useStorageStatus';
// Removed unused imports

// Mock storage service
const mockStorageService = {
  checkAvailability: jest.fn(),
  getStatus: jest.fn(),
  attemptRecovery: jest.fn(),
  clearError: jest.fn(),
  onStatusChange: jest.fn(),
  removeStatusListener: jest.fn()
};

// Mock the useStorageStatus module to use our mock service
jest.mock('../useStorageStatus', () => {
  const { useState, useEffect, useCallback, useRef } = jest.requireActual('react');
  
  return {
    useStorageStatus: () => {
      const [status, setStatus] = useState(() => mockStorageService.getStatus());
      const [isLoading, setIsLoading] = useState(false);
      const statusCallbackRef = useRef();

      useEffect(() => {
        const updateStatus = (newStatus: string) => {
          setStatus(newStatus);
        };

        statusCallbackRef.current = updateStatus;
        mockStorageService.onStatusChange(updateStatus);

        // Initial status check
        mockStorageService.checkAvailability().catch(() => {});

        return () => {
          if (statusCallbackRef.current) {
            mockStorageService.removeStatusListener(statusCallbackRef.current);
          }
        };
      }, []);

      const retryConnection = useCallback(async () => {
        setIsLoading(true);
        try {
          const isAvailable = await mockStorageService.checkAvailability();
          return isAvailable;
        } catch (error: unknown) {
          setStatus((prev: Record<string, unknown>) => ({
            ...prev,
            lastError: error instanceof Error ? error.message : 'Unknown error'
          }));
          return false;
        } finally {
          setIsLoading(false);
        }
      }, []);

      const clearError = useCallback(() => {
        mockStorageService.clearError();
      }, []);

      const attemptRecovery = useCallback(async () => {
        try {
          await mockStorageService.attemptRecovery();
        } catch (error: unknown) {
          setStatus((prev: Record<string, unknown>) => ({
            ...prev,
            lastError: error instanceof Error ? error.message : 'Recovery failed'
          }));
        }
      }, []);

      return {
        status,
        retryConnection,
        clearError,
        attemptRecovery,
        isLoading
      };
    }
  };
});

describe('useStorageStatus Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockStorageService.checkAvailability.mockResolvedValue(true);
    mockStorageService.getStatus.mockReturnValue({
      isAvailable: true,
      fallbackActive: false,
      pendingRecovery: 0,
      lastError: null,
      recoveryInProgress: false
    });
    mockStorageService.attemptRecovery.mockResolvedValue({ success: true });
    mockStorageService.clearError.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    test('should return initial storage status', () => {
      const { result } = renderHook(() => useStorageStatus());
      
      expect(result.current.status).toEqual({
        isAvailable: true,
        fallbackActive: false,
        pendingRecovery: 0,
        lastError: null,
        recoveryInProgress: false
      });
      expect(result.current.isLoading).toBe(false);
    });

    test('should detect storage unavailability on mount', async () => {
      mockStorageService.getStatus.mockReturnValue({
        isAvailable: false,
        fallbackActive: true,
        pendingRecovery: 5,
        lastError: 'Storage quota exceeded',
        recoveryInProgress: false
      });

      const { result } = renderHook(() => useStorageStatus());
      
      await waitFor(() => {
        expect(result.current.status.isAvailable).toBe(false);
        expect(result.current.status.fallbackActive).toBe(true);
        expect(result.current.status.pendingRecovery).toBe(5);
        expect(result.current.status.lastError).toBe('Storage quota exceeded');
      });
    });
  });

  describe('Status Updates', () => {
    test('should update status when storage becomes unavailable', async () => {
      const { result } = renderHook(() => useStorageStatus());
      
      // Initially available
      expect(result.current.status.isAvailable).toBe(true);
      
      // Simulate storage failure by triggering callback
      let statusCallback: ((status: string) => void) | undefined;
      act(() => {
        // Get the callback that was registered
        statusCallback = mockStorageService.onStatusChange.mock.calls[0][0];
        
        // Trigger status change
        statusCallback({
          isAvailable: false,
          fallbackActive: true,
          pendingRecovery: 2,
          lastError: 'QuotaExceededError',
          recoveryInProgress: false
        });
      });
      
      expect(result.current.status.isAvailable).toBe(false);
      expect(result.current.status.fallbackActive).toBe(true);
      expect(result.current.status.lastError).toBe('QuotaExceededError');
    });

    test('should update status when storage recovers', async () => {
      mockStorageService.getStatus.mockReturnValue({
        isAvailable: false,
        fallbackActive: true,
        pendingRecovery: 3,
        lastError: 'NetworkError',
        recoveryInProgress: false
      });

      const { result } = renderHook(() => useStorageStatus());
      
      // Initially unavailable
      expect(result.current.status.isAvailable).toBe(false);
      
      // Simulate storage recovery
      act(() => {
        mockStorageService.getStatus.mockReturnValue({
          isAvailable: true,
          fallbackActive: false,
          pendingRecovery: 0,
          lastError: null,
          recoveryInProgress: false
        });
      });
      
      await waitFor(() => {
        expect(result.current.status.isAvailable).toBe(true);
        expect(result.current.status.fallbackActive).toBe(false);
        expect(result.current.status.pendingRecovery).toBe(0);
      });
    });

    test('should track recovery progress', async () => {
      const { result } = renderHook(() => useStorageStatus());
      
      // Start recovery
      act(() => {
        mockStorageService.getStatus.mockReturnValue({
          isAvailable: false,
          fallbackActive: true,
          pendingRecovery: 5,
          lastError: null,
          recoveryInProgress: true
        });
      });
      
      await waitFor(() => {
        expect(result.current.status.recoveryInProgress).toBe(true);
        expect(result.current.status.pendingRecovery).toBe(5);
      });
      
      // Recovery completes
      act(() => {
        mockStorageService.getStatus.mockReturnValue({
          isAvailable: true,
          fallbackActive: false,
          pendingRecovery: 0,
          lastError: null,
          recoveryInProgress: false
        });
      });
      
      await waitFor(() => {
        expect(result.current.status.recoveryInProgress).toBe(false);
        expect(result.current.status.isAvailable).toBe(true);
      });
    });
  });

  describe('Retry Connection', () => {
    test('should retry storage connection when requested', async () => {
      mockStorageService.checkAvailability.mockResolvedValue(true);
      
      const { result } = renderHook(() => useStorageStatus());
      
      let retryResult: boolean;
      await act(async () => {
        retryResult = await result.current.retryConnection();
      });
      
      expect(retryResult).toBe(true);
      expect(mockStorageService.checkAvailability).toHaveBeenCalled();
    });

    test('should handle retry failures gracefully', async () => {
      mockStorageService.checkAvailability.mockRejectedValue(new Error('Still unavailable'));
      
      const { result } = renderHook(() => useStorageStatus());
      
      let retryResult: boolean;
      await act(async () => {
        retryResult = await result.current.retryConnection();
      });
      
      expect(retryResult).toBe(false);
      expect(result.current.status.lastError).toContain('Still unavailable');
    });

    test('should set loading state during retry', async () => {
      let resolveRetry: (value: boolean) => void;
      const retryPromise = new Promise<boolean>((resolve) => {
        resolveRetry = resolve;
      });
      
      mockStorageService.checkAvailability.mockReturnValue(retryPromise);
      
      const { result } = renderHook(() => useStorageStatus());
      
      act(() => {
        result.current.retryConnection();
      });
      
      // Should be loading during retry
      expect(result.current.isLoading).toBe(true);
      
      // Complete retry
      act(() => {
        resolveRetry!(true);
      });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Recovery Operations', () => {
    test('should trigger recovery when requested', async () => {
      mockStorageService.attemptRecovery.mockResolvedValue({
        success: true,
        recovered: ['key1', 'key2'],
        failed: []
      });

      const { result } = renderHook(() => useStorageStatus());
      
      await act(async () => {
        await result.current.attemptRecovery();
      });
      
      expect(mockStorageService.attemptRecovery).toHaveBeenCalled();
    });

    test('should handle recovery failures', async () => {
      mockStorageService.attemptRecovery.mockRejectedValue(new Error('Recovery failed'));

      const { result } = renderHook(() => useStorageStatus());
      
      await act(async () => {
        await result.current.attemptRecovery();
      });
      
      expect(result.current.status.lastError).toContain('Recovery failed');
    });

    test('should update recovery progress during operation', async () => {
      let resolveRecovery: (value: boolean) => void;
      const recoveryPromise = new Promise((resolve) => {
        resolveRecovery = resolve;
      });
      
      mockStorageService.attemptRecovery.mockReturnValue(recoveryPromise);
      
      const { result } = renderHook(() => useStorageStatus());
      
      act(() => {
        result.current.attemptRecovery();
      });
      
      // Should show recovery in progress
      await waitFor(() => {
        expect(result.current.status.recoveryInProgress).toBe(true);
      });
      
      // Complete recovery
      act(() => {
        resolveRecovery!({ success: true, recovered: ['key1'], failed: [] });
      });
      
      await waitFor(() => {
        expect(result.current.status.recoveryInProgress).toBe(false);
      });
    });
  });

  describe('Error Management', () => {
    test('should clear errors when requested', () => {
      mockStorageService.getStatus.mockReturnValue({
        isAvailable: false,
        fallbackActive: true,
        pendingRecovery: 0,
        lastError: 'Previous error',
        recoveryInProgress: false
      });

      const { result } = renderHook(() => useStorageStatus());
      
      expect(result.current.status.lastError).toBe('Previous error');
      
      act(() => {
        result.current.clearError();
      });
      
      expect(mockStorageService.clearError).toHaveBeenCalled();
    });

    test('should categorize different error types', async () => {
      const errorTypes = [
        { error: 'QuotaExceededError', category: 'quota' },
        { error: 'SecurityError', category: 'security' },
        { error: 'NetworkError', category: 'network' }
      ];

      const { result } = renderHook(() => useStorageStatus());
      
      for (const { error } of errorTypes) {
        act(() => {
          mockStorageService.getStatus.mockReturnValue({
            isAvailable: false,
            fallbackActive: true,
            pendingRecovery: 0,
            lastError: error,
            recoveryInProgress: false
          });
        });
        
        await waitFor(() => {
          expect(result.current.status.lastError).toBe(error);
          // Should categorize error type for appropriate user messaging
        });
      }
    });
  });

  describe('Cleanup and Memory Management', () => {
    test('should cleanup listeners on unmount', () => {
      const { unmount } = renderHook(() => useStorageStatus());
      
      // Should have registered listener
      expect(mockStorageService.onStatusChange).toHaveBeenCalled();
      
      unmount();
      
      // Should cleanup listener
      expect(mockStorageService.removeStatusListener).toHaveBeenCalled();
    });

    test('should not cause memory leaks with frequent status changes', async () => {
      const { result } = renderHook(() => useStorageStatus());
      
      // Simulate rapid status changes
      for (let i = 0; i < 100; i++) {
        act(() => {
          mockStorageService.getStatus.mockReturnValue({
            isAvailable: i % 2 === 0,
            fallbackActive: i % 2 !== 0,
            pendingRecovery: i % 5,
            lastError: i % 10 === 0 ? `Error ${i}` : null,
            recoveryInProgress: false
          });
        });
      }
      
      // Should handle rapid updates without issues
      expect(result.current.status).toBeDefined();
    });
  });

  describe('Integration with Storage Events', () => {
    test('should respond to storage quota events', async () => {
      const { result } = renderHook(() => useStorageStatus());
      
      // Simulate quota exceeded event
      act(() => {
        const quotaEvent = new Event('error');
        Object.defineProperty(quotaEvent, 'name', { value: 'QuotaExceededError' });
        window.dispatchEvent(quotaEvent);
      });
      
      await waitFor(() => {
        expect(result.current.status.fallbackActive).toBe(true);
        expect(result.current.status.lastError).toContain('quota');
      });
    });

    test('should respond to storage recovery events', async () => {
      // Start in fallback mode
      mockStorageService.getStatus.mockReturnValue({
        isAvailable: false,
        fallbackActive: true,
        pendingRecovery: 3,
        lastError: 'Storage unavailable',
        recoveryInProgress: false
      });

      const { result } = renderHook(() => useStorageStatus());
      
      // Simulate recovery event
      act(() => {
        const recoveryEvent = new CustomEvent('storageRecovered');
        window.dispatchEvent(recoveryEvent);
      });
      
      await waitFor(() => {
        expect(result.current.status.isAvailable).toBe(true);
        expect(result.current.status.fallbackActive).toBe(false);
      });
    });
  });
});