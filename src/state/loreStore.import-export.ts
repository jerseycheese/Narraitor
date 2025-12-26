import type { EntityID } from '../types/common.types';
import type { LoreFact, LoreCategory, LoreSource } from '../types/lore.types';
import { getTimestamp } from '@/lib/utils';
import { UserFriendlyError, createStoreError, ErrorType } from '@/lib/utils/errorUtils';

/**
 * Import/export functionality for lore store
 */

export interface ImportExportContext {
  getFacts: (options?: { worldId?: EntityID }) => LoreFact[];
  addFact: (
    key: string,
    value: string,
    category: LoreCategory,
    source: LoreSource,
    worldId: EntityID,
    sessionId?: EntityID,
    metadata?: LoreFact['metadata'],
    visibility?: 'session-private' | 'world-shared'
  ) => EntityID;
  validateFactUniqueness: (worldId: EntityID, key: string, value: string) => boolean;
  setAliases: (id: EntityID, aliases: string[]) => void;
  setError: (error: UserFriendlyError | null) => void;
}

/**
 * Exports facts for a given world to JSON
 */
export function exportFactsImpl(worldId: EntityID, context: ImportExportContext): string {
  const facts = context.getFacts({ worldId });
  const exportData = {
    worldId,
    exportedAt: getTimestamp(),
    facts: facts.map((fact) => ({
      key: fact.key,
      value: fact.value,
      aliases: Array.isArray(fact.aliases) ? fact.aliases : [],
      category: fact.category,
      source: fact.source,
      sessionId: fact.sessionId,
      visibility: fact.visibility,
      metadata: fact.metadata,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Imports facts from JSON data
 */
export function importFactsImpl(worldId: EntityID, jsonData: string, context: ImportExportContext): void {
  try {
    const data = JSON.parse(jsonData);
    const { addFact, validateFactUniqueness, getFacts, setAliases } = context;

    if (!data.facts || !Array.isArray(data.facts)) {
      throw new Error('Invalid import data structure');
    }

    data.facts.forEach(
      (fact: {
        key: string;
        value: string;
        aliases?: string[];
        category: LoreCategory;
        source?: LoreSource;
        sessionId?: EntityID;
        visibility?: 'session-private' | 'world-shared';
        metadata?: LoreFact['metadata'];
      }) => {
        if (validateFactUniqueness(worldId, fact.key, fact.value)) {
          const createdId = addFact(
            fact.key,
            fact.value,
            fact.category,
            fact.source || 'manual',
            worldId,
            fact.sessionId,
            fact.metadata,
            fact.visibility
          );
          if (createdId && Array.isArray(fact.aliases) && fact.aliases.length > 0) {
            // Validate aliases before setting
            const validAliases = fact.aliases
              .filter((a) => typeof a === 'string')
              .map((a) => a.trim())
              .filter((a) => a.length > 0);
            if (validAliases.length > 0) {
              setAliases(createdId, validAliases);
            }
          }
        } else if (Array.isArray(fact.aliases) && fact.aliases.length > 0) {
          // Merge aliases into the existing fact if present
          const existing = getFacts({ worldId }).find(
            (existingFact) => existingFact.key === fact.key && existingFact.value === fact.value
          );
          if (existing) {
            setAliases(existing.id, [...(existing.aliases || []), ...fact.aliases]);
          }
        }
      }
    );
  } catch (error) {
    context.setError(
      createStoreError(
        'Lore Import Failed',
        error instanceof Error ? error.message : 'Unknown import error occurred.',
        ErrorType.SERVICE
      )
    );
    throw new Error(
      `Failed to import facts for worldId "${worldId}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
