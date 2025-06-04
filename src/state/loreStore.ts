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
  
  // Structured extraction
  addStructuredLore: (extraction: StructuredLoreExtraction, worldId: EntityID, sessionId?: EntityID) => void;
}


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
    }),
    {
      name: 'lore-store',
      storage: createIndexedDBStorage(),
      partialize: (state) => ({ facts: state.facts }),
    }
  )
);
