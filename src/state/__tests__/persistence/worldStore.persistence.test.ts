/**
 * worldStore persistence against the real zustand persist middleware.
 *
 * The storage layer is faked, but it is a working fake: a write lands in an
 * in-memory map and a read gets it back, so every assertion here observes what
 * the middleware actually serialized rather than that a mock was called.
 * `../../persistence` is the seam because it is the last point before the
 * browser, and `worldStore` is unmocked so the store code under test runs.
 */

// Backed by a real map so persisted state can be read back. Defined inside the
// factory (not a module const) because jest hoists this above the imports.
jest.mock('../../persistence', () => {
  const backing = new Map<string, string>();

  const storage = {
    backing,
    getItem: jest.fn(async (name: string) => {
      const raw = backing.get(name);
      return raw ? JSON.parse(raw) : null;
    }),
    setItem: jest.fn(async (name: string, value: unknown) => {
      backing.set(name, JSON.stringify(value));
    }),
    removeItem: jest.fn(async (name: string) => {
      backing.delete(name);
    }),
  };

  (global as { __worldStoreTestStorage?: typeof storage }).__worldStoreTestStorage = storage;

  return { createIndexedDBStorage: () => storage };
});

jest.unmock('../../worldStore');

import { useWorldStore } from '../../worldStore';
import { createMockWorld } from '@/lib/test-utils';
import type { World } from '@/types';

const STORE_KEY = 'narraitor-world-store';

type TestStorage = {
  backing: Map<string, string>;
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
};

const testStorage = (global as unknown as { __worldStoreTestStorage: TestStorage })
  .__worldStoreTestStorage;

/** The state the middleware most recently wrote, parsed back out of storage. */
const readPersistedState = (): { worlds: Record<string, World>; currentWorldId: string | null } | null => {
  const raw = testStorage.backing.get(STORE_KEY);
  return raw ? JSON.parse(raw).state : null;
};

/** Persist writes are async; let the middleware's write settle before reading. */
const flushPersist = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Model a fresh page load: keep the bytes the last session wrote, drop the
 * in-memory state, and rehydrate from those bytes. `reset()` alone is not
 * enough, because the middleware immediately persists the emptied state over
 * the top of what we are trying to read back.
 */
const reloadFromStorage = async () => {
  const written = testStorage.backing.get(STORE_KEY)!;
  useWorldStore.getState().reset();
  await flushPersist();
  testStorage.backing.set(STORE_KEY, written);
  await useWorldStore.persist.rehydrate();
};

const worldInput = (overrides: Partial<World> = {}) => {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = createMockWorld(overrides);
  return rest;
};

describe('worldStore persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    testStorage.backing.clear();
    useWorldStore.getState().reset();
  });

  describe('state persistence', () => {
    test('writes a created world through to storage', async () => {
      const worldId = useWorldStore.getState().createWorld(worldInput({ name: 'Persisted World' }));

      await flushPersist();

      const persisted = readPersistedState();
      expect(persisted?.worlds[worldId]).toMatchObject({
        id: worldId,
        name: 'Persisted World',
      });
    });

    test('restores worlds from storage on rehydrate', async () => {
      const stored = createMockWorld({ id: 'world-1', name: 'Restored World' });
      testStorage.backing.set(
        STORE_KEY,
        JSON.stringify({
          state: { worlds: { 'world-1': stored }, currentWorldId: 'world-1' },
          version: 5,
        })
      );

      await useWorldStore.persist.rehydrate();

      const state = useWorldStore.getState();
      expect(state.worlds['world-1']).toMatchObject({ id: 'world-1', name: 'Restored World' });
      expect(state.currentWorldId).toBe('world-1');
    });

    test('rehydrates to empty defaults when storage holds nothing', async () => {
      await useWorldStore.persist.rehydrate();

      const state = useWorldStore.getState();
      expect(state.worlds).toEqual({});
      expect(state.currentWorldId).toBeNull();
    });

    test('drops a deleted world from storage', async () => {
      const worldId = useWorldStore.getState().createWorld(worldInput());
      await flushPersist();

      useWorldStore.getState().deleteWorld(worldId);
      await flushPersist();

      expect(readPersistedState()?.worlds[worldId]).toBeUndefined();
    });
  });

  describe('data integrity', () => {
    test('survives a full write and read back with its dates intact', async () => {
      const worldId = useWorldStore
        .getState()
        .createWorld(worldInput({ name: 'Dated World' }));

      await flushPersist();
      const written = readPersistedState()!.worlds[worldId];

      await reloadFromStorage();

      const restored = useWorldStore.getState().worlds[worldId];
      expect(restored.createdAt).toBe(written.createdAt);
      expect(restored.updatedAt).toBe(written.updatedAt);
      expect(typeof restored.createdAt).toBe('string');
    });

    test('preserves every world property through a round trip', async () => {
      const worldId = useWorldStore.getState().createWorld(
        worldInput({
          name: 'Full Featured World',
          genre: 'sci-fi',
          description: 'A complex world with all properties',
          settings: {
            maxAttributes: 8,
            maxSkills: 10,
            attributePointPool: 32,
            skillPointPool: 25,
          },
        })
      );

      await flushPersist();
      await reloadFromStorage();

      expect(useWorldStore.getState().worlds[worldId]).toMatchObject({
        name: 'Full Featured World',
        genre: 'sci-fi',
        description: 'A complex world with all properties',
        settings: {
          maxAttributes: 8,
          maxSkills: 10,
          attributePointPool: 32,
          skillPointPool: 25,
        },
      });
    });
  });
});
