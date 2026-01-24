import { finalizeCharacterCreation } from '../characterFinalization';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { createMockWorld, createMockWorldAttribute, createMockWorldSkill } from '@/lib/test-utils';

jest.mock('@/state/characterStore');
jest.mock('@/state/sessionStore');

const mockCharacterStore = useCharacterStore as unknown as {
  getState: jest.Mock;
};

describe('finalizeCharacterCreation', () => {
  it('marks character creation as completed in tutorial progress', () => {
    const characterId = 'char-1';
    const createCharacter = jest.fn(() => characterId);
    const recalculateDerivedStats = jest.fn();
    const setCurrentCharacter = jest.fn();
    mockCharacterStore.getState.mockReturnValue({
      createCharacter,
      recalculateDerivedStats,
      setCurrentCharacter,
      currentCharacterId: characterId,
    });

    const updateTutorialProgress = jest.fn();
    (useSessionStore as unknown as { getState: jest.Mock }).getState = jest.fn(() => ({
      updateTutorialProgress,
    }));

    const world = createMockWorld({
      id: 'world-1',
      name: 'Test World',
      genre: 'fantasy',
      attributes: [
        createMockWorldAttribute({
          id: 'attr-1',
          name: 'Strength',
          description: 'Power',
          minValue: 1,
          maxValue: 5,
          worldId: 'world-1',
        }),
      ],
      skills: [
        createMockWorldSkill({
          id: 'skill-1',
          name: 'Combat',
          description: 'Fighting',
          minValue: 1,
          maxValue: 5,
          worldId: 'world-1',
        }),
      ],
      settings: {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });

    finalizeCharacterCreation(
      {
        name: 'Hero',
        worldId: 'world-1',
        description: '',
        background: {
          history: 'History',
          personality: 'Personality',
          motivation: 'Motivation',
          goals: [],
          fears: [],
          physicalDescription: '',
        },
        attributes: [
          { attributeId: 'attr-1', value: 3 },
        ],
        skills: [
          { skillId: 'skill-1', level: 2, isSelected: true },
        ],
        portrait: null,
      },
      world
    );

    expect(updateTutorialProgress).toHaveBeenCalledWith('characterCreation', {
      completed: true,
      skipped: false,
    });
  });
});
