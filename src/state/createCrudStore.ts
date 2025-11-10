/**
 * CRUD Store Factory
 *
 * Comprehensive factory for creating Zustand stores with standardized CRUD operations,
 * state management, and persistence. Eliminates 100+ lines of duplicate code per store.
 */

import { StateCreator } from 'zustand';
import { PersistOptions, PersistStorage } from 'zustand/middleware';
import { generateUniqueId } from '@/lib/utils';
import { getTimestamp } from '@/lib/utils/timestamp';
import { UserFriendlyError, createStoreError, ErrorType } from '@/lib/utils/errorUtils';
import type { EntityID } from '@/types';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrudStoreState<T extends BaseEntity> {
  entities: Record<string, T>;
  currentEntityId: string | null;
  error: UserFriendlyError | null;
  loading: boolean;
}

export interface CrudStoreActions<T extends BaseEntity> {
  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => string;
  update: (id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  delete: (id: string) => void;
  setCurrent: (id: string | null) => void;
  getById: (id: string) => T | undefined;
  getAll: () => T[];
  reset: () => void;
  setError: (error: UserFriendlyError | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export type CrudStore<T extends BaseEntity> = CrudStoreState<T> & CrudStoreActions<T>;

/**
 * Configuration for creating a CRUD store
 */
export interface CrudStoreConfig<T extends BaseEntity, TState extends CrudStoreState<T>> {
  /**
   * Prefix for generating entity IDs (e.g., 'world', 'char', 'goal')
   */
  entityPrefix: string;

  /**
   * Name of the domain entities key in state (e.g., 'worlds', 'characters', 'goals')
   * This allows stores to maintain both generic 'entities' and domain-specific collections
   */
  domainKey: keyof TState;

  /**
   * Name of the current entity ID key (e.g., 'currentWorldId', 'currentCharacterId')
   * If provided, will be kept in sync with currentEntityId
   */
  currentIdKey?: keyof TState;

  /**
   * Initial state beyond the base CRUD state
   */
  additionalInitialState?: Partial<TState>;

  /**
   * Custom logic to run before create
   * Return false to prevent creation, or modify data
   */
  beforeCreate?: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => boolean | Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

  /**
   * Custom logic to run after create
   */
  afterCreate?: (entity: T, set: (partial: Partial<TState> | ((state: TState) => Partial<TState>)) => void, get: () => TState) => void;

  /**
   * Custom logic to run before update
   */
  beforeUpdate?: (id: string, updates: Partial<T>, currentEntity: T) => boolean | Partial<T>;

  /**
   * Custom logic to run after update
   */
  afterUpdate?: (entity: T, set: (partial: Partial<TState> | ((state: TState) => Partial<TState>)) => void, get: () => TState) => void;

  /**
   * Custom logic to run before delete
   */
  beforeDelete?: (id: string, entity: T) => boolean;

  /**
   * Custom logic to run after delete
   */
  afterDelete?: (id: string, set: (partial: Partial<TState> | ((state: TState) => Partial<TState>)) => void, get: () => TState) => void;

  /**
   * Additional state transformations during create/update/delete
   */
  stateTransform?: (entities: Record<string, T>, state: TState) => Partial<TState>;
}

/**
 * Creates standardized CRUD operations for a Zustand store
 * Eliminates 100+ lines of duplicate code per store
 */
export function createCrudOperations<T extends BaseEntity, TState extends CrudStoreState<T>>(
  config: CrudStoreConfig<T, TState>
): StateCreator<TState, [], [], CrudStoreActions<T> & { [K in keyof TState]?: TState[K] }> {
  return (set, get) => ({
    create: (entityData) => {
      // Run beforeCreate hook
      let data = entityData;
      if (config.beforeCreate) {
        const result = config.beforeCreate(data);
        if (result === false) return '';
        if (result !== true) data = result;
      }

      const entityId = generateUniqueId(config.entityPrefix);
      const now = getTimestamp();

      const newEntity: T = {
        ...data,
        id: entityId,
        createdAt: now,
        updatedAt: now,
      } as T;

      set((state) => {
        const baseUpdate = {
          entities: { ...state.entities, [entityId]: newEntity },
          [config.domainKey]: { ...state[config.domainKey] as Record<string, T>, [entityId]: newEntity },
          error: null,
        };

        const additionalUpdate = config.stateTransform
          ? config.stateTransform({ ...state.entities, [entityId]: newEntity }, state)
          : {};

        return { ...baseUpdate, ...additionalUpdate } as Partial<TState>;
      });

      // Run afterCreate hook
      if (config.afterCreate) {
        config.afterCreate(newEntity, set, get);
      }

      return entityId;
    },

    update: (id, updates) => {
      const currentEntity = get().entities[id];
      if (!currentEntity) {
        set({ error: createStoreError('Entity Not Found', `${config.entityPrefix} with ID ${id} not found`, ErrorType.VALIDATION) } as Partial<TState>);
        return;
      }

      // Run beforeUpdate hook
      let finalUpdates = updates;
      if (config.beforeUpdate) {
        const result = config.beforeUpdate(id, updates, currentEntity);
        if (result === false) return;
        if (result !== true) finalUpdates = result;
      }

      const updatedEntity: T = {
        ...currentEntity,
        ...finalUpdates,
        updatedAt: getTimestamp(),
      };

      set((state) => {
        const baseUpdate = {
          entities: { ...state.entities, [id]: updatedEntity },
          [config.domainKey]: { ...state[config.domainKey] as Record<string, T>, [id]: updatedEntity },
          error: null,
        };

        const additionalUpdate = config.stateTransform
          ? config.stateTransform({ ...state.entities, [id]: updatedEntity }, state)
          : {};

        return { ...baseUpdate, ...additionalUpdate } as Partial<TState>;
      });

      // Run afterUpdate hook
      if (config.afterUpdate) {
        config.afterUpdate(updatedEntity, set, get);
      }
    },

    delete: (id) => {
      const entity = get().entities[id];
      if (!entity) return;

      // Run beforeDelete hook
      if (config.beforeDelete) {
        const shouldDelete = config.beforeDelete(id, entity);
        if (!shouldDelete) return;
      }

      set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _removedEntity, ...remainingEntities } = state.entities;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _removedDomain, ...remainingDomain } = state[config.domainKey] as Record<string, T>;

        const shouldResetCurrent = state.currentEntityId === id;
        const shouldResetDomainCurrent = config.currentIdKey && state[config.currentIdKey] === id;

        const baseUpdate = {
          entities: remainingEntities,
          [config.domainKey]: remainingDomain,
          currentEntityId: shouldResetCurrent ? null : state.currentEntityId,
          ...(config.currentIdKey && shouldResetDomainCurrent ? { [config.currentIdKey]: null } : {}),
          error: null,
        };

        const additionalUpdate = config.stateTransform
          ? config.stateTransform(remainingEntities, state)
          : {};

        return { ...baseUpdate, ...additionalUpdate } as Partial<TState>;
      });

      // Run afterDelete hook
      if (config.afterDelete) {
        config.afterDelete(id, set, get);
      }
    },

    setCurrent: (id) => {
      if (id && !get().entities[id]) {
        set({ error: createStoreError('Entity Not Found', `${config.entityPrefix} with ID ${id} not found`, ErrorType.VALIDATION) } as Partial<TState>);
        return;
      }

      const update: Record<string, unknown> = {
        currentEntityId: id,
        error: null,
      };

      if (config.currentIdKey) {
        update[config.currentIdKey] = id;
      }

      set(update as Partial<TState>);
    },

    getById: (id) => get().entities[id],

    getAll: () => Object.values(get().entities),

    reset: () => {
      const initialState: Record<string, unknown> = {
        entities: {},
        [config.domainKey]: {},
        currentEntityId: null,
        ...(config.currentIdKey ? { [config.currentIdKey]: null } : {}),
        error: null,
        loading: false,
        ...config.additionalInitialState,
      };
      set(initialState as Partial<TState>);
    },

    setError: (error) => set({ error } as Partial<TState>),

    clearError: () => set({ error: null } as Partial<TState>),

    setLoading: (loading) => set({ loading } as Partial<TState>),
  });
}

