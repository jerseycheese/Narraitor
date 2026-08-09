import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { World, WorldAttribute, WorldSkill, WorldSettings } from '../types/world.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { ToneSettings, DEFAULT_TONE_SETTINGS } from '../types/tone-settings.types';
import { safeTrim, normalizeText, NORM_NAME, NORM_DESC, getTimestamp } from '@/lib/utils';
import { CrudStore } from './crudStore.types';
import { createStoreError, ErrorType } from '@/lib/utils/errorUtils';
import { WorldState, WorldStateUpdate, createEmptyWorldState } from '../types/world-state.types';
import { applyWorldStateUpdate, getActiveWorldState, mergeState } from '@/lib/world';
import Logger from '@/lib/utils/logger';
import { storeEvents, StoreEventTypes, type WorldDeletedEvent } from '@/lib/state/storePubSub';
import { useSessionStore } from './sessionStore';
import { trackFunnelStep } from '@/lib/analytics/trackFunnelStep';
import { shouldExposeStoreOnWindow } from '@/lib/utils/shouldExposeStoreOnWindow';

const logger = new Logger('WorldStore');

const resolveSessionStatus = (sessionId: EntityID) => {
  try {
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
    (set, get) => {
      return {
        // State
        worlds: {},
        entities: {},
        worldStates: {},
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
            worldStates: {
              ...state.worldStates,
              [worldId]: createEmptyWorldState(worldId),
            },
            error: null,
          }));

          return worldId;
        },

        update: (id, updates) => {
          const world = get().worlds[id];
          if (!world) {
            set({ error: createStoreError('World Not Found', 'The specified world could not be found') });
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

        delete: async (id) => {
          const world = get().worlds[id];
          if (!world) return;

          // Delete the world's image file if it exists and is not a data URI
          if (world.image?.url && !world.image.url.startsWith('data:')) {
            // Call API to delete the image file
            fetch('/api/delete-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl: world.image.url }),
            }).catch((error) => {
              logger.warn('Failed to delete world image file', { worldId: id, error });
            });
          }

          // Emit event for other stores to handle cleanup
          storeEvents.emit<WorldDeletedEvent>(StoreEventTypes.WORLD_DELETED, {
            worldId: id,
          });

          set((state) => {
            const { [id]: _removedWorld, ...remainingWorlds } = state.worlds;
            const { [id]: _removedEntity, ...remainingEntities } = state.entities;
            const { [id]: _removedState, ...remainingStates } = state.worldStates;
            const currentIsDeleted = state.currentEntityId === id || state.currentWorldId === id;
            return {
              worlds: remainingWorlds,
              entities: remainingEntities,
              worldStates: remainingStates,
              currentEntityId: currentIsDeleted ? null : state.currentEntityId,
              currentWorldId: currentIsDeleted ? null : state.currentWorldId,
              error: null,
            };
          });
        },

        setCurrent: (id) => {
          if (id && !get().worlds[id]) {
            set({
              error: createStoreError('World Not Found', 'The specified world could not be found'),
              currentEntityId: null,
              currentWorldId: null,
            });
            return;
          }
          set({ currentEntityId: id, currentWorldId: id, error: null });
        },

        getById: (id) => get().worlds[id],
        getAll: () => Object.values(get().worlds),
        reset: () => set({ worlds: {}, entities: {}, worldStates: {}, currentEntityId: null, currentWorldId: null, error: null, loading: false }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ loading }),
        syncDerivedState: () => {
          set((state) => {
            const worlds =
              state.worlds && typeof state.worlds === 'object' ? state.worlds : {};

            const hasWorlds = Object.keys(worlds).length > 0;

            const existingWorldStates =
              state.worldStates && typeof state.worldStates === 'object' ? state.worldStates : {};

            const nextWorldStates: Record<EntityID, WorldState> = {};

            if (hasWorlds) {
              for (const worldId of Object.keys(worlds)) {
                nextWorldStates[worldId] = existingWorldStates[worldId] ?? createEmptyWorldState(worldId);
              }
            }

            const isValidWorldId = (id: EntityID | null | undefined) => Boolean(id && worlds[id]);

            const validCurrentWorldId = isValidWorldId(state.currentWorldId)
              ? state.currentWorldId
              : null;

            const validCurrentEntityId = isValidWorldId(state.currentEntityId)
              ? state.currentEntityId
              : null;

            const fallbackId = validCurrentWorldId ?? validCurrentEntityId ?? null;

            const nextCurrentWorldId = validCurrentWorldId ?? fallbackId;
            const nextCurrentEntityId = validCurrentEntityId ?? fallbackId;

            return {
              worlds: hasWorlds ? worlds : {},
              entities: { ...worlds },
              worldStates: hasWorlds ? nextWorldStates : {},
              currentWorldId: hasWorlds ? nextCurrentWorldId : null,
              currentEntityId: hasWorlds ? nextCurrentEntityId : null,
              error: state.error ?? null,
              loading: state.loading ?? false,
            };
          });
        },

        // Domain-specific method aliases
        createWorld: (worldData) => {
          const worldId = get().create(worldData);
          trackFunnelStep('world-created');
          return worldId;
        },
        updateWorld: (id, updates) => get().update(id, updates),
        deleteWorld: (id) => get().delete(id),
        setCurrentWorld: (id) => get().setCurrent(id),

        // Add attribute
        addAttribute: (worldId, attributeData) => {
          const world = get().worlds[worldId];
          if (!world) {
            set({ error: createStoreError('World Not Found', 'The specified world could not be found') });
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
            set({ error: createStoreError('World Not Found', 'The specified world could not be found') });
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
            set({ error: createStoreError('World Not Found', 'The specified world could not be found') });
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
            set({ error: createStoreError('World Not Found', 'The specified world could not be found') });
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
            set({ error: createStoreError('World Not Found', 'The specified world could not be found') });
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
            set({ error: createStoreError('World Not Found', 'The specified world could not be found') });
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
            set({ error: createStoreError('World Not Found', 'The specified world could not be found') });
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
            set({ error: createStoreError('World Not Found', 'The specified world could not be found') });
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
            // Worlds are hydrated from IndexedDB by Zustand persistence and stay in
            // sync reactively, so there is nothing to fetch imperatively here.
            get().setLoading(false);
          } catch (error) {
            get().setLoading(false);
            get().setError({
              title: 'Failed to Load Worlds',
              message: error instanceof Error ? error.message : 'Failed to fetch worlds',
              retryable: true,
              type: ErrorType.SERVICE,
              severity: 'error',
            });
          }
        },
      };
    },
    {
      name: 'narraitor-world-store',
      storage: createIndexedDBStorage(),
      version: 5, // Incremented for segment-based checkpoint architecture
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          logger.error('[WorldStore] Failed to rehydrate state', error);
          return;
        }
        state?.syncDerivedState?.();
      },
      migrate: (persistedState: unknown, version?: number) => {
        let nextState = persistedState;

        if (!nextState) {
          nextState = {
            worlds: {},
            entities: {},
            worldStates: {},
            currentWorldId: null,
            currentEntityId: null,
            error: null,
            loading: false,
          };
        }

        if (typeof version === 'number' && version < 4) {
          const worldStates = (nextState as { worldStates?: Record<EntityID, WorldState> }).worldStates;
          if (worldStates && typeof worldStates === 'object') {
            Object.values(worldStates).forEach((state) => {
              if (state && !Array.isArray(state.storyCheckpoints)) {
                state.storyCheckpoints = [];
              }
            });
          }
        }

        // Migration from v4 to v5: Clean start, remove old cumulative-summary checkpoints
        if (typeof version === 'number' && version < 5) {
          const worldStates = (nextState as { worldStates?: Record<EntityID, WorldState> }).worldStates;
          if (worldStates && typeof worldStates === 'object') {
            Object.values(worldStates).forEach((state) => {
              if (state && Array.isArray(state.storyCheckpoints)) {
                // Clear old checkpoints - fresh start with segment-based architecture
                state.storyCheckpoints = [];
              }
            });
          }
        }

        return nextState;
      }, // Preserve data, only clear if null
    }
  )
);

// Expose store globally in development to support test data seeding
// and debugging via window.useWorldStore in dev tools.
if (typeof window !== 'undefined' && shouldExposeStoreOnWindow()) {
  window.useWorldStore = useWorldStore;
}