import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  LoreFact, 
  LoreSearchOptions, 
  LoreContext,
  LoreCategory,
  LoreSource 
} from '../types/lore.types';
import type { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';

/**
 * Simple lore store for tracking narrative facts
 */
export interface LoreStore {
  // State
  facts: Record<EntityID, LoreFact>;
  
  // Core Operations
  addFact: (key: string, value: string, category: LoreCategory, source: LoreSource, worldId: EntityID, sessionId?: EntityID) => void;
  getFacts: (options?: LoreSearchOptions) => LoreFact[];
  clearFacts: (worldId: EntityID) => void;
  
  // AI Integration
  getLoreContext: (worldId: EntityID, limit?: number) => LoreContext;
  
  // Simple fact extraction
  extractFactsFromText: (text: string, worldId: EntityID, sessionId?: EntityID) => void;
}

/**
 * Simple patterns for extracting facts from narrative text
 */
const extractBasicFacts = (text: string): Array<{
  key: string;
  value: string;
  category: LoreCategory;
}> => {
  const facts: Array<{ key: string; value: string; category: LoreCategory }> = [];
  
  // Extract character names (capitalized words followed by titles or actions)
  const characterPattern = /([A-Z][a-z]+ (?:[A-Z][a-z]+\s)?(?:the [A-Za-z]+|[A-Z][a-z]+))/g;
  let match;
  while ((match = characterPattern.exec(text)) !== null) {
    const name = match[1].trim();
    facts.push({
      key: `character_${name.toLowerCase().replace(/\s+/g, '_')}`,
      value: name,
      category: 'characters'
    });
  }
  
  // Extract location names (place indicators)
  const locationPattern = /(?:in|at|from|to) (?:the )?([A-Z][a-z]+(?: [A-Z][a-z]+)*)/g;
  while ((match = locationPattern.exec(text)) !== null) {
    const location = match[1].trim();
    facts.push({
      key: `location_${location.toLowerCase().replace(/\s+/g, '_')}`,
      value: location,
      category: 'locations'
    });
  }
  
  return facts;
};

/**
 * Simple lore store implementation
 */
export const useLoreStore = create<LoreStore>()(
  persist(
    (set, get) => ({
      facts: {},

      addFact: (key, value, category, source, worldId, sessionId) => {
        const id = generateUniqueId();
        const now = new Date().toISOString();
        
        const newFact: LoreFact = {
          id,
          key,
          value,
          category,
          source,
          worldId,
          sessionId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          facts: { ...state.facts, [id]: newFact }
        }));
      },

      getFacts: (options) => {
        const { facts } = get();
        let results = Object.values(facts);

        if (options?.worldId) {
          results = results.filter(fact => fact.worldId === options.worldId);
        }

        if (options?.category) {
          results = results.filter(fact => fact.category === options.category);
        }

        if (options?.sessionId) {
          results = results.filter(fact => fact.sessionId === options.sessionId);
        }

        return results.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      clearFacts: (worldId) => {
        const { facts } = get();
        const remainingFacts = Object.entries(facts)
          .filter(([, fact]) => fact.worldId !== worldId)
          .reduce((acc, [id, fact]) => ({ ...acc, [id]: fact }), {});
        
        set({ facts: remainingFacts });
      },

      getLoreContext: (worldId, limit = 10) => {
        const worldFacts = get().getFacts({ worldId });
        const recentFacts = worldFacts.slice(0, limit);
        
        const factStrings = recentFacts.map(fact => 
          `${fact.category}: ${fact.key} = ${fact.value}`
        );

        return {
          facts: factStrings,
          factCount: factStrings.length,
        };
      },

      extractFactsFromText: (text, worldId, sessionId) => {
        const extractedFacts = extractBasicFacts(text);
        const { addFact, getFacts } = get();
        
        // Get existing facts to avoid duplicates
        const existingFacts = getFacts({ worldId });
        const existingKeys = new Set(existingFacts.map(f => f.key));
        
        // Add only new facts
        extractedFacts.forEach(({ key, value, category }) => {
          if (!existingKeys.has(key)) {
            addFact(key, value, category, 'narrative', worldId, sessionId);
          }
        });
      },
    }),
    {
      name: 'lore-store',
      storage: createIndexedDBStorage(),
      partialize: (state) => ({ facts: state.facts }),
    }
  )
);