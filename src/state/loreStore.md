# Lore Management Store

Zustand store for managing lore facts and maintaining narrative consistency in the Narraitor application.

## Overview

The lore store provides comprehensive management of narrative facts, enabling:
- **Narrative Consistency**: Track established facts to maintain story coherence
- **AI Integration**: Provide context to AI systems for consistent generation
- **User Management**: Allow players to manually add and curate lore
- **Automatic Extraction**: Extract facts from narrative text

## Store Interface

```typescript
interface LoreStore {
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
```

## Usage Examples

### Basic CRUD Operations

```typescript
import { useLoreStore } from '@/state/loreStore';

function ExampleComponent() {
  const { createFact, updateFact, deleteFact, getFactsByWorld } = useLoreStore();

  // Create a new fact
  const factId = createFact({
    category: 'characters',
    title: 'Hero Background',
    content: 'The hero was raised by dragons in the northern mountains',
    source: 'manual',
    tags: ['hero', 'dragons', 'background'],
    isCanonical: true,
    relatedFacts: [],
    worldId: 'world-123'
  });

  // Update an existing fact
  updateFact(factId, {
    content: 'The hero was raised by ancient dragons in the mystical northern peaks',
    tags: ['hero', 'dragons', 'background', 'mystical']
  });

  // Get all facts for a world
  const worldFacts = getFactsByWorld('world-123');
  
  // Delete a fact
  deleteFact(factId);
}
```

### Search and Filtering

```typescript
import { useLoreStore } from '@/state/loreStore';

function SearchExample() {
  const { searchFacts } = useLoreStore();

  // Search by category
  const characterFacts = searchFacts({
    category: 'characters',
    worldId: 'world-123'
  });

  // Search by tags
  const dragonFacts = searchFacts({
    tags: ['dragons'],
    worldId: 'world-123'
  });

  // Complex search
  const importantCanonicalFacts = searchFacts({
    worldId: 'world-123',
    tags: ['important'],
    isCanonical: true,
    searchTerm: 'magic'
  });

  // Search by source
  const aiGeneratedFacts = searchFacts({
    worldId: 'world-123',
    source: 'ai_generated'
  });
}
```

### AI Context Generation

```typescript
import { useLoreStore } from '@/state/loreStore';

function AIIntegrationExample() {
  const { getLoreContext, extractFactsFromText } = useLoreStore();

  // Get relevant lore context for AI prompts
  const loreContext = getLoreContext('world-123', ['current-scene', 'important'], 15);
  
  console.log(loreContext.contextSummary);
  // "Lore context includes 3 characters, 2 locations with common themes: dragons, magic"
  
  // Use context in AI prompt
  const enhancedPrompt = `
    Generate the next scene based on this context:
    
    Established Lore:
    ${loreContext.contextSummary}
    
    Key Facts:
    ${loreContext.relevantFacts.map(fact => `- ${fact.title}: ${fact.content}`).join('\n')}
    
    Ensure consistency with these established facts.
  `;

  // Extract facts from AI-generated content
  const aiResponse = "The ancient Tower of Valdris stands guard over the valley...";
  extractFactsFromText(aiResponse, 'world-123', 'ai_generated');
}
```

## Fact Categories

The store supports the following fact categories:

- **`characters`**: People, creatures, NPCs
- **`locations`**: Places, buildings, geographical features  
- **`events`**: Historical events, recent happenings
- **`rules`**: World mechanics, magic systems, laws
- **`items`**: Important objects, artifacts, equipment
- **`organizations`**: Guilds, factions, governments

## Source Types

Facts can originate from different sources:

- **`narrative`**: Extracted from game narrative text
- **`manual`**: Manually added by players
- **`ai_generated`**: Created by AI during generation
- **`imported`**: Imported from external sources

## Persistence

The store uses IndexedDB for persistence:
- Facts are automatically saved to browser storage
- Data persists across browser sessions
- Graceful fallback if storage is unavailable
- Configurable through persistence middleware

## Fact Extraction

The store includes automatic fact extraction from narrative text:

```typescript
// Example extraction patterns
const narrativeText = `
  The ancient Tower of Valdris stands guard over the valley. 
  Sir Marcus, the knight commander, leads the defense.
`;

extractFactsFromText(narrativeText, 'world-123', 'narrative');

// Extracts:
// - Location: "Tower of Valdris" 
// - Character: "Sir Marcus, the knight commander"
```

### Extraction Patterns

Current patterns detect:
- **Characters**: Titles like "Sir", "Lady", "Name the Title"
- **Locations**: Structures that "stand", places mentioned with "in the", "at"
- **Events**: Past tense actions, "during the", "occurred"

## AI Integration Benefits

1. **Consistency**: AI receives relevant lore context in prompts
2. **Continuity**: Facts ensure narrative coherence across sessions
3. **Enrichment**: New content automatically adds to lore database
4. **Validation**: Potential conflicts can be detected and resolved

## Error Handling

The store includes robust error handling:
- Non-existent fact operations fail gracefully
- Storage errors don't break the application
- User-friendly error messages for UI display
- Automatic recovery from transient failures

## Testing

Comprehensive test coverage includes:
- CRUD operations
- Search and filtering
- AI context generation
- Fact extraction
- Error handling
- Loading states
- Persistence integration

Run tests with:
```bash
npm test -- src/state/__tests__/loreStore.test.ts
```