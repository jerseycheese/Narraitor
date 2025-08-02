---
title: TypeScript Types Reference
tags: [api, types, typescript, reference]
created: 2025-06-26
updated: 2025-06-26
---

# TypeScript Types Reference

This here are the main TypeScript interfaces and types used throughout the app. These define the data structures for worlds, characters, narratives, and other core entities.

## Base Types

```typescript
// Common types used throughout the app
type EntityID = string;
type Timestamp = string; // ISO 8601

interface BaseEntity {
  id: EntityID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface NamedEntity extends BaseEntity {
  name: string;
  description?: string;
}
```

## World Types

```typescript
interface World extends NamedEntity {
  attributes: WorldAttribute[];
  skills: string[];
  theme: string;
  settings: WorldSettings;
}

interface WorldAttribute {
  name: string;
  description?: string;
  min: number;
  max: number;
  default: number;
}

interface WorldSettings {
  toneSettings: ToneSettings;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  allowCustomInput: boolean;
}
```

## Character Types

```typescript
interface Character extends NamedEntity {
  worldId: EntityID;
  attributes: Record<string, number>;
  skills: string[];
  background?: string;
  portrait?: Portrait;
  level: number;
  experience: number;
}

interface Portrait {
  type: 'ai-generated' | 'placeholder' | 'custom';
  url?: string;
  description?: string;
  style?: 'realistic' | 'artistic' | 'cartoon';
}
```

## Narrative Types

```typescript
interface NarrativeEntry extends BaseEntity {
  sessionId: EntityID;
  content: string;
  type: 'narrative' | 'player-action' | 'system-message';
  characterId?: EntityID;
}

interface Decision {
  id: EntityID;
  prompt: string;
  options: Choice[];
  context: NarrativeContext;
}

interface Choice {
  id: EntityID;
  text: string;
  type: 'ai-generated' | 'custom-input';
  metadata?: ChoiceMetadata;
}

interface NarrativeContext {
  worldId: EntityID;
  characterIds: EntityID[];
  recentEntries: NarrativeEntry[];
  currentLocation?: string;
}
```

## Session Types

```typescript
interface GameSession extends BaseEntity {
  worldId: EntityID;
  characterIds: EntityID[];
  status: 'active' | 'paused' | 'completed';
  currentLocation?: string;
  metadata: SessionMetadata;
}

interface SessionMetadata {
  totalEntries: number;
  startTime: Timestamp;
  endTime?: Timestamp;
  pausedAt?: Timestamp;
}
```

## Journal Types

```typescript
interface JournalEntry extends BaseEntity {
  sessionId: EntityID;
  title: string;
  content: string;
  tags: string[];
  category: 'event' | 'character' | 'location' | 'item' | 'lore';
  importance: 'low' | 'medium' | 'high';
}

type JournalFilter = {
  category?: JournalEntry['category'];
  importance?: JournalEntry['importance'];
  tags?: string[];
  dateRange?: [Timestamp, Timestamp];
};
```

## Inventory Types

```typescript
interface InventoryItem extends NamedEntity {
  characterId: EntityID;
  type: 'weapon' | 'armor' | 'consumable' | 'misc';
  quantity: number;
  effects?: ItemEffect[];
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface ItemEffect {
  type: 'attribute-bonus' | 'skill-bonus' | 'special';
  target: string;
  value: number;
  duration?: 'permanent' | 'temporary' | 'combat';
}
```

## AI Context Types

```typescript
interface AIContext {
  worldId: EntityID;
  characterIds: EntityID[];
  conversationHistory: AIMessage[];
  activePrompts: PromptTemplate[];
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
}

interface PromptTemplate {
  id: EntityID;
  name: string;
  template: string;
  variables: string[];
  category: 'narrative' | 'choice' | 'character' | 'world';
}
```

## State Management Types

```typescript
// Generic store interface
interface BaseStore<T> {
  entities: Record<EntityID, T>;
  currentEntityId: EntityID | null;
  loading: boolean;
  error: string | null;
  
  create: (data: Omit<T, keyof BaseEntity>) => EntityID;
  update: (id: EntityID, updates: Partial<T>) => void;
  delete: (id: EntityID) => void;
  setCurrent: (id: EntityID) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Store types
type WorldStore = BaseStore<World> & {
  getWorldCharacters: (worldId: EntityID) => Character[];
};

type CharacterStore = BaseStore<Character> & {
  getByWorldId: (worldId: EntityID) => Character[];
  levelUp: (characterId: EntityID) => void;
};

type NarrativeStore = BaseStore<NarrativeEntry> & {
  currentChoices: Decision | null;
  isGenerating: boolean;
  
  generateNarrative: (context: NarrativeContext) => Promise<void>;
  selectChoice: (choiceId: EntityID) => void;
  submitCustomInput: (input: string) => void;
};
```

## Form Types

```typescript
// Form data types (without IDs and timestamps)
type CreateWorldData = Omit<World, keyof BaseEntity>;
type CreateCharacterData = Omit<Character, keyof BaseEntity>;
type CreateSessionData = Omit<GameSession, keyof BaseEntity | 'status'>;

// Update types (all fields optional)
type UpdateWorldData = Partial<Omit<World, 'id' | 'createdAt'>>;
type UpdateCharacterData = Partial<Omit<Character, 'id' | 'createdAt'>>;
```

## Utility Types

```typescript
// API response types
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Timestamp;
}

// Pagination types
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Search types
interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}
```

## Validation Types

```typescript
// Form validation
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Type guards
const isWorld = (obj: any): obj is World => {
  return obj && typeof obj.id === 'string' && Array.isArray(obj.attributes);
};

const isCharacter = (obj: any): obj is Character => {
  return obj && typeof obj.worldId === 'string' && typeof obj.attributes === 'object';
};
```

## File Locations

Types are organized by domain:
- `/src/types/common.types.ts` - Base and utility types
- `/src/types/world.types.ts` - World-related types
- `/src/types/character.types.ts` - Character-related types
- `/src/types/narrative.types.ts` - Narrative and AI types
- `/src/types/session.types.ts` - Game session types
- `/src/types/journal.types.ts` - Journal and lore types
- `/src/types/inventory.types.ts` - Inventory and items

## Usage Examples

```typescript
// Type-safe store usage
const { worlds, createWorld } = useWorldStore();
const worldData: CreateWorldData = {
  name: 'Wild West',
  description: 'Frontier setting',
  attributes: [{ name: 'Strength', min: 1, max: 10, default: 5 }],
  skills: ['Gunslinging'],
  theme: 'western',
  settings: { /* ... */ }
};
const worldId = createWorld(worldData);

// Type-safe API calls
const response: APIResponse<Character[]> = await fetch('/api/characters');

// Type guards in practice
if (isCharacter(entity)) {
  console.log(entity.worldId); // TypeScript knows this is a Character
}
```