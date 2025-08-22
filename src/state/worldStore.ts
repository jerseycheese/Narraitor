import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { World, WorldAttribute, WorldSkill, WorldSettings } from '../types/world.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { ToneSettings, DEFAULT_TONE_SETTINGS } from '../types/tone-settings.types';
import { safeTrim } from '@/lib/utils';
import { normalizeText } from '../lib/utils/textNormalization';
import { validateWorld } from '../types/type-guards';

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
  
  // Debug method
  testPersistence: () => void;
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
        console.log('[WorldStore] createWorld called with:', worldData);
        
        if (!worldData.name || safeTrim(worldData.name) === '') {
          throw new Error('World name is required');
        }

        const worldId = generateUniqueId('world');
        const now = new Date().toISOString();
        
        // Normalize text fields for consistent storage
        const newWorld: World = {
          ...worldData,
          name: normalizeText(worldData.name, {
            normalizeWhitespace: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: false
          }),
          description: normalizeText(worldData.description, {
            normalizeWhitespace: true,
            normalizeLineEndings: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: true
          }),
          id: worldId,
          createdAt: now,
          updatedAt: now,
        };

        console.log('[WorldStore] Creating new world:', newWorld);

        set((state) => {
          const newState = {
            worlds: {
              ...state.worlds,
              [worldId]: newWorld,
            },
          };
          console.log('[WorldStore] Updated state after createWorld:', newState);
          return newState;
        });

        console.log('[WorldStore] createWorld completed, returning ID:', worldId);
        return worldId;
      },

      // Update world
      updateWorld: (id, updates) => set((state) => {
        if (!state.worlds[id]) {
          return { error: 'World not found' };
        }

        // Normalize text fields in updates
        const normalizedUpdates = { ...updates };
        if (updates.name) {
          normalizedUpdates.name = normalizeText(updates.name, {
            normalizeWhitespace: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: false
          });
        }
        if (updates.description) {
          normalizedUpdates.description = normalizeText(updates.description, {
            normalizeWhitespace: true,
            normalizeLineEndings: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: true
          });
        }

        const updatedWorld: World = {
          ...state.worlds[id],
          ...normalizedUpdates,
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

        if ((world.attributes?.length || 0) >= (world.settings?.maxAttributes || 0)) {
          return { error: 'Maximum attributes limit reached' };
        }

        const attributeId = generateUniqueId('attr');
        const newAttribute: WorldAttribute = {
          ...attributeData,
          name: normalizeText(attributeData.name, {
            normalizeWhitespace: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: false
          }),
          description: normalizeText(attributeData.description, {
            normalizeWhitespace: true,
            normalizeLineEndings: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: true
          }),
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

        const updatedAttributes = world.attributes?.map((attr) =>
          attr.id === attributeId ? { ...attr, ...updates } : attr
        ) || [];

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

        const filteredAttributes = world.attributes?.filter(
          (attr) => attr.id !== attributeId
        ) || [];

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

        if ((world.skills?.length || 0) >= (world.settings?.maxSkills || 0)) {
          return { error: 'Maximum skills limit reached' };
        }

        const skillId = generateUniqueId('skill');
        const newSkill: WorldSkill = {
          ...skillData,
          name: normalizeText(skillData.name, {
            normalizeWhitespace: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: false
          }),
          description: normalizeText(skillData.description, {
            normalizeWhitespace: true,
            normalizeLineEndings: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: true
          }),
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

        const updatedSkills = world.skills?.map((skill) =>
          skill.id === skillId ? { ...skill, ...updates } : skill
        ) || [];

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

        const filteredSkills = world.skills?.filter(
          (skill) => skill.id !== skillId
        ) || [];

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

        const currentToneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
        const updatedWorld: World = {
          ...world,
          toneSettings: {
            ...currentToneSettings,
            ...toneSettings,
          } as ToneSettings,
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
      setError: (error) => {
        console.log('[WorldStore] setError called with:', error);
        set(() => ({ error }));
      },
      clearError: () => set(() => ({ error: null })),
      setLoading: (loading) => set(() => ({ loading })),
      
      // Debug method to test persistence
      testPersistence: () => {
        console.log('[WorldStore] testPersistence called - setting error to test persistence');
        set((state) => ({ 
          ...state, 
          error: 'Test persistence: ' + new Date().toISOString() 
        }));
      },

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
      onRehydrateStorage: (state) => {
        console.log('[WorldStore] Starting rehydration, current state:', state);
        return (state, error) => {
          if (error) {
            console.error('[WorldStore] Rehydration failed:', error);
          } else {
            console.log('[WorldStore] Rehydration successful, final state:', state);
          }
        };
      },
      // Migration strategy for future schema updates
      // Current implementation is minimal for MVP but will need expansion
      // for handling complex migrations in future versions:
      // - Add field transformations for new/changed fields
      // - Add state structure upgrades between versions
      // - Add validation of migrated data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      migrate: (persistedState: unknown, version: number) => {
        console.log('[WorldStore] Migration started with state:', persistedState);
        
        // Validate persisted worlds before restoring
        if (persistedState && typeof persistedState === 'object' && 'worlds' in persistedState) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const state = persistedState as any;
          console.log('[WorldStore] Found state with worlds:', Object.keys(state.worlds || {}));
          
          if (state.worlds && typeof state.worlds === 'object') {
            // Validate each world in storage
            const invalidWorlds: Record<string, unknown> = {};
            for (const [worldId, world] of Object.entries(state.worlds)) {
              console.log(`[WorldStore] Validating world ${worldId}:`, world);
              const validation = validateWorld(world);
              if (!validation.valid) {
                console.error(`[WorldStore] Invalid world data in storage for ${worldId}:`, validation.errors);
                console.error(`[WorldStore] World data:`, world);
                // Backup invalid world before removal
                invalidWorlds[worldId] = world;
                // Remove invalid world to prevent crashes
                delete state.worlds[worldId];
              } else {
                console.log(`[WorldStore] World ${worldId} passed validation`);
              }
            }
            
            // If any invalid worlds, backup to localStorage and set error state
            if (Object.keys(invalidWorlds).length > 0) {
              console.error(`[WorldStore] Removed ${Object.keys(invalidWorlds).length} invalid worlds:`, invalidWorlds);
              try {
                if (typeof window !== 'undefined' && window.localStorage) {
                  window.localStorage.setItem(
                    'narraitor-world-store-backup-invalid-worlds',
                    JSON.stringify(invalidWorlds)
                  );
                }
              } catch (e) {
                console.error('Failed to backup invalid worlds:', e);
              }
              // Set error state to notify user
              state.error = `${Object.keys(invalidWorlds).length} invalid world(s) were found and removed to prevent crashes. A backup has been saved. Please check the console for details.`;
            }
          }
        } else {
          console.log('[WorldStore] No persisted state or worlds found, starting fresh');
        }
        
        console.log('[WorldStore] Migration complete, returning state:', persistedState);
        return persistedState as WorldStore;
      }
    }
  )
);
