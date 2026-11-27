/**
 * Two tabs share one IndexedDB. Each ResilientStorageMiddleware instance
 * stands in for a tab.
 */

import { ResilientStorageMiddleware, StorageStatus } from '../resilientStorage';

const records = new Map<string, unknown>();

// Readwrite transactions on one store never overlap in a browser: a transaction's
// requests all finish, including ones its callbacks add, before the next starts.
interface Transaction {
  tasks: Array<() => void>;
  commit: () => void;
}
const transactions: Transaction[] = [];
// Makes the next transaction that writes abort at commit, like a full disk.
let abortNextWrite = false;

function drain() {
  const task = transactions[0].tasks.shift();
  if (task) task();
  else transactions.shift()?.commit();
  if (transactions.length > 0) setTimeout(drain, 0);
}

function transaction() {
  const tasks: Array<() => void> = [];
  let before: Map<string, unknown> | undefined;
  const handlers: {
    oncomplete?: () => void;
    onabort?: () => void;
    error?: DOMException;
  } = {};
  const commit = () => {
    if (!before || !abortNextWrite) return handlers.oncomplete?.();
    abortNextWrite = false;
    records.clear();
    before.forEach((value, key) => records.set(key, value));
    handlers.error = new DOMException('Disk full', 'QuotaExceededError');
    handlers.onabort?.();
  };
  if (transactions.push({ tasks, commit }) === 1) setTimeout(drain, 0);

  const request = (run: () => unknown) => {
    const req: { result?: unknown; onsuccess?: () => void } = {};
    tasks.push(() => {
      req.result = run();
      req.onsuccess?.();
    });
    return req;
  };

  const store = {
    get: (key: string) => request(() => structuredCloneJson(records.get(key))),
    put: (value: unknown, key: string) =>
      request(() => {
        before ??= new Map(records);
        records.set(key, structuredCloneJson(value));
      }),
    delete: (key: string) => request(() => records.delete(key)),
  };
  return Object.assign(handlers, { objectStore: () => store });
}

function structuredCloneJson<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

const fakeIndexedDB = {
  open: () => {
    const req: {
      onsuccess?: (event: { target: { result: unknown } }) => void;
    } = {};
    const db = { transaction };
    setTimeout(() => req.onsuccess?.({ target: { result: db } }), 0);
    return req;
  },
};

const worlds = (...names: string[]) => JSON.stringify({ state: { names }, version: 1 });

describe('ResilientStorageMiddleware with a second tab open', () => {
  const originalIndexedDB = global.indexedDB;

  beforeEach(() => {
    records.clear();
    abortNextWrite = false;
    global.indexedDB = fakeIndexedDB as unknown as IDBFactory;
  });

  afterAll(() => {
    global.indexedDB = originalIndexedDB;
  });

  const openTwoTabs = async () => {
    const onStatusChange = jest.fn();
    const first = new ResilientStorageMiddleware();
    const second = new ResilientStorageMiddleware({ onStatusChange });
    await first.getItem('worlds');
    await second.getItem('worlds');
    return { first, second, onStatusChange };
  };

  it('refuses a stale write, reports it, and stops saving from that tab', async () => {
    const { first, second, onStatusChange } = await openTwoTabs();

    await first.setItem('worlds', worlds('From Tab One'));
    await second.setItem('worlds', worlds('From Tab Two'));
    await second.setItem('characters', worlds('Orphan'));

    expect(await first.getItem('worlds')).toBe(worlds('From Tab One'));
    expect(records.has('characters')).toBe(false);
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith(StorageStatus.STALE, expect.anything());
  });

  it('refuses a write to a record the other tab left alone', async () => {
    const { first, second, onStatusChange } = await openTwoTabs();
    await second.getItem('characters');

    await first.setItem('worlds', worlds('From Tab One'));
    await second.setItem('characters', worlds('Orphan'));

    expect(records.has('characters')).toBe(false);
    expect(onStatusChange).toHaveBeenCalledWith(StorageStatus.STALE, expect.anything());
  });

  it('refuses to bring back a record the other tab deleted', async () => {
    records.set('worlds', { id: 'worlds', value: JSON.parse(worlds('Old')) });
    const { first, second, onStatusChange } = await openTwoTabs();

    await first.removeItem('worlds');
    await second.setItem('worlds', worlds('Old', 'Stale'));

    expect(records.has('worlds')).toBe(false);
    expect(onStatusChange).toHaveBeenCalledWith(StorageStatus.STALE, expect.anything());
  });

  it('leaves the newer data alone when the stale tab re-saves what it already had', async () => {
    records.set('worlds', { id: 'worlds', value: JSON.parse(worlds('Old')) });
    const { first, second, onStatusChange } = await openTwoTabs();

    await first.setItem('worlds', worlds('Old', 'New'));
    await second.setItem('worlds', worlds('Old'));

    expect(await first.getItem('worlds')).toBe(worlds('Old', 'New'));
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('keeps saving back-to-back writes across records from the only tab that is writing', async () => {
    const onStatusChange = jest.fn();
    const first = new ResilientStorageMiddleware({ onStatusChange });
    await Promise.all([first.getItem('worlds'), first.getItem('characters')]);

    await Promise.all([
      first.setItem('worlds', worlds('A')),
      first.setItem('characters', worlds('Hero')),
      first.setItem('worlds', worlds('A', 'B')),
    ]);
    await first.setItem('worlds', worlds('B'));

    expect(await first.getItem('worlds')).toBe(worlds('B'));
    expect(await first.getItem('characters')).toBe(worlds('Hero'));
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('does not blame another tab for writes queued behind one that aborted', async () => {
    const onStatusChange = jest.fn();
    const first = new ResilientStorageMiddleware({ onStatusChange });
    await Promise.all([first.getItem('worlds'), first.getItem('characters')]);

    abortNextWrite = true;
    await Promise.all([
      first.setItem('worlds', worlds('A')),
      first.setItem('characters', worlds('Hero')),
    ]);

    expect(records.has('worlds')).toBe(false);
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith(StorageStatus.UNAVAILABLE, expect.anything());
  });

  it('does not blame another tab when saving the fingerprint of a read aborts', async () => {
    records.set('worlds', { id: 'worlds', value: JSON.parse(worlds('Old')) });
    const onStatusChange = jest.fn();
    const first = new ResilientStorageMiddleware({ onStatusChange });

    abortNextWrite = true;
    await first.getItem('worlds');
    await first.setItem('worlds', worlds('Old', 'New'));

    expect(await first.getItem('worlds')).toBe(worlds('Old', 'New'));
    expect(onStatusChange).not.toHaveBeenCalled();
  });
});
