// src/lib/ai/__tests__/portraitGenerator.test.ts

import { PortraitGenerator } from '../portraitGenerator';
import { Character } from '../../../types/character.types';
import { AIClient } from '../types';

// Mock the AI client
const mockAIClient: AIClient = {
  generateContent: jest.fn(),
  generateImage: jest.fn()
};

describe('PortraitGenerator', () => {
  let generator: PortraitGenerator;
  let mockCharacter: Character;

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new PortraitGenerator(mockAIClient);
    
    // Mock detection responses
    (mockAIClient.generateContent as jest.Mock).mockImplementation((prompt: string) => {
      if (prompt.includes('Nathan Fielder')) {
        return Promise.resolve({
          content: '{"isKnownFigure": true, "figureType": "comedian", "actorName": null}'
        });
      }
      return Promise.resolve({
        content: '{"isKnownFigure": false, "figureType": null, "actorName": null}'
      });
    });
    
    mockCharacter = {
      id: 'char-1',
      name: 'Elara Moonshadow',
      worldId: 'world-1',
      attributes: [
        { attributeId: 'strength', value: 8 },
        { attributeId: 'intelligence', value: 15 }
      ],
      skills: [
        { skillId: 'magic', level: 10, experience: 100, isActive: true }
      ],
      background: {
        history: 'A skilled mage from the northern kingdoms',
        personality: 'Wise and mysterious',
        goals: ['Master ancient magic'],
        fears: ['Losing control of power'],
        relationships: []
      },
      inventory: { items: [], capacity: 100, categories: [], characterId: 'char-1' },
      status: { health: 100, maxHealth: 100, conditions: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  describe('generatePortrait', () => {
    it('should generate a portrait based on character data', async () => {
      const mockImageData = 'data:image/png;base64,abc123';
      (mockAIClient.generateImage as jest.Mock).mockResolvedValue({
        image: mockImageData,
        prompt: 'portrait of Elara Moonshadow'
      });

      const result = await generator.generatePortrait(mockCharacter);

      expect(result.type).toBe('ai-generated');
      expect(result.url).toBe(mockImageData);
      expect(result.prompt).toContain('Elara Moonshadow');
      expect(result.generatedAt).toBeDefined();
    });

    it('should build descriptive prompt from character attributes', async () => {
      (mockAIClient.generateImage as jest.Mock).mockResolvedValue({
        image: 'data:image/png;base64,abc123',
        prompt: ''
      });

      await generator.generatePortrait(mockCharacter);

      const callArgs = (mockAIClient.generateImage as jest.Mock).mock.calls[0][0];
      expect(callArgs).toContain('Elara Moonshadow');
      expect(callArgs).toContain('mage');
      expect(callArgs).toContain('wise and mysterious');
    });

    it('should handle generation failures gracefully', async () => {
      (mockAIClient.generateImage as jest.Mock).mockRejectedValue(
        new Error('Image generation failed')
      );

      await expect(generator.generatePortrait(mockCharacter))
        .rejects.toThrow('Failed to generate character portrait');
    });

    it('should include world theme in portrait generation', async () => {
      const worldTheme = 'dark fantasy';
      (mockAIClient.generateImage as jest.Mock).mockResolvedValue({
        image: 'data:image/png;base64,abc123',
        prompt: ''
      });

      await generator.generatePortrait(mockCharacter, { worldTheme });

      const callArgs = (mockAIClient.generateImage as jest.Mock).mock.calls[0][0];
      expect(callArgs).toContain('dark fantasy');
    });
  });

  describe('buildPortraitPrompt', () => {
    it('should create detailed prompt from character data', () => {
      const prompt = generator.buildPortraitPrompt(mockCharacter);

      expect(prompt).toContain('Elara Moonshadow');
      expect(prompt).toContain('wise and mysterious');
      expect(prompt).toContain('mage');
      expect(prompt).toContain('portrait');
    });

    it('should detect and handle comedians/TV personalities as known figures', async () => {
      // Generate portrait (which includes detection)
      (mockAIClient.generateImage as jest.Mock).mockResolvedValue({
        image: 'data:image/png;base64,abc123',
        prompt: 'Professional portrait photograph of Nathan Fielder'
      });
      
      // Check that detection was called
      expect(mockAIClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Nathan Fielder')
      );
      
      // Check the generated prompt is for a real person, not fantasy
      const imagePrompt = (mockAIClient.generateImage as jest.Mock).mock.calls[0][0];
      expect(imagePrompt).toContain('Professional portrait photograph');
      expect(imagePrompt).toContain('Nathan Fielder');
      expect(imagePrompt).not.toContain('Fantasy character');
      expect(imagePrompt).not.toContain('digital painting');
    });

    it('should limit prompt length to avoid token limits', () => {
      const longCharacter = {
        ...mockCharacter,
        background: {
          ...mockCharacter.background,
          history: 'A'.repeat(1000),
          personality: 'B'.repeat(1000)
        }
      };

      const prompt = generator.buildPortraitPrompt(longCharacter);
      
      // Gemini has 480 token limit, roughly 1920 characters
      expect(prompt.length).toBeLessThan(1920);
    });

    it('should include style keywords for quality', () => {
      const prompt = generator.buildPortraitPrompt(mockCharacter);

      expect(prompt).toMatch(/portrait|character art|fantasy art/i);
      expect(prompt).toMatch(/detailed|high quality/i);
    });
  });
});