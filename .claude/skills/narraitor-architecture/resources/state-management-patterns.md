# State Management Patterns in Narraitor

Use Zustand stores in `src/state/` and follow existing store conventions.

## Standard store shape
Use `CrudStore<T>` from `src/state/crudStore.types.ts` for CRUD-focused domains. The type is composed from separate state and action interfaces:

```ts
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
```

Note: `crudStore.types.ts` is types only — there's no store factory. Stores that use these types implement the shape directly.

## Persistence pattern
Use `persist` with IndexedDB storage when the domain should survive reloads.

```ts
import { persist } from 'zustand/middleware';
import { createIndexedDBStorage } from '@/state/persistence';

export const useWorldStore = create<WorldStore>()(
  persist((set, get) => ({ /* ... */ }), {
    name: 'worlds',
    storage: createIndexedDBStorage(),
  })
);
```

## Avoid direct store coupling
- Do not import one store from another when avoidable.
- Prefer `storeEvents` from `src/lib/state/storePubSub.ts` for cross-store signals.
- If a direct read is unavoidable, keep it behind a helper and document the dependency.

## Error handling
- Use `createStoreError` or `UserFriendlyError` from `src/lib/utils/errorUtils` for user-facing errors.
- Keep errors in store state; clear them after handling.

## Testing
- Put store tests in `src/state/__tests__/` or alongside the store as `*.test.ts`.
