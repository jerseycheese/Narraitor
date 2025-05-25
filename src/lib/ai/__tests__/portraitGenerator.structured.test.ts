// src/lib/ai/__tests__/portraitGenerator.structured.test.ts

import { PortraitGenerator } from '../portraitGenerator';
import { Character } from '../../../types/character.types';
import { createMockAIClient } from './portraitGenerator.test-helpers';

describe('PortraitGenerator - Structured Known Figures', () => {
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
      personality: 'Courageous and wise',
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

  describe('Known figures with structured data', () => {
    test('should generate appropriate prompt for fictional character', () => {
      const character = createTestCharacter('Gandalf', true, 'fictional');
      const prompt = generator.buildPortraitPrompt(character, {
        isKnownFigure: true,
        knownFigureContext: 'fictional'
      });
      
      expect(prompt).toContain('Gandalf');
      expect(prompt).toContain('the fictional');
      expect(prompt).toContain('accurate depiction');
      expect(prompt).toContain('as commonly recognized');
      expect(prompt).toContain('photorealistic');
      expect(prompt).toContain('professional portrait');
      
      // Should NOT contain generic descriptors
      expect(prompt).not.toContain('detailed character portrait of');
      expect(prompt).not.toContain('with courageous and wise appearance');
      expect(prompt).not.toContain('fantasy art');
    });

    test('should generate appropriate prompt for historical figure', () => {
      const character = createTestCharacter('Albert Einstein', true, 'historical');
      const prompt = generator.buildPortraitPrompt(character, {
        isKnownFigure: true,
        knownFigureContext: 'historical'
      });
      
      expect(prompt).toContain('Albert Einstein');
      expect(prompt).toContain('the historical');
      expect(prompt).toContain('accurate depiction');
      expect(prompt).toContain('as commonly recognized');
      expect(prompt).toContain('photorealistic');
    });

    test('should generate appropriate prompt for celebrity', () => {
      const character = createTestCharacter('Taylor Swift', true, 'celebrity');
      const prompt = generator.buildPortraitPrompt(character, {
        isKnownFigure: true,
        knownFigureContext: 'celebrity'
      });
      
      expect(prompt).toContain('Taylor Swift');
      expect(prompt).toContain('the celebrity');
      expect(prompt).toContain('accurate depiction');
      expect(prompt).toContain('as commonly recognized');
    });

    test('should generate appropriate prompt for mythological figure', () => {
      const character = createTestCharacter('Zeus', true, 'mythological');
      const prompt = generator.buildPortraitPrompt(character, {
        isKnownFigure: true,
        knownFigureContext: 'mythological'
      });
      
      expect(prompt).toContain('Zeus');
      expect(prompt).toContain('the mythological');
      expect(prompt).toContain('accurate depiction');
      expect(prompt).toContain('as commonly recognized');
    });
  });

  describe('Original characters', () => {
    test('should generate standard prompts for non-known figures', () => {
      const character = createTestCharacter('Elara Moonshadow', false);
      const prompt = generator.buildPortraitPrompt(character);
      
      expect(prompt).toContain('detailed character portrait');
      expect(prompt).toContain('of Elara Moonshadow');
      expect(prompt).toContain('with courageous and wise appearance');
      expect(prompt).toContain('fantasy art');
      expect(prompt).not.toContain('accurate depiction');
      expect(prompt).not.toContain('as commonly recognized');
      expect(prompt).not.toContain('photorealistic');
    });

    test('should include world theme for original characters', () => {
      const character = createTestCharacter('New Hero', false);
      const prompt = generator.buildPortraitPrompt(character, {
        worldTheme: 'cyberpunk'
      });
      
      expect(prompt).toContain('in cyberpunk style');
    });

    test('should not include world theme for known figures', () => {
      const character = createTestCharacter('Batman', true, 'fictional');
      const prompt = generator.buildPortraitPrompt(character, {
        worldTheme: 'medieval',
        isKnownFigure: true,
        knownFigureContext: 'fictional'
      });
      
      expect(prompt).not.toContain('in medieval style');
      expect(prompt).toContain('Batman');
      expect(prompt).toContain('the fictional');
    });
  });

  describe('Example prompts', () => {
    test('Example: Gandalf (fictional)', () => {
      const character = createTestCharacter('Gandalf', true, 'fictional');
      const prompt = generator.buildPortraitPrompt(character, {
        isKnownFigure: true,
        knownFigureContext: 'fictional'
      });
      
      console.log('Gandalf prompt:', prompt);
      // Expected: "Gandalf, the fictional, accurate depiction, as commonly recognized, photorealistic, professional portrait, high quality, detailed"
    });

    test('Example: Abraham Lincoln (historical)', () => {
      const character = createTestCharacter('Abraham Lincoln', true, 'historical');
      const prompt = generator.buildPortraitPrompt(character, {
        isKnownFigure: true,
        knownFigureContext: 'historical'
      });
      
      console.log('Abraham Lincoln prompt:', prompt);
      // Expected: "Abraham Lincoln, the historical, accurate depiction, as commonly recognized, photorealistic, professional portrait, high quality, detailed"
    });

    test('Example: Original character', () => {
      const character = createTestCharacter('Elara Moonshadow', false);
      character.background.history = 'A powerful wizard who studied the arcane arts';
      const prompt = generator.buildPortraitPrompt(character, {
        worldTheme: 'fantasy'
      });
      
      console.log('Elara Moonshadow prompt:', prompt);
      // Expected: "detailed character portrait, of Elara Moonshadow, with courageous and wise appearance, wizard, in fantasy style, fantasy art, high quality, detailed"
    });
  });
});