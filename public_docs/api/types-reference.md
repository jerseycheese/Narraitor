---
title: TypeScript Types Reference
tags: [api, types, typescript, reference]
created: 2025-06-26
updated: 2025-06-26
---

# TypeScript Types Reference

TypeScript types for worlds, characters, narratives, and everything else. These interfaces define how data is structured.

## Base Types

Foundation types used throughout the app:

```typescript
// Common types used throughout the app
type EntityID = string;
type ISODateString = string; // ISO 8601 datetime

interface NamedEntity {
  id: EntityID;
  name: string;
  description: string;
}

interface TimestampedEntity {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
```

## World Types

Worlds define the setting and rules for storytelling. They're like game systems - each world has its own attributes, skills, and tone settings:

```typescript
interface World extends NamedEntity, TimestampedEntity {
  description: string;
  genre: GenreValue;
  attributes: WorldAttribute[];
  skills: WorldSkill[];
  settings: WorldSettings;
  image?: GeneratedImage;
  reference?: string;
  relationship?: 'set_within' | 'inspired_by';
  toneSettings?: ToneSettings;
}

interface WorldAttribute extends NamedEntity {
  worldId: EntityID;
  description: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
  category?: string;
}

interface WorldSkill extends NamedEntity {
  worldId: EntityID;
  description: string;
  attributeIds?: EntityID[];
  difficulty: SkillDifficulty;
  category?: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
}

interface WorldSettings {
  maxAttributes: number;
  maxSkills: number;
  attributePointPool: number;
  skillPointPool: number;
}
```

## Character Types

Characters are player avatars with stats, skills, and personality. They're tied to a specific world and inherit that world's attribute system:

```typescript
interface Character extends NamedEntity, TimestampedEntity {
  worldId: EntityID;
  attributes: CharacterAttribute[];
  skills: CharacterSkill[];
  background: CharacterBackground;
  inventory: Inventory;
  status: CharacterStatus;
  portrait?: GeneratedImage;
}

interface CharacterAttribute {
  attributeId: EntityID;
  value: number;
}

interface CharacterSkill {
  skillId: EntityID;
  level: number;
  experience: number;
  isActive: boolean;
}

interface CharacterBackground {
  history: string;
  personality: string;
  physicalDescription?: string;
  goals: string[];
  fears: string[];
  relationships: CharacterRelationship[];
  isKnownFigure?: boolean;
  knownFigureType?: 'historical' | 'fictional' | 'celebrity' | 'mythological' | 'other';
}

interface CharacterStatus {
  health: number;
  maxHealth: number;
  conditions: string[];
  location?: string;
}
```

## Narrative Types

These handle the actual storytelling content - the back-and-forth between AI and player that creates the story:

```typescript
interface NarrativeSegment extends TimestampedEntity {
  id: EntityID;
  worldId?: EntityID;
  sessionId?: EntityID;
  content: string;
  type: 'scene' | 'dialogue' | 'action' | 'transition' | 'ending';
  characterIds?: EntityID[];
  decisions?: Decision[];
  metadata: NarrativeMetadata;
  timestamp: Date;
}

interface Decision {
  id: EntityID;
  prompt: string;
  options: DecisionOption[];
  selectedOptionId?: EntityID;
  selectedAt?: Date;
  characterId?: EntityID;
  consequences?: Consequence[];
  contextSummary?: string;
  decisionWeight?: DecisionWeight;
  narrativeSegmentId?: EntityID;
}

interface DecisionOption {
  id: EntityID;
  text: string;
  requirements?: DecisionRequirement[];
  requiredItems?: DecisionItemRequirements;
  hint?: string;
  isCustomInput?: boolean;
  customText?: string;
  alignment?: ChoiceAlignment;
}

interface NarrativeContext {
  worldId: EntityID;
  currentSceneId: EntityID;
  characterIds: EntityID[];
  previousSegments: NarrativeSegment[];
  currentTags: string[];
  sessionId: EntityID;
  recentSegments?: NarrativeSegment[];
  currentLocation?: string;
  currentSituation?: string;
  importantEntities?: Array<{
    id: EntityID;
    type: string;
    name: string;
    description?: string;
    avatarUrl?: string | null;
    role?: string;
  }>;
}
```

## Session Types

```typescript
interface GameSession extends TimestampedEntity {
  id: EntityID;
  worldId: EntityID;
  characterId: EntityID;
  state: SessionState;
  narrativeHistory: EntityID[]; // NarrativeSegment IDs
  currentContext: NarrativeContext;
}
```

