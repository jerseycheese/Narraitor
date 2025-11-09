import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { World, WorldAttribute, WorldSkill, WorldSettings } from '../types/world.types';
import { EntityID } from '../types/common.types';
import { createIndexedDBStorage } from './persistence';
import { ToneSettings, DEFAULT_TONE_SETTINGS } from '../types/tone-settings.types';
import { safeTrim, normalizeText, NORM_NAME, NORM_DESC } from '@/lib/utils';
import { validateWorld } from '../types/type-guards';
import {
  CrudStore,
  createCrudOperations,
  createInitialState,
  createPersistOptions,
} from './createCrudStore';
import { createStoreError, ErrorType, createNotFoundError } from '@/lib/utils/errorUtils';
import { WorldState, WorldStateUpdate, createEmptyWorldState } from '../types/world-state.types';
import { applyWorldStateUpdate, getActiveWorldState, mergeState } from '@/lib/world/worldStateManager';
import Logger from '@/lib/utils/logger';

const logger = new Logger('WorldStore');
let sessionStoreModule: typeof import('./sessionStore') | null = null;

const resolveSessionStatus = (sessionId: EntityID) => {
  try {
    if (!sessionStoreModule) {
      sessionStoreModule = eval('require("./sessionStore")');
    }
    const { useSessionStore } = sessionStoreModule!;
    return useSessionStore.getState().getSessionLifecycle(sessionId)?.status;
  } catch (error) {
    logger.warn('Failed to resolve session status', { sessionId, error });
    return undefined;
  }
};

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
  syncDerivedState: () => void;

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

  // World state management
  worldStates: Record<EntityID, WorldState>;
  initializeWorldState: (worldId: EntityID) => void;
  updateWorldState: (worldId: EntityID, stateUpdate: WorldStateUpdate, sessionId: EntityID) => void;
  mergeWorldState: (incomingState: WorldState) => void;
  getWorldState: (worldId: EntityID, options?: { includeEndedSessions?: boolean }) => WorldState;
  getRawWorldState: (worldId: EntityID) => WorldState | undefined;
}

