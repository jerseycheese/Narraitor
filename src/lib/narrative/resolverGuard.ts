// src/lib/narrative/resolverGuard.ts

import type { EntityID } from '@/types/common.types';

/**
 * Session-scoped guard that prevents duplicate writers during the
 * TurnResolver migration. When a session is resolver-active, the old
 * fire-and-forget tails in narrativeGenerator.generateSegment() and
 * narrativeStore.addSegment() skip their side effects because the
 * resolver handles those itself.
 *
 * Three-phase deployment:
 * 1. Guard lands, nothing calls markResolverActive - zero behavior change.
 * 2. Resolver wired, marks sessions active on entry - old path is dead.
 * 3. Stable, guard checks removed, fire-and-forget tails deleted.
 */
const activeSessions = new Set<EntityID>();

export function markResolverActive(sessionId: EntityID): void {
  activeSessions.add(sessionId);
}

export function markResolverInactive(sessionId: EntityID): void {
  activeSessions.delete(sessionId);
}

export function isResolverActive(sessionId: EntityID): boolean {
  return activeSessions.has(sessionId);
}
