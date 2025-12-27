import type { EntityID } from '../types/common.types';
import type { LoreFact } from '../types/lore.types';
import { normalizeText, NORM_NAME } from '../lib/utils/textNormalization';
import { logger } from '@/lib/utils/logger';

/**
 * Alias management functions for the lore store
 * Handles adding, removing, and searching by aliases
 */

export interface AliasManagementContext {
  getFact: (id: EntityID) => LoreFact | undefined;
  updateFact: (id: EntityID, updates: Partial<LoreFact>) => void;
  getFacts: (options?: { worldId?: EntityID }) => LoreFact[];
}

/**
 * Adds a single alias to a lore fact, which means category checks and de-duplication
 * happen before anything gets stored.
 *
 * @param id - The fact ID to update.
 * @param alias - The alias to add (trimmed before storage).
 * @param context - Store methods needed for reading/updating facts.
 * @returns void
 */
export function addAliasImpl(id: EntityID, alias: string, context: AliasManagementContext): void {
  const fact = context.getFact(id);
  if (!fact) return;

  // Validate that aliases are only used for appropriate categories
  if (!['characters', 'locations'].includes(fact.category)) {
    logger.warn('[LoreStore] Aliases only supported for characters/locations', {
      category: fact.category,
      factId: id
    });
    return;
  }

  const trimmedAlias = alias.trim();
  if (!trimmedAlias) return;

  const currentAliases = fact.aliases || [];
  if (currentAliases.includes(trimmedAlias)) return; // Prevent duplicates

  context.updateFact(id, {
    aliases: [...currentAliases, trimmedAlias],
  });
}

/**
 * Removes a single alias from a lore fact so the canonical value stays intact,
 * but the extra name stops matching.
 *
 * @param id - The fact ID to update.
 * @param alias - The alias to remove.
 * @param context - Store methods needed for reading/updating facts.
 * @returns void
 */
export function removeAliasImpl(id: EntityID, alias: string, context: AliasManagementContext): void {
  const fact = context.getFact(id);
  if (!fact) return;

  const currentAliases = fact.aliases || [];
  const updatedAliases = currentAliases.filter((a) => a !== alias);

  context.updateFact(id, {
    aliases: updatedAliases,
  });
}

/**
 * Replaces all aliases for a lore fact with a cleaned, de-duplicated list,
 * which keeps the stored data tidy and predictable.
 *
 * @param id - The fact ID to update.
 * @param aliases - The new aliases array (trimmed and de-duplicated).
 * @param context - Store methods needed for reading/updating facts.
 * @returns void
 */
export function setAliasesImpl(id: EntityID, aliases: string[], context: AliasManagementContext): void {
  const fact = context.getFact(id);
  if (!fact) return;

  // Validate that aliases are only used for appropriate categories
  if (!['characters', 'locations'].includes(fact.category)) {
    logger.warn('[LoreStore] Aliases only supported for characters/locations', {
      category: fact.category,
      factId: id
    });
    return;
  }

  // Filter out empty strings and trim, then remove duplicates
  const cleanedAliases = aliases
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
    .filter((alias, index, self) => self.indexOf(alias) === index);

  context.updateFact(id, {
    aliases: cleanedAliases,
  });
}

/**
 * Finds an entity by canonical name or any alias using normalized, case-insensitive
 * matching, so lookups behave the same no matter how the input is cased.
 *
 * @param name - The name or alias to search for.
 * @param worldId - The world ID to search within.
 * @param context - Store methods needed for searching facts.
 * @returns The matching fact, or null when no match is found.
 */
export function findEntityByAnyNameImpl(
  name: string,
  worldId: EntityID,
  context: AliasManagementContext
): LoreFact | null {
  const facts = context.getFacts({ worldId });
  const normalizedName = normalizeText(name, NORM_NAME).toLowerCase();

  return (
    facts.find((fact) => {
      const normalizedValue = normalizeText(fact.value, NORM_NAME).toLowerCase();
      const normalizedAliases = fact.aliases?.map((a) => normalizeText(a, NORM_NAME).toLowerCase()) || [];

      return normalizedValue === normalizedName || normalizedAliases.includes(normalizedName);
    }) || null
  );
}
