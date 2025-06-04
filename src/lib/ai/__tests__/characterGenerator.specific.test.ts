import { generateCharacter } from '../characterGenerator';
import { World } from '@/types/world.types';

// Mock the AI client
const mockGenerateContent = jest.fn();
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: jest.fn(() => ({
    generateContent: mockGenerateContent
  }))
}));

// Mock fetch for API calls (fallback)
global.fetch = jest.fn();

describe('generateCharacter - Specific Character Type', () => {
  const mockWorld: World = {
    id: 'world-1',
    name: 'Middle Earth',
    theme: 'fantasy',
    description: 'The world of Lord of the Rings',
    attributes: [
      {
        id: 'attr-1',
        name: 'Strength',
        description: 'Physical power',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        worldId: 'world-1'
      },
      {
        id: 'attr-2',
        name: 'Wisdom',
        description: 'Mental capacity',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        worldId: 'world-1'
      }
    ],
    skills: [
      {
        id: 'skill-1',
        name: 'Swordsmanship',
        description: 'Skill with bladed weapons',
        difficulty: 'medium',
        linkedAttributeId: 'attr-1',
        baseValue: 1,
        minValue: 1,
        maxValue: 10,
        worldId: 'world-1',
        category: 'Combat'
      },
      {
        id: 'skill-2',
        name: 'Lore',
        description: 'Knowledge of ancient things',
        difficulty: 'hard',
        linkedAttributeId: 'attr-2',
        baseValue: 1,
        minValue: 1,
        maxValue: 10,
        worldId: 'world-1',
        category: 'Knowledge'
      }
    ],
    settings: {
      maxAttributes: 2,
      maxSkills: 2,
      attributePointPool: 20,
      skillPointPool: 30
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a known figure when using specific type with a character name', async () => {
    const characterName = 'Gandalf';
    const mockCharacterJSON = {
      name: characterName,
      level: 15,
      background: {
        description: 'A wizard of Middle Earth, member of the Istari',
        personality: 'Wise, patient, and caring but can be stern when needed',
        motivation: 'To guide the peoples of Middle Earth against the forces of darkness',
        fears: ['Sauron', 'Failure'],
        physicalDescription: 'Tall elderly man with long grey beard, wearing grey robes and pointed hat, carrying a staff'
      },
      attributes: [
        { id: 'attr-1', value: 6 },
        { id: 'attr-2', value: 10 }
      ],
      skills: [
        { id: 'skill-1', level: 7 },
        { id: 'skill-2', level: 10 }
      ]
    };

    // Mock AI client response
    mockGenerateContent.mockResolvedValue({
      content: JSON.stringify(mockCharacterJSON),
      finishReason: 'stop'
    });

    const result = await generateCharacter(mockWorld, [], characterName, 'specific');

    // Verify the character has the correct name
    expect(result.name).toBe(characterName);
    
    // Verify the character has physical description
    expect(result.background.physicalDescription).toBe('Tall elderly man with long grey beard, wearing grey robes and pointed hat, carrying a staff');

    // Verify the character is marked as a known figure
    expect(result.isKnownFigure).toBe(true);
    expect(result.characterType).toBe('protagonist');

    // Verify AI client was called
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining(characterName));
  });

  it('should generate an original character when using original type', async () => {
    const mockCharacterJSON = {
      name: 'Thorin Oakenshield III',
      level: 8,
      background: {
        description: 'A descendant of the line of Durin',
        personality: 'Proud and honorable',
        motivation: 'To restore the glory of his ancestors',
        fears: ['Dishonor', 'Dragon fire'],
        physicalDescription: 'Stout dwarf with braided beard'
      },
      attributes: [
        { id: 'attr-1', value: 8 },
        { id: 'attr-2', value: 6 }
      ],
      skills: [
        { id: 'skill-1', level: 9 },
        { id: 'skill-2', level: 5 }
      ]
    };

    // Mock AI client response
    mockGenerateContent.mockResolvedValue({
      content: JSON.stringify(mockCharacterJSON),
      finishReason: 'stop'
    });

    const result = await generateCharacter(mockWorld, [], undefined, 'original');

    // Verify the character is NOT marked as a known figure
    expect(result.isKnownFigure).toBe(false);
    expect(result.characterType).toBe('original');

    // Verify AI client was called
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('should handle specific character generation with existing names', async () => {
    const existingNames = ['Aragorn', 'Legolas', 'Gimli'];
    const characterName = 'Gandalf';
    const mockCharacterJSON = {
      name: characterName,
      level: 15,
      background: {
        description: 'A wizard of Middle Earth',
        personality: 'Wise and powerful',
        motivation: 'To defeat Sauron',
        fears: ['Corruption', 'The Dark'],
        physicalDescription: 'Grey robed wizard'
      },
      attributes: [
        { id: 'attr-1', value: 6 },
        { id: 'attr-2', value: 10 }
      ],
      skills: [
        { id: 'skill-1', level: 7 },
        { id: 'skill-2', level: 10 }
      ]
    };

    // Mock AI client response
    mockGenerateContent.mockResolvedValue({
      content: JSON.stringify(mockCharacterJSON),
      finishReason: 'stop'
    });

    const result = await generateCharacter(mockWorld, existingNames, characterName, 'specific');

    expect(result.name).toBe(characterName);
    expect(result.isKnownFigure).toBe(true);

    // Verify AI client was called with the existing names in the prompt
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('Aragorn, Legolas, Gimli'));
  });
});