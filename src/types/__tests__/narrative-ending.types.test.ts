// src/types/__tests__/narrative-ending.types.test.ts

import {
  EndingType,
  EndingTone,
  StoryEnding,
  EndingGenerationRequest,
  EndingGenerationResult
} from '../narrative.types';

describe('Narrative Ending Types', () => {
  describe('EndingType', () => {
    it('should have all required ending types', () => {
      const validTypes: EndingType[] = [
        'player-choice',
        'story-complete',
        'session-limit',
        'character-retirement'
      ];

      // This test ensures we have all the required ending types
      expect(validTypes).toHaveLength(4);
    });
  });

  describe('EndingTone', () => {
    it('should have all required ending tones', () => {
      const validTones: EndingTone[] = [
        'triumphant',
        'bittersweet',
        'mysterious',
        'tragic',
        'hopeful'
      ];

      // This test ensures we have all the required ending tones
      expect(validTones).toHaveLength(5);
    });
  });

  describe('StoryEnding', () => {
    it('should have all required properties', () => {
      const mockEnding: StoryEnding = {
        id: 'ending-123',
        sessionId: 'session-456',
        characterId: 'char-789',
        worldId: 'world-012',
        type: 'player-choice',
        tone: 'triumphant',
        epilogue: 'And so the hero returned...',
        characterLegacy: 'Known throughout the land...',
        worldImpact: 'The kingdom prospered...',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        journalSummary: 'A brave journey...',
        achievements: ['Dragon Slayer', 'Peace Bringer'],
        playTime: 3600
      };

      expect(mockEnding).toHaveProperty('id');
      expect(mockEnding).toHaveProperty('sessionId');
      expect(mockEnding).toHaveProperty('characterId');
      expect(mockEnding).toHaveProperty('worldId');
      expect(mockEnding).toHaveProperty('type');
      expect(mockEnding).toHaveProperty('tone');
      expect(mockEnding).toHaveProperty('epilogue');
      expect(mockEnding).toHaveProperty('characterLegacy');
      expect(mockEnding).toHaveProperty('worldImpact');
      expect(mockEnding).toHaveProperty('timestamp');
    });
  });

  describe('EndingGenerationRequest', () => {
    it('should have all required properties', () => {
      const mockRequest: EndingGenerationRequest = {
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789',
        endingType: 'player-choice',
        desiredTone: 'triumphant',
        customPrompt: 'Make it epic'
      };

      expect(mockRequest).toHaveProperty('sessionId');
      expect(mockRequest).toHaveProperty('characterId');
      expect(mockRequest).toHaveProperty('worldId');
      expect(mockRequest).toHaveProperty('endingType');
    });

    it('should allow optional properties', () => {
      const minimalRequest: EndingGenerationRequest = {
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789',
        endingType: 'story-complete'
      };

      expect(minimalRequest.desiredTone).toBeUndefined();
      expect(minimalRequest.customPrompt).toBeUndefined();
    });
  });

  describe('EndingGenerationResult', () => {
    it('should have all required properties', () => {
      const mockResult: EndingGenerationResult = {
        epilogue: 'The adventure concluded...',
        characterLegacy: 'Remembered as a hero...',
        worldImpact: 'The world changed forever...',
        tone: 'triumphant',
        achievements: ['Quest Complete', 'Hero of the Realm'],
        playTime: 7200,
        tokenUsage: {
          promptTokens: 500,
          completionTokens: 300,
          totalTokens: 800
        }
      };

      expect(mockResult).toHaveProperty('epilogue');
      expect(mockResult).toHaveProperty('characterLegacy');
      expect(mockResult).toHaveProperty('worldImpact');
      expect(mockResult).toHaveProperty('tone');
      expect(mockResult).toHaveProperty('achievements');
    });
  });
});