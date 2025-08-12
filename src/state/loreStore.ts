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
import { normalizeText } from '../lib/utils/textNormalization';

/**
 * Helper function to generate normalized lore keys
 */
function generateLoreKey(worldId: string, category: string, name: string, maxLength?: number): string {
  const normalizedName = normalizeText(name, {
    normalizeWhitespace: true,
    normalizeQuotes: true,
    normalizeSpecialChars: true,
    normalizeLineEndings: true,
    preserveStructure: false
  }).toLowerCase().replace(/[^a-z0-9]+/g, '_');
  
  const truncatedName = maxLength ? normalizedName.substring(0, maxLength) : normalizedName;
  return `${worldId}:${category}_${truncatedName}`;
}

/**
 * Fact validation structure
 */
interface FactValidation {
  key: string;
  value: string;
  category: LoreCategory;
  worldId: EntityID;
}

/**
 * Fact history tracking
 */
interface FactHistory {
  factId: EntityID;
  versions: LoreFact[];
}

/**
 * Lore store for tracking narrative facts
 */
export interface LoreStore {
  // State
  facts: Record<EntityID, LoreFact>;
  factHistory: Record<EntityID, FactHistory>;
  
  // Core Operations
  addFact: (key: string, value: string, category: LoreCategory, source: LoreSource, worldId: EntityID, sessionId?: EntityID, metadata?: LoreFact['metadata']) => void;
  getFacts: (options?: LoreSearchOptions) => LoreFact[];
  clearFacts: (worldId: EntityID) => void;
  
  // Enhanced Developer Operations
  updateFact: (id: EntityID, updates: Partial<LoreFact>) => void;
  deleteFact: (id: EntityID) => void;
  validateFactUniqueness: (worldId: EntityID, key: string, value: string) => boolean;
  findSimilarFacts: (worldId: EntityID, value: string) => LoreFact[];
  searchFacts: (query: string, options?: LoreSearchOptions) => LoreFact[];
  exportFacts: (worldId: EntityID) => string;
  importFacts: (worldId: EntityID, jsonData: string) => void;
  getFactHistory: (id: EntityID) => LoreFact[];
  
  // Validation
  validateFact: (fact: Partial<FactValidation>) => boolean;
  validateKey: (key: string) => boolean;
  
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
      factHistory: {},

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
          facts: { ...state.facts, [id]: newFact },
          factHistory: { 
            ...state.factHistory, 
            [id]: { factId: id, versions: [newFact] } 
          }
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
          const key = generateLoreKey(worldId, 'character', char.name);
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
          const key = generateLoreKey(worldId, 'location', loc.name);
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
          const key = generateLoreKey(worldId, 'event', event.description, 30);
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
          const key = generateLoreKey(worldId, 'rule', rule.rule, 30);
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

      // Enhanced Developer Operations
      updateFact: (id, updates) => {
        const { facts, factHistory } = get();
        const existingFact = facts[id];
        
        if (!existingFact) return;

        const updatedFact = {
          ...existingFact,
          ...updates,
          id: existingFact.id, // Preserve ID
          createdAt: existingFact.createdAt, // Preserve creation time
          updatedAt: new Date().toISOString()
        };

        const history = factHistory[id] || { factId: id, versions: [] };
        history.versions.push(updatedFact);

        set((state) => ({
          facts: { ...state.facts, [id]: updatedFact },
          factHistory: { ...state.factHistory, [id]: history }
        }));
      },

      deleteFact: (id) => {
        const { facts } = get();
        if (!facts[id]) return;
        
        set((state) => {
          const newFacts = { ...state.facts };
          const newHistory = { ...state.factHistory };
          delete newFacts[id];
          delete newHistory[id];
          return {
            facts: newFacts,
            factHistory: newHistory
          };
        });
      },

      validateFactUniqueness: (worldId, key, value) => {
        const { facts } = get();
        const worldFacts = Object.values(facts).filter(f => f.worldId === worldId);
        
        // Check for exact duplicate
        const hasDuplicate = worldFacts.some(f => 
          f.key === key && f.value === value
        );
        
        return !hasDuplicate; // Return true if unique, false if duplicate
      },

