import { analyzeWorldDescription } from '../worldAnalyzer';
import { GeminiClient } from '../geminiClient';

// Mock the GeminiClient
jest.mock('../geminiClient');
// Mock the config
jest.mock('../config');

describe('worldAnalyzer - AI Suggestions', () => {
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateContent = jest.fn();
    (GeminiClient as jest.Mock).mockImplementation(() => ({
      generateContent: mockGenerateContent,
    }));
  });

  describe('analyzeWorldDescription', () => {
    it('should analyze world description and return attribute and skill suggestions', async () => {
      const worldDescription = 'A fantasy world with magic and dragons';
      const mockAIResponse = {
        content: JSON.stringify({
          attributes: [
            {
              name: 'Arcane Power',
              description: 'Magical energy and spellcasting ability',
              minValue: 1,
              maxValue: 10,
              category: 'Magical'
            },
            {
              name: 'Dragon Affinity',
              description: 'Connection to draconic beings',
              minValue: 1,
              maxValue: 10,
              category: 'Magical'
            }
          ],
          skills: [
            {
              name: 'Spellcasting',
              description: 'Ability to cast magical spells',
              difficulty: 'hard',
              category: 'Magic',
              linkedAttributeName: 'Arcane Power'
            },
            {
              name: 'Dragon Riding',
              description: 'Skill in commanding and riding dragons',
              difficulty: 'hard',
              category: 'Physical',
              linkedAttributeName: 'Dragon Affinity'
            }
          ]
        })
      };

      mockGenerateContent.mockResolvedValue(mockAIResponse);

      const result = await analyzeWorldDescription(worldDescription);

      // Verify the AI client was called correctly
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(worldDescription)
      );

      // Verify attributes are returned with correct structure
      expect(result.attributes).toHaveLength(2);
      expect(result.attributes[0]).toEqual(expect.objectContaining({
        name: 'Arcane Power',
        description: 'Magical energy and spellcasting ability',
        minValue: 1,
        maxValue: 10,
        category: 'Magical',
        accepted: false
      }));

      // Verify skills are returned with correct structure
      expect(result.skills).toHaveLength(2);
      expect(result.skills[0]).toEqual(expect.objectContaining({
        name: 'Spellcasting',
        description: 'Ability to cast magical spells',
        difficulty: 'hard',
        category: 'Magic',
        linkedAttributeName: 'Arcane Power',
        accepted: false
      }));
    });

    it('should handle JSON response embedded in text', async () => {
      const worldDescription = 'A cyberpunk world';
      const mockAIResponse = {
        content: `Here are the suggestions:
        {
          "attributes": [
            {
              "name": "Cyber Enhancement",
              "description": "Level of technological augmentation",
              "minValue": 1,
              "maxValue": 10,
              "category": "Tech"
            }
          ],
          "skills": [
            {
              "name": "Hacking",
              "description": "Breaking into computer systems",
              "difficulty": "hard",
              "category": "Tech"
            }
          ]
        }
        These suggestions fit the cyberpunk theme.`
      };

      mockGenerateContent.mockResolvedValue(mockAIResponse);

      const result = await analyzeWorldDescription(worldDescription);

      // JSON is successfully extracted from the response
      expect(result.attributes).toHaveLength(1);
      expect(result.attributes[0].name).toBe('Cyber Enhancement');
      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe('Hacking');
    });

    it('should provide default suggestions when AI fails', async () => {
      const worldDescription = 'A unique world';
      
      // Simulate AI failure
      mockGenerateContent.mockRejectedValue(new Error('AI service unavailable'));

      const result = await analyzeWorldDescription(worldDescription);

      // Should return default suggestions
      expect(result.attributes.length).toBeGreaterThan(0);
      expect(result.skills.length).toBeGreaterThan(0);
      
      // Check for some expected default attributes
      const attributeNames = result.attributes.map(a => a.name);
      expect(attributeNames).toContain('Strength');
      expect(attributeNames).toContain('Intelligence');
      
      // Check for some expected default skills
      const skillNames = result.skills.map(s => s.name);
      expect(skillNames).toContain('Combat');
      expect(skillNames).toContain('Stealth');
    });

    it('should handle malformed JSON responses', async () => {
      const worldDescription = 'A post-apocalyptic world';
      const mockAIResponse = {
        content: 'Invalid JSON response'
      };

      mockGenerateContent.mockResolvedValue(mockAIResponse);

      const result = await analyzeWorldDescription(worldDescription);

      // Should fall back to default suggestions
      expect(result.attributes.length).toBeGreaterThan(0);
      expect(result.skills.length).toBeGreaterThan(0);
    });

    it('should set accepted property to false for all suggestions', async () => {
      const worldDescription = 'A steampunk world';
      const mockAIResponse = {
        content: JSON.stringify({
          attributes: [
            { name: 'Steam Power', description: 'Control over steam-based tech' }
          ],
          skills: [
            { name: 'Engineering', description: 'Building mechanical devices' }
          ]
        })
      };

      mockGenerateContent.mockResolvedValue(mockAIResponse);

      const result = await analyzeWorldDescription(worldDescription);

      // All suggestions should have accepted: false
      result.attributes.forEach(attr => {
        expect(attr.accepted).toBe(false);
      });
      result.skills.forEach(skill => {
        expect(skill.accepted).toBe(false);
      });
    });
  });
});