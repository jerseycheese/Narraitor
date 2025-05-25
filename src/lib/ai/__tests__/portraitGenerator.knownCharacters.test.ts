// src/lib/ai/__tests__/portraitGenerator.knownCharacters.test.ts

import { PortraitGenerator } from '../portraitGenerator';
import { Character } from '../../../types/character.types';
import { createMockAIClient } from './portraitGenerator.test-helpers';

describe('PortraitGenerator - Known Characters', () => {
  let generator: PortraitGenerator;
  let mockAIClient: ReturnType<typeof createMockAIClient>;

  beforeEach(() => {
    mockAIClient = createMockAIClient();
    generator = new PortraitGenerator(mockAIClient);
  });

  const createTestCharacter = (name: string): Character => ({
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
      relationships: []
    },
    inventory: { items: [], capacity: 100, categories: [], characterId: 'test-char' },
    status: { health: 100, maxHealth: 100, conditions: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  describe('Known fictional characters', () => {
    test('should recognize Gandalf and generate appropriate prompt', () => {
      const character = createTestCharacter('Gandalf');
      const prompt = generator.buildPortraitPrompt(character, { 
        isKnownFigure: true, 
        knownFigureContext: 'fictional',
        detection: {
          isKnownFigure: true,
          figureType: 'fictional',
          figureName: 'Lord of the Rings'
        }
      });
      
      expect(prompt).toContain('Character portrait of Gandalf');
      // For fictional characters without actors, "from" is only added for videogame context
      expect(prompt).toContain('courageous wise');
      expect(prompt).toContain('authentic');
      
      // Should NOT contain generic descriptors for known characters
      expect(prompt).not.toContain('Fantasy character portrait');
    });

  });

  describe('Characters played by specific actors', () => {
    test('should detect Sloth from The Goonies played by John Matuszak', async () => {
      // Mock the AI response for detection
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: '{"isKnownFigure": true, "figureType": "fictional", "actorName": "John Matuszak", "figureName": "The Goonies"}',
        finishReason: 'stop'
      });
      
      // Mock the image generation
      if (mockAIClient.generateImage) {
        mockAIClient.generateImage.mockResolvedValueOnce({
          image: 'https://example.com/sloth.jpg',
          prompt: 'Cinematic portrait of Sloth character. John Matuszak as Sloth, authentic character portrayal'
        });
      }

      const character = createTestCharacter('Sloth');
      character.background.physicalDescription = 'Large deformed man with misshapen face, one eye higher than the other, wearing torn clothes';
      character.background.personality = 'Gentle giant with childlike innocence who loves candy and making friends';
      character.background.history = 'Kept prisoner by the Fratelli crime family but helps the Goonies escape';
      
      const result = await generator.generatePortrait(character, { worldTheme: 'adventure' });
      
      expect(result.prompt).toContain('John Matuszak as Sloth');
      expect(result.prompt).toContain('Cinematic portrait');
      expect(result.prompt).toContain('authentic character portrayal');
    });

    test('should detect Bob Wiley played by Bill Murray', async () => {
      mockAIClient.generateContent.mockResolvedValueOnce({
        content: '{"isKnownFigure": true, "figureType": "fictional", "actorName": "Bill Murray", "figureName": "What About Bob?"}',
        finishReason: 'stop'
      });
      
      if (mockAIClient.generateImage) {
        mockAIClient.generateImage.mockResolvedValueOnce({
          image: 'https://example.com/bob.jpg',
          prompt: 'Cinematic portrait of Bob Wiley character. Bill Murray as Bob Wiley, authentic character portrayal'
        });
      }

      const character = createTestCharacter('Bob Wiley');
      const result = await generator.generatePortrait(character, { worldTheme: 'comedy' });
      
      expect(result.prompt).toContain('Bill Murray as Bob Wiley');
    });
  });

  describe('Original characters', () => {
    test('should generate standard prompts for unknown characters', () => {
      const character = createTestCharacter('Elara Moonshadow');
      const prompt = generator.buildPortraitPrompt(character);
      
      expect(prompt).toContain('Character portrait of Elara Moonshadow');
      expect(prompt).toContain('expressing courageous wise character');
      expect(prompt).toContain('photorealistic quality');
      expect(prompt).not.toContain('as they appear in');
      expect(prompt).not.toContain('official art style');
    });

    test('should extract class from background for original characters', () => {
      const character = createTestCharacter('Original Hero');
      character.background.history = 'A powerful wizard who studied magic';
      
      const prompt = generator.buildPortraitPrompt(character, { worldTheme: 'fantasy' });
      
      expect(prompt).toContain('wizard character');
      expect(prompt).toContain('Fantasy character portrait');
    });
  });

  describe('World theme integration', () => {
    test('should include world theme for original characters', () => {
      const character = createTestCharacter('New Character');
      const prompt = generator.buildPortraitPrompt(character, { worldTheme: 'cyberpunk' });
      
      expect(prompt).toContain('cyberpunk setting');
    });

    test('should include world theme for adaptable known characters', () => {
      const character = createTestCharacter('Gandalf');
      const prompt = generator.buildPortraitPrompt(character, { 
        worldTheme: 'cyberpunk',
        isKnownFigure: true, 
        knownFigureContext: 'fictional',
        detection: {
          isKnownFigure: true,
          figureType: 'fictional',
          figureName: 'Lord of the Rings'
        }
      });
      
      // For fictional characters without actors, "from" is only added for videogame context
      expect(prompt).toContain('cyberpunk style atmosphere');
    });
  });
});