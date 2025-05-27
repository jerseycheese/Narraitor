import { generateCharacter } from '../characterGenerator';
import { createAIClient } from '../clientFactory';
import { World } from '@/types/world.types';

// Mock the AI client factory
jest.mock('../clientFactory');

describe('generateCharacter - Specific Character Type', () => {
  const mockWorld: World = {
    id: 'world-1',
    name: 'Middle Earth',
    theme: 'fantasy',
    description: 'The world of Lord of the Rings',
    attributes: [
      { id: 'attr-1', name: 'Strength', minValue: 1, maxValue: 10, category: 'physical' },
      { id: 'attr-2', name: 'Wisdom', minValue: 1, maxValue: 10, category: 'mental' }
    ],
    skills: [
      { id: 'skill-1', name: 'Swordsmanship', category: 'combat', associatedAttributeId: 'attr-1' },
      { id: 'skill-2', name: 'Lore', category: 'knowledge', associatedAttributeId: 'attr-2' }
    ],
    settings: {
      characterPointsLimit: 50,
      startingLevel: 1,
      maxLevel: 20
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockGenerateContent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createAIClient as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent
    });
  });

  it('should generate a known figure when using specific type with a character name', async () => {
    const characterName = 'Gandalf';
    const mockResponse = {
      content: JSON.stringify({
        name: characterName,
        level: 15,
        background: {
          description: 'A wizard of Middle Earth, member of the Istari',
          personality: 'Wise, patient, and caring but can be stern when needed',
          motivation: 'To guide the peoples of Middle Earth against the forces of darkness'
        },
        attributes: [
          { id: 'attr-1', value: 6 },
          { id: 'attr-2', value: 10 }
        ],
        skills: [
          { id: 'skill-1', level: 7 },
          { id: 'skill-2', level: 10 }
        ]
      })
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await generateCharacter(mockWorld, [], characterName, 'specific');

    // Verify the character has the correct name
    expect(result.name).toBe(characterName);

    // Verify the character is marked as a known figure
    expect(result.isKnownFigure).toBe(true);
    expect(result.characterType).toBe('protagonist');

    // Verify the AI prompt includes instructions for known figures
    const promptCall = mockGenerateContent.mock.calls[0][0];
    expect(promptCall).toContain(`Is named "${characterName}" and MUST be a REAL, EXISTING character from the actual Middle Earth source material`);
    expect(promptCall).toContain('CRITICAL: You MUST create a REAL character that ACTUALLY EXISTS in the Middle Earth source material');
    expect(promptCall).toContain(`The character MUST be named "${characterName}" and must be a known figure from the source material`);
  });

  it('should generate an original character when using original type', async () => {
    const mockResponse = {
      content: JSON.stringify({
        name: 'Thorin Oakenshield III',
        level: 8,
        background: {
          description: 'A descendant of the line of Durin',
          personality: 'Proud and honorable',
          motivation: 'To restore the glory of his ancestors'
        },
        attributes: [
          { id: 'attr-1', value: 8 },
          { id: 'attr-2', value: 6 }
        ],
        skills: [
          { id: 'skill-1', level: 9 },
          { id: 'skill-2', level: 5 }
        ]
      })
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await generateCharacter(mockWorld, [], undefined, 'original');

    // Verify the character is NOT marked as a known figure
    expect(result.isKnownFigure).toBeUndefined();
    expect(result.characterType).toBeUndefined();

    // Verify the AI prompt includes instructions for original characters
    const promptCall = mockGenerateContent.mock.calls[0][0];
    expect(promptCall).toContain('Should be an original character that fits the Middle Earth world theme');
    expect(promptCall).toContain('Create a completely original character that:');
    expect(promptCall).toContain('Has never appeared in the source material');
  });

  it('should handle specific character generation with existing names', async () => {
    const existingNames = ['Aragorn', 'Legolas', 'Gimli'];
    const characterName = 'Gandalf';
    const mockResponse = {
      content: JSON.stringify({
        name: characterName,
        level: 15,
        background: {
          description: 'A wizard of Middle Earth',
          personality: 'Wise and powerful',
          motivation: 'To defeat Sauron'
        },
        attributes: [
          { id: 'attr-1', value: 6 },
          { id: 'attr-2', value: 10 }
        ],
        skills: [
          { id: 'skill-1', level: 7 },
          { id: 'skill-2', level: 10 }
        ]
      })
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await generateCharacter(mockWorld, existingNames, characterName, 'specific');

    expect(result.name).toBe(characterName);
    expect(result.isKnownFigure).toBe(true);

    // Verify the prompt includes existing names to avoid
    const promptCall = mockGenerateContent.mock.calls[0][0];
    expect(promptCall).toContain('IMPORTANT: These character names already exist in this world and must NOT be used: Aragorn, Legolas, Gimli');
  });
});