      findSimilarFacts: (worldId, value) => {
        const { facts } = get();
        const worldFacts = Object.values(facts).filter(f => f.worldId === worldId);
        const normalizedValue = normalizeText(value, {
          normalizeWhitespace: true,
          normalizeQuotes: true,
          normalizeSpecialChars: true,
          normalizeLineEndings: true,
          preserveStructure: false
        }).toLowerCase();
        
        return worldFacts.filter(fact => {
          const normalizedFactValue = normalizeText(fact.value, {
            normalizeWhitespace: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            normalizeLineEndings: true,
            preserveStructure: false
          }).toLowerCase();
          
          return normalizedFactValue === normalizedValue;
        });
      },

      searchFacts: (query, options) => {
        const { facts } = get();
        let results = Object.values(facts);
        
        // Apply search options filters first
        if (options?.worldId) {
          results = results.filter(fact => fact.worldId === options.worldId);
        }
        
        if (options?.category) {
          results = results.filter(fact => fact.category === options.category);
        }
        
        if (options?.sessionId) {
          results = results.filter(fact => fact.sessionId === options.sessionId);
        }
        
        // Apply text search
        const normalizedQuery = query.toLowerCase();
        results = results.filter(fact => 
          fact.value.toLowerCase().includes(normalizedQuery) ||
          fact.key.toLowerCase().includes(normalizedQuery) ||
          fact.metadata?.description?.toLowerCase().includes(normalizedQuery) ||
          fact.metadata?.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))
        );
        
        return results.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      exportFacts: (worldId) => {
        const facts = get().getFacts({ worldId });
        const exportData = {
          worldId,
          exportedAt: new Date().toISOString(),
          facts: facts.map(fact => ({
            key: fact.key,
            value: fact.value,
            category: fact.category,
            source: fact.source,
            metadata: fact.metadata
          }))
        };
        
        return JSON.stringify(exportData, null, 2);
      },

      importFacts: (worldId, jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          const { addFact, validateFactUniqueness } = get();
          
          if (!data.facts || !Array.isArray(data.facts)) {
            throw new Error('Invalid import data structure');
          }
          
          data.facts.forEach((fact: {
            key: string;
            value: string;
            category: LoreCategory;
            source?: LoreSource;
            metadata?: {
              description?: string;
              importance?: 'low' | 'medium' | 'high';
              tags?: string[];
              relatedEntities?: string[];
              type?: string;
            };
          }) => {
            // Check if fact already exists
            if (validateFactUniqueness(worldId, fact.key, fact.value)) {
              addFact(
                fact.key,
                fact.value,
                fact.category,
                fact.source || 'manual',
                worldId,
                undefined,
                fact.metadata
              );
            }
          });
        } catch (error) {
          // Wrap the error with additional context about the import operation
          throw new Error(`Failed to import facts for worldId "${worldId}": ${error instanceof Error ? error.message : String(error)}`);
        }
      },

      getFactHistory: (id) => {
        const { factHistory } = get();
        const history = factHistory[id];
        return history ? history.versions : [];
      },

      validateFact: (fact) => {
        const validCategories: LoreCategory[] = ['characters', 'locations', 'events', 'rules'];
        
        if (!fact.key || fact.key.trim() === '') return false;
        if (!fact.value || fact.value.trim() === '') return false;
        if (!fact.category || !validCategories.includes(fact.category)) return false;
        if (!fact.worldId || fact.worldId.trim() === '') return false;
        
        return true;
      },

      validateKey: (key) => {
        // Key should be alphanumeric with underscores, not starting with a number
        const keyPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
        return keyPattern.test(key);
      },
    }),
    {
      name: 'lore-store',
      storage: createIndexedDBStorage(),
      partialize: (state) => ({ 
        facts: state.facts,
        factHistory: state.factHistory 
      }),
    }
  )
);
