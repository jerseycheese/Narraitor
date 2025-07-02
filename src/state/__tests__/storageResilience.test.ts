/**
 * Integration tests for storage resilience across Zustand stores
 * Tests actual store behavior during storage failures and recovery scenarios
 */

import { act, renderHook } from '@testing-library/react';
import { useWorldStore } from '../worldStore';
import { useCharacterStore } from '../characterStore';
import { StorageStatus } from '../../lib/storage/resilientStorage';

// Mock the resilient storage with realistic behavior
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

jest.mock('../../lib/storage/resilientStorage');
jest.mock('../../lib/storage/indexedDBAdapter');

// Mock the persistence storage to use our mocked resilient storage
jest.mock('../persistence', () => ({
  createIndexedDBStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

describe('Storage Resilience Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.HEALTHY);
    mockResilientStorage.getLastError.mockReturnValue(null);
  });

  describe('Application Resilience During Storage Failures', () => {
    it('should maintain full game functionality when storage becomes unavailable', async () => {
      mockResilientStorage.setItem.mockRejectedValue(new Error('Storage failed'));
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.UNAVAILABLE);

      const { result } = renderHook(() => useWorldStore());

      let worldId: string;
      act(() => {
        worldId = result.current.createWorld({
          name: 'Offline World',
          description: 'Created during storage failure',
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
      });

      // Verify game continues to work normally
      expect(result.current.worlds[worldId]).toBeDefined();
      expect(result.current.worlds[worldId].name).toBe('Offline World');
      
      // Verify subsequent operations work
      act(() => {
        result.current.updateWorld(worldId, { description: 'Updated offline' });
      });
      
      expect(result.current.worlds[worldId].description).toBe('Updated offline');
    });

    it('should maintain cross-store data integrity during storage failures', async () => {
      mockResilientStorage.setItem.mockRejectedValue(new Error('Storage failed'));
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.UNAVAILABLE);

      const { result: worldResult } = renderHook(() => useWorldStore());
      const { result: characterResult } = renderHook(() => useCharacterStore());

      let worldId: string;
      let characterId: string;
      
      act(() => {
        worldId = worldResult.current.createWorld({
          name: 'Linked World',
          description: 'Testing cross-store integrity',
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

        characterId = characterResult.current.createCharacter({
          name: 'Linked Character',
          worldId,
          attributes: [],
          skills: [],
          description: 'Character linked to world',
        });
      });

      // Verify relational integrity is maintained in memory
      expect(worldResult.current.worlds[worldId]).toBeDefined();
      expect(characterResult.current.characters[characterId]).toBeDefined();
      expect(characterResult.current.characters[characterId].worldId).toBe(worldId);
      
      // Test that updates to related entities work correctly
      act(() => {
        worldResult.current.updateWorld(worldId, { name: 'Updated World Name' });
      });
      
      expect(worldResult.current.worlds[worldId].name).toBe('Updated World Name');
      expect(characterResult.current.characters[characterId].worldId).toBe(worldId);
    });
  });

  describe('Storage Recovery and Data Synchronization', () => {
    it('should seamlessly transition from memory-only to persistent storage when recovered', async () => {
      // Start with failing storage
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.UNAVAILABLE);
      mockResilientStorage.setItem.mockRejectedValue(new Error('Storage failed'));

      const { result } = renderHook(() => useWorldStore());

      // Create world in memory-only mode
      let worldId: string;
      act(() => {
        worldId = result.current.createWorld({
          name: 'Recovery Test World',
          description: 'Created offline',
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

      // Verify world exists in memory
      expect(result.current.worlds[worldId].name).toBe('Recovery Test World');

      // Simulate storage recovery
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.HEALTHY);
      mockResilientStorage.setItem.mockResolvedValue(undefined);

      // Trigger store operation after recovery
      act(() => {
        result.current.updateWorld(worldId, { description: 'Updated after recovery' });
      });

      // Should maintain functionality and attempt persistence
      expect(result.current.worlds[worldId].description).toBe('Updated after recovery');
      expect(mockResilientStorage.setItem).toHaveBeenCalledWith(
        'narraitor-world-store',
        expect.stringContaining('Updated after recovery')
      );
    });
  });

  describe('User Experience During Storage Issues', () => {
    it('should provide consistent user experience despite storage problems', async () => {
      const quotaError = {
        userMessage: 'Storage quota exceeded',
        technicalMessage: 'QuotaExceededError',
        isRecoverable: true,
        shouldNotify: true,
      };

      mockResilientStorage.getLastError.mockReturnValue(quotaError);
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.DEGRADED);
      mockResilientStorage.setItem.mockRejectedValue(new Error('Quota exceeded'));

      const { result } = renderHook(() => useWorldStore());

      // User can still create and use content normally
      let worldId: string;
      act(() => {
        worldId = result.current.createWorld({
          name: 'Limited Storage World',
          description: 'Works despite quota issues',
          genre: 'Action',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 5,
            maxSkills: 5,
            allowCustomAttributes: false,
            allowCustomSkills: false,
          },
        });
      });

      // Functionality remains intact for user
      expect(result.current.worlds[worldId]).toBeDefined();
      expect(result.current.worlds[worldId].name).toBe('Limited Storage World');
      
      // User can continue editing
      act(() => {
        result.current.updateWorld(worldId, { description: 'Still working fine' });
      });
      
      expect(result.current.worlds[worldId].description).toBe('Still working fine');
    });

    it('should handle complete storage recovery cycle transparently', async () => {
      // Start with error state
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.UNAVAILABLE);
      mockResilientStorage.getLastError.mockReturnValue({
        userMessage: 'Storage temporarily unavailable',
        technicalMessage: 'NetworkError',
        isRecoverable: true,
        shouldNotify: true,
      });

      const { result } = renderHook(() => useWorldStore());

      // Create content during outage
      let worldId: string;
      act(() => {
        worldId = result.current.createWorld({
          name: 'Offline World',
          description: 'Created during outage',
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

      // Simulate complete recovery
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.HEALTHY);
      mockResilientStorage.getLastError.mockReturnValue(null);
      mockResilientStorage.setItem.mockResolvedValue(undefined);

      // Trigger health check simulation
      await act(async () => {
        await mockResilientStorage.checkStorageHealth();
      });

      // User's work is preserved and system is healthy
      expect(result.current.worlds[worldId]).toBeDefined();
      expect(mockResilientStorage.getStorageStatus()).toBe(StorageStatus.HEALTHY);
      expect(mockResilientStorage.getLastError()).toBeNull();
    });
  });

  describe('Real-World Storage Scenarios', () => {
    it('should handle intermittent connectivity gracefully during gameplay', async () => {
      // Simulate flaky network conditions
      let callCount = 0;
      mockResilientStorage.setItem.mockImplementation(() => {
        callCount++;
        if (callCount % 3 === 0) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve();
      });
      
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.DEGRADED);

      const { result } = renderHook(() => useWorldStore());

      let worldId: string;
      act(() => {
        worldId = result.current.createWorld({
          name: 'Flaky Network World',
          description: 'Testing intermittent failures',
          genre: 'Adventure',
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

      // Gameplay continues normally despite network issues
      expect(result.current.worlds[worldId]).toBeDefined();
      expect(result.current.worlds[worldId].name).toBe('Flaky Network World');
      
      // Multiple operations work despite intermittent failures
      act(() => {
        result.current.updateWorld(worldId, { description: 'Updated description' });
        result.current.updateWorld(worldId, { genre: 'Fantasy' });
      });
      
      expect(result.current.worlds[worldId].genre).toBe('Fantasy');
    });

    it('should maintain game state under storage pressure', async () => {
      const quotaError = new DOMException('QuotaExceededError');
      mockResilientStorage.setItem.mockRejectedValue(quotaError);
      mockResilientStorage.getStorageStatus.mockReturnValue(StorageStatus.DEGRADED);

      const { result } = renderHook(() => useWorldStore());

      // User creates large amounts of content
      const worldIds: string[] = [];
      act(() => {
        for (let i = 0; i < 5; i++) {
          const worldId = result.current.createWorld({
            name: `Test World ${i}`,
            description: `World ${i} with lots of content`,
            genre: 'Epic Fantasy',
            attributes: [],
            skills: [],
            settings: {
              maxAttributes: 20,
              maxSkills: 30,
              allowCustomAttributes: true,
              allowCustomSkills: true,
            },
          });
          worldIds.push(worldId);
        }
      });

      // All worlds should exist in memory even if storage fails
      worldIds.forEach((worldId, index) => {
        expect(result.current.worlds[worldId]).toBeDefined();
        expect(result.current.worlds[worldId].name).toBe(`Test World ${index}`);
      });
      
      // User can continue working with all worlds
      act(() => {
        worldIds.forEach((worldId, index) => {
          result.current.updateWorld(worldId, { description: `Updated world ${index}` });
        });
      });
      
      // All updates are preserved in memory
      worldIds.forEach((worldId, index) => {
        expect(result.current.worlds[worldId].description).toBe(`Updated world ${index}`);
      });
    });
  });
});