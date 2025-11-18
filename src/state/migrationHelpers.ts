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
 * @param state - The store state to modify
 * @param domainKey - The key of the domain slice (e.g., 'worlds', 'characters')
 */
export function syncEntitiesFromSlice<T>(
  state: Record<string, unknown>,
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
 * @param state - The store state to modify
 * @param domainIdKey - The domain-specific ID key (e.g., 'currentWorldId')
 */
export function syncCurrentIds(
  state: Record<string, unknown>,
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
 * @param state - The store state to modify
 */
export function normalizeErrorState(state: Record<string, unknown>): void {
  if (typeof state.error === 'string') {
    state.error = createStoreError(state.error, state.error, ErrorType.UNKNOWN);
  }
}

/**
 * Normalize loading state in migrations.
 *
 * Ensures loading is always a boolean (defaults to false if missing/invalid).
 *
 * @param state - The store state to modify
 */
export function normalizeLoadingState(state: Record<string, unknown>): void {
  if (typeof state.loading !== 'boolean') {
    state.loading = false;
  }
}

/**
 * Combined helper to normalize error and loading states.
 * This is a common pattern in simpler store migrations.
 *
 * @param state - The store state to modify
 */
export function normalizeCommonStates(state: Record<string, unknown>): void {
  normalizeErrorState(state);
  normalizeLoadingState(state);
}
