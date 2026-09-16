/**
 * The migrate contract every persisted store now shares: keep what's in
 * storage, and only fall back to defaults when there was nothing there.
 *
 * This is the honest version of a promise four of these stores used to get
 * wrong in a comment - they claimed a version bump cleared old data, while the
 * code preserved it. These tests pin the behavior the comments now describe,
 * and they pin the fact that no persisted store is left without a migrate,
 * since Zustand drops the whole record on a version mismatch when one is
 * missing.
 */

import { useCharacterStore } from '../../characterStore';
import { useGoalStore } from '../../goalStore';
import { useInventoryStore } from '../../inventoryStore';
import { useJournalStore } from '../../journalStore';
import { useLoreStore } from '../../loreStore';
import { useNarrativeStore } from '../../narrativeStore';
import { useNavigationStore } from '../../navigationStore';
import { useNPCStore } from '../../npcStore';
import { useProviderStore } from '../../providerStore';

type Migrate = (persistedState: unknown, version: number) => unknown;

type PersistedStore = {
  persist: {
    getOptions: () => { migrate?: Migrate };
  };
};

const getOptions = (store: unknown) =>
  (store as unknown as PersistedStore).persist.getOptions();

// One row per persisted store: something a returning player would have in
// storage, and the collection that should come back empty for a fresh browser.
const stores: Array<{
  name: string;
  store: unknown;
  persisted: Record<string, unknown>;
  emptyKey: string;
  empty: unknown;
}> = [
  {
    name: 'characterStore',
    store: useCharacterStore,
    persisted: { characters: { 'char-1': { id: 'char-1' } } },
    emptyKey: 'characters',
    empty: {},
  },
  {
    name: 'goalStore',
    store: useGoalStore,
    persisted: { goals: { 'goal-1': { id: 'goal-1' } } },
    emptyKey: 'goals',
    empty: {},
  },
  {
    name: 'inventoryStore',
    store: useInventoryStore,
    persisted: { items: { 'item-1': { id: 'item-1' } } },
    emptyKey: 'items',
    empty: {},
  },
  {
    name: 'journalStore',
    store: useJournalStore,
    persisted: { entries: { 'entry-1': { id: 'entry-1' } } },
    emptyKey: 'entries',
    empty: {},
  },
  {
    name: 'loreStore',
    store: useLoreStore,
    persisted: { facts: { 'fact-1': { id: 'fact-1' } } },
    emptyKey: 'facts',
    empty: {},
  },
  {
    name: 'narrativeStore',
    store: useNarrativeStore,
    persisted: { segments: { 'segment-1': { id: 'segment-1' } } },
    emptyKey: 'segments',
    empty: {},
  },
  {
    name: 'navigationStore',
    store: useNavigationStore,
    persisted: { history: [{ path: '/play', timestamp: '2026-01-01' }] },
    emptyKey: 'history',
    empty: [],
  },
  {
    name: 'npcStore',
    store: useNPCStore,
    persisted: { npcs: { 'npc-1': { id: 'npc-1' } } },
    emptyKey: 'npcs',
    empty: {},
  },
  {
    name: 'providerStore',
    store: useProviderStore,
    persisted: { providers: { 'provider-1': { id: 'provider-1' } } },
    emptyKey: 'providers',
    empty: {},
  },
];

describe('persisted store migrate contract', () => {
  test.each(stores)('$name has a migrate at all', ({ store }) => {
    expect(getOptions(store).migrate).toBeInstanceOf(Function);
  });

  test.each(stores)(
    '$name hands a returning player their data back untouched',
    ({ store, persisted }) => {
      expect(getOptions(store).migrate?.(persisted, 0)).toBe(persisted);
    }
  );

  test.each(stores)(
    '$name falls back to defaults only when storage was empty',
    ({ store, emptyKey, empty }) => {
      const fromUndefined = getOptions(store).migrate?.(undefined, 0) as Record<string, unknown>;
      const fromNull = getOptions(store).migrate?.(null, 0) as Record<string, unknown>;

      expect(fromUndefined[emptyKey]).toEqual(empty);
      expect(fromNull[emptyKey]).toEqual(empty);
    }
  );
});
