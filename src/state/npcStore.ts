import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeText, NORM_NAME, NORM_DESC, getTimestamp } from '@/lib/utils';
import { UserFriendlyError, ErrorType, createStoreError } from '@/lib/utils/errorUtils';
import { NPC } from '../types/npc.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { storeEvents, StoreEventTypes, type WorldDeletedEvent } from '@/lib/state/storePubSub';
import { CrudStore } from './crudStore.types';
import { shouldExposeStoreOnWindow } from '@/lib/utils/shouldExposeStoreOnWindow';

export interface NPCStore extends CrudStore<NPC> {
  npcs: Record<EntityID, NPC>;
  worldNpcs: Record<EntityID, EntityID[]>;

  createNPC: (npcData: Omit<NPC, 'id' | 'createdAt' | 'updatedAt'> & { id?: EntityID }) => EntityID;
  updateNPC: (npcId: EntityID, updates: Partial<NPC>) => void;
  deleteNPC: (npcId: EntityID) => void;

  getNPCsByWorld: (worldId: EntityID) => NPC[];
  clearWorldNPCs: (worldId: EntityID) => void;
}

const getInitialState = () => ({
  npcs: {} as Record<EntityID, NPC>,
  entities: {} as Record<EntityID, NPC>,
  worldNpcs: {} as Record<EntityID, EntityID[]>,
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
});

const validateNPCData = (data: Partial<NPC>): void => {
  const normalizedName = normalizeText(data.name || '', NORM_NAME);
  if (!normalizedName) {
    throw new Error('NPC name is required');
  }
  if (!data.worldId) {
    throw new Error('World ID is required');
  }
  const normalizedDescription = normalizeText(data.description || '', NORM_DESC);
  if (!normalizedDescription) {
    throw new Error('NPC description is required');
  }
};

