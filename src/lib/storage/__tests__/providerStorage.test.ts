/**
 * providerStorage covers two transports: IndexedDB (primary) and localStorage
 * (fallback). jsdom has localStorage but no IndexedDB, so the fallback path runs
 * naturally; the IndexedDB path is exercised with a mocked adapter + a truthy
 * global indexedDB.
 */

const idbStore = new Map<string, string>();

jest.mock('../indexedDBAdapter', () => ({
  IndexedDBAdapter: class {
    isInitialized = true;
    async initialize(): Promise<void> {}
    async getItem(key: string): Promise<string | null> {
      return idbStore.has(key) ? (idbStore.get(key) as string) : null;
    }
    async setItem(key: string, value: string): Promise<void> {
      idbStore.set(key, value);
    }
    async removeItem(key: string): Promise<void> {
      idbStore.delete(key);
    }
  },
}));

import { createProviderStorage } from '../providerStorage';

const KEY = 'narraitor-provider-store';

beforeEach(() => {
  idbStore.clear();
  localStorage.clear();
});

describe('providerStorage — localStorage fallback (no IndexedDB)', () => {
  test('round-trips and wipes via localStorage', async () => {
    const storage = createProviderStorage<{ foo: string }>();
    const value = { state: { foo: 'bar' }, version: 1 };

    await storage.setItem(KEY, value);
    expect(localStorage.getItem(KEY)).toContain('bar');

    expect(await storage.getItem(KEY)).toEqual(value);

    await storage.removeItem(KEY);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(await storage.getItem(KEY)).toBeNull();
  });
});

describe('providerStorage — IndexedDB path', () => {
  const globalRef = globalThis as { indexedDB?: unknown };

  beforeEach(() => {
    globalRef.indexedDB = {}; // truthy so the adapter branch is taken
  });

  afterEach(() => {
    delete globalRef.indexedDB;
  });

  test('round-trips via IndexedDB and leaves localStorage untouched', async () => {
    // Fresh module instance so the cached adapter re-evaluates with indexedDB present.
    let create: typeof createProviderStorage;
    jest.isolateModules(() => {
      create = require('../providerStorage').createProviderStorage;
    });

    const storage = create!<{ a: number }>();
    const value = { state: { a: 1 }, version: 1 };

    await storage.setItem(KEY, value);
    expect(idbStore.get(KEY)).toContain('"a":1');
    expect(localStorage.getItem(KEY)).toBeNull();

    expect(await storage.getItem(KEY)).toEqual(value);

    await storage.removeItem(KEY);
    expect(idbStore.has(KEY)).toBe(false);
  });
});
