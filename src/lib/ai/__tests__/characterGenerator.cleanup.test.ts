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
        baseValue: 5,
        worldId: 'test-world'
      },
      {
        id: 'intelligence',
        name: 'Intelligence',
        description: 'Mental capacity',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        worldId: 'test-world'
      }
    ],
    skills: [
      {
        id: 'swordsmanship',
        name: 'Swordsmanship',
        description: 'Skill with bladed weapons',
        difficulty: 'medium',
        linkedAttributeId: 'strength',
        baseValue: 1,
        minValue: 1,
        maxValue: 10,
        worldId: 'test-world',
        category: 'Combat'
      },
      {
        id: 'magic',
        name: 'Magic',
        description: 'Arcane knowledge',
        difficulty: 'hard',
        linkedAttributeId: 'intelligence',
        baseValue: 1,
        minValue: 1,
        maxValue: 10,
        worldId: 'test-world',
        category: 'Arcane'
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
    
    // Setup default AI client response for original character generation
    mockGenerateContent.mockResolvedValue({
      content: JSON.stringify({
        name: 'Test Character',
        level: 5,
        background: {
          description: 'A brave adventurer',
          personality: 'Courageous and determined',
          motivation: 'To explore the world',
          fears: ['Death', 'Failure'],
          physicalDescription: 'Tall and strong'
        },
        attributes: [
          { id: 'strength', value: 8 },
          { id: 'intelligence', value: 6 }
        ],
        skills: [
          { id: 'swordsmanship', level: 7 },
          { id: 'magic', level: 4 }
        ]
      }),
      finishReason: 'stop'
    });
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
      const mockCharacterWithInvalidValues = {
        name: 'Test Hero',
        level: 3,
        background: {
          description: 'A test character',
          personality: 'Test personality',
          motivation: 'Test motivation',
          fears: ['Death', 'Failure'],
          physicalDescription: 'Tall and strong'
        },
        attributes: [
          { id: 'strength', value: 15 }, // Exceeds max (10)
          { id: 'intelligence', value: -5 } // Below min (1)
        ],
        skills: [
          { id: 'swordsmanship', level: 7 },
          { id: 'magic', level: 4 }
        ]
      };

      // Mock AI client to return invalid values
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(mockCharacterWithInvalidValues),
        finishReason: 'stop'
      });

      const result = await generateCharacter(mockWorld, [], undefined, 'original');

      // Values should be clamped to valid ranges
      const strengthAttr = result.attributes.find(a => a.id === 'strength');
      const intelligenceAttr = result.attributes.find(a => a.id === 'intelligence');

      expect(strengthAttr?.value).toBe(10); // Clamped to max
      expect(intelligenceAttr?.value).toBe(1); // Clamped to min
    });

    it('should validate skill levels within 0-10 range', async () => {
      const mockCharacterWithInvalidSkills = {
        name: 'Test Hero',
        level: 3,
        background: {
          description: 'A test character',
          personality: 'Test personality',
          motivation: 'Test motivation',
          fears: ['Death', 'Failure'],
          physicalDescription: 'Tall and strong'
        },
        attributes: [
          { id: 'strength', value: 8 },
          { id: 'intelligence', value: 6 }
        ],
        skills: [
          { id: 'swordsmanship', level: 15 }, // Exceeds max (10)
          { id: 'magic', level: -2 } // Below min (0)
        ]
      };

      // Mock AI client to return invalid skill values
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(mockCharacterWithInvalidSkills),
        finishReason: 'stop'
      });

      const result = await generateCharacter(mockWorld, [], undefined, 'original');

      // Values should be clamped to valid ranges
      const swordSkill = result.skills.find(s => s.id === 'swordsmanship');
      const magicSkill = result.skills.find(s => s.id === 'magic');

      expect(swordSkill?.level).toBe(10); // Clamped to max
      expect(magicSkill?.level).toBe(0); // Clamped to min
    });
  });

  describe('API Error Handling', () => {
    it('should use template fallback when API fails', async () => {
      // Mock API failure
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      const result = await generateCharacter(mockWorld, [], undefined, 'original');
      
      // Should fall back to template generation
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('attributes');
      expect(result).toHaveProperty('skills');
      expect(result.isKnownFigure).toBe(false);
    });

    it('should handle malformed JSON response', async () => {
      const malformedResponse = {
        content: 'This is not valid JSON'
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(malformedResponse),
      } as Response);

      const result = await generateCharacter(mockWorld, [], undefined, 'original');
      
      // Should fall back to template generation
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('attributes');
      expect(result).toHaveProperty('skills');
    });
  });

  describe('Generation Types', () => {
    it('should set isKnownFigure correctly for known character generation', async () => {
      const result = await generateCharacter(mockWorld, [], undefined, 'known');
      expect(result.isKnownFigure).toBe(true);
    });

    it('should set isKnownFigure correctly for original character generation', async () => {
      const result = await generateCharacter(mockWorld, [], undefined, 'original');
      expect(result.isKnownFigure).toBe(false);
    });

    it('should use suggested name for specific generation type', async () => {
      const suggestedName = 'Aragorn';
      const result = await generateCharacter(mockWorld, [], suggestedName, 'specific');
      expect(result.name).toBe(suggestedName);
      expect(result.isKnownFigure).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should fall back to template generation when AI response is invalid JSON', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: 'Invalid JSON response' }),
      } as Response);

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
            motivation: 'Test motivation',
            fears: ['Death', 'Failure'],
            physicalDescription: 'Tall and strong'
          },
          attributes: [],
          skills: []
        })
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponseWithoutName),
      } as Response);

      const result = await generateCharacter(mockWorld, [], undefined, 'original');
      
      // Should successfully return a template-generated character with a valid name
      expect(result.name).toBeTruthy();
      expect(typeof result.name).toBe('string');
      expect(result.name.length).toBeGreaterThan(0);
    });

    it('should fall back to template generation when fetch throws an error', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

      const result = await generateCharacter(mockWorld, [], undefined, 'original');
      
      // Should successfully return a template-generated character
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('attributes');
      expect(result).toHaveProperty('skills');
    });
  });
});