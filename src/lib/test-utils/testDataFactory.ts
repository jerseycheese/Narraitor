/**
 * Test Data Factory
 * 
 * Centralized factory for creating mock objects used in tests.
 * Provides consistent test data with sensible defaults that can be overridden.
 */

import type {
  World,
  WorldAttribute,
  WorldSkill,
  NarrativeSegment,
  GameSession,
  JournalEntry,
  JournalEntryType,
  InventoryItem,
  Decision
} from '@/types';
import type { Character } from '@/state/characterStore';
import { generateUniqueId } from '@/lib/utils';

// PlayerChoice is a custom type for this factory
interface PlayerChoice {
  id: string;
  text: string;
  isSelected: boolean;
}

// Default timestamp for consistent test data
const DEFAULT_TIMESTAMP = '2023-01-01T00:00:00.000Z';

/**
 * Creates a mock World object with sensible defaults
 */
export function createMockWorld(overrides: Partial<World> = {}): World {
  return {
    id: overrides.id || generateUniqueId('world'),
    name: 'Test World',
    description: 'A test world for unit testing',
    genre: 'fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 20,
      attributePointPool: 30,
      skillPointPool: 40,
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

/**
 * Creates a mock WorldAttribute object
 */
export function createMockWorldAttribute(overrides: Partial<WorldAttribute> = {}): WorldAttribute {
  return {
    id: overrides.id || generateUniqueId('attr'),
    worldId: 'world-test-1',
    name: 'Strength',
    description: 'Physical power and endurance',
    baseValue: 10,
    minValue: 1,
    maxValue: 20,
    category: 'Physical',
    ...overrides,
  };
}

/**
 * Creates a mock WorldSkill object
 */
export function createMockWorldSkill(overrides: Partial<WorldSkill> = {}): WorldSkill {
  return {
    id: overrides.id || generateUniqueId('skill'),
    worldId: 'world-test-1',
    name: 'Athletics',
    description: 'Physical prowess and agility',
    attributeIds: ['attr-1'],
    difficulty: 'medium',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
    ...overrides,
  };
}

/**
 * Creates a mock Character object with sensible defaults
 */
export function createMockCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: overrides.id || generateUniqueId('char'),
    worldId: 'world-test-1',
    name: 'Test Character',
    description: 'A test character for unit testing',
    level: 1,
    isPlayer: false,
    attributes: [],
    skills: [],
    background: {
      history: 'Test history',
      personality: 'Test personality',
      goals: ['Test goal 1', 'Test goal 2'],
      fears: ['Test fear'],
      relationships: [],
    },
    inventory: {
      characterId: overrides.id || 'char-test-1',
      items: [],
      capacity: 10,
      categories: [
        { id: 'equipment', name: 'Equipment', description: 'Weapons, armor, and gear', sortOrder: 0 },
        { id: 'consumables', name: 'Consumables', description: 'Potions and single-use items', sortOrder: 1 },
        { id: 'quest-items', name: 'Quest Items', description: 'Important story items', sortOrder: 2 }
      ],
      itemOrder: [],
    },
    status: {
      health: 100,
      maxHealth: 100,
      conditions: [],
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

/**
 * Creates a mock GameSession object
 */
export function createMockSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: overrides.id || generateUniqueId('session'),
    worldId: 'world-test-1',
    characterId: 'char-test-1',
    state: {
      status: 'active',
      lastActivity: DEFAULT_TIMESTAMP,
    },
    narrativeHistory: [],
    currentContext: {
      recentSegments: [],
      activeCharacters: ['char-test-1'],
      currentLocation: 'Test Location',
      activeQuests: [],
      mood: 'neutral',
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

/**
 * Creates a mock NarrativeSegment object
 */
export function createMockNarrativeSegment(overrides: Partial<NarrativeSegment> = {}): NarrativeSegment {
  return {
    id: overrides.id || generateUniqueId('seg'),
    worldId: 'world-test-1',
    sessionId: 'session-test-1',
    content: 'Test narrative content',
    type: 'scene',
    characterIds: [],
    metadata: {
      location: 'Test Location',
      mood: 'neutral',
      tags: [],
    },
    timestamp: new Date(DEFAULT_TIMESTAMP),
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

/**
 * Creates a mock Decision object
 */
export function createMockDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: overrides.id || generateUniqueId('decision'),
    prompt: 'What do you want to do?',
    options: [
      { id: 'opt-1', text: 'Option 1', hint: 'Hint for option 1' },
      { id: 'opt-2', text: 'Option 2' },
      { id: 'opt-3', text: 'Option 3' },
    ],
    selectedOptionId: undefined,
    ...overrides,
  };
}

/**
 * Creates a mock PlayerChoice object
 */
export function createMockPlayerChoice(overrides: Partial<PlayerChoice> = {}): PlayerChoice {
  return {
    id: overrides.id || generateUniqueId('choice'),
    text: 'Test choice',
    isSelected: false,
    ...overrides,
  };
}

/**
 * Creates a mock JournalEntry object
 */
export function createMockJournalEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: overrides.id || generateUniqueId('journal'),
    sessionId: 'session-test-1',
    worldId: 'world-test-1',
    characterId: 'char-test-1',
    type: 'character_event' as JournalEntryType,
    title: 'Test Journal Entry',
    content: 'Something happened in the test',
    significance: 'minor',
    isRead: false,
    relatedEntities: [],
    metadata: {
      tags: [],
      automaticEntry: false,
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

/**
 * Creates a mock InventoryItem object
 */
export function createMockInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  const categoryId = overrides.categoryId ?? 'equipment';
  const quantity = overrides.quantity ?? 1;

  return {
    id: overrides.id ?? generateUniqueId('item'),
    name: overrides.name ?? 'Test Item',
    description: overrides.description ?? 'A test item for unit testing',
    categoryId,
    quantity,
    stackable: overrides.stackable ?? false,
    maxStack: overrides.maxStack,
    acquisitionHistory:
      overrides.acquisitionHistory ?? [
        {
          acquiredAt: DEFAULT_TIMESTAMP,
          method: 'manual',
          quantity,
        },
      ],
    categorization:
      overrides.categorization ?? {
        categoryId,
        source: 'manual',
        classifiedAt: DEFAULT_TIMESTAMP,
        confidence: 0.9,
      },
    createdAt: overrides.createdAt ?? DEFAULT_TIMESTAMP,
    updatedAt: overrides.updatedAt ?? DEFAULT_TIMESTAMP,
  };
}

/**
 * Creates a mock World object with skills pre-configured
 */
export function createMockWorldWithSkills(overrides: Partial<World> = {}): World {
  const worldId = overrides.id || generateUniqueId('world');
  return createMockWorld({
    id: worldId,
    name: 'Fantasy Realm',
    description: 'A world with magic and combat',
    skills: [
      {
        id: 'athletics',
        name: 'Athletics',
        description: 'Physical prowess and endurance',
        attributeIds: ['strength'],
        worldId,
        difficulty: 'medium' as const,
        baseValue: 0,
        minValue: 0,
        maxValue: 10
      },
      {
        id: 'magic',
        name: 'Magic',
        description: 'Arcane knowledge and spellcasting',
        attributeIds: ['intelligence'],
        worldId,
        difficulty: 'hard' as const,
        baseValue: 0,
        minValue: 0,
        maxValue: 10
      },
      {
        id: 'stealth',
        name: 'Stealth',
        description: 'Moving unseen and unheard',
        attributeIds: ['dexterity'],
        worldId,
        difficulty: 'easy' as const,
        baseValue: 0,
        minValue: 0,
        maxValue: 10
      }
    ],
    ...overrides,
  });
}

/**
 * Creates a mock Character object with skills and attributes pre-configured
 */
export function createMockCharacterWithSkills(overrides: Partial<Character> = {}): Character {
  const characterId = overrides.id || generateUniqueId('char');
  return createMockCharacter({
    id: characterId,
    name: 'Test Hero',
    description: 'A skilled adventurer ready for any challenge',
    level: 5,
    isPlayer: true,
    background: {
      history: 'Skilled adventurer with years of experience',
      personality: 'Brave and resourceful',
      goals: ['Master all skills'],
      fears: ['Failure'],
      relationships: []
    },
    attributes: [
      { id: 'attr-1', characterId, worldAttributeId: 'strength', name: 'Strength', baseValue: 16, modifiedValue: 16 },
      { id: 'attr-2', characterId, worldAttributeId: 'intelligence', name: 'Intelligence', baseValue: 14, modifiedValue: 14 },
      { id: 'attr-3', characterId, worldAttributeId: 'dexterity', name: 'Dexterity', baseValue: 12, modifiedValue: 12 }
    ],
    skills: [
      { id: 'skill-1', characterId, worldSkillId: 'athletics', name: 'Athletics', level: 6 },
      { id: 'skill-2', characterId, worldSkillId: 'magic', name: 'Magic', level: 4 },
      { id: 'skill-3', characterId, worldSkillId: 'stealth', name: 'Stealth', level: 3 }
    ],
    ...overrides,
  });
}

