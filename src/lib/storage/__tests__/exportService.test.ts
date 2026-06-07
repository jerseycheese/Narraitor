/**
 * Full-state backup coverage.
 *
 * Guards against the regression where export/import silently dropped player
 * domains. For a no-backend app the export file is the only backup, so every
 * player-content store has to survive the round trip.
 */
import { exportGameState, importFromFile } from '../exportService';
import { useInventoryStore } from '../../../state/inventoryStore';
import { useLoreStore } from '../../../state/loreStore';
import { useGoalStore } from '../../../state/goalStore';
import { useNPCStore } from '../../../state/npcStore';

/* eslint-disable @typescript-eslint/no-explicit-any */

// worldStore is globally mocked in jest.setup with no setState; the import path
// calls setState, so use the real store here (it degrades to memory in jsdom).
jest.unmock('@/state/worldStore');

beforeEach(() => {
  useInventoryStore.setState({ items: {}, entities: {} } as any);
  useLoreStore.setState({ entities: {} } as any);
  useGoalStore.setState({ entities: {} } as any);
  useNPCStore.setState({ entities: {} } as any);
});

describe('exportService full-state coverage', () => {
  it('captures inventory, lore, goal, and npc stores on export', async () => {
    useInventoryStore.setState({ items: { i1: { id: 'i1' } } } as any);
    useGoalStore.setState({ entities: { g1: { id: 'g1' } } } as any);
    useNPCStore.setState({ entities: { n1: { id: 'n1' } } } as any);
    useLoreStore.setState({ entities: { l1: { id: 'l1' } } } as any);

    const result = await exportGameState();
    const data = result.data as any;

    expect(result.success).toBe(true);
    expect(data.inventoryState.items.i1).toEqual({ id: 'i1' });
    expect(data.goalState.entities.g1).toEqual({ id: 'g1' });
    expect(data.npcState.entities.n1).toEqual({ id: 'n1' });
    expect(data.loreState.entities.l1).toEqual({ id: 'l1' });
  });

  it('restores inventory, lore, goal, and npc stores on import', async () => {
    const payload = {
      version: '1.0.0',
      exportedAt: '2026-01-01T00:00:00.000Z',
      worldState: {},
      characterState: {},
      sessionState: {},
      inventoryState: { items: { i9: { id: 'i9' } } },
      loreState: { entities: { l9: { id: 'l9' } } },
      goalState: { entities: { g9: { id: 'g9' } } },
      npcState: { entities: { n9: { id: 'n9' } } },
    };
    // importFromFile only calls file.text(); jsdom's File has no text(), so stub it.
    const fakeFile = { text: async () => JSON.stringify(payload) } as unknown as File;

    const res = await importFromFile(fakeFile);

    expect(res.success).toBe(true);
    expect((useInventoryStore.getState().items as any).i9).toEqual({ id: 'i9' });
    expect((useLoreStore.getState().entities as any).l9).toEqual({ id: 'l9' });
    expect((useGoalStore.getState().entities as any).g9).toEqual({ id: 'g9' });
    expect((useNPCStore.getState().entities as any).n9).toEqual({ id: 'n9' });
  });
});
