import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { World, WorldAttribute, WorldSkill, WorldSettings } from '../types/world.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { ToneSettings } from '../types/tone-settings.types';

/**
 * World store interface with state and actions
 */
export interface WorldStore {
  // State
  worlds: Record<EntityID, World>;
  currentWorldId: EntityID | null;
  error: string | null;
  loading: boolean;

  // Actions
  createWorld: (world: Omit<World, 'id' | 'createdAt' | 'updatedAt'>) => EntityID;
  updateWorld: (id: EntityID, updates: Partial<World>) => void;
  deleteWorld: (id: EntityID) => void;
  setCurrentWorld: (id: EntityID) => void;
  fetchWorlds: () => Promise<void>; // Add fetchWorlds action
  
  // Attribute management
  addAttribute: (worldId: EntityID, attribute: Omit<WorldAttribute, 'id' | 'worldId'>) => void;
  updateAttribute: (worldId: EntityID, attributeId: EntityID, updates: Partial<WorldAttribute>) => void;
  removeAttribute: (worldId: EntityID, attributeId: EntityID) => void;
  
  // Skill management
  addSkill: (worldId: EntityID, skill: Omit<WorldSkill, 'id' | 'worldId'>) => void;
  updateSkill: (worldId: EntityID, skillId: EntityID, updates: Partial<WorldSkill>) => void;
  removeSkill: (worldId: EntityID, skillId: EntityID) => void;
  
  // Settings management
  updateSettings: (worldId: EntityID, settings: Partial<WorldSettings>) => void;
  
  // Tone settings management
  updateToneSettings: (worldId: EntityID, toneSettings: Partial<ToneSettings>) => void;
  
