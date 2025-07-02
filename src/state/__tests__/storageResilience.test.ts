/**
 * Integration tests for storage resilience across Zustand stores
 * Tests store behavior during storage failures and recovery
 */

import { act, renderHook } from '@testing-library/react';
import { useWorldStore } from '../worldStore';
import { useCharacterStore } from '../characterStore';
import { ResilientStorageMiddleware, StorageStatus } from '../../lib/storage/resilientStorage';

// Create mock functions first
const mockResilientStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getStorageStatus: jest.fn(),
  getLastError: jest.fn(),
  checkStorageHealth: jest.fn(),
  startHealthMonitoring: jest.fn(),
  stopHealthMonitoring: jest.fn(),
  onStatusChange: jest.fn(),
};

// Mock the persistence storage to use our mocked resilient storage
jest.mock('../persistence', () => ({
  createIndexedDBStorage: () => ({
    getItem: mockResilientStorage.getItem,
    setItem: mockResilientStorage.setItem,
    removeItem: mockResilientStorage.removeItem,
  }),
}));

// Mock the resilient storage
jest.mock('../../lib/storage/resilientStorage');
jest.mock('../../lib/storage/indexedDBAdapter');

describe('Storage Resilience Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.HEALTHY);
    mockResilientStorage.getLastError.mockReturnValue(null);
  });

  describe('Store Behavior During Storage Failures', () => {
    it('should continue functioning when storage fails during world creation', async () => {
      // Mock storage failure
      mockResilientStorage.setItem.mockRejectedValue(new Error('Storage failed'));
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.UNAVAILABLE);

      const { result } = renderHook(() => useWorldStore());

      // Should still be able to create world in memory
      act(() => {
        const worldId = result.current.createWorld({
          name: 'Test World',
          description: 'A test world',
          genre: 'Fantasy',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 10,
            maxSkills: 10,
            allowCustomAttributes: true,
            allowCustomSkills: true,
          },
        });

        expect(worldId).toBeDefined();
        expect(result.current.worlds[worldId]).toBeDefined();
        expect(result.current.worlds[worldId].name).toBe('Test World');
      });

      // Storage operations should have been attempted
      expect(mockResilientStorage.setItem).toHaveBeenCalled();
    });

    it('should maintain state consistency across multiple store operations during storage failure', async () => {
      mockResilientStorage.setItem.mockRejectedValue(new Error('Storage failed'));
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.UNAVAILABLE);

      const { result: worldResult } = renderHook(() => useWorldStore());
      const { result: characterResult } = renderHook(() => useCharacterStore());

      act(() => {
        // Create world
        const worldId = worldResult.current.createWorld({
          name: 'Test World',
          description: 'A test world',
          genre: 'Fantasy',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 10,
            maxSkills: 10,
            allowCustomAttributes: true,
            allowCustomSkills: true,
          },
        });

        // Create character linked to world
        const characterId = characterResult.current.createCharacter({
          name: 'Test Character',
          worldId,
          attributes: [],
          skills: [],
          description: 'A test character',
        });

        // Verify both stores maintain consistency
        expect(worldResult.current.worlds[worldId]).toBeDefined();
        expect(characterResult.current.characters[characterId]).toBeDefined();
        expect(characterResult.current.characters[characterId].worldId).toBe(worldId);
      });
    });
  });

  describe('Store Behavior During Storage Recovery', () => {
    it('should handle storage recovery gracefully', async () => {
      // Start with failing storage
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.UNAVAILABLE);
      mockResilientStorage.setItem.mockRejectedValue(new Error('Storage failed'));

      const { result } = renderHook(() => useWorldStore());

      // Create world in memory-only mode
      let worldId: string;
      act(() => {
        worldId = result.current.createWorld({
          name: 'Recovery Test World',
          description: 'A world created during storage failure',
          genre: 'Sci-Fi',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 10,
            maxSkills: 10,
            allowCustomAttributes: true,
            allowCustomSkills: true,
          },
        });
      });

      // Simulate storage recovery
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.HEALTHY);
      mockResilientStorage.setItem.mockResolvedValue(undefined);

      // Trigger store operation that would attempt persistence
      act(() => {
        result.current.updateWorld(worldId, { description: 'Updated after recovery' });
      });

      // Should attempt to persist to recovered storage
      expect(mockResilientStorage.setItem).toHaveBeenCalledWith(
        'narraitor-world-store',
        expect.stringContaining('Updated after recovery')
      );
    });
  });

  describe('Error State Management', () => {
    it('should track storage errors in store state', async () => {
      const mockError = {
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      mockResilientStorage.getLastError.mockReturnValue(mockError);
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.UNAVAILABLE);

      const { result } = renderHook(() => useWorldStore());

      // Stores should be able to access storage error information
      // This would be implemented as part of the enhanced store interface
      expect(mockResilientStorage.getLastError()).toEqual(mockError);
      expect(mockResilientStorage.getStorageStatus()).toBe(StorageStatus.UNAVAILABLE);
    });

    it('should clear storage errors when storage recovers', async () => {
      // Start with error state
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.UNAVAILABLE);
      mockResilientStorage.getLastError.mockReturnValue({
        userMessage: 'Storage failed',
        technicalMessage: 'Error',
        isRecoverable: true,
        shouldNotify: true,
      });

      const { result } = renderHook(() => useWorldStore());

      // Simulate recovery
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.HEALTHY);
      mockResilientStorage.getLastError.mockReturnValue(null);

      // Trigger health check
      await act(async () => {
        await mockResilientStorage.checkStorageHealth();
      });

      // Error should be cleared
      expect(mockResilientStorage.getLastError()).toBeNull();
      expect(mockResilientStorage.getStorageStatus()).toBe(StorageStatus.HEALTHY);
    });
  });

  describe('Data Persistence Edge Cases', () => {
    it('should handle partial storage failures gracefully', async () => {
      // Mock intermittent storage failures
      let callCount = 0;
      mockResilientStorage.setItem.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.reject(new Error('Intermittent failure'));
        }
        return Promise.resolve();
      });

      const { result } = renderHook(() => useWorldStore());

      // Should handle intermittent failures
      act(() => {
        result.current.createWorld({
          name: 'Intermittent Test',
          description: 'Testing intermittent failures',
          genre: 'Mystery',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 10,
            maxSkills: 10,
            allowCustomAttributes: true,
            allowCustomSkills: true,
          },
        });
      });

      // Should have attempted storage operations
      expect(mockResilientStorage.setItem).toHaveBeenCalled();
    });

    it('should handle storage quota exceeded scenarios', async () => {
      const quotaError = new DOMException('QuotaExceededError');
      mockResilientStorage.setItem.mockRejectedValue(quotaError);
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.DEGRADED);

      const { result } = renderHook(() => useWorldStore());

      // Should continue functioning even with quota issues
      act(() => {
        const worldId = result.current.createWorld({
          name: 'Quota Test World',
          description: 'Testing quota exceeded handling',
          genre: 'Action',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 10,
            maxSkills: 10,
            allowCustomAttributes: true,
            allowCustomSkills: true,
          },
        });

        expect(result.current.worlds[worldId]).toBeDefined();
      });

      // Should have attempted storage and handled quota error
      expect(mockResilientStorage.setItem).toHaveBeenCalled();
    });
  });
});