/**
 * loreStore persistence of usage totals against the real zustand persist
 * middleware, with a working in-memory fake behind the storage seam.
 */
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
  (global as { __loreStoreTestStorage?: typeof storage }).__loreStoreTestStorage = storage;
  return {
    createIndexedDBStorage: () => storage,
    createPreserveMigrate: () => (persisted: unknown) => persisted,
  };
});

jest.unmock('../../loreStore');

import { useLoreStore } from '../../loreStore';

const STORE_KEY = 'lore-store';

type TestStorage = { backing: Map<string, string> };
const testStorage = (global as unknown as { __loreStoreTestStorage: TestStorage })
  .__loreStoreTestStorage;

const flushPersist = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('loreStore persistence - usage totals', () => {
  beforeEach(async () => {
    useLoreStore.getState().reset();
    await flushPersist();
    testStorage.backing.clear();
  });

  test('loreUsage survives a reload', async () => {
    const factId = useLoreStore
      .getState()
      .addFact('door', 'The cellar door is barred', 'rules', 'narrative', 'world-1', 'session-1');
    useLoreStore
      .getState()
      .recordLoreUsage({ worldId: 'world-1', sessionId: 'session-1', factIds: [factId] });
    await flushPersist();
    const written = testStorage.backing.get(STORE_KEY)!;

    useLoreStore.getState().reset();
    await flushPersist();
    testStorage.backing.set(STORE_KEY, written);
    await useLoreStore.persist.rehydrate();

    expect(useLoreStore.getState().loreUsage[factId]?.usageCount).toBe(1);
  });

  test('an old save without loreUsage loads as an empty object', async () => {
    testStorage.backing.set(
      STORE_KEY,
      JSON.stringify({ state: { facts: {}, factHistory: {}, mergeAuditLog: [] }, version: 3 })
    );

    await useLoreStore.persist.rehydrate();

    expect(useLoreStore.getState().loreUsage).toEqual({});
  });
});
