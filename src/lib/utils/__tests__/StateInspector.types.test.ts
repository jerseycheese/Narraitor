import type { 
  StateSnapshot, 
  PathMetadata, 
  StateChangeCallback, 
  WatchOptions,
  StateInspectorConfig 
} from '../StateInspector';

// Type-only tests to ensure proper TypeScript interfaces
describe('StateInspector Types', () => {
  describe('StateSnapshot', () => {
    it('should accept any store state structure', () => {
      const snapshot: StateSnapshot = {
        worldStore: {
          worlds: {},
          currentWorldId: null,
          loading: false,
          error: null
        },
        characterStore: {
          characters: {},
          currentCharacterId: null,
          loading: false
        }
      };

      expect(typeof snapshot).toBe('object');
    });

    it('should allow stores with error states', () => {
      const snapshotWithError: StateSnapshot = {
        worldStore: {
          error: 'Error accessing store state: Connection failed'
        }
      };

      expect(snapshotWithError.worldStore.error).toBe('Error accessing store state: Connection failed');
    });
  });

  describe('PathMetadata', () => {
    it('should provide complete path information', () => {
      const metadata: PathMetadata = {
        exists: true,
        type: 'object',
        depth: 3,
        hasChildren: true,
        childCount: 5
      };

      expect(metadata.exists).toBe(true);
      expect(metadata.type).toBe('object');
      expect(metadata.depth).toBe(3);
      expect(metadata.hasChildren).toBe(true);
      expect(metadata.childCount).toBe(5);
    });

    it('should handle primitive value metadata', () => {
      const primitiveMetadata: PathMetadata = {
        exists: true,
        type: 'string',
        depth: 2,
        hasChildren: false,
        childCount: 0
      };

      expect(primitiveMetadata.hasChildren).toBe(false);
      expect(primitiveMetadata.childCount).toBe(0);
    });

    it('should handle non-existent path metadata', () => {
      const nonExistentMetadata: PathMetadata = {
        exists: false,
        type: 'undefined',
        depth: 0,
        hasChildren: false,
        childCount: 0
      };

      expect(nonExistentMetadata.exists).toBe(false);
    });
  });

  describe('StateChangeCallback', () => {
    it('should accept proper callback signature', () => {
      const callback: StateChangeCallback = (newValue, oldValue, path) => {
        expect(typeof path).toBe('string');
        // Values can be any type
        console.log(`State changed at ${path}: ${oldValue} -> ${newValue}`);
      };

      // Test the callback
      callback('world-2', 'world-1', 'worldStore.currentWorldId');
    });

    it('should handle complex object changes', () => {
      const callback: StateChangeCallback = (newValue, oldValue, path) => {
        if (typeof newValue === 'object' && typeof oldValue === 'object') {
          expect(newValue).not.toEqual(oldValue);
        }
      };

      const oldWorld = { id: 'world-1', name: 'Old World' };
      const newWorld = { id: 'world-1', name: 'New World' };
      
      callback(newWorld, oldWorld, 'worldStore.worlds.world-1');
    });
  });

  describe('WatchOptions', () => {
    it('should provide optional debouncing configuration', () => {
      const options: WatchOptions = {
        debounceMs: 500
      };

      expect(options.debounceMs).toBe(500);
    });

    it('should allow empty options object', () => {
      const options: WatchOptions = {};
      expect(typeof options).toBe('object');
    });

    it('should be optional parameter', () => {
      // This simulates the actual usage where options are optional
      const mockWatch = (path: string, callback: StateChangeCallback, options?: WatchOptions) => {
        if (options?.debounceMs) {
          expect(options.debounceMs).toBeGreaterThan(0);
        }
      };

      // Should work without options
      mockWatch('worldStore.currentWorldId', () => {});
      
      // Should work with options
      mockWatch('worldStore.currentWorldId', () => {}, { debounceMs: 100 });
    });
  });

  describe('StateInspectorConfig', () => {
    it('should provide configuration for performance limits', () => {
      const config: StateInspectorConfig = {
        maxDepth: 10,
        maxWatchedPaths: 50,
        debounceMs: 100
      };

      expect(config.maxDepth).toBe(10);
      expect(config.maxWatchedPaths).toBe(50);
      expect(config.debounceMs).toBe(100);
    });

    it('should allow partial configuration', () => {
      const partialConfig: StateInspectorConfig = {
        maxDepth: 5
      };

      expect(partialConfig.maxDepth).toBe(5);
      expect(partialConfig.maxWatchedPaths).toBeUndefined();
    });

    it('should be optional for StateInspector constructor', () => {
      // This tests that the config parameter should be optional
      const mockConstructor = (config?: StateInspectorConfig) => {
        if (config?.maxDepth) {
          expect(config.maxDepth).toBeGreaterThan(0);
        }
      };

      // Should work without config
      mockConstructor();
      
      // Should work with config
      mockConstructor({ maxDepth: 8 });
    });
  });

  describe('Type compatibility', () => {
    it('should work with actual Zustand store signatures', () => {
      // Mock store interface similar to actual Zustand stores
      interface MockStore {
        getState: () => any;
        subscribe: (callback: (state: any, prevState: any) => void) => () => void;
      }

      const mockStore: MockStore = {
        getState: () => ({ data: 'test' }),
        subscribe: (callback) => {
          // Mock subscription
          return () => {}; // unsubscribe function
        }
      };

      // This should be compatible with StateInspector's expected store format
      expect(typeof mockStore.getState).toBe('function');
      expect(typeof mockStore.subscribe).toBe('function');
    });

    it('should handle store state serialization safely', () => {
      // Test that state snapshot can handle complex objects that might not serialize well
      const complexState = {
        date: new Date(),
        function: () => 'test',
        undefined: undefined,
        null: null,
        circular: {} as any
      };
      
      // Create circular reference
      complexState.circular.self = complexState.circular;

      // This should be handled by the StateInspector's serialization logic
      const serialized = JSON.stringify(complexState, (key, value) => {
        if (typeof value === 'function') return '[Function]';
        if (value === undefined) return 'undefined';
        if (value instanceof Date) return value.toISOString();
        return value;
      });

      expect(typeof serialized).toBe('string');
    });
  });
});