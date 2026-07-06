/**
 * Persistence transport for the provider store.
 *
 * IndexedDB is the primary store; localStorage is the fallback for browsers
 * without IndexedDB (private mode, older browsers). Unlike the game-state
 * persistence layer — which falls back to in-memory and loses data on reload —
 * provider configs need to survive a refresh so players don't re-enter their
 * key every session, hence the localStorage fallback.
 *
 * Only the (already-encrypted) config blob passes through here; the plaintext
 * API key is never written. Removal clears BOTH stores so a `forget provider`
 * wipe leaves no trace.
 */

import { PersistStorage, StorageValue } from 'zustand/middleware';
import { IndexedDBAdapter } from './indexedDBAdapter';

const hasIndexedDB = (): boolean => typeof indexedDB !== 'undefined';
const hasLocalStorage = (): boolean => typeof localStorage !== 'undefined';

let adapterPromise: Promise<IndexedDBAdapter | null> | null = null;

async function getAdapter(): Promise<IndexedDBAdapter | null> {
  if (!hasIndexedDB()) return null;
  if (!adapterPromise) {
    adapterPromise = (async () => {
      const adapter = new IndexedDBAdapter();
      await adapter.initialize();
      return adapter.isInitialized ? adapter : null;
    })();
  }
  return adapterPromise;
}

export function createProviderStorage<T = unknown>(): PersistStorage<T> {
  return {
    getItem: async (name) => {
      const adapter = await getAdapter();
      if (adapter) {
        try {
          const raw = await adapter.getItem(name);
          if (raw) return JSON.parse(raw) as StorageValue<T>;
        } catch {
          // Fall through to localStorage.
        }
      }
      if (hasLocalStorage()) {
        const raw = localStorage.getItem(name);
        if (raw) return JSON.parse(raw) as StorageValue<T>;
      }
      return null;
    },

    setItem: async (name, value) => {
      const serialized = JSON.stringify(value);
      const adapter = await getAdapter();
      if (adapter) {
        try {
          await adapter.setItem(name, serialized);
          return;
        } catch {
          // Fall through to localStorage.
        }
      }
      if (hasLocalStorage()) {
        localStorage.setItem(name, serialized);
      }
    },

    removeItem: async (name) => {
      const adapter = await getAdapter();
      if (adapter) {
        try {
          await adapter.removeItem(name);
        } catch {
          // Non-critical.
        }
      }
      if (hasLocalStorage()) {
        localStorage.removeItem(name);
      }
    },
  };
}