/**
 * Creates initial state for a CRUD store
 */
export function createInitialState<T extends BaseEntity, TState extends CrudStoreState<T>>(
  config: Pick<CrudStoreConfig<T, TState>, 'domainKey' | 'currentIdKey' | 'additionalInitialState'>
): TState {
  return {
    entities: {},
    [config.domainKey]: {},
    currentEntityId: null,
    ...(config.currentIdKey ? { [config.currentIdKey]: null } : {}),
    error: null,
    loading: false,
    ...config.additionalInitialState,
  } as TState;
}

/**
 * Creates standardized persist options for a store
 */
export function createPersistOptions<TState>(
  storeName: string,
  domainKey: string,
  storage: PersistStorage<TState> | undefined,
  version: number = 1
): Partial<PersistOptions<TState>> {
  return {
    name: `narraitor-${storeName}-store`,
    storage,
    version,
    onRehydrateStorage: () => (state, error) => {
      if (error) {
        console.error(`[${storeName}Store] Failed to rehydrate state`, error);
        return;
      }

      // Sync entities with domain objects after rehydration
      if (state && (state as Record<string, unknown>)[domainKey]) {
        (state as Record<string, unknown>).entities = { ...(state as Record<string, unknown>)[domainKey] };
      }
    },
    migrate: (persistedState: unknown) => {
      if (!persistedState || typeof persistedState !== 'object') {
        return persistedState as TState;
      }

      const state = persistedState as Record<string, unknown>;

      // Sync entities with domain objects
      if (state[domainKey] && typeof state[domainKey] === 'object') {
        state.entities = { ...state[domainKey] };
      }

      // Normalize error to UserFriendlyError if it's a string
      if (typeof state.error === 'string') {
        state.error = createStoreError(state.error, state.error, ErrorType.UNKNOWN);
      }

      // Ensure loading is a boolean
      if (typeof state.loading !== 'boolean') {
        state.loading = false;
      }

      return persistedState as TState;
    },
  };
}
