/**
 * Tests for useDataRecovery hook
 * Tests recovery state management and operations
 */

import { renderHook, act } from '@testing-library/react';
import { useDataRecovery } from '../useDataRecovery';
import { RecoveryService } from '../../lib/storage/recoveryService';

// Mock the recovery service
jest.mock('../../lib/storage/recoveryService');
jest.mock('../../lib/storage/localStorageAdapter');
jest.mock('../../lib/storage/indexedDBAdapter');

const MockedRecoveryService = RecoveryService as jest.MockedClass<typeof RecoveryService>;

describe('useDataRecovery', () => {
  let mockCheckRecoveryNeeded: jest.Mock;
  let mockPerformRecovery: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCheckRecoveryNeeded = jest.fn().mockResolvedValue(false);
    mockPerformRecovery = jest.fn().mockResolvedValue({ success: true, message: 'Recovery successful' });
    
    MockedRecoveryService.mockImplementation(() => ({
      checkRecoveryNeeded: mockCheckRecoveryNeeded,
      performRecovery: mockPerformRecovery,
      getRecoveryPreview: jest.fn(),
      clearRecoveryData: jest.fn(),
    }) as RecoveryService);
  });

  describe('initial state', () => {
    test('returns initial state correctly', async () => {
      const { result } = renderHook(() => useDataRecovery());

      // Wait for initial async effect to complete
      await act(async () => {
        // Allow effects to run
      });

      expect(result.current.needsRecovery).toBe(false);
      expect(result.current.isRecovering).toBe(false);
      expect(result.current.recoveryComplete).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('recovery check', () => {
    test('checks for recovery needs on mount', async () => {
      mockCheckRecoveryNeeded.mockResolvedValue(true);

      const { result } = renderHook(() => useDataRecovery());

      await act(async () => {
        await result.current.checkRecovery();
      });

      expect(result.current.needsRecovery).toBe(true);
    });

    test('handles recovery check errors', async () => {
      mockCheckRecoveryNeeded.mockRejectedValue(new Error('Check failed'));

      const { result } = renderHook(() => useDataRecovery());

      await act(async () => {
        await result.current.checkRecovery();
      });

      expect(result.current.error).toBe('Failed to check for recoverable data');
      expect(result.current.needsRecovery).toBe(false);
    });
  });

  describe('recovery process', () => {
    test('performs recovery successfully', async () => {
      const { result } = renderHook(() => useDataRecovery());

      await act(async () => {
        await result.current.performRecovery();
      });

      expect(result.current.recoveryComplete).toBe(true);
      expect(result.current.isRecovering).toBe(false);
    });

    test('handles recovery errors', async () => {
      mockPerformRecovery.mockResolvedValue({ 
        success: false, 
        error: 'Recovery failed' 
      });

      const { result } = renderHook(() => useDataRecovery());

      await act(async () => {
        await result.current.performRecovery();
      });

      expect(result.current.error).toBe('Recovery failed');
      expect(result.current.isRecovering).toBe(false);
    });
  });

  describe('state management', () => {
    test('dismisses recovery notification', () => {
      const { result } = renderHook(() => useDataRecovery());

      act(() => {
        result.current.dismissRecovery();
      });

      expect(result.current.needsRecovery).toBe(false);
    });

    test('clears errors', () => {
      const { result } = renderHook(() => useDataRecovery());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});