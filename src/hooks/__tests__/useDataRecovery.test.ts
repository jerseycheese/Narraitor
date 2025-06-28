/**
 * Tests for useDataRecovery hook
 * Tests recovery state management and operations
 */

import { renderHook, act } from '@testing-library/react';
import { useDataRecovery } from '../useDataRecovery';

// Mock the recovery service
jest.mock('../../lib/storage/recoveryService');

describe('useDataRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    test('returns initial state correctly', () => {
      const { result } = renderHook(() => useDataRecovery());

      expect(result.current.isCheckingRecovery).toBe(false);
      expect(result.current.needsRecovery).toBe(false);
      expect(result.current.isRecovering).toBe(false);
      expect(result.current.recoveryComplete).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('recovery check', () => {
    test('checks for recovery needs on mount', async () => {
      const mockRecoveryService = require('../../lib/storage/recoveryService');
      mockRecoveryService.RecoveryService.mockImplementation(() => ({
        checkRecoveryNeeded: jest.fn().mockResolvedValue(true),
      }));

      const { result } = renderHook(() => useDataRecovery());

      await act(async () => {
        await result.current.checkRecovery();
      });

      expect(result.current.needsRecovery).toBe(true);
    });

    test('handles recovery check errors', async () => {
      const mockRecoveryService = require('../../lib/storage/recoveryService');
      mockRecoveryService.RecoveryService.mockImplementation(() => ({
        checkRecoveryNeeded: jest.fn().mockRejectedValue(new Error('Check failed')),
      }));

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
      const mockRecoveryService = require('../../lib/storage/recoveryService');
      mockRecoveryService.RecoveryService.mockImplementation(() => ({
        performRecovery: jest.fn().mockResolvedValue({ 
          success: true, 
          message: 'Recovery successful' 
        }),
      }));

      const { result } = renderHook(() => useDataRecovery());

      await act(async () => {
        await result.current.performRecovery();
      });

      expect(result.current.recoveryComplete).toBe(true);
      expect(result.current.isRecovering).toBe(false);
    });

    test('handles recovery errors', async () => {
      const mockRecoveryService = require('../../lib/storage/recoveryService');
      mockRecoveryService.RecoveryService.mockImplementation(() => ({
        performRecovery: jest.fn().mockResolvedValue({ 
          success: false, 
          error: 'Recovery failed' 
        }),
      }));

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

      // Set error state
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});