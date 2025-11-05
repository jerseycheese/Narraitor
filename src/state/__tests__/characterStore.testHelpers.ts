/**
 * Test helpers for characterStore tests
 * Provides reusable mock character data factories
 */

// Type matching the Character interface from characterStore.ts
interface CharacterInput {
  name: string;
  description: string;
  worldId: string;
  level: number;
  attributes: Array<{
    id: string;
    characterId: string;
    worldAttributeId?: string;
    name: string;
    baseValue: number;
    modifiedValue: number;
    category?: string;
  }>;
  skills: Array<{
    id: string;
    characterId: string;
    worldSkillId?: string;
    name: string;
    level: number;
    category?: string;
  }>;
  background: {
    history: string;
    personality: string;
    goals: string[];
    fears: string[];
    physicalDescription?: string;
    relationships: unknown[];
    isKnownFigure?: boolean;
    knownFigureType?: 'historical' | 'fictional' | 'celebrity' | 'mythological' | 'other';
  };
  isPlayer: boolean;
  status: {
    health: number;
    maxHealth: number;
    conditions: string[];
    location?: string;
  };
  inventory: {
    characterId: string;
    items: unknown[];
    capacity: number;
    categories: unknown[];
    itemOrder: string[];
  };
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
    generatedAt?: string;
    prompt?: string;
  };
}

/**
 * Creates basic character test data
 */
export function createTestCharacterData(overrides?: Partial<CharacterInput>): CharacterInput {
  return {
    name: 'Test Character',
    description: 'A test character',
    worldId: 'world-1',
    level: 1,
    attributes: [],
    skills: [],
    background: {
      history: 'A test character',
      personality: 'Friendly',
      goals: ['Testing'],
      fears: [],
      relationships: []
    },
    isPlayer: true,
    status: {
      health: 100,
      maxHealth: 100,
      conditions: []
    },
    inventory: {
      characterId: '',
      items: [],
      capacity: 20,
      categories: [],
      itemOrder: [],
    },
    ...overrides
  };
}

/**
 * Creates a character for attribute testing
 */
export function createAttributeTestCharacter() {
  return createTestCharacterData({
    name: 'Attribute Test Character',
    description: 'Character for testing attributes',
    background: {
      history: 'For testing attributes',
      personality: 'Analytical',
      goals: [],
      fears: [],
      relationships: []
    }
  });
}

/**
 * Creates a character for skill testing
 */
export function createSkillTestCharacter() {
  return createTestCharacterData({
    name: 'Skill Test Character',
    description: 'Character for testing skills',
    background: {
      history: 'For testing skills',
      personality: 'Skilled',
      goals: [],
      fears: [],
      relationships: []
    }
  });
}

/**
 * Sets up fake timers with a standard test time
 */
export function setupTestTimers() {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
}
