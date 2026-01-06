// src/lib/ai/templateGenerator.test.ts

import { TemplateGenerator } from './templateGenerator';
import { generateWorldTemplatePrompt } from './templatePrompts';
import { AIClient } from './types';

// Mock the AI client
const mockAIClient = {
  generateContent: jest.fn()
};

describe('TemplateGenerator', () => {
  let templateGenerator: TemplateGenerator;

  beforeEach(() => {
    templateGenerator = new TemplateGenerator(mockAIClient as AIClient);
    jest.clearAllMocks();
  });

  describe('generateWorldTemplate', () => {
    test('generates template for "inspired by" mode', async () => {
      const mockResponse = {
        content: JSON.stringify({
          name: 'Neo-Victorian Skyport',
          description: 'A steampunk world floating in the clouds',
          genre: 'Steampunk',
          attributes: [
            { name: 'Strength', baseValue: 50, minValue: 0, maxValue: 100, category: 'Physical' }
          ],
          skills: [
            { name: 'Engineering', baseValue: 40, minValue: 0, maxValue: 100, difficulty: 'medium', category: 'Technical' }
          ],
          explanation: 'Steampunk worlds emphasize mechanical ingenuity and Victorian aesthetics'
        })
      };

      mockAIClient.generateContent.mockResolvedValue(mockResponse);

      const result = await templateGenerator.generateWorldTemplate({
        userInput: 'Steampunk flying cities',
        type: 'inspired-by'
      });

      expect(result).toEqual({
        name: 'Neo-Victorian Skyport',
        description: 'A steampunk world floating in the clouds',
        genre: 'other',
        attributes: expect.arrayContaining([
          expect.objectContaining({ name: 'Strength' })
        ]),
        skills: expect.arrayContaining([
          expect.objectContaining({ name: 'Engineering' })
        ]),
        explanation: 'Steampunk worlds emphasize mechanical ingenuity and Victorian aesthetics'
      });

      expect(mockAIClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('inspired by: "Steampunk flying cities"')
      );
    });

    test('generates template for genre mixing mode', async () => {
      const mockResponse = {
        content: JSON.stringify({
          name: 'Cyber Frontier',
          description: 'A world where high-tech meets the wild west',
          genre: 'Cyberpunk Western',
          attributes: [
            { name: 'Tech Savvy', baseValue: 60, minValue: 0, maxValue: 100, category: 'Mental' },
            { name: 'Grit', baseValue: 70, minValue: 0, maxValue: 100, category: 'Social' }
          ],
          skills: [
            { name: 'Hacking', baseValue: 45, minValue: 0, maxValue: 100, difficulty: 'hard', category: 'Technical' },
            { name: 'Quick Draw', baseValue: 50, minValue: 0, maxValue: 100, difficulty: 'medium', category: 'Combat' }
          ],
          explanation: 'This genre mix combines cyberpunk technology with western frontier themes'
        })
      };

      mockAIClient.generateContent.mockResolvedValue(mockResponse);

      const result = await templateGenerator.generateWorldTemplate({
        genres: ['Cyberpunk', 'Western'],
        type: 'genre-mix'
      });

      expect(result.genre).toBe('other');
      expect(result.attributes).toHaveLength(2);
      expect(result.skills).toHaveLength(2);
      
      expect(mockAIClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Cyberpunk + Western')
      );
    });

    test('generates surprise template', async () => {
      const mockResponse = {
        content: JSON.stringify({
          name: 'Microscopic Empire',
          description: 'A world inside a single drop of water',
          genre: 'Micro Fantasy',
          attributes: [
            { name: 'Surface Tension', baseValue: 40, minValue: 0, maxValue: 100, category: 'Physical' }
          ],
          skills: [
            { name: 'Bubble Navigation', baseValue: 30, minValue: 0, maxValue: 100, difficulty: 'easy', category: 'Movement' }
          ],
          explanation: 'An unexpected microscopic world with unique physics and challenges'
        })
      };

      mockAIClient.generateContent.mockResolvedValue(mockResponse);

      const result = await templateGenerator.generateWorldTemplate({
        type: 'surprise-me'
      });

      expect(result.name).toBe('Microscopic Empire');
      expect(result.genre).toBe('other');
      
      expect(mockAIClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('completely unexpected')
      );
    });

    test('handles invalid JSON response gracefully', async () => {
      mockAIClient.generateContent.mockResolvedValue({
        content: 'Invalid JSON response'
      });

      await expect(
        templateGenerator.generateWorldTemplate({ type: 'surprise-me' })
      ).rejects.toThrow('Failed to parse world template');
    });

    test('handles AI generation failure', async () => {
      mockAIClient.generateContent.mockRejectedValue(new Error('AI service unavailable'));

      await expect(
        templateGenerator.generateWorldTemplate({ type: 'surprise-me' })
      ).rejects.toThrow('AI service unavailable');
    });
  });

  describe('validateTemplate', () => {
    test('validates correct template structure', () => {
      const validTemplate = {
        name: 'Test World',
        description: 'A test world',
        genre: 'Fantasy',
        attributes: [
          { name: 'Strength', baseValue: 50, minValue: 0, maxValue: 100, category: 'Physical' }
        ],
        skills: [
          { name: 'Swordplay', baseValue: 25, minValue: 0, maxValue: 100, difficulty: 'medium', category: 'Combat' }
        ],
        explanation: 'Test explanation'
      };

      expect(() => templateGenerator.validateTemplate(validTemplate)).not.toThrow();
    });

    test('throws error for missing required fields', () => {
      const invalidTemplate = {
        name: 'Test World',
        // Missing other required fields
      };

      expect(() => templateGenerator.validateTemplate(invalidTemplate as unknown))
        .toThrow('Invalid template structure: missing description');
    });

    test('normalizes genre values correctly', () => {
      const templateWithCapsGenre = {
        name: 'Test World',
        description: 'A test world',
        genre: 'Fantasy',
        attributes: [
          { name: 'Strength', baseValue: 50, minValue: 0, maxValue: 100, category: 'Physical' }
        ],
        skills: [
          { name: 'Swordplay', baseValue: 25, minValue: 0, maxValue: 100, difficulty: 'medium', category: 'Combat' }
        ],
        explanation: 'Test explanation'
      };

      templateGenerator.validateTemplate(templateWithCapsGenre);
      expect(templateWithCapsGenre.genre).toBe('fantasy');
    });

    test('coerces mixed genre values to a supported genre', () => {
      const templateWithMixedGenre = {
        name: 'Test World',
        description: 'A test world',
        genre: 'Cyberpunk Fantasy',
        attributes: [
          { name: 'Tech', baseValue: 50, minValue: 0, maxValue: 100, category: 'Mental' }
        ],
        skills: [
          { name: 'Hacking', baseValue: 25, minValue: 0, maxValue: 100, difficulty: 'hard', category: 'Technical' }
        ],
        explanation: 'Test explanation'
      };

      templateGenerator.validateTemplate(templateWithMixedGenre);
      expect(templateWithMixedGenre.genre).toBe('other');
    });
  });
});

