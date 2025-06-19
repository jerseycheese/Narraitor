/**
 * Base Store Factory
 * 
 * Creates a Zustand store with standard CRUD operations for entity management.
 * Reduces duplication across store implementations.
 */

import { StateCreator } from 'zustand';
import { generateUniqueId } from '@/lib/utils';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrudStoreState<T extends BaseEntity> {
  entities: Record<string, T>;
  currentEntityId: string | null;
  error: string | null;
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
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export type CrudStore<T extends BaseEntity> = CrudStoreState<T> & CrudStoreActions<T>;

export interface CreateCrudStoreOptions<T extends BaseEntity> {
  entityName: string;
  idPrefix: string;
  validator?: (data: Partial<T>) => void;
  onBeforeCreate?: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
  onAfterCreate?: (entity: T) => void;
  onBeforeUpdate?: (id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
  onAfterUpdate?: (entity: T) => void;
  onBeforeDelete?: (id: string) => void;
  onAfterDelete?: (id: string) => void;
}

/**
 * Creates a Zustand store with standard CRUD operations
 */
export function createCrudStore<T extends BaseEntity>(
  options: CreateCrudStoreOptions<T>
): StateCreator<CrudStore<T>> {
  const {
    entityName,
    idPrefix,
    validator,
    onBeforeCreate,
    onAfterCreate,
    onBeforeUpdate,
    onAfterUpdate,
    onBeforeDelete,
    onAfterDelete,
  } = options;

  const initialState: CrudStoreState<T> = {
    entities: {},
    currentEntityId: null,
    error: null,
    loading: false,
  };

  return (set, get) => ({
    ...initialState,

    create: (data) => {
      try {
        // Validate if validator is provided
        if (validator) {
          validator(data as Partial<T>);
        }

        // Apply before create hook if provided
        const processedData = onBeforeCreate ? onBeforeCreate(data) : data;

        // Generate ID and timestamps
        const id = generateUniqueId(idPrefix);
        const now = new Date().toISOString();

        const newEntity: T = {
          ...processedData,
          id,
          createdAt: now,
          updatedAt: now,
        } as T;

        // Update state
        set((state) => ({
          entities: {
            ...state.entities,
            [id]: newEntity,
          },
          error: null,
        }));

        // Apply after create hook if provided
        if (onAfterCreate) {
          onAfterCreate(newEntity);
        }

        return id;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create entity';
        set({ error: errorMessage });
        throw error;
      }
    },

    update: (id, updates) => {
      const entity = get().entities[id];
      
      if (!entity) {
        const error = `${entityName} not found`;
        set({ error });
        return;
      }

      try {
        // Apply before update hook if provided
        const processedUpdates = onBeforeUpdate ? onBeforeUpdate(id, updates) : updates;

        // Validate if validator is provided
        if (validator) {
          validator({ ...entity, ...processedUpdates });
        }

        const updatedEntity: T = {
          ...entity,
          ...processedUpdates,
          updatedAt: new Date().toISOString(),
        } as T;

        // Update state
        set((state) => ({
          entities: {
            ...state.entities,
            [id]: updatedEntity,
          },
          error: null,
        }));

        // Apply after update hook if provided
        if (onAfterUpdate) {
          onAfterUpdate(updatedEntity);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update entity';
        set({ error: errorMessage });
        throw error;
      }
    },

    delete: (id) => {
      const entity = get().entities[id];
      
      if (!entity) {
        return; // Silent fail for delete
      }

      try {
        // Apply before delete hook if provided
        if (onBeforeDelete) {
          onBeforeDelete(id);
        }

        // Update state
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _, ...remaining } = state.entities;
          return {
            entities: remaining,
            currentEntityId: state.currentEntityId === id ? null : state.currentEntityId,
            error: null,
          };
        });

        // Apply after delete hook if provided
        if (onAfterDelete) {
          onAfterDelete(id);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete entity';
        set({ error: errorMessage });
        throw error;
      }
    },

    setCurrent: (id) => {
      if (id && !get().entities[id]) {
        set({ error: `${entityName} not found` });
        return;
      }
      set({ currentEntityId: id, error: null });
    },

    getById: (id) => {
      return get().entities[id];
    },

    getAll: () => {
      return Object.values(get().entities);
    },

    reset: () => {
      set(initialState);
    },

    setError: (error) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },

    setLoading: (loading) => {
      set({ loading });
    },
  });
}

/**
 * Helper type to extract the entity type from a crud store
 */
export type ExtractEntity<T> = T extends CrudStore<infer E> ? E : never;
