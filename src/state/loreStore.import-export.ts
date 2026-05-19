import type { EntityID } from '../types/common.types';
import type { LoreFact, LoreCategory, LoreSource } from '../types/lore.types';
import { getTimestamp } from '@/lib/utils';
import { createStoreError, ErrorType } from '@/lib/utils/errorUtils';
import type { LoreStore } from './loreStore';

type SetState = (
  partial: Partial<LoreStore> | ((state: LoreStore) => Partial<LoreStore>)
) => void;
type GetState = () => LoreStore;

export const createLoreImportExportActions = (set: SetState, get: GetState) => ({
  exportFacts: (worldId: EntityID): string => {
    const facts = get().getFacts({ worldId });
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
  },

  importFacts: (worldId: EntityID, jsonData: string): void => {
    try {
      const data = JSON.parse(jsonData);
      const { addFact, validateFactUniqueness, getFacts, setAliases } = get();

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
              const validAliases = fact.aliases
                .filter((a) => typeof a === 'string')
                .map((a) => a.trim())
                .filter((a) => a.length > 0);
              if (validAliases.length > 0) {
                setAliases(createdId, validAliases);
              }
            }
          } else if (Array.isArray(fact.aliases) && fact.aliases.length > 0) {
            const existing = getFacts({ worldId }).find(
              (existingFact) =>
                existingFact.key === fact.key && existingFact.value === fact.value
            );
            if (existing) {
              setAliases(existing.id, [...(existing.aliases || []), ...fact.aliases]);
            }
          }
        }
      );
    } catch (error) {
      set({
        error: createStoreError(
          'Lore Import Failed',
          error instanceof Error ? error.message : 'Unknown import error occurred.',
          ErrorType.SERVICE
        ),
      });
      throw new Error(
        `Failed to import facts for worldId "${worldId}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
});
