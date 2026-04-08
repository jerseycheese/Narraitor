import { useMemo } from 'react';
import { useLoreStore } from '@/state/loreStore';
import type { EntityID } from '@/types/common.types';
import type { LoreCategory } from '@/types/lore.types';

export interface TermDefinitionData {
  name: string;
  category: LoreCategory;
  type?: string;
  description: string;
  importance?: 'low' | 'medium' | 'high';
}

const DEFINABLE_CATEGORIES: LoreCategory[] = ['characters', 'locations', 'events'];

/**
 * Builds a term lookup map from lore facts for the current world/session.
 * Returns term names (for highlighting) and a lookup function (for definitions).
 */
export function useTermDefinitions(
  worldId?: EntityID,
  sessionId?: EntityID
) {
  const getFacts = useLoreStore((state) => state.getFacts);

  const { termNames, lookupMap } = useMemo(() => {
    if (!worldId) {
      return { termNames: [] as string[], lookupMap: new Map<string, TermDefinitionData>() };
    }

    const facts = getFacts({ worldId });
    const map = new Map<string, TermDefinitionData>();
    const names: string[] = [];

    for (const fact of facts) {
      if (!DEFINABLE_CATEGORIES.includes(fact.category)) continue;
      if (!fact.metadata?.description) continue;

      // Scope: session-private facts only show for their session
      if (fact.visibility === 'session-private' && fact.sessionId !== sessionId) continue;

      const data: TermDefinitionData = {
        name: fact.value,
        category: fact.category,
        type: fact.metadata.type,
        description: fact.metadata.description,
        importance: fact.metadata.importance,
      };

      // Register canonical name
      const canonKey = fact.value.toLowerCase();
      if (!map.has(canonKey)) {
        map.set(canonKey, data);
        names.push(fact.value);
      }

      // Register aliases
      for (const alias of fact.aliases || []) {
        const aliasKey = alias.toLowerCase();
        if (!map.has(aliasKey)) {
          map.set(aliasKey, data);
          names.push(alias);
        }
      }
    }

    return { termNames: names, lookupMap: map };
  }, [worldId, sessionId, getFacts]);

  const getDefinition = useMemo(() => {
    return (matchedText: string): TermDefinitionData | null => {
      return lookupMap.get(matchedText.toLowerCase()) ?? null;
    };
  }, [lookupMap]);

  return { termNames, getDefinition };
}
