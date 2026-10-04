import { act, renderHook, waitFor } from '@testing-library/react';
import { useWorldStore } from '../worldStore';
import { IndexedDBAdapter } from '@/lib/storage/indexedDBAdapter';
import { ResilientStorageMiddleware } from '@/lib/storage/resilientStorage';
import {
  createMockDB,
  createMockIDB,
  createMockRequest,
  createMockStore,
  setupMockTransaction,
  setupSuccessfulOpen,
  triggerSuccess,
} from '@/lib/storage/__tests__/indexedDBAdapter.testHelpers';

// Mock IndexedDB for testing
const mockIndexedDB = () => {
  let stores: Record<string, Record<string, string>> = {};
  let initPromise: Promise<void> | null = null;

  const mockDB = {
    transaction: jest.fn(() => ({
      objectStore: jest.fn(() => ({
        get: jest.fn((key: string) => ({
          onsuccess: function () {
            // @ts-expect-error - Mock IndexedDB result assignment
            this.result = stores['worlds']?.[key]
              ? { value: stores['worlds'][key] }
              : undefined;
          },
        })),
        put: jest.fn((data: { value: string }, key: string) => {
          if (!stores['worlds']) stores['worlds'] = {};
          stores['worlds'][key] = data.value;
          return {
            onsuccess: function () {},
          };
        }),
      })),
    })),
  };

  // Mock the global indexedDB
  Object.defineProperty(global, 'indexedDB', {
    value: {
      open: jest.fn(() => ({
        onsuccess: function () {
          // @ts-expect-error - Mock IndexedDB result assignment
          this.result = mockDB;
        },
        onupgradeneeded: function () {
          // @ts-expect-error - Mock IndexedDB result assignment
          this.result = {
            ...mockDB,
            createObjectStore: jest.fn(() => ({})),
          };
        },
      })),
    },
    writable: true,
  });

  return {
    mockDB,
    stores,
    reset: () => {
      stores = {};
      initPromise = null;
    },
    simulateInitDelay: (ms: number = 100) => {
      initPromise = new Promise((resolve) =>
        setTimeout(() => {
          resolve();
        }, ms)
      );
      return initPromise;
    },
  };
};

