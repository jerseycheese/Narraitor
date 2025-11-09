import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeText, NORM_NAME, NORM_DESC, filterTruthy } from '@/lib/utils';
import { createStoreError } from '@/lib/utils/errorUtils';
import { NPC } from '../types/npc.types';
import { EntityID } from '../types/common.types';
import { createIndexedDBStorage } from './persistence';
import {
  CrudStore,
  createCrudOperations,
  createInitialState,
  createPersistOptions,
} from './createCrudStore';

export interface NPCStore extends CrudStore<NPC> {
  npcs: Record<EntityID, NPC>;
  worldNpcs: Record<EntityID, EntityID[]>;

  createNPC: (npcData: Omit<NPC, 'id' | 'createdAt' | 'updatedAt'> & { id?: EntityID }) => EntityID;
  updateNPC: (npcId: EntityID, updates: Partial<NPC>) => void;
  deleteNPC: (npcId: EntityID) => void;

  getNPCsByWorld: (worldId: EntityID) => NPC[];
  clearWorldNPCs: (worldId: EntityID) => void;
}

// Validation helper
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
      // Initialize state using factory
      ...createInitialState<NPC, NPCStore>({
        domainKey: 'npcs',
        additionalInitialState: {
          worldNpcs: {} as Record<EntityID, EntityID[]>,
        },
      }),

      // Create CRUD operations using factory
      ...createCrudOperations<NPC, NPCStore>({
        entityPrefix: 'npc',
        domainKey: 'npcs',

        // Hook: Validate and normalize before create
        beforeCreate: (data) => {
          validateNPCData(data);
          return {
            ...data,
            name: normalizeText(data.name, NORM_NAME),
            description: normalizeText(data.description, NORM_DESC),
          };
        },

        // Hook: Update worldNpcs index after create
        afterCreate: (npc, _set) => {
          _set((state: NPCStore) => {
            const worldNpcs = state.worldNpcs[npc.worldId] || [];
            return {
              worldNpcs: {
                ...state.worldNpcs,
                [npc.worldId]: [...worldNpcs, npc.id],
              },
            };
          });
        },

        // Hook: Validate and normalize before update
        beforeUpdate: (id, updates, currentNPC) => {
          const normalizedUpdates: Partial<NPC> = { ...updates };

          if (updates.name !== undefined) {
            const normalizedName = normalizeText(updates.name, NORM_NAME);
            if (!normalizedName) {
              throw new Error('NPC name cannot be empty');
            }
            normalizedUpdates.name = normalizedName;
          }

          if (updates.description !== undefined) {
            const normalizedDescription = normalizeText(updates.description, NORM_DESC);
            if (!normalizedDescription) {
              throw new Error('NPC description cannot be empty');
            }
            normalizedUpdates.description = normalizedDescription;
          }

          if (updates.worldId !== undefined && !updates.worldId) {
            throw new Error('World ID is required');
          }

          return normalizedUpdates;
        },

        // Hook: Update worldNpcs index after update if world changed
        afterUpdate: (npc, _set, _get) => {
          const state = _get() as NPCStore;
          const oldNPC = state.entities[npc.id];

          if (oldNPC && oldNPC.worldId !== npc.worldId) {
            _set((s: NPCStore) => {
              const nextWorldNpcs = { ...s.worldNpcs };

              // Remove from old world
              const oldWorldList = nextWorldNpcs[oldNPC.worldId] || [];
              nextWorldNpcs[oldNPC.worldId] = oldWorldList.filter((id) => id !== npc.id);

              // Add to new world
              const newWorldList = nextWorldNpcs[npc.worldId] || [];
              nextWorldNpcs[npc.worldId] = [...newWorldList, npc.id];

              return { worldNpcs: nextWorldNpcs };
            });
          }
        },

        // Hook: Update worldNpcs index after delete
        afterDelete: (id, _set, _get) => {
          const state = _get() as NPCStore;
          const npc = state.entities[id];

          if (npc) {
            _set((s: NPCStore) => {
              const worldNpcs = s.worldNpcs[npc.worldId] || [];
              const updatedWorldNpcs = worldNpcs.filter((npcId) => npcId !== id);

              const nextWorldNpcs = {
                ...s.worldNpcs,
                [npc.worldId]: updatedWorldNpcs,
              };

              if (nextWorldNpcs[npc.worldId].length === 0) {
                delete nextWorldNpcs[npc.worldId];
              }

              return { worldNpcs: nextWorldNpcs };
            });
          }
        },
      })(set, get),

      // Domain-specific aliases
      createNPC: (npcData) => get().create(npcData),
      updateNPC: (npcId, updates) => get().update(npcId, updates),
      deleteNPC: (npcId) => get().delete(npcId),

      getNPCsByWorld: (worldId) => {
        const state = get();
        const npcIds = state.worldNpcs[worldId] || [];
        return npcIds
          .map((id) => state.npcs[id])
          .filter(filterTruthy);
      },

      clearWorldNPCs: (worldId) => {
        const npcIds = get().worldNpcs[worldId] || [];
        npcIds.forEach((npcId) => get().delete(npcId));
      },
    }),

    // Persistence configuration using factory
    {
      ...createPersistOptions<NPCStore>('npc', 'npcs', createIndexedDBStorage(), 1),
      partialize: (state) => ({
        npcs: state.npcs,
        worldNpcs: state.worldNpcs,
      }),
    }
  )
);