export const useNPCStore = create<NPCStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      create: (npcDataParam) => {
        const npcData = npcDataParam as Omit<NPC, 'createdAt' | 'updatedAt'> & {
          id?: EntityID;
        };

        validateNPCData(npcData);

        const npcId = npcData.id || generateUniqueId('npc');
        const now = getTimestamp();

        const normalizedName = normalizeText(npcData.name, NORM_NAME);
        const normalizedDescription = normalizeText(npcData.description, NORM_DESC);

        const newNPC: NPC = {
          ...npcData,
          id: npcId,
          name: normalizedName,
          description: normalizedDescription,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          const worldNpcs = state.worldNpcs[newNPC.worldId] || [];
          const updatedNpcs = { ...state.npcs, [npcId]: newNPC };

          return {
            npcs: updatedNpcs,
            entities: { ...state.entities, [npcId]: newNPC },
            worldNpcs: {
              ...state.worldNpcs,
              [newNPC.worldId]: [...worldNpcs, npcId],
            },
            error: null,
          };
        });

        return npcId;
      },

      update: (npcId, updates) => {
        const existingNPC = get().npcs[npcId];
        if (!existingNPC) {
          set({ error: createStoreError('NPC Not Found', 'The specified NPC could not be found.') });
          return;
        }

        const normalizedUpdates: Partial<NPC> = { ...updates };

        if (updates.name !== undefined) {
          const normalizedName = normalizeText(updates.name, NORM_NAME);
          if (!normalizedName) {
            set({ error: createStoreError('Invalid Name', 'NPC name cannot be empty.', ErrorType.VALIDATION) });
            return;
          }
          normalizedUpdates.name = normalizedName;
        }

        if (updates.description !== undefined) {
          const normalizedDescription = normalizeText(updates.description, NORM_DESC);
          if (!normalizedDescription) {
            set({ error: createStoreError('Invalid Description', 'NPC description cannot be empty.', ErrorType.VALIDATION) });
            return;
          }
          normalizedUpdates.description = normalizedDescription;
        }

        if (updates.worldId !== undefined && !updates.worldId) {
          set({ error: createStoreError('Invalid World ID', 'World ID is required.', ErrorType.VALIDATION) });
          return;
        }

        const now = getTimestamp();
        const previousWorldId = existingNPC.worldId;
        const nextWorldId = updates.worldId ?? previousWorldId;

        const updatedNPC: NPC = {
          ...existingNPC,
          ...normalizedUpdates,
          worldId: nextWorldId,
          updatedAt: now,
        };

        set((state) => {
          const updatedNpcs = { ...state.npcs, [npcId]: updatedNPC };
          const nextEntities = { ...state.entities, [npcId]: updatedNPC };
          const nextWorldNpcs = { ...state.worldNpcs };

          if (previousWorldId !== nextWorldId) {
            const previousList = nextWorldNpcs[previousWorldId] || [];
            nextWorldNpcs[previousWorldId] = previousList.filter((id) => id !== npcId);

            const nextList = nextWorldNpcs[nextWorldId] || [];
            nextWorldNpcs[nextWorldId] = [...nextList, npcId];
          }

          return {
            npcs: updatedNpcs,
            entities: nextEntities,
            worldNpcs: nextWorldNpcs,
            error: null,
          };
        });
      },

      delete: (npcId) => {
        const existingNPC = get().npcs[npcId];
        if (!existingNPC) {
          return;
        }

        set((state) => {
          const { [npcId]: _removedNPC, ...remainingNpcs } = state.npcs;
          const { [npcId]: _removedEntity, ...remainingEntities } = state.entities;

          const worldNpcs = state.worldNpcs[existingNPC.worldId] || [];
          const updatedWorldNpcs = worldNpcs.filter((id) => id !== npcId);

          const nextWorldNpcs = {
            ...state.worldNpcs,
            [existingNPC.worldId]: updatedWorldNpcs,
          };

          if (nextWorldNpcs[existingNPC.worldId].length === 0) {
            delete nextWorldNpcs[existingNPC.worldId];
          }

          return {
            npcs: remainingNpcs,
            entities: remainingEntities,
            worldNpcs: nextWorldNpcs,
            currentEntityId: state.currentEntityId === npcId ? null : state.currentEntityId,
            error: null,
          };
        });
      },

      setCurrent: (id) => {
        if (id && !get().npcs[id]) {
          set({
            error: createStoreError('NPC Not Found', 'The specified NPC could not be found.'),
            currentEntityId: null,
          });
          return;
        }

        set({ currentEntityId: id ?? null, error: null });
      },

      getById: (id) => get().npcs[id],
      getAll: () => Object.values(get().npcs),

      reset: () => set(getInitialState()),

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ loading }),

      createNPC: (npcData) => get().create(npcData),
      updateNPC: (npcId, updates) => get().update(npcId, updates),
      deleteNPC: (npcId) => get().delete(npcId),

      getNPCsByWorld: (worldId) => {
        const state = get();
        const npcIds = state.worldNpcs[worldId] || [];
        return npcIds
          .map((id) => state.npcs[id])
          .filter((npc): npc is NPC => Boolean(npc));
      },

      clearWorldNPCs: (worldId) => {
        const npcIds = get().worldNpcs[worldId] || [];
        npcIds.forEach((npcId) => get().delete(npcId));
      },
    }),
    {
      name: 'narraitor-npc-store',
      storage: createIndexedDBStorage(),
      version: 2, // Incremented to clear old migrated data
      partialize: (state) => ({
        npcs: state.npcs,
        worldNpcs: state.worldNpcs,
      }),
      migrate: (persistedState) => persistedState || getInitialState(), // Preserve data, only clear if null
    }
  )
);

// Expose store globally in development to support test data seeding
// and debugging via window.useNPCStore in dev tools.
if (typeof window !== 'undefined' && shouldExposeStoreOnWindow()) {
  window.useNPCStore = useNPCStore;
}

// Cascade cleanup: deleting a world orphans its NPCs otherwise (mirrors
// characterStore's WORLD_DELETED subscription). Plain subscribe — the handler
// only clears data, so a double-fire is a no-op.
storeEvents.subscribe<WorldDeletedEvent>(
  StoreEventTypes.WORLD_DELETED,
  ({ worldId }) => {
    useNPCStore.getState().clearWorldNPCs(worldId);
  }
);
