// src/lib/narrative/resolverGuard.ts

/**
 * Call-scoped flag that prevents duplicate writers. When the resolver
 * commits a segment it passes `resolverManaged: true` to addSegment, which
 * then skips its own fire-and-forget side-effect tail because the resolver
 * runs those itself. Only the resolver's call is suppressed; commits from
 * other paths (the controller fallback, the bootstrap segment) run their
 * tails normally.
 *
 * This replaces the previous session-wide guard, which blocked ALL writes
 * to a session while any resolver was active.
 */

/**
 * Check whether a commit should skip its side-effect tail because the
 * TurnResolver is handling it.
 */
export function isResolverManaged(options?: { resolverManaged?: boolean }): boolean {
  return options?.resolverManaged === true;
}
