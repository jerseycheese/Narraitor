import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { World, WorldAttribute, WorldSkill, WorldSettings } from '../types/world.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { ToneSettings, DEFAULT_TONE_SETTINGS } from '../types/tone-settings.types';
import { safeTrim, normalizeText, NORM_NAME, NORM_DESC, getTimestamp } from '@/lib/utils';
import { validateWorld } from '../types/type-guards';
import { CrudStore } from './createCrudStore';
import { UserFriendlyError, ErrorType } from '@/lib/utils/errorUtils';

/**
 * World store interface with state and actions
 */
export interface WorldStore extends CrudStore<World> {
  // Domain-specific method aliases
  createWorld: (world: Omit<World, 'id' | 'createdAt' | 'updatedAt'>) => EntityID;
  updateWorld: (id: EntityID, updates: Partial<Omit<World, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteWorld: (id: EntityID) => void;
  setCurrentWorld: (id: EntityID | null) => void;
  fetchWorlds: () => Promise<void>;

  // Rename for domain clarity
  worlds: Record<EntityID, World>;
  currentWorldId: EntityID | null;

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
}

// World Store implementation with persistence
export const useWorldStore = create<WorldStore>()(
  persist(
    (set, get) => {
      // Helper to create UserFriendlyError
      const createValidationError = (title: string, message: string): UserFriendlyError => ({
        title,
        message,
        retryable: false,
        type: ErrorType.VALIDATION,
      });

      return {
        // State
        worlds: {},
        entities: {},
        currentWorldId: null,
        currentEntityId: null,
        error: null,
        loading: false,

        // CRUD Operations
        create: (worldData) => {
          // Validate
          if (!worldData.name || safeTrim(worldData.name) === '') {
            throw new Error('World name is required');
          }

          const worldId = generateUniqueId('world');
          const now = getTimestamp();

          // Normalize and create
          const newWorld: World = {
            ...worldData,
            name: normalizeText(worldData.name, NORM_NAME),
            description: normalizeText(worldData.description, NORM_DESC),
            id: worldId,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            worlds: {
              ...state.worlds,
              [worldId]: newWorld,
            },
            entities: {
              ...state.entities,
              [worldId]: newWorld,
            },
            error: null,
          }));

          return worldId;
        },

        update: (id, updates) => {
          const world = get().worlds[id];
          if (!world) {
            set({ error: createValidationError('World Not Found', 'The specified world could not be found') });
            return;
          }

          // Normalize text fields in updates
          const normalized = { ...updates };
          if (updates.name) {
            normalized.name = normalizeText(updates.name, NORM_NAME);
          }
          if (updates.description) {
            normalized.description = normalizeText(updates.description, NORM_DESC);
          }

          const updatedWorld = {
            ...world,
            ...normalized,
            updatedAt: getTimestamp(),
          };

          set((state) => ({
            worlds: {
              ...state.worlds,
              [id]: updatedWorld,
            },
            entities: {
              ...state.entities,
              [id]: updatedWorld,
            },
            error: null,
          }));
        },

        delete: (id) => {
          const world = get().worlds[id];
          if (!world) return;

          // Delete all characters in the world
          try {
            const { useCharacterStore } = eval('require("./characterStore")');
            const characterStore = useCharacterStore.getState();
            characterStore.deleteCharactersInWorld(id);
          } catch {
            // Handle import errors silently (e.g., in test environments)
          }

          set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _removedWorld, ...remainingWorlds } = state.worlds;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _removedEntity, ...remainingEntities } = state.entities;
            const currentIsDeleted = state.currentEntityId === id || state.currentWorldId === id;
            return {
              worlds: remainingWorlds,
              entities: remainingEntities,
              currentEntityId: currentIsDeleted ? null : state.currentEntityId,
              currentWorldId: currentIsDeleted ? null : state.currentWorldId,
              error: null,
            };
          });
        },

        setCurrent: (id) => {
          if (id && !get().worlds[id]) {
            set({
              error: createValidationError('World Not Found', 'The specified world could not be found'),
              currentEntityId: null,
              currentWorldId: null,
            });
            return;
          }
          set({ currentEntityId: id, currentWorldId: id, error: null });
        },

        getById: (id) => get().worlds[id],
        getAll: () => Object.values(get().worlds),
        reset: () => set({ worlds: {}, entities: {}, currentEntityId: null, currentWorldId: null, error: null, loading: false }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ loading }),

        // Domain-specific method aliases
        createWorld: (worldData) => get().create(worldData),
        updateWorld: (id, updates) => get().update(id, updates),
        deleteWorld: (id) => get().delete(id),
        setCurrentWorld: (id) => get().setCurrent(id),

        // Add attribute
        addAttribute: (worldId, attributeData) => {
          const world = get().worlds[worldId];
          if (!world) {
            set({ error: createValidationError('World Not Found', 'The specified world could not be found') });
            return;
          }

          if ((world.attributes?.length || 0) >= (world.settings?.maxAttributes || 0)) {
            set({ error: createValidationError('Maximum Attributes Reached', 'This world has reached its maximum number of attributes') });
            return;
          }

          const attributeId = generateUniqueId('attr');
          const newAttribute: WorldAttribute = {
            ...attributeData,
            name: normalizeText(attributeData.name, NORM_NAME),
            description: normalizeText(attributeData.description, NORM_DESC),
            id: attributeId,
            worldId,
          };

          get().update(worldId, {
            ...world,
            attributes: [...world.attributes, newAttribute],
          });
        },

        // Update attribute
        updateAttribute: (worldId, attributeId, updates) => {
          const world = get().worlds[worldId];
          if (!world) {
            set({ error: createValidationError('World Not Found', 'The specified world could not be found') });
            return;
          }

          const updatedAttributes = world.attributes?.map((attr) =>
            attr.id === attributeId ? { ...attr, ...updates } : attr
          ) || [];

          get().update(worldId, {
            ...world,
            attributes: updatedAttributes,
          });
        },

        // Remove attribute
        removeAttribute: (worldId, attributeId) => {
          const world = get().worlds[worldId];
          if (!world) {
            set({ error: createValidationError('World Not Found', 'The specified world could not be found') });
            return;
          }

          const filteredAttributes = world.attributes?.filter(
            (attr) => attr.id !== attributeId
          ) || [];

          get().update(worldId, {
            ...world,
            attributes: filteredAttributes,
          });
        },

        // Add skill
        addSkill: (worldId, skillData) => {
          const world = get().worlds[worldId];
          if (!world) {
            set({ error: createValidationError('World Not Found', 'The specified world could not be found') });
            return;
          }

          if ((world.skills?.length || 0) >= (world.settings?.maxSkills || 0)) {
            set({ error: createValidationError('Maximum Skills Reached', 'This world has reached its maximum number of skills') });
            return;
          }

          const skillId = generateUniqueId('skill');
          const newSkill: WorldSkill = {
            ...skillData,
            name: normalizeText(skillData.name, NORM_NAME),
            description: normalizeText(skillData.description, NORM_DESC),
            id: skillId,
            worldId,
          };

          get().update(worldId, {
            ...world,
            skills: [...world.skills, newSkill],
          });
        },

        // Update skill
        updateSkill: (worldId, skillId, updates) => {
          const world = get().worlds[worldId];
          if (!world) {
            set({ error: createValidationError('World Not Found', 'The specified world could not be found') });
            return;
          }

          const updatedSkills = world.skills?.map((skill) =>
            skill.id === skillId ? { ...skill, ...updates } : skill
          ) || [];

          get().update(worldId, {
            ...world,
            skills: updatedSkills,
          });
        },

        // Remove skill
        removeSkill: (worldId, skillId) => {
          const world = get().worlds[worldId];
          if (!world) {
            set({ error: createValidationError('World Not Found', 'The specified world could not be found') });
            return;
          }

          const filteredSkills = world.skills?.filter(
            (skill) => skill.id !== skillId
          ) || [];

          get().update(worldId, {
            ...world,
            skills: filteredSkills,
          });
        },

        // Update settings
        updateSettings: (worldId, settings) => {
          const world = get().worlds[worldId];
          if (!world) {
            set({ error: createValidationError('World Not Found', 'The specified world could not be found') });
            return;
          }

          get().update(worldId, {
            ...world,
            settings: {
              ...world.settings,
              ...settings,
            },
          });
        },

        // Update tone settings
        updateToneSettings: (worldId, toneSettings) => {
          const world = get().worlds[worldId];
          if (!world) {
            set({ error: createValidationError('World Not Found', 'The specified world could not be found') });
            return;
          }

          const currentToneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
          get().update(worldId, {
            ...world,
            toneSettings: {
              ...currentToneSettings,
              ...toneSettings,
            } as ToneSettings,
          });
        },

        // Fetch worlds action - loads from persisted state
        fetchWorlds: async () => {
          get().setLoading(true);
          get().clearError();
          try {
            // In this architecture, worlds are automatically loaded from IndexedDB
            // via Zustand persistence, so we just need to ensure the state is ready
            await new Promise(resolve => setTimeout(resolve, 100));
            get().setLoading(false);
          } catch (error) {
            get().setLoading(false);
            get().setError({
              title: 'Failed to Load Worlds',
              message: error instanceof Error ? error.message : 'Failed to fetch worlds',
              retryable: true,
              type: ErrorType.SERVICE,
            });
          }
        },
      };
    },
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
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState as WorldStore;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persistedState as any;

        // Ensure entities matches worlds
        if (state.worlds && !state.entities) {
          state.entities = { ...state.worlds };
        }

        // Validate persisted worlds before restoring
        if (state.worlds && typeof state.worlds === 'object') {
          const invalidWorlds: Record<string, unknown> = {};
          for (const [worldId, world] of Object.entries(state.worlds)) {
            const validation = validateWorld(world);
            if (!validation.valid) {
              console.warn(`Invalid world data in storage for ${worldId}:`, validation.errors[0]);
              // Backup invalid world before removal
              invalidWorlds[worldId] = world;
              // Remove invalid world to prevent crashes
              delete state.worlds[worldId];
            }
          }

          // Sync entities with worlds
          state.entities = { ...state.worlds };

          if (typeof state.currentWorldId === 'string' && !state.currentEntityId) {
            state.currentEntityId = state.currentWorldId;
          }

          if (typeof state.currentEntityId === 'string' && !state.currentWorldId) {
            state.currentWorldId = state.currentEntityId;
          }

          // If any invalid worlds, backup to localStorage and set error state
          if (Object.keys(invalidWorlds).length > 0) {
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
            state.error = {
              title: 'Invalid Worlds Removed',
              message: `${Object.keys(invalidWorlds).length} invalid world(s) were found and removed to prevent crashes. A backup has been saved. Please check the console for details.`,
              retryable: false,
              type: ErrorType.VALIDATION,
            };
          }
        }

        return persistedState as WorldStore;
      }
    }
  )
);

// Expose store globally in development to support test data seeding
// and debugging via window.useWorldStore in dev tools.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).useWorldStore = useWorldStore;
}
