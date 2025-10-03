// src/types/__tests__/character-portrait.types.test.ts

import { Character, CharacterPortrait, PortraitGenerationStatus } from '../character.types';
import { getTimestamp } from '@/lib/utils/timestamp';

describe('Character Portrait Types', () => {
  describe('CharacterPortrait', () => {
    it('should allow AI-generated portrait data', () => {
      const portrait: CharacterPortrait = {
        type: 'ai-generated',
        url: 'data:image/png;base64,abc123',
        generatedAt: getTimestamp(),
        prompt: 'A brave warrior with long hair'
      };

      expect(portrait.type).toBe('ai-generated');
      expect(portrait.url).toContain('data:image');
      expect(portrait.prompt).toBeDefined();
    });

    it('should allow placeholder portrait', () => {
      const portrait: CharacterPortrait = {
        type: 'placeholder',
        url: null
      };

      expect(portrait.type).toBe('placeholder');
      expect(portrait.url).toBeNull();
    });
  });

  describe('PortraitGenerationStatus', () => {
    it('should track generation progress', () => {
      const status: PortraitGenerationStatus = {
        isGenerating: true,
        error: null,
        lastAttemptAt: getTimestamp()
      };

      expect(status.isGenerating).toBe(true);
      expect(status.error).toBeNull();
      expect(status.lastAttemptAt).toBeDefined();
    });

    it('should track generation errors', () => {
      const status: PortraitGenerationStatus = {
        isGenerating: false,
        error: 'Failed to generate portrait',
        lastAttemptAt: getTimestamp()
      };

      expect(status.isGenerating).toBe(false);
      expect(status.error).toBe('Failed to generate portrait');
    });
  });

  describe('Character with Portrait', () => {
    it('should include portrait in character data', () => {
      const character: Character = {
        id: 'char-1',
        name: 'Test Hero',
        description: 'A test character for portrait testing',
        worldId: 'world-1',
        attributes: [],
        skills: [],
        background: {
          history: 'A brave warrior',
          personality: 'Courageous',
          goals: [],
          fears: [],
          relationships: []
        },
        inventory: {
          characterId: 'char-1',
          items: [],
          capacity: 100,
          categories: []
        },
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        portrait: {
          type: 'placeholder',
          url: null
        },
        createdAt: getTimestamp(),
        updatedAt: getTimestamp()
      };

      expect(character.portrait).toBeDefined();
      expect(character.portrait?.type).toBe('placeholder');
    });
  });
});
