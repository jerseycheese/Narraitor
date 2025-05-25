// src/lib/ai/__tests__/portraitGenerator.geminiGuide.test.ts

import { PortraitGenerator } from '../portraitGenerator';
import { Character } from '../../../types/character.types';
import { createMockAIClient } from './portraitGenerator.test-helpers';

describe('PortraitGenerator - Following Gemini Guidelines', () => {
  let generator: PortraitGenerator;
  let mockAIClient: ReturnType<typeof createMockAIClient>;

  beforeEach(() => {
    mockAIClient = createMockAIClient();
    generator = new PortraitGenerator(mockAIClient);
  });

  const createTestCharacter = (name: string, isKnownFigure = false, knownFigureType?: string): Character => ({
    id: 'test-char',
    name,
    description: 'Test character',
    worldId: 'test-world',
    attributes: [],
    skills: [],
    background: {
      history: 'A brave adventurer',
      personality: 'Courageous and wise leader',
      goals: [],
      fears: [],
      relationships: [],
      isKnownFigure,
      knownFigureType: knownFigureType as 'historical' | 'fictional' | 'celebrity' | 'mythological' | 'other' | undefined
    },
    inventory: { items: [], capacity: 100, categories: [], characterId: 'test-char' },
    status: { health: 100, maxHealth: 100, conditions: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  describe('Prompt structure following Gemini guidelines', () => {
    test('known figures should start with clear statement', () => {
      const character = createTestCharacter('Albert Einstein', true, 'historical');
      const prompt = generator.buildPortraitPrompt(character, {
        isKnownFigure: true,
        knownFigureContext: 'historical'
      });
      
      // Should follow: Subject + Context + Style
      expect(prompt).toMatch(/^Photorealistic portrait of/);
      expect(prompt).toContain('Albert Einstein');
      expect(prompt).toContain('the historical');
      expect(prompt).toContain('appropriate environment'); // context
      expect(prompt).toContain('ambient lighting'); // context
      expect(prompt).toContain('photorealistic quality'); // style
    });

    test('original characters should use fantasy art approach', () => {
      const character = createTestCharacter('Elara Moonshadow', false);
      character.background.history = 'A powerful wizard who mastered the arcane arts';
      const prompt = generator.buildPortraitPrompt(character, {
        worldTheme: 'fantasy'
      });
      
      // Should follow: Subject + Context + Style
      expect(prompt).toMatch(/^Fantasy character portrait of/);
      expect(prompt).toContain('Elara Moonshadow');
      expect(prompt).toContain('courageous wise leader character'); // extracted traits
      expect(prompt).toContain('wizard character'); // profession
      expect(prompt).toContain('fantasy world setting'); // context
      expect(prompt).toContain('dramatic atmospheric lighting'); // context
      expect(prompt).toContain('digital painting'); // style
      expect(prompt).toContain('concept art quality'); // style
    });

    test('should include specific photography terms for known figures', () => {
      const character = createTestCharacter('Taylor Swift', true, 'celebrity');
      const prompt = generator.buildPortraitPrompt(character, {
        isKnownFigure: true,
        knownFigureContext: 'celebrity'
      });
      
      expect(prompt).toContain('Photorealistic portrait');
      expect(prompt).toContain('Taylor Swift');
      expect(prompt).toContain('sharp focus');
      expect(prompt).toContain('high-resolution photorealistic quality');
      expect(prompt).toContain('natural skin tones');
    });

    test('should handle different world themes for original characters', () => {
      const testCases = [
        { theme: 'cyberpunk', expected: 'cyberpunk setting' },
        { theme: 'steampunk', expected: 'steampunk setting' },
        { theme: 'medieval', expected: 'medieval world setting' },
        { theme: undefined, expected: 'neutral background' }
      ];

      testCases.forEach(({ theme, expected }) => {
        const character = createTestCharacter('Test Hero', false);
        const prompt = generator.buildPortraitPrompt(character, { worldTheme: theme });
        expect(prompt).toContain(expected);
      });
    });
  });

  describe('Example prompts following guidelines', () => {
    test('Known figure: Gandalf', () => {
      const character = createTestCharacter('Gandalf', true, 'fictional');
      const prompt = generator.buildPortraitPrompt(character, {
        isKnownFigure: true,
        knownFigureContext: 'fictional'
      });
      
      console.log('Gandalf (Gemini-optimized):', prompt);
      // Expected format: "A portrait photograph of Gandalf, the fictional, professional headshot, studio lighting, 85mm lens, shallow depth of field, photorealistic, high resolution, professional photography"
    });

    test('Original character: Fantasy Warrior', () => {
      const character = createTestCharacter('Thorgrim Ironforge', false);
      character.background.personality = 'Fierce and honorable warrior with unwavering loyalty';
      character.background.history = 'A legendary warrior who defended the mountain kingdoms';
      
      const prompt = generator.buildPortraitPrompt(character, {
        worldTheme: 'fantasy'
      });
      
      console.log('Thorgrim (Gemini-optimized):', prompt);
      // Expected format: "A fantasy portrait of Thorgrim Ironforge, fierce honorable warrior character, warrior class, fantasy setting, dramatic lighting, digital painting, concept art style, highly detailed, artstation quality"
    });

    test('Known figure: Historical', () => {
      const character = createTestCharacter('Leonardo da Vinci', true, 'historical');
      const prompt = generator.buildPortraitPrompt(character, {
        isKnownFigure: true,
        knownFigureContext: 'historical'
      });
      
      console.log('Leonardo da Vinci (Gemini-optimized):', prompt);
    });
  });

  describe('Prompt length constraints', () => {
    test('should keep prompts under 480 tokens (approximately 1900 characters)', () => {
      const character = createTestCharacter('Test Character', false);
      character.background.personality = 'A'.repeat(2000); // Very long personality
      
      const prompt = generator.buildPortraitPrompt(character);
      
      expect(prompt.length).toBeLessThanOrEqual(1900);
      expect(prompt).toContain('...');
    });
  });
});