// World Store implementation with persistence
export const useWorldStore = create<WorldStore>()(
  persist(
    (set, get) => ({
      // Initialize state using factory
      ...createInitialState<World, WorldStore>({
        domainKey: 'worlds',
        currentIdKey: 'currentWorldId',
        additionalInitialState: {
          worldStates: {} as Record<EntityID, WorldState>,
        },
      }),

      // Create CRUD operations using factory
      ...createCrudOperations<World, WorldStore>({
        entityPrefix: 'world',
        domainKey: 'worlds',
        currentIdKey: 'currentWorldId',

        // Hook: Validate and normalize before create
        beforeCreate: (data) => {
          if (!data.name || safeTrim(data.name) === '') {
            throw new Error('World name is required');
          }
          return {
            ...data,
            name: normalizeText(data.name, NORM_NAME),
            description: normalizeText(data.description, NORM_DESC),
          };
        },

        // Hook: Initialize worldState after create
        afterCreate: (world, _set) => {
          _set((state: WorldStore) => ({
            worldStates: {
              ...state.worldStates,
              [world.id]: createEmptyWorldState(world.id),
            },
          }));
        },

        // Hook: Normalize text fields before update
        beforeUpdate: (id, updates) => {
          const normalized = { ...updates };
          if (updates.name) {
            normalized.name = normalizeText(updates.name, NORM_NAME);
          }
          if (updates.description) {
            normalized.description = normalizeText(updates.description, NORM_DESC);
          }
          return normalized;
        },

        // Hook: Cascade delete to characters and remove worldState
        afterDelete: (id, _set) => {
          // Delete all characters in the world
          try {
            const { useCharacterStore } = eval('require("./characterStore")');
            const characterStore = useCharacterStore.getState();
            characterStore.deleteCharactersInWorld(id);
          } catch {
            // Handle import errors silently (e.g., in test environments)
          }

          // Remove worldState
          _set((state: WorldStore) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _removedState, ...remainingStates } = state.worldStates;
            return {
              worldStates: remainingStates,
            };
          });
        },
      })(set, get),

      syncDerivedState: () => {
        const { createSyncDerivedStateHelper } = require('./storeHelpers');
        createSyncDerivedStateHelper<World, WorldStore>({
          entitiesKey: 'worlds',
          currentIdKey: 'currentWorldId',
          additionalTransform: (worlds, hasWorlds, state) => {
            const existingWorldStates =
              state.worldStates && typeof state.worldStates === 'object' ? state.worldStates : {};

            const nextWorldStates: Record<EntityID, WorldState> = {};

            if (hasWorlds) {
              for (const worldId of Object.keys(worlds)) {
                nextWorldStates[worldId] = existingWorldStates[worldId] ?? createEmptyWorldState(worldId);
              }
            }

            return {
              worldStates: hasWorlds ? nextWorldStates : {}
            };
          }
        })(set);
      },

      // Domain-specific method aliases
      createWorld: (worldData) => get().create(worldData),
      updateWorld: (id, updates) => get().update(id, updates),
      deleteWorld: (id) => get().delete(id),
      setCurrentWorld: (id) => get().setCurrent(id),

        // Add attribute
        addAttribute: (worldId, attributeData) => {
          const world = get().worlds[worldId];
          if (!world) {
            set({ error: createNotFoundError('World') });
            return;
          }

          if ((world.attributes?.length || 0) >= (world.settings?.maxAttributes || 0)) {
            set({ error: createStoreError('Maximum Attributes Reached', 'This world has reached its maximum number of attributes') });
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
            set({ error: createNotFoundError('World') });
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
            set({ error: createNotFoundError('World') });
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
          set({ error: createNotFoundError('World') });
          return;
        }

        if ((world.skills?.length || 0) >= (world.settings?.maxSkills || 0)) {
          set({ error: createStoreError('Maximum Skills Reached', 'This world has reached its maximum number of skills') });
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
          set({ error: createNotFoundError('World') });
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
          set({ error: createNotFoundError('World') });
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
          set({ error: createNotFoundError('World') });
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
          set({ error: createNotFoundError('World') });
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

      initializeWorldState: (worldId) => {
        set(state => {
          if (state.worldStates[worldId]) {
            return {};
          }

          logger.debug('Initializing world state for world:', worldId);
          return {
            worldStates: {
              ...state.worldStates,
              [worldId]: createEmptyWorldState(worldId),
            }
          };
        });
      },

      updateWorldState: (worldId, stateUpdate, sessionId) => {
        if (!get().worlds[worldId]) {
          logger.warn('Attempted to update state for unknown world', { worldId, sessionId });
          return;
        }
        logger.debug('Applying world state update', { worldId, sessionId, keys: Object.keys(stateUpdate ?? {}) });
        set(state => {
          const currentState = state.worldStates[worldId];
          const nextState = applyWorldStateUpdate(worldId, currentState, stateUpdate, sessionId);

          return {
            worldStates: {
              ...state.worldStates,
              [worldId]: nextState,
            }
          };
        });
      },

      mergeWorldState: (incomingState) => {
        logger.debug('Merging external world state', { worldId: incomingState.worldId, version: incomingState.version });
        set(state => {
          const currentState = state.worldStates[incomingState.worldId];
          const merged = currentState ? mergeState(currentState, incomingState) : incomingState;

          return {
            worldStates: {
              ...state.worldStates,
              [incomingState.worldId]: merged,
            }
          };
        });
      },

      getWorldState: (worldId, options) => {
        const includeEndedSessions = options?.includeEndedSessions ?? false;
        const rawState = get().worldStates[worldId];

        if (includeEndedSessions) {
          return rawState ?? createEmptyWorldState(worldId);
        }

        return getActiveWorldState(worldId, rawState, resolveSessionStatus);
      },

      getRawWorldState: (worldId) => {
        return get().worldStates[worldId];
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
            message: getErrorMessage(error, 'Failed to fetch worlds'),
            retryable: true,
            type: ErrorType.SERVICE,
          });
        }
      },
    }),

    // Persistence configuration (keeping custom migrate for world validation)
    {
      ...createPersistOptions<WorldStore>('world', 'worlds', createIndexedDBStorage(), 2),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[WorldStore] Failed to rehydrate state', error);
          return;
        }
        state?.syncDerivedState?.();
      },
      // Custom migration with world validation and worldStates handling
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

          if (state.worldStates && typeof state.worldStates === 'object') {
            for (const [worldId, rawWorldState] of Object.entries(state.worldStates)) {
              if (!rawWorldState || typeof rawWorldState !== 'object') {
                state.worldStates[worldId] = createEmptyWorldState(worldId);
                continue;
              }

              const existingState = rawWorldState as Partial<WorldState>;

              if (!existingState.playerCharacterThreads || typeof existingState.playerCharacterThreads !== 'object') {
                existingState.playerCharacterThreads = {};
              }

              if (!existingState.characterRelationships || typeof existingState.characterRelationships !== 'object') {
                existingState.characterRelationships = {};
              }

              state.worldStates[worldId] = {
                ...createEmptyWorldState(worldId),
                ...existingState,
                playerCharacterThreads: existingState.playerCharacterThreads,
                characterRelationships: existingState.characterRelationships,
              };
            }
          }
        }

        return persistedState as WorldStore;
      }
    }
  )
);

// Expose store globally in development to support test data seeding
// and debugging via window.useWorldStore in dev tools.
import { exposeStoreInDev } from './storeHelpers';
exposeStoreInDev('useWorldStore', useWorldStore);
