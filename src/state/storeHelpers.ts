/**
 * Shared utilities for Zustand stores
 * Consolidates common patterns across store implementations
 */

import type { EntityID } from '@/types';

/**
 * Configuration for syncDerivedState helper
 */
export interface SyncDerivedStateConfig<TEntity, TState> {
  /**
   * Name of the entities collection in the state (e.g., 'characters', 'worlds')
   */
  entitiesKey: keyof TState;

  /**
   * Name of the current entity ID field (e.g., 'currentCharacterId', 'currentWorldId')
   */
  currentIdKey: keyof TState;

  /**
   * Optional: Additional state transformations to apply
   */
  additionalTransform?: (
    entities: Record<EntityID, TEntity>,
    hasEntities: boolean,
    state: TState
  ) => Partial<TState>;
}

/**
 * Creates a syncDerivedState function for a store
 * Eliminates duplicate validation and synchronization logic across stores
 *
 * @example
 * ```typescript
 * syncDerivedState: createSyncDerivedStateHelper({
 *   entitiesKey: 'characters',
 *   currentIdKey: 'currentCharacterId',
 *   additionalTransform: (characters, hasCharacters) => ({
 *     worldCharacterIds: hasCharacters ? buildWorldCharacterIds(characters) : {}
 *   })
 * })
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSyncDerivedStateHelper<TEntity, TState extends Record<string, any>>(
  config: SyncDerivedStateConfig<TEntity, TState>
) {
  return (set: (fn: (state: TState) => Partial<TState>) => void) => {
    set((state) => {
      const { entitiesKey, currentIdKey, additionalTransform } = config;

      // Validate and normalize entities collection
      const rawEntities = state[entitiesKey];
      const entities: Record<EntityID, TEntity> =
        rawEntities && typeof rawEntities === 'object' ? rawEntities : {};

      const hasEntities = Object.keys(entities).length > 0;

      // Validate current entity IDs
      const isValidId = (id: EntityID | null | undefined) => Boolean(id && entities[id]);

      const validCurrentSpecificId = isValidId(state[currentIdKey])
        ? state[currentIdKey]
        : null;

      const validCurrentEntityId = isValidId(state.currentEntityId)
        ? state.currentEntityId
        : null;

      // Create fallback logic
      const fallbackId = validCurrentSpecificId ?? validCurrentEntityId ?? null;
      const nextCurrentSpecificId = validCurrentSpecificId ?? fallbackId;
      const nextCurrentEntityId = validCurrentEntityId ?? fallbackId;

      // Base state update
      const baseUpdate = {
        [entitiesKey]: hasEntities ? entities : {},
        entities: { ...entities },
        [currentIdKey]: hasEntities ? nextCurrentSpecificId : null,
        currentEntityId: hasEntities ? nextCurrentEntityId : null,
        error: state.error ?? null,
        loading: state.loading ?? false,
      };

      // Apply additional transformations if provided
      const additionalUpdate = additionalTransform
        ? additionalTransform(entities, hasEntities, state)
        : {};

      return {
        ...baseUpdate,
        ...additionalUpdate,
      } as Partial<TState>;
    });
  };
}

/**
 * Creates a window global exposure helper for development
 * Consolidates the pattern of exposing stores to window in dev mode
 */
export function exposeStoreInDev<T>(storeName: string, storeHook: T): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[storeName] = storeHook;
  }
}
