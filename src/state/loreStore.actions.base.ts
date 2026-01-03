import type { LoreFact } from '../types/lore.types';
import type { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { getTimestamp } from '@/lib/utils';
import { createStoreError, type UserFriendlyError } from '@/lib/utils/errorUtils';
import { getInitialState } from './loreStore.state';
import type { SetState, GetState } from './loreStore.actions.types';

export const createLoreBaseActions = (set: SetState, get: GetState) => ({
  create: (factData: Omit<LoreFact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateUniqueId();
    const now = getTimestamp();
    const newFact: LoreFact = {
      ...factData,
      aliases: factData.aliases ?? [],
      id,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      facts: { ...state.facts, [id]: newFact },
      entities: { ...state.entities, [id]: newFact },
      factHistory: {
        ...state.factHistory,
        [id]: { factId: id, versions: [newFact] },
      },
      error: null,
    }));

    return id;
  },

  update: (id: EntityID, updates: Partial<LoreFact>) => {
    const fact = get().facts[id];
    if (!fact) {
      set({
        error: createStoreError(
          'Lore Fact Not Found',
          'The specified lore fact could not be found.'
        ),
      });
      return;
    }

    const updatedFact: LoreFact = {
      ...fact,
      ...updates,
      id,
      createdAt: fact.createdAt,
      updatedAt: getTimestamp(),
    };

    const previousHistory = get().factHistory[id]?.versions ?? [];

    set((state) => ({
      facts: { ...state.facts, [id]: updatedFact },
      entities: { ...state.entities, [id]: updatedFact },
      factHistory: {
        ...state.factHistory,
        [id]: {
          factId: id,
          versions: [...previousHistory, updatedFact],
        },
      },
      error: null,
    }));
  },

  delete: (id: EntityID) => {
    if (!get().facts[id]) return;

    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removedFact, ...remainingFacts } = state.facts;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removedEntity, ...remainingEntities } = state.entities;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removedHistory, ...remainingHistory } = state.factHistory;

      return {
        facts: remainingFacts,
        entities: remainingEntities,
        factHistory: remainingHistory,
        currentEntityId:
          state.currentEntityId === id ? null : state.currentEntityId,
        error: null,
      };
    });
  },

  setCurrent: (id: EntityID | null) => {
    if (id && !get().facts[id]) {
      set({
        error: createStoreError(
          'Lore Fact Not Found',
          'The specified lore fact could not be found.'
        ),
        currentEntityId: null,
      });
      return;
    }
    set({ currentEntityId: id ?? null, error: null });
  },

  getById: (id: EntityID) => get().facts[id],
  getAll: () => Object.values(get().facts),
  reset: () => set(getInitialState()),
  setError: (error: UserFriendlyError | null) => set({ error }),
  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ loading }),
});
