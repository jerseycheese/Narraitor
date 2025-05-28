import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  LoreFact, 
  LoreSearchOptions, 
  LoreContext,
  LoreCategory,
  LoreSource,
  StructuredLoreExtraction 
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
  addFact: (key: string, value: string, category: LoreCategory, source: LoreSource, worldId: EntityID, sessionId?: EntityID, metadata?: LoreFact['metadata']) => void;
  getFacts: (options?: LoreSearchOptions) => LoreFact[];
  clearFacts: (worldId: EntityID) => void;
  
  // AI Integration
  getLoreContext: (worldId: EntityID, limit?: number) => LoreContext;
  
  // Structured extraction (new approach)
  addStructuredLore: (extraction: StructuredLoreExtraction, worldId: EntityID, sessionId?: EntityID) => void;
  
  // Legacy regex extraction (will be deprecated)
  extractFactsFromText: (text: string, worldId: EntityID, sessionId?: EntityID) => void;
}

/**
 * Patterns for extracting facts from narrative text
 */
const extractBasicFacts = (text: string, worldId: EntityID): Array<{
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
    const key = `${worldId}:character_${name.toLowerCase().replace(/\s+/g, '_')}`;
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
  
  // Pattern 1: Basic preposition pattern (from, to, in, at) - only capture the place name
  const basicLocationPattern = /(?:in|at|from|to)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)(?:\s|,|\.|\b)/g;
  while ((match = basicLocationPattern.exec(text)) !== null) {
    const location = match[1].trim();
    // Skip if it's followed by common non-place words
    if (!location.match(/\b(district|quarter|market|bridge|tower|citadel|castle|palace|temple|spire|dome|was|were|is|are|had|have|has|and|or|but|with|for|by|on|upon|under|over|through|across|along|around|before|after|during|while|until|since|because|although|though|if|when|where|why|how|what|who|which|that|this|these|those|stretched|stood|rose|lay)\b/i)) {
      const key = `${worldId}:location_${location.toLowerCase().replace(/\s+/g, '_')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        facts.push({
          key,
          value: location,
          category: 'locations'
        });
      }
    }
  }
  
  // Pattern 2: "X of Y" constructs (e.g., "Citadel of Stars", "city of Aetheria")
  const locationOfPattern = /\b(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)\b/g;
  while ((match = locationOfPattern.exec(text)) !== null) {
    const firstPart = match[1].trim();
    const secondPart = match[2].trim();
    
    // For "city of X" patterns, extract just X
    if (firstPart.toLowerCase().match(/^(city|town|village|kingdom|realm|land|country|province|region)$/)) {
      const key = `${worldId}:location_${secondPart.toLowerCase().replace(/\s+/g, '_')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        facts.push({
          key,
          value: secondPart,
          category: 'locations'
        });
      }
    } else {
      // For other "X of Y" patterns, keep the full name
      const location = `${firstPart} of ${secondPart}`;
      const key = `${worldId}:location_${location.toLowerCase().replace(/\s+/g, '_')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        facts.push({
          key,
          value: location,
          category: 'locations'
        });
      }
    }
  }
  
  // Pattern 3: Named places with location types (e.g., "market district")
  const namedPlacePattern = /\b([a-z]+\s+)?(district|quarter|market|bridge|tower|citadel|castle|palace|temple|spire|dome|plaza|square|avenue|street|road)\b/gi;
  while ((match = namedPlacePattern.exec(text)) !== null) {
    const fullMatch = match[0].trim();
    // Only extract if it has a descriptive prefix
    if (match[1] && match[1].trim()) {
      const location = fullMatch.replace(/^(the\s+)?/i, '');
      const key = `${worldId}:location_${location.toLowerCase().replace(/\s+/g, '_')}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        facts.push({
          key,
          value: location,
          category: 'locations'
        });
      }
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

      addFact: (key, value, category, source, worldId, sessionId, metadata) => {
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
          metadata,
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

      addStructuredLore: (extraction, worldId, sessionId) => {
        const { addFact, getFacts } = get();
        
        // Get existing facts to avoid duplicates
        const existingFacts = getFacts({ worldId });
        const existingKeys = new Set(existingFacts.map(f => f.key));
        
        // Add characters
        extraction.characters.forEach(char => {
          const key = `${worldId}:character_${char.name.toLowerCase().replace(/\s+/g, '_')}`;
          if (!existingKeys.has(key)) {
            addFact(
              key, 
              char.name, 
              'characters', 
              'narrative', 
              worldId, 
              sessionId,
              {
                description: char.description,
                type: char.role,
                importance: char.importance || 'medium',
                tags: char.tags
              }
            );
          }
        });
        
        // Add locations
        extraction.locations.forEach(loc => {
          const key = `${worldId}:location_${loc.name.toLowerCase().replace(/\s+/g, '_')}`;
          if (!existingKeys.has(key)) {
            addFact(
              key, 
              loc.name, 
              'locations', 
              'narrative', 
              worldId, 
              sessionId,
              {
                description: loc.description,
                type: loc.type,
                importance: loc.importance || 'medium',
                tags: loc.tags
              }
            );
          }
        });
        
        // Add events
        extraction.events.forEach(event => {
          const key = `${worldId}:event_${event.description.toLowerCase().replace(/\s+/g, '_').substring(0, 30)}`;
          if (!existingKeys.has(key)) {
            addFact(
              key, 
              event.description, 
              'events', 
              'narrative', 
              worldId, 
              sessionId,
              {
                description: event.significance,
                importance: event.importance || 'medium',
                relatedEntities: event.relatedEntities
              }
            );
          }
        });
        
        // Add rules
        extraction.rules.forEach(rule => {
          const key = `${worldId}:rule_${rule.rule.toLowerCase().replace(/\s+/g, '_').substring(0, 30)}`;
          if (!existingKeys.has(key)) {
            addFact(
              key, 
              rule.rule, 
              'rules', 
              'narrative', 
              worldId, 
              sessionId,
              {
                description: rule.context,
                importance: rule.importance || 'medium',
                tags: rule.tags
              }
            );
          }
        });
      },

      extractFactsFromText: (text, worldId, sessionId) => {
        const extractedFacts = extractBasicFacts(text, worldId);
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