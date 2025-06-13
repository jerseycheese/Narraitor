import { analyzeWorldDescription } from '../worldAnalyzer';
import { GeminiClient } from '../geminiClient';

// Mock the GeminiClient
jest.mock('../geminiClient');
jest.mock('../config');

describe('worldAnalyzer', () => {
  const mockGenerateContent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation
    (GeminiClient as jest.Mock).mockImplementation(() => ({
      generateContent: mockGenerateContent,
    }));
  });

  test('sends correct prompt to AI service', async () => {
    const description = 'A fantasy world with magic and dragons';
    const mockResponse = {
      content: JSON.stringify({
        attributes: [
          { name: 'Magic', description: 'Control over supernatural forces', minValue: 1, maxValue: 10, category: 'Supernatural' },
          { name: 'Medieval', description: 'Reflects the technological and social level', minValue: 1, maxValue: 10, category: 'Setting' },
          { name: 'Dragons', description: 'Presence and influence of dragons', minValue: 1, maxValue: 10, category: 'Creatures' },
        ],
        skills: [],
      }),
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    await analyzeWorldDescription(description);

    // Verify that the prompt is sent correctly to the AI service
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining('Analyze the following world description')
    );
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining(description)
    );
  });

  test('parses valid JSON response', async () => {
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

    const result = await analyzeWorldDescription('Test description');

    // Test should expect what the mock is returning
    expect(result.attributes).toHaveLength(3);
    
    // Use a more flexible approach for testing - expect.objectContaining ensures we match
    // the important fields without being strict about additional calculated fields
    expect(result.attributes[0]).toEqual(expect.objectContaining({
      name: 'Magic',
      description: 'Control over supernatural forces',
      minValue: 1,
      maxValue: 10,
      category: 'Supernatural',
      accepted: false,
    }));
    expect(result.attributes[1]).toEqual(expect.objectContaining({
      name: 'Medieval',
      description: 'Reflects the technological and social level',
      minValue: 1,
      maxValue: 10,
      category: 'Setting',
      accepted: false,
    }));
    expect(result.attributes[2]).toEqual(expect.objectContaining({
      name: 'Dragons',
      description: 'Presence and influence of dragons',
      minValue: 1,
      maxValue: 10,
      category: 'Creatures',
      accepted: false,
    }));

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0]).toEqual(expect.objectContaining({
      name: 'Swordsmanship',
      description: 'Skill with bladed weapons',
      difficulty: 'medium',
      category: 'Combat',
      linkedAttributeNames: ['Strength'],
      accepted: false,
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
    }));
  });


  test('returns default suggestions on AI failure', async () => {
    mockGenerateContent.mockRejectedValue(new Error('AI service unavailable'));

    const result = await analyzeWorldDescription('Test description');

    // Should return default suggestions
    expect(result.attributes).toHaveLength(6);
    expect(result.attributes[0].name).toBe('Strength');
    expect(result.attributes[1].name).toBe('Intelligence');
    expect(result.attributes[2].name).toBe('Agility');
    expect(result.attributes[3].name).toBe('Charisma');
    expect(result.attributes[4].name).toBe('Dexterity');
    expect(result.attributes[5].name).toBe('Constitution');

    expect(result.skills).toHaveLength(12);
    expect(result.skills[0].name).toBe('Combat');
    expect(result.skills[1].name).toBe('Stealth');
    expect(result.skills[2].name).toBe('Perception');
    expect(result.skills[3].name).toBe('Persuasion');
    expect(result.skills[4].name).toBe('Investigation');
    expect(result.skills[5].name).toBe('Athletics');
  });

  test('transforms AI response to correct format', async () => {
    const mockResponse = {
      content: JSON.stringify({
        attributes: [
          {
            name: 'Wisdom',
            description: 'Spiritual insight',
            // Missing minValue and maxValue
            category: 'Mental',
          },
        ],
        skills: [
          {
            name: 'Meditation',
            description: 'Inner peace and focus',
            // Missing difficulty
            category: 'Mental',
          },
        ],
      }),
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await analyzeWorldDescription('Test description');

    // Should have default values filled in
    expect(result.attributes[0].minValue).toBe(1);
    expect(result.attributes[0].maxValue).toBe(10);
    expect(result.attributes[0].accepted).toBe(false);

    expect(result.skills[0].difficulty).toBe('medium');
    expect(result.skills[0].accepted).toBe(false);
  });

  test('handles network errors gracefully', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Network error'));

    const result = await analyzeWorldDescription('Test description');

    // Should not throw, should return defaults
    expect(result.attributes).toBeDefined();
    expect(result.skills).toBeDefined();
    expect(result.attributes.length).toBeGreaterThan(0);
    expect(result.skills.length).toBeGreaterThan(0);
  });
});
