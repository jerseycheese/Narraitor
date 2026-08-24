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

There's no `GameSession` interface and no `SessionState` type. Live session state lives in
`sessionStore`. `src/types/session.types.ts` defines lifecycle metadata and the narrative context
shape:

```typescript
type SessionLifecycleStatus = 'active' | 'ended' | 'abandoned';

interface SessionLifecycleMetadata {
  id: EntityID;
  worldId: EntityID;
  characterId: EntityID;
  status: SessionLifecycleStatus;
  lastActivity: ISODateString;
}

interface NarrativeContext {
  recentSegments: EntityID[]; // Last 5-10 segments
  activeCharacters: EntityID[];
  currentLocation?: string;
  activeQuests?: string[];
  mood?: string;
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

```

There's no `JournalFilter` type; journal filtering is done inline against the entry fields above.

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

There's no `AIContext` or `AIMessage` type and no stored conversation history. The context type is
`AISessionContext`, returned by `useAiContextStore.getState().buildContextForSession()`:

```typescript
// src/state/aiContextStore.ts
interface AISessionContext {
  sessionId: EntityID;
  goalContext: string;
  contextText: string;
  activeGoals: NarrativeGoal[];
  criticalGoals: NarrativeGoal[];
  recentGoals: NarrativeGoal[];
  tokenCount: number;
  error: string | null;
  timestamp: string;
}

// src/lib/promptTemplates/types.ts
interface PromptTemplate {
  id: string;
  content: string;
}
```

## State Management Types

Six stores extend the shared `CrudStore<T>` contract in `src/state/crudStore.types.ts`:
`worldStore`, `characterStore`, `inventoryStore`, `npcStore`, `goalStore`, and `loreStore`. Those
expose the generic `create`/`update`/`delete` alongside domain-named aliases, so `updateWorld`
delegates to `update`. `narrativeStore`, `sessionStore`, `journalStore`, `aiContextStore`, and the
rest declare their own actions with no shared base.

(The file's own header comment says only goalStore and loreStore reference these types. That
comment is stale — don't trust it over the `extends CrudStore<...>` declarations.)

```typescript
// src/state/crudStore.types.ts - the shared contract, used by goalStore and loreStore
type CrudStore<T extends BaseEntity> = {
  entities: Record<string, T>;
  currentEntityId: string | null;
  error: UserFriendlyError | null;
  loading: boolean;

  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => string;
  update: (id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  delete: (id: string) => void;
  setCurrent: (id: string | null) => void;
  getById: (id: string) => T | undefined;
  getAll: () => T[];
  reset: () => void;
  setError: (error: UserFriendlyError | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
};
```

For any other store, read its own type file. `narrativeStore` has no `generateNarrative`,
`selectChoice`, or `submitCustomInput` - generation lives in `src/lib/ai/narrativeGenerator.ts`.
The store holds `segments` and `decisions` and exposes `addSegment`, `selectDecisionOption`, and
`generateEnding`. See `src/state/narrativeStore.types.ts`.

## Form Types

None of these are exported; they're the shape store methods take inline:

```typescript
// What createWorld / createCharacter accept
Omit<World, 'id' | 'createdAt' | 'updatedAt'>
Omit<Character, 'id' | 'createdAt' | 'updatedAt'>

// The two update signatures differ; they are not symmetrical.
updateWorld: (id: EntityID, updates: Partial<Omit<World, 'id' | 'createdAt' | 'updatedAt'>>) => void
updateCharacter: (id: EntityID, updates: Partial<Character>) => void
```

There's no session equivalent, since there's no `GameSession` entity type (see Session Types above).

## Validation Types

```typescript
// src/lib/utils/validationUtils.ts - errors are plain strings, and the flag is `valid`, not `isValid`
interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

There's no structured `ValidationError` type with field/message/code. The validators in
`src/lib/utils/typeGuards/` all return `ValidationResult`:

```typescript
import { validateWorld, validateWorldAttribute } from '@/lib/utils/typeGuards';

const result = validateWorld(data);
if (!result.valid) {
  console.error(result.errors); // string[]
}
```

The only other guards exported from there are `isPlayerDecisionArray` and `sanitizeString`. There's
no `isNarrativeSegment` or `isJournalEntry`.

## File Locations

Types are split by domain:

- `/src/types/common.types.ts` - Base and utility types
- `/src/types/world.types.ts` - World-related types
- `/src/types/character.types.ts` - Character-related types
- `/src/types/narrative.types.ts` - Narrative and AI types
- `/src/types/session.types.ts` - Session lifecycle metadata and narrative context
- `/src/types/journal.types.ts` - Journal entries
- `/src/types/lore.types.ts` - Lore facts and categories
- `/src/types/inventory.types.ts` - Inventory and items

This page doesn't cover the rest: `goal`, `npc`, `provider`, `personalization`, `tone-settings`,
`story-checkpoint`, `continuity`, `tutorial`, `dashboard`, and others. `ls src/types/` is the
authoritative list.

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
