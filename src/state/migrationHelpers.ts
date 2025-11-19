// src/state/migrationHelpers.ts

import { createStoreError, ErrorType } from '@/lib/utils/errorUtils';
import type { EntityID } from '@/types/common.types';

/**
 * Sync entities from a domain-specific slice to the shared entities object.
 *
 * This is a common pattern in store migrations where we maintain both:
 * - Domain-specific object (e.g., state.worlds, state.characters)
 * - Generic entities object (state.entities) for shared access
 *
 * @param state - The store state to modify (typed as any for migration compatibility)
 * @param domainKey - The key of the domain slice (e.g., 'worlds', 'characters')
 */
export function syncEntitiesFromSlice<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
  domainKey: string
): void {
  if (state[domainKey] && typeof state[domainKey] === 'object') {
    state.entities = { ...state[domainKey] as Record<EntityID, T> };
  }
}

/**
 * Sync bidirectional currentId fields.
 *
 * Some stores have both currentEntityId and currentDomainId (e.g., currentWorldId).
 * This ensures they stay in sync during migration.
 *
 * @param state - The store state to modify (typed as any for migration compatibility)
 * @param domainIdKey - The domain-specific ID key (e.g., 'currentWorldId')
 */
export function syncCurrentIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
  domainIdKey: string
): void {
  // Sync from domain ID to entity ID
  if (typeof state[domainIdKey] === 'string' && !state.currentEntityId) {
    state.currentEntityId = state[domainIdKey];
  }

  // Sync from entity ID to domain ID
  if (typeof state.currentEntityId === 'string' && !state[domainIdKey]) {
    state[domainIdKey] = state.currentEntityId;
  }
}

/**
 * Normalize error state in migrations.
 *
 * Older versions of stores may have stored errors as strings.
 * This converts them to proper StoreError objects.
 *
 * @param state - The store state to modify (typed as any for migration compatibility)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeErrorState(state: any): void {
  if (typeof state.error === 'string') {
    state.error = createStoreError(state.error, state.error, ErrorType.UNKNOWN);
  }
}

/**
 * Normalize loading state in migrations.
 *
 * Ensures loading is always a boolean (defaults to false if missing/invalid).
 *
 * @param state - The store state to modify (typed as any for migration compatibility)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeLoadingState(state: any): void {
  if (typeof state.loading !== 'boolean') {
    state.loading = false;
  }
}

/**
 * Combined helper to normalize error and loading states.
 * This is a common pattern in simpler store migrations.
 *
 * @param state - The store state to modify (typed as any for migration compatibility)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeCommonStates(state: any): void {
  normalizeErrorState(state);
  normalizeLoadingState(state);
}