describe('generateWorldTemplatePrompt', () => {
  test('creates correct prompt for inspired-by mode', () => {
    const prompt = generateWorldTemplatePrompt({
      userInput: 'Space pirates',
      type: 'inspired-by'
    });

    expect(prompt).toContain('inspired by: "Space pirates"');
    expect(prompt).toContain('valid JSON');
  });

  test('creates correct prompt for genre-mix mode', () => {
    const prompt = generateWorldTemplatePrompt({
      genres: ['Horror', 'Comedy'],
      type: 'genre-mix'
    });

    expect(prompt).toContain('Horror + Comedy');
    expect(prompt).toContain('seamlessly blends');
  });

  test('creates correct prompt for surprise-me mode', () => {
    const prompt = generateWorldTemplatePrompt({
      type: 'surprise-me'
    });

    expect(prompt).toContain('completely unexpected');
    expect(prompt).toContain('unique world');
  });

  test('includes genre constraints in prompt', () => {
    const prompt = generateWorldTemplatePrompt({
      userInput: 'Space adventure',
      type: 'inspired-by'
    });

    expect(prompt).toContain('fantasy, sci-fi, modern, historical, horror, mystery, western, cyberpunk, other');
    expect(prompt).toContain('Use lowercase values exactly as shown');
  });

  test('includes attribute description requirement', () => {
    const prompt = generateWorldTemplatePrompt({
      userInput: 'Space adventure',
      type: 'inspired-by'
    });

    expect(prompt).toContain('"description": "What this attribute represents"');
    expect(prompt).toContain('"description": "What this skill allows characters to do"');
  });
});
