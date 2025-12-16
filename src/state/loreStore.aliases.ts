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
 * Adds an alias to a lore fact
 *
 * @param id - The fact ID
 * @param alias - The alias to add
 * @param context - Store methods needed for updating facts
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
 * Removes an alias from a lore fact
 *
 * @param id - The fact ID
 * @param alias - The alias to remove
 * @param context - Store methods needed for updating facts
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
 * Sets all aliases for a lore fact (replaces existing)
 *
 * @param id - The fact ID
 * @param aliases - The new aliases array
 * @param context - Store methods needed for updating facts
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
 * Finds an entity by canonical name or any alias
 * Uses case-insensitive normalized matching
 *
 * @param name - The name or alias to search for
 * @param worldId - The world ID to search within
 * @param context - Store methods needed for searching facts
 * @returns The matching fact or null if not found
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
