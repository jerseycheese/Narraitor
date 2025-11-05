/**
 * Tests for worldStore CRUD operations
 * Covers create, update, delete, and setCurrentWorld functionality
 */

import { useWorldStore } from '../worldStore';
import { ErrorType } from '@/lib/utils/errorUtils';
import { createTestWorldData } from './worldStore.testHelpers';

describe('useWorldStore - CRUD Operations', () => {
  beforeEach(() => {
    useWorldStore.getState().reset();
  });

  describe('initialization', () => {
    test('should initialize with default state', () => {
      const state = useWorldStore.getState();
      expect(state.worlds).toEqual({});
      expect(state.currentWorldId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('createWorld', () => {
    test('should create a new world with generated ID', () => {
      const worldData = createTestWorldData();

      const worldId = useWorldStore.getState().createWorld(worldData);
      const state = useWorldStore.getState();

      expect(worldId).toBeDefined();
      expect(state.worlds[worldId]).toBeDefined();
      expect(state.worlds[worldId].name).toBe('Test World');
      expect(state.worlds[worldId].genre).toBe('fantasy');
      expect(state.worlds[worldId].createdAt).toBeDefined();
      expect(state.worlds[worldId].updatedAt).toBeDefined();
    });

    test('should validate required fields', () => {
      const invalidWorldData = createTestWorldData({
        name: '',
        description: '',
        genre: '',
      });
      // Override settings with invalid values
      Object.assign(invalidWorldData.settings, {
        maxAttributes: 0,
        maxSkills: 0,
        attributePointPool: 0,
        skillPointPool: 0
      });

      expect(() => {
        useWorldStore.getState().createWorld(invalidWorldData);
      }).toThrow('World name is required');
    });
  });

  describe('updateWorld', () => {
    test('should update existing world', async () => {
      const worldData = createTestWorldData({
        name: 'Original World',
        description: 'Original fantasy world',
      });

      const worldId = useWorldStore.getState().createWorld(worldData);
      const originalUpdatedAt = useWorldStore.getState().worlds[worldId].updatedAt;

      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      useWorldStore.getState().updateWorld(worldId, { name: 'Updated World' });
      const state = useWorldStore.getState();

      expect(state.worlds[worldId].name).toBe('Updated World');
      expect(state.worlds[worldId].updatedAt).not.toBe(originalUpdatedAt);
    });

    test('should handle non-existent world', () => {
      useWorldStore.getState().updateWorld('non-existent-id', { name: 'Updated' });
      const state = useWorldStore.getState();
      expect(state.error?.message).toBe('World not found');
    });
  });

  describe('deleteWorld', () => {
    test('should remove world from store', () => {
      const worldId = useWorldStore.getState().createWorld(createTestWorldData({
        name: 'To Delete',
        description: 'World to be deleted',
      }));

      useWorldStore.getState().deleteWorld(worldId);
      const state = useWorldStore.getState();

      expect(state.worlds[worldId]).toBeUndefined();
    });

    test('should clear currentWorldId if deleted world was current', () => {
      const worldId = useWorldStore.getState().createWorld(createTestWorldData({
        name: 'Current World',
        description: 'Current world test',
      }));

      useWorldStore.getState().setCurrentWorld(worldId);
      useWorldStore.getState().deleteWorld(worldId);
      const state = useWorldStore.getState();

      expect(state.currentWorldId).toBeNull();
    });
  });

  describe('setCurrentWorld', () => {
    test('should set current world ID', () => {
      const worldId = useWorldStore.getState().createWorld(createTestWorldData({
        name: 'Current World',
        description: 'Set current world test',
      }));

      useWorldStore.getState().setCurrentWorld(worldId);
      const state = useWorldStore.getState();

      expect(state.currentWorldId).toBe(worldId);
    });

    test('should handle non-existent world', () => {
      useWorldStore.getState().setCurrentWorld('non-existent-id');
      const state = useWorldStore.getState();
      expect(state.error?.message).toBe('World not found');
      expect(state.currentWorldId).toBeNull();
    });
  });

  describe('error handling', () => {
    test('should set and clear errors', () => {
      useWorldStore.getState().setError({
        title: 'Test error',
        message: 'Details',
        retryable: false,
        type: ErrorType.UNKNOWN,
      });
      expect(useWorldStore.getState().error?.title).toBe('Test error');

      useWorldStore.getState().clearError();
      expect(useWorldStore.getState().error).toBeNull();
    });
  });

  describe('loading state', () => {
    test('should set loading state', () => {
      useWorldStore.getState().setLoading(true);
      expect(useWorldStore.getState().loading).toBe(true);

      useWorldStore.getState().setLoading(false);
      expect(useWorldStore.getState().loading).toBe(false);
    });
  });

  describe('reset', () => {
    test('should reset store to initial state', () => {
      // Add some data
      useWorldStore.getState().createWorld(createTestWorldData());
      useWorldStore.getState().setError({
        title: 'Some error',
        message: 'Details',
        retryable: false,
        type: ErrorType.UNKNOWN,
      });
      useWorldStore.getState().setLoading(true);

      // Reset
      useWorldStore.getState().reset();
      const state = useWorldStore.getState();

      expect(state.worlds).toEqual({});
      expect(state.currentWorldId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });
});
