import { StateInspector } from '../StateInspector';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';

// Mock the stores
jest.mock('@/state/worldStore', () => ({
  worldStore: {
    getState: jest.fn(),
    subscribe: jest.fn()
  }
}));

jest.mock('@/state/characterStore', () => ({
  characterStore: {
    getState: jest.fn(),
    subscribe: jest.fn()
  }
}));

describe('StateInspector', () => {
  let inspector: StateInspector;
  let mockWorldStore: jest.Mocked<typeof worldStore>;
  let mockCharacterStore: jest.Mocked<typeof characterStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorldStore = worldStore as jest.Mocked<typeof worldStore>;
    mockCharacterStore = characterStore as jest.Mocked<typeof characterStore>;
    
    // Setup mock state data
    mockWorldStore.getState.mockReturnValue({
      worlds: {
        'world-1': { 
          id: 'world-1', 
          name: 'Test World',
          theme: 'Fantasy',
          attributes: {
            magic: 'high',
            technology: 'low'
          }
        }
      },
      currentWorldId: 'world-1',
      loading: false,
      error: null
    });

    mockCharacterStore.getState.mockReturnValue({
      characters: {
        'char-1': {
          id: 'char-1',
          name: 'Test Character',
          stats: { strength: 10, intelligence: 15 }
        }
      },
      currentCharacterId: 'char-1',
      loading: false,
      error: null
    });

    inspector = new StateInspector();
  });

  describe('hierarchical state exploration', () => {
    it('should provide current application state snapshot', () => {
      const snapshot = inspector.getStateSnapshot();
      
      expect(snapshot).toHaveProperty('worldStore');
      expect(snapshot).toHaveProperty('characterStore');
      expect(snapshot.worldStore).toEqual(mockWorldStore.getState());
      expect(snapshot.characterStore).toEqual(mockCharacterStore.getState());
    });

    it('should allow exploring nested object properties by path', () => {
      const worldData = inspector.getValueAtPath('worldStore.worlds.world-1');
      
      expect(worldData).toEqual({
        id: 'world-1',
        name: 'Test World',
        theme: 'Fantasy',
        attributes: {
          magic: 'high',
          technology: 'low'
        }
      });
    });

    it('should return undefined for invalid paths', () => {
      const result = inspector.getValueAtPath('worldStore.nonexistent.path');
      expect(result).toBeUndefined();
    });

    it('should provide metadata about nested structure depth', () => {
      const metadata = inspector.getPathMetadata('worldStore.worlds.world-1');
      
      expect(metadata).toEqual({
        exists: true,
        type: 'object',
        depth: 3,
        hasChildren: true,
        childCount: 4 // id, name, theme, attributes
      });
    });

    it('should list available child paths for navigation', () => {
      const childPaths = inspector.getChildPaths('worldStore.worlds.world-1');
      
      expect(childPaths).toContain('worldStore.worlds.world-1.id');
      expect(childPaths).toContain('worldStore.worlds.world-1.name');
      expect(childPaths).toContain('worldStore.worlds.world-1.theme');
      expect(childPaths).toContain('worldStore.worlds.world-1.attributes');
    });
  });

  describe('state change monitoring', () => {
    it('should monitor specific state paths for changes', () => {
      const callback = jest.fn();
      const unsubscribe = inspector.watchPath('worldStore.currentWorldId', callback);

      expect(typeof unsubscribe).toBe('function');
      expect(mockWorldStore.subscribe).toHaveBeenCalled();
    });

    it('should detect changes to watched paths', () => {
      const callback = jest.fn();
      inspector.watchPath('worldStore.currentWorldId', callback);

      // Simulate store subscription callback
      const subscribeCallback = mockWorldStore.subscribe.mock.calls[0][0];
      
      // Update mock state
      mockWorldStore.getState.mockReturnValue({
        ...mockWorldStore.getState(),
        currentWorldId: 'world-2'
      });

      // Trigger the subscription
      subscribeCallback(mockWorldStore.getState(), mockWorldStore.getState());

      expect(callback).toHaveBeenCalledWith(
        'world-2', // new value
        'world-1', // old value
        'worldStore.currentWorldId' // path
      );
    });

    it('should not trigger callbacks for unchanged watched paths', () => {
      const callback = jest.fn();
      inspector.watchPath('worldStore.currentWorldId', callback);

      const subscribeCallback = mockWorldStore.subscribe.mock.calls[0][0];
      
      // Trigger subscription with same state
      subscribeCallback(mockWorldStore.getState(), mockWorldStore.getState());

      expect(callback).not.toHaveBeenCalled();
    });

    it('should allow unsubscribing from path monitoring', () => {
      const callback = jest.fn();
      const unsubscribe = inspector.watchPath('worldStore.currentWorldId', callback);
      
      unsubscribe();
      
      // State change after unsubscribe should not trigger callback
      const subscribeCallback = mockWorldStore.subscribe.mock.calls[0][0];
      mockWorldStore.getState.mockReturnValue({
        ...mockWorldStore.getState(),
        currentWorldId: 'world-3'
      });
      
      subscribeCallback(mockWorldStore.getState(), mockWorldStore.getState());
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('development-only functionality', () => {
    it('should only work in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test in production environment
      process.env.NODE_ENV = 'production';
      
      expect(() => new StateInspector()).toThrow('StateInspector is only available in development environment');
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should work in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      expect(() => new StateInspector()).not.toThrow();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should work in test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      expect(() => new StateInspector()).not.toThrow();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('performance safeguards', () => {
    it('should implement debouncing for rapid state changes', () => {
      jest.useFakeTimers();
      
      const callback = jest.fn();
      inspector.watchPath('worldStore.currentWorldId', callback, { debounceMs: 100 });

      const subscribeCallback = mockWorldStore.subscribe.mock.calls[0][0];
      
      // Rapid state changes
      mockWorldStore.getState.mockReturnValue({ ...mockWorldStore.getState(), currentWorldId: 'world-2' });
      subscribeCallback(mockWorldStore.getState(), mockWorldStore.getState());
      
      mockWorldStore.getState.mockReturnValue({ ...mockWorldStore.getState(), currentWorldId: 'world-3' });
      subscribeCallback(mockWorldStore.getState(), mockWorldStore.getState());

      // Should not call immediately
      expect(callback).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(100);
      
      // Should only call once with the final value
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('world-3', 'world-1', 'worldStore.currentWorldId');
      
      jest.useRealTimers();
    });

    it('should limit the depth of object exploration to prevent infinite recursion', () => {
      // Create deeply nested mock data
      const deeplyNested = { level1: { level2: { level3: { level4: { level5: 'deep' } } } } };
      mockWorldStore.getState.mockReturnValue({ ...mockWorldStore.getState(), deepData: deeplyNested });

      const result = inspector.getValueAtPath('worldStore.deepData.level1.level2.level3.level4.level5');
      expect(result).toBe('deep');

      // Test that extremely deep paths are handled gracefully
      const metadata = inspector.getPathMetadata('worldStore.deepData.level1.level2.level3.level4');
      expect(metadata.depth).toBeLessThanOrEqual(10); // Reasonable depth limit
    });

    it('should handle circular references safely', () => {
      const circularData: any = { name: 'circular' };
      circularData.self = circularData;
      
      mockWorldStore.getState.mockReturnValue({ ...mockWorldStore.getState(), circular: circularData });

      expect(() => inspector.getStateSnapshot()).not.toThrow();
      
      const snapshot = inspector.getStateSnapshot();
      expect(snapshot.worldStore.circular).toBeDefined();
      expect(snapshot.worldStore.circular.self).toBe('[Circular Reference]');
    });
  });

  describe('error handling', () => {
    it('should handle store access errors gracefully', () => {
      mockWorldStore.getState.mockImplementation(() => {
        throw new Error('Store access failed');
      });

      expect(() => inspector.getStateSnapshot()).not.toThrow();
      
      const snapshot = inspector.getStateSnapshot();
      expect(snapshot.worldStore).toEqual({
        error: 'Error accessing store state: Store access failed'
      });
    });

    it('should handle invalid path formats', () => {
      const result = inspector.getValueAtPath('');
      expect(result).toBeUndefined();

      const result2 = inspector.getValueAtPath('.invalid..path.');
      expect(result2).toBeUndefined();
    });
  });
});