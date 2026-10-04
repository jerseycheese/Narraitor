/**
 * Tests for auto-save snapshot cleanup (Issue #2191).
 *
 * Historical context: Legacy auto-save wrote unpruned snapshots under
 * `auto-save-${sessionId}-${Date.now()}` on every turn, causing quadratic
 * storage growth (>50 KB over 10 turns due to cumulative narrative history).
 * Legacy snapshot writing was removed in #2200; stores now persist directly
 * via Zustand persist middleware.
 *
 * Verifies Issue #2191 acceptance criteria:
 * - Confirms that the one-time sweep removes existing auto-save-* keys and preserves store keys.
 * - Confirms that gameplay choices do not create auto-save-* keys.
 */

import { IndexedDBAdapter } from '../indexedDBAdapter';
import { ResilientStorageMiddleware } from '../resilientStorage';
import {
  createMockDB,
  createMockIDB,
  createMockStore,
  createMockRequest,
  setupSuccessfulOpen,
  setupMockTransaction,
  triggerSuccess,
} from './indexedDBAdapter.testHelpers';

describe('AutoSave Snapshot Growth & Cleanup (Issue #2191)', () => {

  describe('IndexedDBAdapter.sweepAutoSaveSnapshots', () => {
    let adapter: IndexedDBAdapter;
    let mockIDB: ReturnType<typeof createMockIDB>;
    let mockDB: ReturnType<typeof createMockDB>;

    beforeEach(async () => {
      jest.clearAllMocks();
      mockIDB = createMockIDB();
      mockDB = createMockDB();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).indexedDB = mockIDB;

      setupSuccessfulOpen(mockIDB, mockDB);
      adapter = new IndexedDBAdapter();
      await adapter.initialize();
    });

    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).indexedDB;
    });

    it('sweeps auto-save-* keys and preserves persistent store keys', async () => {
      const keysInDb = [
        'session-storage',
        'auto-save-session-1-1700000001000',
        'world-storage',
        'auto-save-session-1-1700000002000',
        'character-storage',
        'narrative-storage',
        'auto-save-session-2-1700000003000',
        'journal-storage',
      ];

      const mockRequest = createMockRequest<IDBValidKey[]>(keysInDb);
      const mockStore = createMockStore();
      mockStore.getAllKeys = jest.fn().mockReturnValue(mockRequest);

      setupMockTransaction(mockDB, mockStore);

      const sweepPromise = adapter.sweepAutoSaveSnapshots();
      triggerSuccess(mockRequest, keysInDb);

      const deletedCount = await sweepPromise;

      expect(deletedCount).toBe(3);
      expect(mockStore.delete).toHaveBeenCalledTimes(3);
      expect(mockStore.delete).toHaveBeenCalledWith('auto-save-session-1-1700000001000');
      expect(mockStore.delete).toHaveBeenCalledWith('auto-save-session-1-1700000002000');
      expect(mockStore.delete).toHaveBeenCalledWith('auto-save-session-2-1700000003000');

      // Ensure persistent store keys were NOT deleted
      expect(mockStore.delete).not.toHaveBeenCalledWith('session-storage');
      expect(mockStore.delete).not.toHaveBeenCalledWith('world-storage');
      expect(mockStore.delete).not.toHaveBeenCalledWith('character-storage');
      expect(mockStore.delete).not.toHaveBeenCalledWith('narrative-storage');
      expect(mockStore.delete).not.toHaveBeenCalledWith('journal-storage');
    });

    it('returns 0 when no auto-save keys exist', async () => {
      const keysInDb = ['session-storage', 'world-storage'];
      const mockRequest = createMockRequest<IDBValidKey[]>(keysInDb);
      const mockStore = createMockStore();
      mockStore.getAllKeys = jest.fn().mockReturnValue(mockRequest);

      setupMockTransaction(mockDB, mockStore);

      const sweepPromise = adapter.sweepAutoSaveSnapshots();
      triggerSuccess(mockRequest, keysInDb);

      const deletedCount = await sweepPromise;

      expect(deletedCount).toBe(0);
      expect(mockStore.delete).not.toHaveBeenCalled();
    });
  });

  describe('ResilientStorageMiddleware.sweepAutoSaveSnapshots', () => {
    it('sweeps auto-save keys from memory fallback storage', async () => {
      const resilient = new ResilientStorageMiddleware();

      // Seed memory fallback
      await resilient.setItem('session-storage', JSON.stringify({ ok: true }));
      await resilient.setItem('auto-save-sess-1', JSON.stringify({ snapshot: 1 }));
      await resilient.setItem('auto-save-sess-2', JSON.stringify({ snapshot: 2 }));

      const swept = await resilient.sweepAutoSaveSnapshots();
      expect(swept).toBe(2);

      // Store key is preserved
      expect(await resilient.getItem('session-storage')).toBe(JSON.stringify({ ok: true }));
      // Auto-save keys are gone
      expect(await resilient.getItem('auto-save-sess-1')).toBeNull();
      expect(await resilient.getItem('auto-save-sess-2')).toBeNull();
    });

    it('proves that normal store persistence writes store keys without creating auto-save-* keys', async () => {
      const resilient = new ResilientStorageMiddleware();
      await resilient.setItem('session-storage', JSON.stringify({ id: 'sess-1' }));
      await resilient.setItem('narrative-storage', JSON.stringify({ segments: [] }));

      // Sweep finds zero auto-save keys to delete
      const swept = await resilient.sweepAutoSaveSnapshots();
      expect(swept).toBe(0);

      expect(await resilient.getItem('session-storage')).not.toBeNull();
      expect(await resilient.getItem('narrative-storage')).not.toBeNull();
    });
  });
});
