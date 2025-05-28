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
 * Lore store interface with state and actions
 */
export interface LoreStore {
  // State
  facts: Record<EntityID, LoreFact>;
  error: string | null;
  loading: boolean;

  // Core CRUD Operations
  createFact: (fact: Omit<LoreFact, 'id' | 'createdAt' | 'updatedAt'>) => EntityID;
  updateFact: (id: EntityID, updates: Partial<LoreFact>) => void;
  deleteFact: (id: EntityID) => void;
  clearAllFacts: () => void;

  // Query Operations
  getFactsByWorld: (worldId: EntityID) => LoreFact[];
  searchFacts: (options: LoreSearchOptions) => LoreFact[];
  getRelatedFacts: (factId: EntityID) => LoreFact[];

  // AI Integration
  getLoreContext: (worldId: EntityID, relevantTags?: string[], maxFacts?: number) => LoreContext;
  extractFactsFromText: (text: string, worldId: EntityID, source: LoreSource) => void;

  // State Management
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  facts: {},
  error: null,
  loading: false,
};

/**
 * Extract potential facts from narrative text using simple heuristics
 */
const extractFactsFromNarrativeText = (
  text: string, 
  worldId: EntityID, 
  source: LoreSource
): Omit<LoreFact, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const extractedFacts: Omit<LoreFact, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  // Simple patterns for fact extraction
  const patterns = {
    characters: [
      /([A-Z][a-z]+ [A-Z][a-z]+), the ([^,]+),/g,
      /Sir ([A-Z][a-z]+)/g,
      /Lady ([A-Z][a-z]+)/g,
      /([A-Z][a-z]+) the ([A-Z][a-z]+)/g
    ],
    locations: [
      /the ([A-Z][a-z]+ of [A-Z][a-z]+)/g,
      /([A-Z][a-z]+ [A-Z][a-z]+) stands/g,
      /in the ([A-Z][a-z]+ [A-Z][a-z]+)/g,
      /at ([A-Z][a-z]+ [A-Z][a-z]+)/g
    ],
    events: [
      /The ([^.]+) happened/g,
      /during the ([^,]+),/g,
      /([A-Z][^.]+) occurred/g
    ]
  };

  // Extract character facts
  patterns.characters.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1] || match[0];
      const title = match[2] || '';
      extractedFacts.push({
        category: 'characters',
        title: `Character: ${name}`,
        content: `${name}${title ? ` - ${title}` : ''} mentioned in narrative`,
        source,
        tags: ['character', 'extracted'],
        isCanonical: false,
        relatedFacts: [],
        worldId,
        sourceReference: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20)
      });
    }
  });

  // Extract location facts
  patterns.locations.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const location = match[1] || match[0];
      extractedFacts.push({
        category: 'locations',
        title: `Location: ${location}`,
        content: `${location} mentioned in narrative`,
        source,
        tags: ['location', 'extracted'],
        isCanonical: false,
        relatedFacts: [],
        worldId,
        sourceReference: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20)
      });
    }
  });

  // Remove duplicates based on title
  const uniqueFacts = extractedFacts.filter((fact, index, arr) => 
    arr.findIndex(f => f.title === fact.title) === index
  );

  return uniqueFacts;
};

/**
 * Generate a summary for lore context
 */
