import { analyzeWorldDescription } from '../worldAnalyzer';
import { AIPromptProcessor } from '@/lib/ai/aiPromptProcessor';

// Mock the AI prompt processor
jest.mock('@/lib/ai/aiPromptProcessor');

describe('worldAnalyzer', () => {
  const mockProcess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the constructor and process method
    (AIPromptProcessor as jest.Mock).mockImplementation(() => ({
      processAndSend: mockProcess, // Corrected method name
    }));
  });

  test('sends correct prompt to AI service', async () => {
    const description = 'A fantasy world with magic and dragons';
    const mockResponse = {
      content: JSON.stringify({
        attributes: [
          { name: 'Magic', description: 'Control over supernatural forces', minValue: 1, maxValue: 10, category: 'Supernatural' },
          { name: 'Medieval', description: 'Reflects the technological and social level', minValue: 1, maxValue: 10, category: 'Setting' },
          { name: 'Dragons', description: 'Presence and influence of dragons', minValue: 1, maxValue: 10, category: 'Creatures' }, // Changed from Conflict to Dragons
        ],
        skills: [],
      }),
    };

    mockProcess.mockResolvedValue(mockResponse);

    await analyzeWorldDescription(description);

    // The first argument to processAndSend is the templateId
    // The second argument is an object of variables, where one variable is 'prompt'
    expect(mockProcess).toHaveBeenCalledWith(
      'world-analysis', // templateId
      expect.objectContaining({
        prompt: expect.stringContaining('Analyze the following world description')
      })
    );
    expect(mockProcess).toHaveBeenCalledWith(
      'world-analysis', // templateId
      expect.objectContaining({
        prompt: expect.stringContaining(description)
      })
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
            linkedAttributeName: 'Strength',
          },
        ],
      }),
    };

    mockProcess.mockResolvedValue(mockResponse);

    const result = await analyzeWorldDescription('Test description');

    // Test should expect what the mock is returning
    expect(result.attributes).toHaveLength(3);
    expect(result.attributes[0]).toEqual({
      name: 'Magic',
      description: 'Control over supernatural forces',
      minValue: 1,
      maxValue: 10,
      category: 'Supernatural',
      accepted: false,
    });
    expect(result.attributes[1]).toEqual({
      name: 'Medieval',
      description: 'Reflects the technological and social level',
      minValue: 1,
      maxValue: 10,
      category: 'Setting',
      accepted: false,
    });
    expect(result.attributes[2]).toEqual({
      name: 'Dragons',
      description: 'Presence and influence of dragons',
      minValue: 1,
      maxValue: 10,
      category: 'Creatures',
      accepted: false,
    });

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0]).toEqual({
      name: 'Swordsmanship',
      description: 'Skill with bladed weapons',
      difficulty: 'medium',
      category: 'Combat',
      linkedAttributeName: 'Strength',
      accepted: false,
    });
  });

  test('extracts JSON from mixed content response', async () => {
    const mockResponse = {
      content: `Here's the analysis:
      {
        "attributes": [
          {
            "name": "Intelligence",
            "description": "Mental acuity",
            "minValue": 1,
            "maxValue": 10
          }
        ],
        "skills": []
      }
      That should work for your world.`,
    };

    mockProcess.mockResolvedValue(mockResponse);

    const result = await analyzeWorldDescription('Test description');

    expect(result.attributes).toHaveLength(1);
    expect(result.attributes[0].name).toBe('Intelligence');
  });

  test('returns default suggestions on AI failure', async () => {
    mockProcess.mockRejectedValue(new Error('AI service unavailable'));

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

    mockProcess.mockResolvedValue(mockResponse);

    const result = await analyzeWorldDescription('Test description');

    // Should have default values filled in
    expect(result.attributes[0].minValue).toBe(1);
    expect(result.attributes[0].maxValue).toBe(10);
    expect(result.attributes[0].accepted).toBe(false);

    expect(result.skills[0].difficulty).toBe('medium');
    expect(result.skills[0].accepted).toBe(false);
  });

  test('handles network errors gracefully', async () => {
    mockProcess.mockRejectedValue(new Error('Network error'));

    const result = await analyzeWorldDescription('Test description');

    // Should not throw, should return defaults
    expect(result.attributes).toBeDefined();
    expect(result.skills).toBeDefined();
    expect(result.attributes.length).toBeGreaterThan(0);
    expect(result.skills.length).toBeGreaterThan(0);
  });
});
