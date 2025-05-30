import { generateCharacter } from '../characterGenerator';
import { World } from '@/types/world.types';
import { createAIClient } from '../clientFactory';

// Mock the AI client
jest.mock('../clientFactory');
const mockCreateAIClient = createAIClient as jest.MockedFunction<typeof createAIClient>;

describe('Character Generator - Cleanup Tests', () => {
  const mockWorld: World = {
    id: 'test-world',
    name: 'Test Fantasy World',
    theme: 'Fantasy',
    description: 'A magical realm for testing',
    attributes: [
      {
        id: 'strength',
        name: 'Strength',
        description: 'Physical power',
        minValue: 1,
        maxValue: 10,
        defaultValue: 5
      },
      {
        id: 'intelligence',
        name: 'Intelligence',
        description: 'Mental capacity',
        minValue: 1,
        maxValue: 10,
        defaultValue: 5
      }
    ],
    skills: [
      {
        id: 'swordsmanship',
        name: 'Swordsmanship',
        description: 'Skill with bladed weapons',
        difficulty: 'medium',
        associatedAttributeId: 'strength'
      },
      {
        id: 'magic',
        name: 'Magic',
        description: 'Arcane knowledge',
        difficulty: 'hard',
        associatedAttributeId: 'intelligence'
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

  const mockAIResponse = {
    content: JSON.stringify({
      name: 'Test Hero',
      level: 3,
      background: {
        description: 'A brave warrior from the north',
        personality: 'Courageous and noble',
        motivation: 'Seeking justice for his fallen comrades'
      },
      attributes: [
        { id: 'strength', value: 8 },
        { id: 'intelligence', value: 6 }
      ],
      skills: [
        { id: 'swordsmanship', level: 7 },
        { id: 'magic', level: 4 }
      ]
    })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const mockClient = {
      generateContent: jest.fn().mockResolvedValue(mockAIResponse)
    };
    mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);
  });

  describe('Basic Generation', () => {
    it('should generate a character with valid data structure', async () => {
      const result = await generateCharacter(mockWorld, [], undefined, 'original');

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('attributes');
      expect(result).toHaveProperty('skills');
      expect(result.attributes).toHaveLength(2);
      expect(result.skills).toHaveLength(2);
    });

    it('should use suggested name when provided', async () => {
      const suggestedName = 'Custom Hero Name';
      const result = await generateCharacter(mockWorld, [], suggestedName, 'specific');

      expect(result.name).toBe(suggestedName);
    });

    it('should validate attribute values within world bounds', async () => {
      const mockResponseWithInvalidValues = {
        content: JSON.stringify({
          name: 'Test Hero',
          level: 3,
          background: {
            description: 'A test character',
            personality: 'Test personality',
            motivation: 'Test motivation'
          },
          attributes: [
            { id: 'strength', value: 15 }, // Exceeds max (10)
            { id: 'intelligence', value: -5 } // Below min (1)
          ],
          skills: [
            { id: 'swordsmanship', level: 7 },
            { id: 'magic', level: 4 }
          ]
        })
      };

      const mockClient = {
        generateContent: jest.fn().mockResolvedValue(mockResponseWithInvalidValues)
      };
      mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);

      const result = await generateCharacter(mockWorld, [], undefined, 'original');

      // Values should be clamped to valid ranges
      const strengthAttr = result.attributes.find(a => a.id === 'strength');
      const intelligenceAttr = result.attributes.find(a => a.id === 'intelligence');

      expect(strengthAttr?.value).toBe(10); // Clamped to max
      expect(intelligenceAttr?.value).toBe(1); // Clamped to min
    });

    it('should validate skill levels within 0-10 range', async () => {
      const mockResponseWithInvalidSkills = {
        content: JSON.stringify({
          name: 'Test Hero',
          level: 3,
          background: {
            description: 'A test character',
            personality: 'Test personality',
            motivation: 'Test motivation'
          },
          attributes: [
            { id: 'strength', value: 8 },
            { id: 'intelligence', value: 6 }
          ],
          skills: [
            { id: 'swordsmanship', level: 15 }, // Exceeds max (10)
            { id: 'magic', level: -2 } // Below min (0)
          ]
        })
      };

      const mockClient = {
        generateContent: jest.fn().mockResolvedValue(mockResponseWithInvalidSkills)
      };
      mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);

      const result = await generateCharacter(mockWorld, [], undefined, 'original');

      const swordSkill = result.skills.find(s => s.id === 'swordsmanship');
      const magicSkill = result.skills.find(s => s.id === 'magic');

      expect(swordSkill?.level).toBe(10); // Clamped to max
      expect(magicSkill?.level).toBe(0); // Clamped to min
    });
  });

  describe('Duplicate Name Detection', () => {
    it('should throw error for exact duplicate names', async () => {
      const existingNames = ['Test Hero', 'Another Character'];
      
      // Mock response that returns a duplicate name
      const mockResponseWithDuplicate = {
        content: JSON.stringify({
          name: 'Test Hero', // This matches existing name
          level: 3,
          background: {
            description: 'A duplicate character',
            personality: 'Test personality',
            motivation: 'Test motivation'
          },
          attributes: [
            { id: 'strength', value: 8 },
            { id: 'intelligence', value: 6 }
          ],
          skills: [
            { id: 'swordsmanship', level: 7 },
            { id: 'magic', level: 4 }
          ]
        })
      };

      const mockClient = {
        generateContent: jest.fn().mockResolvedValue(mockResponseWithDuplicate)
      };
      mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);

      await expect(
        generateCharacter(mockWorld, existingNames, undefined, 'original')
      ).rejects.toThrow('already exists in this world');
    });

    it('should be case-insensitive for duplicate detection', async () => {
      const existingNames = ['test hero', 'Another Character'];
      
      // Mock response that returns a name with different case
      const mockResponseWithCaseDuplicate = {
        content: JSON.stringify({
          name: 'Test Hero', // Different case but same name
          level: 3,
          background: {
            description: 'A duplicate character',
            personality: 'Test personality',
            motivation: 'Test motivation'
          },
          attributes: [
            { id: 'strength', value: 8 },
            { id: 'intelligence', value: 6 }
          ],
          skills: [
            { id: 'swordsmanship', level: 7 },
            { id: 'magic', level: 4 }
          ]
        })
      };

      const mockClient = {
        generateContent: jest.fn().mockResolvedValue(mockResponseWithCaseDuplicate)
      };
      mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);

      await expect(
        generateCharacter(mockWorld, existingNames, undefined, 'original')
      ).rejects.toThrow('already exists in this world');
    });
  });

  describe('Generation Types', () => {
    it('should include appropriate prompts for known figure generation', async () => {
      const mockClient = {
        generateContent: jest.fn().mockResolvedValue(mockAIResponse)
      };
      mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);

      await generateCharacter(mockWorld, [], undefined, 'known');

      const prompt = mockClient.generateContent.mock.calls[0][0];
      expect(prompt).toContain('REAL, EXISTING character');
      expect(prompt).toContain('source material');
    });

    it('should include appropriate prompts for original character generation', async () => {
      const mockClient = {
        generateContent: jest.fn().mockResolvedValue(mockAIResponse)
      };
      mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);

      await generateCharacter(mockWorld, [], undefined, 'original');

      const prompt = mockClient.generateContent.mock.calls[0][0];
      expect(prompt).toContain('original character');
      expect(prompt).toContain('never appeared in the source material');
    });

    it('should use suggested name for specific generation type', async () => {
      const mockClient = {
        generateContent: jest.fn().mockResolvedValue(mockAIResponse)
      };
      mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);

      const suggestedName = 'Aragorn';
      await generateCharacter(mockWorld, [], suggestedName, 'specific');

      const prompt = mockClient.generateContent.mock.calls[0][0];
      expect(prompt).toContain(`named "${suggestedName}"`);
    });
  });

  describe('Error Handling', () => {
    it('should fall back to template generation when AI response is invalid JSON', async () => {
      const mockClient = {
        generateContent: jest.fn().mockResolvedValue({ content: 'Invalid JSON response' })
      };
      mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);

      const result = await generateCharacter(mockWorld, [], undefined, 'original');
      
      // Should successfully return a template-generated character
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('attributes');
      expect(result).toHaveProperty('skills');
      expect(result.characterType).toBe('original');
    });

    it('should fall back to template generation when generated character has no name', async () => {
      const mockResponseWithoutName = {
        content: JSON.stringify({
          level: 3,
          background: {
            description: 'A test character',
            personality: 'Test personality',
            motivation: 'Test motivation'
          },
          attributes: [],
          skills: []
        })
      };

      const mockClient = {
        generateContent: jest.fn().mockResolvedValue(mockResponseWithoutName)
      };
      mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);

      const result = await generateCharacter(mockWorld, [], undefined, 'original');
      
      // Should successfully return a template-generated character with a valid name
      expect(result.name).toBeTruthy();
      expect(typeof result.name).toBe('string');
      expect(result.name.length).toBeGreaterThan(0);
    });

    it('should fall back to template generation when AI client errors occur', async () => {
      const mockClient = {
        generateContent: jest.fn().mockRejectedValue(new Error('AI service unavailable'))
      };
      mockCreateAIClient.mockReturnValue(mockClient as ReturnType<typeof createAIClient>);

      const result = await generateCharacter(mockWorld, [], undefined, 'original');
      
      // Should successfully return a template-generated character
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('attributes');
      expect(result).toHaveProperty('skills');
      expect(result.characterType).toBe('original');
    });
  });
});