describe('World Persistence Infrastructure', () => {
  let mockIDB: ReturnType<typeof mockIndexedDB>;

  beforeEach(() => {
    mockIDB = mockIndexedDB();
    jest.clearAllMocks();

    // Reset Zustand store
    useWorldStore.getState().reset();
  });

  afterEach(() => {
    mockIDB.reset();
  });

  describe('Race Condition Prevention', () => {
    test('handles concurrent store rehydration without data loss', async () => {
      // Simulate slow IndexedDB initialization
      const initDelay = mockIDB.simulateInitDelay(200);

      // Create multiple store instances concurrently (simulates multiple components mounting)
      const hooks = Array.from({ length: 3 }, () =>
        renderHook(() => useWorldStore())
      );

      // Create a world in one instance while others are still initializing
      const worldData = {
        name: 'Test Race Condition World',
        theme: 'Testing',
        genre: 'fantasy' as const,
        description: 'World created during concurrent initialization',
        attributes: [],
        skills: [],
        derivedStats: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 10,
          attributePointPool: 30,
          skillPointPool: 50,
        },
      };

      act(() => {
        hooks[0].result.current.createWorld(worldData);
      });

      // Wait for initialization to complete
      await act(async () => {
        await initDelay;
        await new Promise((resolve) => setTimeout(resolve, 100)); // Allow persistence to complete
      });

      // Verify the world exists in all store instances
      hooks.forEach((hook) => {
        const worlds = Object.values(hook.result.current.worlds);
        expect(worlds).toHaveLength(1);
        expect(worlds[0].name).toBe('Test Race Condition World');
      });
    });

    test('recovers gracefully from storage initialization failures', async () => {
      // Mock IndexedDB to fail initialization
      Object.defineProperty(global, 'indexedDB', {
        value: {
          open: jest.fn(() => ({
            onerror: function () {
              // @ts-expect-error - Mock IndexedDB error assignment
              this.error = new Error('IndexedDB initialization failed');
            },
          })),
        },
        writable: true,
      });

      const { result } = renderHook(() => useWorldStore());

      // Create a world despite storage failure
      const worldData = {
        name: 'Fallback Test World',
        theme: 'Resilience Testing',
        genre: 'fantasy' as const,
        description: 'World created with storage failure',
        attributes: [],
        skills: [],
        derivedStats: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 10,
          attributePointPool: 30,
          skillPointPool: 50,
        },
      };

      act(() => {
        result.current.createWorld(worldData);
      });

      // Verify world is still created (using memory fallback)
      const worlds = Object.values(result.current.worlds);
      expect(worlds).toHaveLength(1);
      expect(worlds[0].name).toBe('Fallback Test World');
    });
  });

  describe('Persistence Lifecycle', () => {
    test('persists world data across store recreation', async () => {
      // Create initial world
      const { result: firstStore, unmount: unmountFirstStore } = renderHook(
        () => useWorldStore()
      );

      const worldData = {
        name: 'Persistent Test World',
        theme: 'Persistence Testing',
        genre: 'fantasy' as const,
        description: 'World that should survive store recreation',
        attributes: [
          {
            id: 'strength',
            name: 'Strength',
            description: 'Physical power',
            baseValue: 5,
            minValue: 1,
            maxValue: 10,
            category: 'Physical',
            worldId: '',
          },
        ],
        skills: [
          {
            id: 'combat',
            name: 'Combat',
            description: 'Fighting ability',
            difficulty: 'medium' as const,
            category: 'Combat',
            baseValue: 1,
            minValue: 1,
            maxValue: 5,
            worldId: '',
          },
        ],
        settings: {
          maxAttributes: 6,
          maxSkills: 10,
          attributePointPool: 30,
          skillPointPool: 50,
        },
      };

      let worldId: string;
      act(() => {
        worldId = firstStore.current.createWorld(worldData);
      });

      // Allow persistence to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Simulate store recreation (like page refresh)
      unmountFirstStore();

      // Create new store instance
      const { result: secondStore } = renderHook(() => useWorldStore());

      // Wait for rehydration
      await waitFor(
        () => {
          const worlds = Object.values(secondStore.current.worlds);
          expect(worlds.length).toBeGreaterThan(0);
        },
        { timeout: 1000 }
      );

      // Verify world data persisted correctly
      const persistedWorld = secondStore.current.worlds[worldId!];
      expect(persistedWorld).toBeDefined();
      expect(persistedWorld.name).toBe('Persistent Test World');
      expect(persistedWorld.attributes).toHaveLength(1);
      expect(persistedWorld.attributes[0].name).toBe('Strength');
      expect(persistedWorld.skills).toHaveLength(1);
      expect(persistedWorld.skills[0].name).toBe('Combat');
    });

    test('handles rapid create/update operations without data corruption', async () => {
      const { result } = renderHook(() => useWorldStore());

      const baseWorldData = {
        name: 'Rapid Update World',
        theme: 'Performance Testing',
        genre: 'fantasy' as const,
        description: 'World for testing rapid operations',
        attributes: [],
        skills: [],
        derivedStats: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 10,
          attributePointPool: 30,
          skillPointPool: 50,
        },
      };

      let worldId: string;

      // Rapid create and update operations
      act(() => {
        worldId = result.current.createWorld(baseWorldData);

        // Immediate updates
        result.current.updateWorld(worldId, {
          description: 'Updated description 1',
        });
        result.current.updateWorld(worldId, {
          description: 'Updated description 2',
        });
        result.current.updateWorld(worldId, {
          description: 'Final description',
        });
      });

      // Allow all persistence operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      // Verify final state is correct
      const world = result.current.worlds[worldId!];
      expect(world.description).toBe('Final description');
      expect(world.name).toBe('Rapid Update World');
    });
  });

  describe('Storage Adapter Integration', () => {
    test('properly initializes IndexedDB adapter before first access', async () => {
      const mockIDBInstance = createMockIDB();
      const mockDBInstance = createMockDB();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).indexedDB = mockIDBInstance;
      setupSuccessfulOpen(mockIDBInstance, mockDBInstance);

      const backing = new Map<string, unknown>();
      backing.set('test-key', { test: 'data' });

      const mockStore = createMockStore();
      mockStore.put.mockImplementation((record: { id: string; value: unknown }) => {
        backing.set(record.id, record.value);
        const req = createMockRequest();
        triggerSuccess(req);
        return req;
      });
      mockStore.get.mockImplementation((key: string) => {
        const val = backing.get(key);
        const req = createMockRequest(val !== undefined ? { value: val } : undefined);
        triggerSuccess(req, val !== undefined ? { value: val } : undefined);
        return req;
      });
      setupMockTransaction(mockDBInstance, mockStore);

      const adapter = new IndexedDBAdapter();
      expect(adapter.isInitialized).toBe(false);

      // Reading uninitialized adapter triggers lazy initialization before first access
      const retrieved = await adapter.getItem('test-key');
      expect(adapter.isInitialized).toBe(true);
      expect(retrieved).toBe(JSON.stringify({ test: 'data' }));

      // Writing uninitialized/subsequent also persists through initialized store
      await adapter.setItem('another-key', JSON.stringify({ saved: true }));
      const roundTripped = await adapter.getItem('another-key');
      expect(roundTripped).toBe(JSON.stringify({ saved: true }));
    });

    test('handles storage adapter unavailability gracefully', async () => {
      // Mock storage failure
      jest
        .spyOn(IndexedDBAdapter.prototype, 'initialize')
        .mockRejectedValue(new Error('Storage unavailable'));

      const { result } = renderHook(() => useWorldStore());

      // Should still be able to create worlds using memory fallback
      const worldData = {
        name: 'Memory Fallback World',
        theme: 'Fallback Testing',
        genre: 'fantasy' as const,
        description: 'World created with storage unavailable',
        attributes: [],
        skills: [],
        derivedStats: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 10,
          attributePointPool: 30,
          skillPointPool: 50,
        },
      };

      expect(() => {
        act(() => {
          result.current.createWorld(worldData);
        });
      }).not.toThrow();

      const worlds = Object.values(result.current.worlds);
      expect(worlds).toHaveLength(1);
      expect(worlds[0].name).toBe('Memory Fallback World');
    });
  });

  describe('Error Recovery', () => {
    test('continues operation after transient storage errors', async () => {
      const { result } = renderHook(() => useWorldStore());

      // Mock transient storage error
      let failCount = 0;
      jest
        .spyOn(ResilientStorageMiddleware.prototype, 'setItem')
        .mockImplementation(async function (
          this: ResilientStorageMiddleware,
          key: string,
          value: string
        ) {
          failCount++;
          if (failCount <= 2) {
            throw new Error('Transient storage error');
          }
          // Call original implementation on third try
          return ResilientStorageMiddleware.prototype.setItem.call(
            this,
            key,
            value
          );
        });

      const worldData = {
        name: 'Resilient World',
        theme: 'Error Recovery',
        genre: 'fantasy' as const,
        description: 'World that survives storage errors',
        attributes: [],
        skills: [],
        derivedStats: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 10,
          attributePointPool: 30,
          skillPointPool: 50,
        },
      };

      // Should eventually succeed despite initial failures
      act(() => {
        result.current.createWorld(worldData);
      });

      // Allow retry attempts to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });

      const worlds = Object.values(result.current.worlds);
      expect(worlds).toHaveLength(1);
      expect(worlds[0].name).toBe('Resilient World');
    });
  });
});
