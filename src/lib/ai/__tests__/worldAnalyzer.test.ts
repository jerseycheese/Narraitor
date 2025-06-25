import { analyzeWorldDescription } from '../worldAnalyzer';

// Mock the GeminiClient to focus on testing data transformation logic
jest.mock('../geminiClient', () => ({
  GeminiClient: jest.fn().mockImplementation(() => ({
    generateContent: jest.fn(),
  })),
}));

// Mock config with valid settings
jest.mock('../config', () => ({
  getAIConfig: jest.fn(() => ({
    geminiApiKey: 'test-api-key',
    modelName: 'test-model',
    maxRetries: 3,
    timeout: 30000,
  })),
  getGenerationConfig: jest.fn(() => ({})),
  getSafetySettings: jest.fn(() => []),
}));

describe('worldAnalyzer', () => {
  const { GeminiClient } = require('../geminiClient');
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateContent = jest.fn();
    GeminiClient.mockImplementation(() => ({
      generateContent: mockGenerateContent,
    }));
  });

  test('processes valid AI response into correct suggestion format', async () => {
    const mockResponse = {
      content: JSON.stringify({
        attributes: [
          { name: 'Magic', description: 'Control over supernatural forces', minValue: 1, maxValue: 10, category: 'Supernatural' },
          { name: 'Medieval', description: 'Reflects the technological and social level', minValue: 1, maxValue: 10, category: 'Setting' },
          { name: 'Dragons', description: 'Presence and influence of dragons', minValue: 1, maxValue: 10, category: 'Creatures' },
        ],
        skills: [
          {
            name: 'Swordsmanship',
            description: 'Skill with bladed weapons',
            difficulty: 'medium',
            category: 'Combat',
            linkedAttributeNames: ['Strength'],
          },
        ],
      }),
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await analyzeWorldDescription('A fantasy world');

    // Test data transformation functionality
    expect(result.attributes).toHaveLength(3);
    expect(result.attributes[0]).toEqual({
      name: 'Magic',
      description: 'Control over supernatural forces',
      minValue: 1,
      maxValue: 10,
      baseValue: 5, // Should calculate middle value
      category: 'Supernatural',
      accepted: true, // Should auto-accept AI suggestions
    });

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0]).toEqual({
      name: 'Swordsmanship',
      description: 'Skill with bladed weapons',
      difficulty: 'medium',
      category: 'Combat',
      linkedAttributeNames: ['Strength'],
      accepted: true, // Should auto-accept AI suggestions
      baseValue: 5, // Should set default base value
      minValue: 1, // Should set fixed min
      maxValue: 10, // Should set fixed max
    });
  });

  test('handles JSON response in markdown code blocks', async () => {
    const mockResponse = {
      content: `Here's the analysis:

\`\`\`json
{
  "attributes": [
    { "name": "Wisdom", "description": "Spiritual insight", "category": "Mental" }
  ],
  "skills": [
    { "name": "Meditation", "description": "Inner peace", "category": "Mental" }
  ]
}
\`\`\`

Hope this helps!`,
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await analyzeWorldDescription('Test description');

    // Test JSON extraction from markdown functionality
    expect(result.attributes).toHaveLength(1);
    expect(result.attributes[0].name).toBe('Wisdom');
    expect(result.attributes[0].description).toBe('Spiritual insight');
    
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('Meditation');
    expect(result.skills[0].description).toBe('Inner peace');
  });


  test('returns complete default suggestions when AI fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('AI service unavailable'));

    const result = await analyzeWorldDescription('Test description');

    // Test error fallback functionality - should return complete default set
    expect(result.attributes).toHaveLength(6);
    expect(result.skills).toHaveLength(12);
    
    // Test that default attributes have proper structure
    expect(result.attributes[0]).toEqual({
      name: 'Strength',
      description: 'Physical power and endurance',
      minValue: 1,
      maxValue: 10,
      baseValue: 5,
      category: 'Physical',
      accepted: true,
    });
    
    // Test that default skills have proper structure
    expect(result.skills[0]).toEqual({
      name: 'Combat',
      description: 'Ability to fight effectively',
      difficulty: 'medium',
      category: 'Combat',
      linkedAttributeNames: ['Strength'],
      accepted: true,
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
    });
  });

  test('fills in missing values with defaults', async () => {
    const mockResponse = {
      content: JSON.stringify({
        attributes: [
          {
            name: 'Wisdom',
            description: 'Spiritual insight',
            // Missing minValue, maxValue, category
          },
        ],
        skills: [
          {
            name: 'Meditation',
            description: 'Inner peace and focus',
            // Missing difficulty, linkedAttributeNames
          },
        ],
      }),
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await analyzeWorldDescription('Test description');

    // Test default value filling functionality
    expect(result.attributes[0]).toEqual({
      name: 'Wisdom',
      description: 'Spiritual insight',
      minValue: 1, // Should default to 1
      maxValue: 10, // Should default to 10
      baseValue: 5, // Should calculate middle value
      category: undefined, // Should preserve undefined
      accepted: true, // Should auto-accept
    });

    expect(result.skills[0]).toEqual({
      name: 'Meditation',
      description: 'Inner peace and focus',
      difficulty: 'medium', // Should default to medium
      category: undefined, // Should preserve undefined
      linkedAttributeNames: undefined, // Should preserve undefined
      accepted: true, // Should auto-accept
      baseValue: 5, // Should set default
      minValue: 1, // Should set fixed min
      maxValue: 10, // Should set fixed max
    });
  });

  test('calculates baseValue correctly for different ranges', async () => {
    const mockResponse = {
      content: JSON.stringify({
        attributes: [
          { name: 'Strength', description: 'Power', minValue: 5, maxValue: 15 },
          { name: 'Magic', description: 'Spells', minValue: 0, maxValue: 20 },
        ],
        skills: [],
      }),
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await analyzeWorldDescription('Test description');

    // Test baseValue calculation functionality
    expect(result.attributes[0].baseValue).toBe(10); // (5 + 15) / 2
    expect(result.attributes[1].baseValue).toBe(10); // (0 + 20) / 2
  });
  
  test('handles malformed JSON gracefully', async () => {
    const mockResponse = {
      content: 'This is not valid JSON at all!',
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await analyzeWorldDescription('Test description');

    // Test error handling - should fallback to defaults when JSON parsing fails
    expect(result.attributes).toHaveLength(6);
    expect(result.skills).toHaveLength(12);
    expect(result.attributes[0].name).toBe('Strength');
  });
});
