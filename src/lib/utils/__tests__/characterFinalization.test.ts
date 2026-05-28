import { finalizeCharacterCreation } from '../characterFinalization';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { useInventoryStore } from '@/state/inventoryStore';
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
        portraitPlaceholder: '',
        background: {
          history: 'History',
          personality: 'Personality',
          motivation: 'Motivation',
          goals: [],
          physicalDescription: '',
        },
        attributes: [
          { attributeId: 'attr-1', name: 'Strength', description: 'Power', value: 3, minValue: 1, maxValue: 5 },
        ],
        skills: [
          { skillId: 'skill-1', name: 'Combat', description: 'Fighting', level: 2, minLevel: 1, maxLevel: 5, isSelected: true },
        ],
      },
      world
    );

    expect(updateTutorialProgress).toHaveBeenCalledWith('characterCreation', {
      completed: true,
      skipped: false,
    });
  });

  it('seeds the inventory from the selected quick-start template', () => {
    const characterId = 'char-inv';
    useInventoryStore.getState().reset();

    mockCharacterStore.getState.mockReturnValue({
      createCharacter: jest.fn(() => characterId),
      recalculateDerivedStats: jest.fn(),
      setCurrentCharacter: jest.fn(),
      currentCharacterId: characterId,
    });

    (useSessionStore as unknown as { getState: jest.Mock }).getState = jest.fn(() => ({
      updateTutorialProgress: jest.fn(),
    }));

    const world = createMockWorld({
      id: 'world-2',
      name: 'Inventory World',
      genre: 'fantasy',
      attributes: [
        createMockWorldAttribute({ id: 'attr-1', name: 'Strength', minValue: 1, maxValue: 5, worldId: 'world-2' }),
      ],
      skills: [
        createMockWorldSkill({ id: 'skill-1', name: 'Combat', minValue: 1, maxValue: 5, worldId: 'world-2' }),
      ],
      settings: { maxAttributes: 6, maxSkills: 8, attributePointPool: 10, skillPointPool: 10 },
      characterTemplates: [
        {
          id: 'tmpl-1',
          name: 'Warrior',
          description: 'A fighter',
          level: 1,
          attributes: [{ id: 'attr-1', name: 'Strength', value: 3 }],
          skills: [{ id: 'skill-1', name: 'Combat', level: 2 }],
          background: { description: '', personality: '', motivation: '', fears: [] },
          startingInventory: [
            { name: 'Steel Sword', categoryId: 'equipment', equipped: true },
            { name: 'Health Potion', categoryId: 'consumables', quantity: 3, stackable: true, maxStack: 10 },
          ],
        },
      ],
    });

    finalizeCharacterCreation(
      {
        name: 'Hero',
        worldId: 'world-2',
        description: '',
        portraitPlaceholder: '',
        selectedTemplateId: 'tmpl-1',
        background: { history: '', personality: '', motivation: '', goals: [], physicalDescription: '' },
        attributes: [
          { attributeId: 'attr-1', name: 'Strength', description: '', value: 3, minValue: 1, maxValue: 5 },
        ],
        skills: [
          { skillId: 'skill-1', name: 'Combat', description: '', level: 2, minLevel: 1, maxLevel: 5, isSelected: true },
        ],
      },
      world
    );

    const items = useInventoryStore.getState().getCharacterItems(characterId);
    const names = items.map((item) => item.name);
    expect(names).toContain('Steel Sword');
    expect(names).toContain('Health Potion');
    expect(items.find((item) => item.name === 'Steel Sword')?.equipped).toBe(true);
  });
});
