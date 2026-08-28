// src/lib/narrative/resolverGuard.ts

/**
 * Call-scoped flag that prevents duplicate writers during the TurnResolver
 * migration. When the resolver drives a generation + commit cycle, it
 * passes `resolverManaged: true` in the options so the generator and
 * addSegment skip their own fire-and-forget side-effect tails. Only the
 * specific call from the resolver is suppressed; concurrent calls from
 * other paths (item-use, bootstrap) run their own tails normally.
 *
 * This replaces the previous session-wide guard, which blocked ALL writes
 * to a session while any resolver was active.
 */

/**
 * Check whether a generation or commit call should skip its side-effect
 * tails because the TurnResolver is handling them.
 */
export function isResolverManaged(options?: { resolverManaged?: boolean }): boolean {
  return options?.resolverManaged === true;
}
