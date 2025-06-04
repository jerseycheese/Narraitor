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
    
    // Mock detection and enhancement responses
    (mockAIClient.generateContent as jest.Mock).mockImplementation((prompt: string) => {
      // Handle detection requests
      if (prompt.includes('Is "') && prompt.includes('" a character from any form of media')) {
        if (prompt.includes('Nathan Fielder')) {
          return Promise.resolve({
            content: '{"isKnownFigure": true, "figureType": "comedian"}',
            finishReason: 'stop'
          });
        }
        return Promise.resolve({
          content: '{"isKnownFigure": false, "figureType": null}',
          finishReason: 'stop'
        });
      }
      
      // Handle personality to visual traits conversion
      if (prompt.includes('Convert these personality traits into visible physical expressions')) {
        return Promise.resolve({
          content: 'expressing wise mysterious character',
          finishReason: 'stop'
        });
      }
      
      // Handle physical diversity enhancement  
      if (prompt.includes('Add specific, non-idealized physical features')) {
        return Promise.resolve({
          content: 'realistic average person with natural imperfections',
          finishReason: 'stop'
        });
      }
      
      // Default fallback for any other prompts
      return Promise.resolve({
        content: 'test response',
        finishReason: 'stop'
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
        physicalDescription: 'Tall elf with long silver hair and piercing blue eyes',
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
      
      // Check that detection was called with Elara's name
      expect(mockAIClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Elara Moonshadow')
      );
      
      // The prompt should be for an unknown character (not a comedian)
      expect(callArgs).toContain('Elara Moonshadow');
      expect(callArgs).toContain('Character portrait'); // Not "Photorealistic portrait"
      expect(callArgs).toContain('realistic average person'); // Should include enhanced physical description
      expect(callArgs).not.toContain('comedian');
      expect(callArgs).not.toContain('comedy club');
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
    it('should create detailed prompt from character data', async () => {
      const prompt = await generator.buildPortraitPrompt(mockCharacter);

      expect(prompt).toContain('Elara Moonshadow');
      expect(prompt).toContain('expressing wise mysterious character');
      expect(prompt).toContain('portrait');
    });

    it('should detect and handle comedians/TV personalities as known figures', async () => {
      const comedianCharacter = {
        ...mockCharacter,
        name: 'Nathan Fielder',
        background: {
          ...mockCharacter.background,
          history: 'Known for his comedy and awkward situations'
        }
      };
      
      // Generate portrait (which includes detection)
      (mockAIClient.generateImage as jest.Mock).mockResolvedValue({
        image: 'data:image/png;base64,abc123',
        prompt: 'Photorealistic portrait of Nathan Fielder'
      });
      
      await generator.generatePortrait(comedianCharacter);
      
      // Check that detection was called
      expect(mockAIClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Nathan Fielder')
      );
      
      // Check the generated prompt is for a real person, not fantasy
      const imagePrompt = (mockAIClient.generateImage as jest.Mock).mock.calls[0][0];
      expect(imagePrompt).toContain('Photorealistic portrait of Nathan Fielder');
      expect(imagePrompt).toContain('comedian');
      expect(imagePrompt).not.toContain('Fantasy character');
      expect(imagePrompt).not.toContain('digital painting');
    });

    it('should limit prompt length to avoid token limits', async () => {
      const longCharacter = {
        ...mockCharacter,
        background: {
          ...mockCharacter.background,
          history: 'A'.repeat(1000),
          personality: 'B'.repeat(1000)
        }
      };

      const prompt = await generator.buildPortraitPrompt(longCharacter);
      
      // Gemini has 480 token limit, roughly 1920 characters
      expect(prompt.length).toBeLessThan(1920);
    });

    it('should include style keywords for quality', async () => {
      const prompt = await generator.buildPortraitPrompt(mockCharacter);

      expect(prompt).toMatch(/portrait|character art|fantasy art/i);
      expect(prompt).toMatch(/photorealistic|documentary photography/i);
    });
  });
});