const generateContextSummary = (facts: LoreFact[]): string => {
  const categories = facts.reduce((acc, fact) => {
    acc[fact.category] = (acc[fact.category] || 0) + 1;
    return acc;
  }, {} as Record<LoreCategory, number>);

  const summaryParts = Object.entries(categories).map(([category, count]) => 
    `${count} ${category}${count > 1 ? 's' : ''}`
  );

  const allTags = facts.flatMap(f => f.tags);
  const commonTags = [...new Set(allTags)]
    .map(tag => ({ tag, count: allTags.filter(t => t === tag).length }))
    .filter(t => t.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(t => t.tag);

  return `Lore context includes ${summaryParts.join(', ')}${
    commonTags.length > 0 ? ` with common themes: ${commonTags.join(', ')}` : ''
  }`;
};

/**
 * Lore store implementation with Zustand
 */
export const useLoreStore = create<LoreStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Core CRUD Operations
      createFact: (factData) => {
        const id = generateUniqueId();
        const now = new Date().toISOString();
        
        const newFact: LoreFact = {
          ...factData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          facts: { ...state.facts, [id]: newFact },
          error: null,
        }));

        return id;
      },

      updateFact: (id, updates) => {
        const { facts } = get();
        if (!facts[id]) {
          console.warn(`Fact with id ${id} not found`);
          return;
        }

        const updatedFact: LoreFact = {
          ...facts[id],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          facts: { ...state.facts, [id]: updatedFact },
          error: null,
        }));
      },

      deleteFact: (id) => {
        const { facts } = get();
        if (!facts[id]) {
          console.warn(`Fact with id ${id} not found`);
          return;
        }

        const { [id]: deleted, ...remainingFacts } = facts;
        
        // Remove this fact from any related facts
        Object.values(remainingFacts).forEach(fact => {
          if (fact.relatedFacts.includes(id)) {
            get().updateFact(fact.id, {
              relatedFacts: fact.relatedFacts.filter(relatedId => relatedId !== id)
            });
          }
        });

        set({ facts: remainingFacts, error: null });
      },

      clearAllFacts: () => {
        set({ facts: {}, error: null });
      },

      // Query Operations
      getFactsByWorld: (worldId) => {
        const { facts } = get();
        return Object.values(facts)
          .filter(fact => fact.worldId === worldId)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      searchFacts: (options) => {
        const { facts } = get();
        let results = Object.values(facts);

        // Filter by world
        if (options.worldId) {
          results = results.filter(fact => fact.worldId === options.worldId);
        }

        // Filter by category
        if (options.category) {
          results = results.filter(fact => fact.category === options.category);
        }

        // Filter by source
        if (options.source) {
          results = results.filter(fact => fact.source === options.source);
        }

        // Filter by canonical status
        if (options.isCanonical !== undefined) {
          results = results.filter(fact => fact.isCanonical === options.isCanonical);
        }

        // Filter by tags
        if (options.tags && options.tags.length > 0) {
          results = results.filter(fact => 
            options.tags!.some(tag => fact.tags.includes(tag))
          );
        }

        // Filter by search term
        if (options.searchTerm) {
          const searchLower = options.searchTerm.toLowerCase();
          results = results.filter(fact => 
            fact.title.toLowerCase().includes(searchLower) ||
            fact.content.toLowerCase().includes(searchLower) ||
            fact.tags.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }

        return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      getRelatedFacts: (factId) => {
        const { facts } = get();
        const fact = facts[factId];
        if (!fact) return [];

        return fact.relatedFacts
          .map(id => facts[id])
          .filter(Boolean)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      // AI Integration
      getLoreContext: (worldId, relevantTags = [], maxFacts = 20) => {
        const searchOptions: LoreSearchOptions = {
          worldId,
          isCanonical: true, // Prioritize canonical facts for AI context
        };

        if (relevantTags.length > 0) {
          searchOptions.tags = relevantTags;
        }

        const relevantFacts = get().searchFacts(searchOptions).slice(0, maxFacts);
        
        return {
          relevantFacts,
          contextSummary: generateContextSummary(relevantFacts),
          factCount: relevantFacts.length,
        };
      },

      extractFactsFromText: (text, worldId, source) => {
        set({ loading: true });
        
        try {
          const extractedFacts = extractFactsFromNarrativeText(text, worldId, source);
          
          extractedFacts.forEach(factData => {
            get().createFact(factData);
          });
          
          set({ loading: false, error: null });
        } catch (error) {
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Failed to extract facts' 
          });
        }
      },

      // State Management
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ loading }),
      reset: () => set(initialState),
    }),
    {
      name: 'lore-store',
      storage: createIndexedDBStorage('lore-store'),
      partialize: (state) => ({ facts: state.facts }),
    }
  )
);