  // State management
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state
const initialState = {
  worlds: {},
  currentWorldId: null,
  error: null,
  loading: false,
};

// World Store implementation with persistence
export const useWorldStore = create<WorldStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Create world
      createWorld: (worldData) => {
        if (!worldData.name || worldData.name.trim() === '') {
          throw new Error('World name is required');
        }

        const worldId = generateUniqueId('world');
        const now = new Date().toISOString();
        
        const newWorld: World = {
          ...worldData,
          id: worldId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          worlds: {
            ...state.worlds,
            [worldId]: newWorld,
          },
        }));

        return worldId;
      },

      // Update world
      updateWorld: (id, updates) => set((state) => {
        if (!state.worlds[id]) {
          return { error: 'World not found' };
        }

        const updatedWorld: World = {
          ...state.worlds[id],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        return {
          worlds: {
            ...state.worlds,
            [id]: updatedWorld,
          },
          error: null,
        };
      }),

      // Delete world
      deleteWorld: (id) => set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _deletedWorld, ...remainingWorlds } = state.worlds;
        
        return {
          worlds: remainingWorlds,
          currentWorldId: state.currentWorldId === id ? null : state.currentWorldId,
        };
      }),

      // Set current world
      setCurrentWorld: (id) => set((state) => {
        if (!state.worlds[id]) {
          return { 
            error: 'World not found',
            currentWorldId: null,
          };
        }

        return {
          currentWorldId: id,
          error: null,
        };
      }),

      // Add attribute
      addAttribute: (worldId, attributeData) => set((state) => {
        const world = state.worlds[worldId];
        if (!world) {
          return { error: 'World not found' };
        }

        if (world.attributes.length >= world.settings.maxAttributes) {
          return { error: 'Maximum attributes limit reached' };
        }

        const attributeId = generateUniqueId('attr');
        const newAttribute: WorldAttribute = {
          ...attributeData,
          id: attributeId,
          worldId,
        };

        const updatedWorld: World = {
          ...world,
          attributes: [...world.attributes, newAttribute],
          updatedAt: new Date().toISOString(),
        };

        return {
          worlds: {
            ...state.worlds,
            [worldId]: updatedWorld,
          },
          error: null,
        };
      }),

      // Update attribute
      updateAttribute: (worldId, attributeId, updates) => set((state) => {
        const world = state.worlds[worldId];
        if (!world) {
          return { error: 'World not found' };
        }

        const updatedAttributes = world.attributes.map((attr) =>
          attr.id === attributeId ? { ...attr, ...updates } : attr
        );

        const updatedWorld: World = {
          ...world,
          attributes: updatedAttributes,
          updatedAt: new Date().toISOString(),
        };

        return {
          worlds: {
            ...state.worlds,
            [worldId]: updatedWorld,
          },
          error: null,
        };
      }),

      // Remove attribute
      removeAttribute: (worldId, attributeId) => set((state) => {
        const world = state.worlds[worldId];
        if (!world) {
          return { error: 'World not found' };
        }

        const filteredAttributes = world.attributes.filter(
          (attr) => attr.id !== attributeId
        );

        const updatedWorld: World = {
          ...world,
          attributes: filteredAttributes,
          updatedAt: new Date().toISOString(),
        };

        return {
          worlds: {
            ...state.worlds,
            [worldId]: updatedWorld,
          },
          error: null,
        };
      }),

      // Add skill
      addSkill: (worldId, skillData) => set((state) => {
        const world = state.worlds[worldId];
        if (!world) {
          return { error: 'World not found' };
        }

        if (world.skills.length >= world.settings.maxSkills) {
          return { error: 'Maximum skills limit reached' };
        }

        const skillId = generateUniqueId('skill');
        const newSkill: WorldSkill = {
          ...skillData,
          id: skillId,
          worldId,
        };

        const updatedWorld: World = {
          ...world,
          skills: [...world.skills, newSkill],
          updatedAt: new Date().toISOString(),
        };

        return {
          worlds: {
            ...state.worlds,
            [worldId]: updatedWorld,
          },
          error: null,
        };
      }),

      // Update skill
      updateSkill: (worldId, skillId, updates) => set((state) => {
        const world = state.worlds[worldId];
        if (!world) {
          return { error: 'World not found' };
        }

        const updatedSkills = world.skills.map((skill) =>
          skill.id === skillId ? { ...skill, ...updates } : skill
        );

        const updatedWorld: World = {
          ...world,
          skills: updatedSkills,
          updatedAt: new Date().toISOString(),
        };

        return {
          worlds: {
            ...state.worlds,
            [worldId]: updatedWorld,
          },
          error: null,
        };
      }),

      // Remove skill
      removeSkill: (worldId, skillId) => set((state) => {
        const world = state.worlds[worldId];
        if (!world) {
          return { error: 'World not found' };
        }

        const filteredSkills = world.skills.filter(
          (skill) => skill.id !== skillId
        );

        const updatedWorld: World = {
          ...world,
          skills: filteredSkills,
          updatedAt: new Date().toISOString(),
        };

        return {
          worlds: {
            ...state.worlds,
            [worldId]: updatedWorld,
          },
          error: null,
        };
      }),

      // Update settings
      updateSettings: (worldId, settings) => set((state) => {
        const world = state.worlds[worldId];
        if (!world) {
          return { error: 'World not found' };
        }

        const updatedWorld: World = {
          ...world,
          settings: {
            ...world.settings,
            ...settings,
          },
          updatedAt: new Date().toISOString(),
        };

        return {
          worlds: {
            ...state.worlds,
            [worldId]: updatedWorld,
          },
          error: null,
        };
      }),

      // Update tone settings
      updateToneSettings: (worldId, toneSettings) => set((state) => {
        const world = state.worlds[worldId];
        if (!world) {
          return { error: 'World not found' };
        }

        const updatedWorld: World = {
          ...world,
          toneSettings: {
            ...world.toneSettings,
            ...toneSettings,
          },
          updatedAt: new Date().toISOString(),
        };

        return {
          worlds: {
            ...state.worlds,
            [worldId]: updatedWorld,
          },
          error: null,
        };
      }),

      // State management actions
      reset: () => set(() => initialState),
      setError: (error) => set(() => ({ error })),
      clearError: () => set(() => ({ error: null })),
      setLoading: (loading) => set(() => ({ loading })),

      // Fetch worlds action - loads from persisted state
      fetchWorlds: async () => {
        set({ loading: true, error: null });
        try {
          // In this architecture, worlds are automatically loaded from IndexedDB
          // via Zustand persistence, so we just need to ensure the state is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          set({ loading: false });
        } catch (error) {
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch worlds'
          });
        }
      },
    }),
    {
      name: 'narraitor-world-store',
      storage: createIndexedDBStorage(),
      version: 1,
      // Migration strategy for future schema updates
      // Current implementation is minimal for MVP but will need expansion
      // for handling complex migrations in future versions:
      // - Add field transformations for new/changed fields
      // - Add state structure upgrades between versions
      // - Add validation of migrated data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      migrate: (persistedState: unknown, version: number) => {
        // Simple migration for MVP - just return the state as WorldState
        return persistedState as WorldStore;
      }
    }
  )
);
