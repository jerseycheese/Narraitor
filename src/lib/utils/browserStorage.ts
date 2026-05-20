/**
 * SSR-safe wrappers around localStorage and sessionStorage.
 *
 * All functions no-op on the server (typeof window === 'undefined') and
 * swallow Storage exceptions (quota, disabled, private-mode failures) so
 * callers don't need to wrap every access in try/catch.
 *
 * `readJSON`/`writeJSON` handle JSON.parse failures by returning the
 * fallback rather than throwing — corrupted stored values are treated
 * as "no value" instead of crashing the caller.
 */

type StorageKind = 'local' | 'session';

function getStore(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readString(kind: StorageKind, key: string): string | null {
  const store = getStore(kind);
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(kind: StorageKind, key: string, value: string): void {
  const store = getStore(kind);
  if (!store) return;
  try {
    store.setItem(key, value);
  } catch {
    /* quota or disabled — drop silently */
  }
}

export function removeKey(kind: StorageKind, key: string): void {
  const store = getStore(kind);
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readJSON<T>(kind: StorageKind, key: string, fallback: T): T {
  const raw = readString(kind, key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(kind: StorageKind, key: string, value: T): void {
  try {
    writeString(kind, key, JSON.stringify(value));
  } catch {
    /* circular structure or other stringify failure */
  }
}