## Journal Types

```typescript
interface JournalEntry extends TimestampedEntity {
  id: EntityID;
  sessionId: EntityID;
  worldId: EntityID;
  characterId: EntityID;
  type: JournalEntryType;
  title: string;
  content: string;
  detailedContent?: string;
  significance: 'minor' | 'major' | 'critical';
  isRead: boolean;
  relatedEntities: RelatedEntity[];
  metadata: JournalMetadata;
}

type JournalFilter = {
  type?: JournalEntryType;
  significance?: 'minor' | 'major' | 'critical';
  isRead?: boolean;
  dateRange?: [ISODateString, ISODateString];
};
```

## Inventory Types

```typescript
type InventoryAcquisitionMethod =
  | 'loot'
  | 'quest'
  | 'purchase'
  | 'craft'
  | 'reward'
  | 'gift'
  | 'manual'
  | 'unknown';

interface InventoryAcquisitionRecord {
  acquiredAt: ISODateString;
  method: InventoryAcquisitionMethod;
  quantity: number;
  description?: string;
  sourceId?: EntityID;
  sessionId?: EntityID;
  recordedBy?: EntityID;
}

type InventoryCategorizationSource = 'ai' | 'manual' | 'system' | 'fallback';

interface InventoryItemCategorization {
  categoryId: StandardInventoryCategory;
  source: InventoryCategorizationSource;
  classifiedAt: ISODateString;
  confidence?: number;
  model?: string;
  rationale?: string;
}

interface InventoryItem extends NamedEntity, TimestampedEntity {
  categoryId: StandardInventoryCategory;
  quantity: number;
  stackable: boolean;
  maxStack?: number;
  acquisitionHistory: InventoryAcquisitionRecord[];
  categorization: InventoryItemCategorization;
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
  timestamp: ISODateString;
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
  error: UserFriendlyError | null;

  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => EntityID;
  update: (id: EntityID, updates: Partial<T>) => void;
  delete: (id: EntityID) => void;
  setCurrent: (id: EntityID) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: UserFriendlyError | null) => void;
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

type NarrativeStore = BaseStore<NarrativeSegment> & {
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
type CreateWorldData = Omit<World, 'id' | 'createdAt' | 'updatedAt'>;
type CreateCharacterData = Omit<Character, 'id' | 'createdAt' | 'updatedAt'>;
type CreateSessionData = Omit<GameSession, 'id' | 'createdAt' | 'updatedAt'>;

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
  timestamp: ISODateString;
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

// Type guards for runtime validation
const isNarrativeSegment = (obj: any): obj is NarrativeSegment => {
  return obj && typeof obj.id === 'string' && typeof obj.content === 'string';
};

const isJournalEntry = (obj: any): obj is JournalEntry => {
  return obj && typeof obj.id === 'string' && typeof obj.type === 'string';
};
```

## File Locations

Types are split by domain:

- `/src/types/common.types.ts` - Base and utility types
- `/src/types/world.types.ts` - World-related types
- `/src/types/character.types.ts` - Character-related types
- `/src/types/narrative.types.ts` - Narrative and AI types
- `/src/types/session.types.ts` - Game session types
- `/src/types/journal.types.ts` - Journal and lore types
- `/src/types/inventory.types.ts` - Inventory and items

## Usage Examples

Here's how these types work in practice:

```typescript
// Type-safe store usage
const { worlds, createWorld } = useWorldStore();
const worldData: CreateWorldData = {
  name: 'Wild West',
  description: 'Frontier setting',
  genre: 'western',
  attributes: [{
    id: 'attr-str',
    worldId: 'world-1',
    name: 'Strength',
    description: 'Physical power',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }],
  skills: [{
    id: 'skill-gun',
    worldId: 'world-1',
    name: 'Gunslinging',
    description: 'Quick draw and accurate shooting',
    difficulty: 'medium',
    baseValue: 1,
    minValue: 1,
    maxValue: 5,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }],
  settings: {
    maxAttributes: 6,
    maxSkills: 12,
    attributePointPool: 30,
    skillPointPool: 10
  }
};
const worldId = createWorld(worldData);

// Type-safe API calls
const response: APIResponse<Character[]> = await fetch('/api/characters');

// Type guards in practice
if (isCharacter(entity)) {
  console.log(entity.worldId); // TypeScript knows this is a Character
}
```
