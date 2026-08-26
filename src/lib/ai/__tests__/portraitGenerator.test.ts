// src/lib/ai/__tests__/portraitGenerator.test.ts

import { buildPortraitPrompt } from '../portraitGenerator';
import { PortraitSubject } from '../../../types/character.types';
import { AIClient } from '../types';

// Mock the AI client
const mockAIClient: AIClient = {
  generateContent: jest.fn(),
  generateImage: jest.fn(),
};

describe('portraitGenerator', () => {
  let mockCharacter: PortraitSubject;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock detection and enhancement responses
    (mockAIClient.generateContent as jest.Mock).mockImplementation(
      (prompt: string) => {
        // Handle detection requests
        if (
          prompt.includes('Is "') &&
          prompt.includes('" a character from any form of media')
        ) {
          if (prompt.includes('Nathan Fielder')) {
            return Promise.resolve({
              content: '{"isKnownFigure": true, "figureType": "comedian"}',
              finishReason: 'stop',
            });
          }
          return Promise.resolve({
            content: '{"isKnownFigure": false, "figureType": null}',
            finishReason: 'stop',
          });
        }

        // Handle personality to visual traits conversion
        if (
          prompt.includes(
            'Convert these personality traits into visible physical expressions'
          )
        ) {
          return Promise.resolve({
            content: 'expressing wise mysterious character',
            finishReason: 'stop',
          });
        }

        // Handle physical diversity enhancement
        if (prompt.includes('Add specific, non-idealized physical features')) {
          return Promise.resolve({
            content: 'realistic average person with natural imperfections',
            finishReason: 'stop',
          });
        }

        // Default fallback for any other prompts
        return Promise.resolve({
          content: 'test response',
          finishReason: 'stop',
        });
      }
    );

    mockCharacter = {
      name: 'Elara Moonshadow',
      background: {
        history: 'A skilled mage from the northern kingdoms',
        personality: 'Wise and mysterious',
        physicalDescription:
          'Tall elf with long silver hair and piercing blue eyes',
      },
    };
  });

  describe('buildPortraitPrompt', () => {
    it('should create detailed prompt from character data', async () => {
      const prompt = await buildPortraitPrompt(mockAIClient,mockCharacter);

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
          history: 'Known for his comedy and awkward situations',
        },
      };

      const prompt = await buildPortraitPrompt(mockAIClient, comedianCharacter);

      // Check that detection was called
      expect(mockAIClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Nathan Fielder')
      );

      // Check the generated prompt is for a real person, not fantasy
      expect(prompt).toContain('Photorealistic portrait of Nathan Fielder');
      expect(prompt).toContain('comedian');
      expect(prompt).not.toContain('Fantasy character');
      expect(prompt).not.toContain('digital painting');
    });

    it('should limit prompt length to avoid token limits', async () => {
      const longCharacter = {
        ...mockCharacter,
        background: {
          ...mockCharacter.background,
          history: 'A'.repeat(1000),
          personality: 'B'.repeat(1000),
        },
      };

      const prompt = await buildPortraitPrompt(mockAIClient,longCharacter);

      // Gemini has 480 token limit, roughly 1920 characters
      expect(prompt.length).toBeLessThan(1920);
    });

    it('should include style keywords for quality', async () => {
      const prompt = await buildPortraitPrompt(mockAIClient,mockCharacter);

      expect(prompt).toMatch(/portrait|character art|fantasy art/i);
      expect(prompt).toMatch(/photorealistic|documentary photography/i);
    });
  });
});
