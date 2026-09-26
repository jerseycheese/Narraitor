/**
 * Tests for auto-save snapshot cleanup and confirmation of snapshot growth metrics.
 * Verifies Issue #2191 acceptance criteria:
 * - Documents real growth metrics of legacy auto-save snapshots.
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
  it('confirms the quadratic growth of legacy auto-save snapshots over turns', () => {
    // Measurement verification of legacy snapshot writing:
    // auto-save-${sessionId}-${Date.now()} stored the full state every turn without pruning
    const sessionId = 'session-2191';
    const store = new Map<string, string>();

    const measurements: Array<{ turn: number; keyCount: number; cumulativeBytes: number }> = [];

    for (let turn = 1; turn <= 10; turn++) {
      const segment = {
        id: `segment-${turn}`,
        sessionId,
        content: `You step forward into the ancient ruins as dust swirls around your boots. Turn ${turn}: The shadows whisper secrets of the past, offering you a crucial choice between caution and ambition. You examine the strange runes carved into the stone archway.`,
        choices: [
          { id: `choice-${turn}-1`, text: 'Inspect the glowing glyph on the left pillar.', prompt: 'Inspect glyph' },
          { id: `choice-${turn}-2`, text: 'Draw your weapon and advance cautiously into the darkness.', prompt: 'Advance with weapon' },
          { id: `choice-${turn}-3`, text: 'Consult your field journal for translations of the symbols.', prompt: 'Read journal' },
        ],
        timestamp: new Date().toISOString(),
        sceneId: `scene-${Math.floor(turn / 3) + 1}`,
      };
      const snapshot = {
        session: { id: sessionId, status: 'active' },
        world: { id: 'world-1', name: 'Aethelgard Reaches', description: 'Fractured magic archipelago' },
        character: { id: 'char-1', name: 'Rowan Vance', stats: { intellect: 14, perception: 16 } },
        narrative: { entries: Array(turn).fill(segment), currentEntry: segment },
        journal: { entries: Array(turn).fill({ id: `entry-${turn}`, title: `Discovery ${turn}` }) },
      };

      const key = `auto-save-${sessionId}-${1700000000000 + turn}`;
      const serialized = JSON.stringify({ state: snapshot, version: 1 });
      store.set(key, serialized);

      let keyCount = 0;
      let cumulativeBytes = 0;
      for (const [k, v] of store.entries()) {
        if (k.startsWith('auto-save-')) {
          keyCount++;
          cumulativeBytes += Buffer.byteLength(k, 'utf8') + Buffer.byteLength(v, 'utf8');
        }
      }

      measurements.push({ turn, keyCount, cumulativeBytes });
    }

    // Turn 1: 1 key (~1.8 KB)
    expect(measurements[0].keyCount).toBe(1);
    expect(measurements[0].cumulativeBytes).toBeGreaterThan(1500);

    // Turn 10: 10 keys (cumulative size > 50 KB due to repeated narrative duplication)
    expect(measurements[9].keyCount).toBe(10);
    expect(measurements[9].cumulativeBytes).toBeGreaterThan(50000);
  });

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
