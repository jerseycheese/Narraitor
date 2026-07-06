/**
 * CRUD Store Types
 *
 * Type definitions for stores with standard CRUD operations.
 * Note: The factory function was removed as unused code, but types are retained
 * for stores that still reference them (goalStore, loreStore).
 */

import { UserFriendlyError } from '@/lib/utils/errorUtils';

interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface CrudStoreState<T extends BaseEntity> {
  entities: Record<string, T>;
  currentEntityId: string | null;
  error: UserFriendlyError | null;
  loading: boolean;
}

interface CrudStoreActions<T extends BaseEntity> {
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
