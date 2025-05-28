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
 * Lore store for tracking narrative facts
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
  
  // Fact extraction
  extractFactsFromText: (text: string, worldId: EntityID, sessionId?: EntityID) => void;
}

/**
 * Patterns for extracting facts from narrative text
 */
const extractBasicFacts = (text: string): Array<{
  key: string;
  value: string;
  category: LoreCategory;
}> => {
  const facts: Array<{ key: string; value: string; category: LoreCategory }> = [];
  const seenKeys = new Set<string>();
  
  // Extract character names (pattern for titles + names)
  const characterPattern = /\b((?:Sir|Lady|Lord|Captain|Master|Dr\.|Professor|King|Queen|Prince|Princess) [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  let match;
  while ((match = characterPattern.exec(text)) !== null) {
    const name = match[1].trim();
    const key = `character_${name.toLowerCase().replace(/\s+/g, '_')}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      facts.push({
        key,
        value: name,
        category: 'characters'
      });
    }
  }
  
  // Extract locations - multiple patterns for better coverage
  
  // Pattern 1: Basic preposition pattern (from, to, in, at)
  const basicLocationPattern = /(?:in|at|from|to) (?:the )?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  while ((match = basicLocationPattern.exec(text)) !== null) {
    const location = match[1].trim();
    const key = `location_${location.toLowerCase().replace(/\s+/g, '_')}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      facts.push({
        key,
        value: location,
        category: 'locations'
      });
    }
  }
  
  // Pattern 2: "the X of Y" (e.g., "the Citadel of Stars", "the city of Aetheria")
  const locationOfPattern = /\b(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  while ((match = locationOfPattern.exec(text)) !== null) {
    const location = `${match[1]} of ${match[2]}`;
    const key = `location_${location.toLowerCase().replace(/\s+/g, '_')}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      facts.push({
        key,
        value: location,
        category: 'locations'
      });
    }
  }
  
  // Pattern 3: Named places (capitalized words with location context)
  const namedPlacePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:district|quarter|market|bridge|tower|citadel|castle|palace|temple|spire|dome)\b/gi;
  while ((match = namedPlacePattern.exec(text)) !== null) {
    const location = match[0].trim();
    const key = `location_${location.toLowerCase().replace(/\s+/g, '_')}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      facts.push({
        key,
        value: location,
        category: 'locations'
      });
    }
  }
  
  // Pattern 4: Standalone proper nouns with location context
  const contextualLocationPattern = /\b(?:city|town|village|kingdom|realm|land|country|province|region)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi;
  while ((match = contextualLocationPattern.exec(text)) !== null) {
    const place = match[1].trim();
    const key = `location_${place.toLowerCase().replace(/\s+/g, '_')}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      facts.push({
        key,
        value: place,
        category: 'locations'
      });
    }
  }
  
  return facts;
};

/**
 * Lore store implementation
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