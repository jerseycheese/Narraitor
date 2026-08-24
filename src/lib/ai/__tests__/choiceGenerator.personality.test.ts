import {
  extractPersonalityContext,
  formatPersonalityForChoices,
} from '../choiceGenerator.personality';
import type { Character as StoreCharacter } from '@/state/characterStore';

const createCharacter = (
  overrides: Partial<StoreCharacter> = {}
): StoreCharacter => {
  const base: StoreCharacter = {
    id: 'char-1',
    name: 'Test Character',
    description: 'A test character',
    worldId: 'world-1',
    level: 1,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'A test history',
      personality: 'Curious',
      goals: ['Find answers'],
      fears: ['Darkness'],
      relationships: [],
    },
    isPlayer: true,
    status: {
      conditions: [],
    },
    inventory: {
      characterId: 'char-1',
      items: [],
      capacity: 10,
      categories: [],
      itemOrder: [],
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  };

  return {
    ...base,
    ...overrides,
    background: {
      ...base.background,
      ...(overrides.background ?? {}),
    },
  };
};

describe('choiceGenerator.personality', () => {
  describe('extractPersonalityContext', () => {
    it('returns null when personality context is empty', () => {
      const character = createCharacter({
        background: {
          history: '',
          personality: '',
          goals: [],
          fears: [],
          relationships: [],
        },
      });

      expect(extractPersonalityContext(character)).toBeNull();
    });

    it('trims and filters personality data', () => {
      const character = createCharacter({
        background: {
          history: '  Former explorer  ',
          personality: '  cautious, diplomatic  ',
          goals: ['  Find the relic  ', ' ', ''],
          fears: ['  Spiders  ', ''],
          relationships: [],
        },
      });

      expect(extractPersonalityContext(character)).toEqual({
        personality: 'cautious, diplomatic',
        goals: ['Find the relic'],
        fears: ['Spiders'],
        history: 'Former explorer',
      });
    });
  });

  describe('formatPersonalityForChoices', () => {
    it('returns null when no personality context is available', () => {
      const character = createCharacter({
        background: {
          history: '',
          personality: '',
          goals: [],
          fears: [],
          relationships: [],
        },
      });

      expect(formatPersonalityForChoices(character)).toBeNull();
    });

    it('formats personality context with alignment hints by default', () => {
      const character = createCharacter({
        background: {
          history: 'Former archaeologist seeking redemption',
          personality: 'cautious, diplomatic, curious',
          goals: ['Discover the source of the artifact'],
          fears: ['Being trapped underground'],
          relationships: [],
        },
      });

      const result = formatPersonalityForChoices(character);

      expect(result).toContain('CHARACTER PERSONALITY CONTEXT:');
      expect(result).toContain(
        'Personality: cautious, diplomatic, curious'
      );
      expect(result).toContain('Active Goals:');
      expect(result).toContain('- Discover the source of the artifact');
      expect(result).toContain('Fears: Being trapped underground');
      expect(result).toContain(
        'History: Former archaeologist seeking redemption'
      );
      expect(result).toContain(
        'Lawful/neutral/chaotic alignment should consider personality:'
      );
    });

    it('gates alignment hints when disabled', () => {
      const character = createCharacter({
        background: {
          history: 'Former archaeologist seeking redemption',
          personality: 'cautious, diplomatic, curious',
          goals: ['Discover the source of the artifact'],
          fears: ['Being trapped underground'],
          relationships: [],
        },
      });

      const result = formatPersonalityForChoices(character, false);

      expect(result).toContain(
        'Personality guides HOW an alignment is expressed, not which alignments appear'
      );
      expect(result).not.toMatch(/required alignment distribution|the distribution/i);
      expect(result).not.toContain(
        'Lawful/neutral/chaotic alignment should consider personality:'
      );
    });
  });
});
