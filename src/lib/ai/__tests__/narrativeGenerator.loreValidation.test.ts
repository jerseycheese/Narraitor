/**
 * Integration tests for lore validation in NarrativeGenerator
 * Tests that validation is called during generation and metadata is attached correctly
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import type { AIClient } from '../types';
import type { NarrativeGenerationRequest } from '@/types/narrative.types';

// Mock the lore validation context helper
jest.mock('../loreValidationContextHelper', () => ({
  assembleLoreValidationContext: jest.fn().mockResolvedValue({
    characters: [],
    worldRules: [],
    historicalEvents: [],
    locations: [],
  }),
}));

// Mock fetch for validation API
global.fetch = jest.fn();

// Mock stores
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: () => ({
      worlds: {
        'world1': {
          id: 'world1',
          name: 'Test World',
          settings: {
            maxAttributes: 5,
            maxSkills: 10,
            attributePointPool: 20,
            skillPointPool: 15,
            loreValidation: {
              enabled: true, // Enabled for testing
              strictness: 'moderate',
              validateEveryNSegments: 1,
              validateOnlyCheckpoints: false,
              autoRegenerate: false,
              blockOnBreaking: false,
            },
          },
        },
      },
      worldStates: {},
    }),
  },
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: {
    getState: () => ({
      characters: {
        'char1': {
          id: 'char1',
          name: 'Test Character',
          background: {
            history: 'A brave warrior',
            personality: 'Bold',
          },
        },
      },
    }),
  },
}));

jest.mock('@/state/loreStore', () => ({
  useLoreStore: {
    getState: () => ({
      getFacts: () => [],
      getLoreContext: () => ({ facts: [], factCount: 0 }),
    }),
  },
}));

describe('NarrativeGenerator - Lore Validation Integration', () => {
  let generator: NarrativeGenerator;
  let mockAIClient: jest.Mocked<AIClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAIClient = {
      generateContent: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true),
    } as any;

    generator = new NarrativeGenerator(mockAIClient);
  });

  describe('validation enabled', () => {
    it('should call validation API during segment generation', async () => {
      // Mock AI response
      mockAIClient.generateContent.mockResolvedValue({
        content: JSON.stringify({
          narrative: 'Test narrative content',
          choices: [],
          metadata: { tags: [] },
        }),
        finishReason: 'STOP',
      });

      // Mock validation API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          isConsistent: true,
          contradictions: [],
          severity: 'none',
          confidence: 'high',
          processingTime: 100,
          validated: true,
        }),
      });

      const request: NarrativeGenerationRequest = {
        worldId: 'world1',
        sessionId: 'session1',
        characterIds: ['char1'],
        narrativeContext: {
          worldId: 'world1',
          currentSceneId: 'scene1',
          characterIds: ['char1'],
          previousSegments: [],
          currentTags: [],
          sessionId: 'session1',
        },
      };

      const result = await generator.generateSegment(request);

      // Verify validation was called
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/narrative/validate-lore',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Verify metadata was attached
      expect(result.metadata.loreValidation).toBeDefined();
      expect(result.metadata.loreValidation?.validated).toBe(true);
      expect(result.metadata.loreValidation?.isConsistent).toBe(true);
    });

    it('should attach contradiction metadata when validation finds issues', async () => {
      mockAIClient.generateContent.mockResolvedValue({
        content: JSON.stringify({
          narrative: 'Test narrative content',
          choices: [],
          metadata: { tags: [] },
        }),
        finishReason: 'STOP',
      });

      // Mock validation finding contradictions
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          isConsistent: false,
          contradictions: [
            {
              category: 'character',
              severity: 'major',
              description: 'Character contradiction',
              conflictingLore: 'Test lore',
              narrativeExcerpt: 'Test excerpt',
            },
          ],
          severity: 'major',
          confidence: 'high',
          processingTime: 150,
          validated: true,
        }),
      });

      const request: NarrativeGenerationRequest = {
        worldId: 'world1',
        sessionId: 'session1',
        characterIds: ['char1'],
        narrativeContext: {
          worldId: 'world1',
          currentSceneId: 'scene1',
          characterIds: ['char1'],
          previousSegments: [],
          currentTags: [],
          sessionId: 'session1',
        },
      };

      const result = await generator.generateSegment(request);

      // Verify contradiction metadata
      expect(result.metadata.loreValidation?.isConsistent).toBe(false);
      expect(result.metadata.loreValidation?.severity).toBe('major');
      expect(result.metadata.loreValidation?.contradictionCount).toBe(1);

      // Verify tags were added
      expect(result.metadata.tags).toContain('lore-review-needed');
      expect(result.metadata.tags).toContain('lore-severity-major');
    });

    it('should fail open on validation API error', async () => {
      mockAIClient.generateContent.mockResolvedValue({
        content: JSON.stringify({
          narrative: 'Test narrative content',
          choices: [],
          metadata: { tags: [] },
        }),
        finishReason: 'STOP',
      });

      // Mock validation API error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const request: NarrativeGenerationRequest = {
        worldId: 'world1',
        sessionId: 'session1',
        characterIds: ['char1'],
        narrativeContext: {
          worldId: 'world1',
          currentSceneId: 'scene1',
          characterIds: ['char1'],
          previousSegments: [],
          currentTags: [],
          sessionId: 'session1',
        },
      };

      const result = await generator.generateSegment(request);

      // Should still return narrative (fail-open)
      expect(result.content).toBeTruthy();
      // Validation metadata should not be present on error
      expect(result.metadata.loreValidation).toBeUndefined();
    });

    it('should handle validation timeout gracefully', async () => {
      mockAIClient.generateContent.mockResolvedValue({
        content: JSON.stringify({
          narrative: 'Test narrative content',
          choices: [],
          metadata: { tags: [] },
        }),
        finishReason: 'STOP',
      });

      // Mock timeout
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      const request: NarrativeGenerationRequest = {
        worldId: 'world1',
        sessionId: 'session1',
        characterIds: ['char1'],
        narrativeContext: {
          worldId: 'world1',
          currentSceneId: 'scene1',
          characterIds: ['char1'],
          previousSegments: [],
          currentTags: [],
          sessionId: 'session1',
        },
      };

      const result = await generator.generateSegment(request);

      // Should still return narrative (fail-open)
      expect(result.content).toBeTruthy();
    });
  });

  describe('validation disabled', () => {
    beforeEach(() => {
      // Override mock to have validation disabled
      jest.spyOn(require('@/state/worldStore').useWorldStore, 'getState').mockReturnValue({
        worlds: {
          'world1': {
            id: 'world1',
            name: 'Test World',
            settings: {
              maxAttributes: 5,
              maxSkills: 10,
              attributePointPool: 20,
              skillPointPool: 15,
              loreValidation: {
                enabled: false, // Disabled
                strictness: 'moderate',
                validateEveryNSegments: 1,
                validateOnlyCheckpoints: false,
                autoRegenerate: false,
                blockOnBreaking: false,
              },
            },
          },
        },
        worldStates: {},
      });
    });

    it('should skip validation when disabled', async () => {
      mockAIClient.generateContent.mockResolvedValue({
        content: JSON.stringify({
          narrative: 'Test narrative content',
          choices: [],
          metadata: { tags: [] },
        }),
        finishReason: 'STOP',
      });

      const request: NarrativeGenerationRequest = {
        worldId: 'world1',
        sessionId: 'session1',
        characterIds: ['char1'],
        narrativeContext: {
          worldId: 'world1',
          currentSceneId: 'scene1',
          characterIds: ['char1'],
          previousSegments: [],
          currentTags: [],
          sessionId: 'session1',
        },
      };

      const result = await generator.generateSegment(request);

      // Validation API should NOT be called
      expect(global.fetch).not.toHaveBeenCalled();

      // Result should still be valid
      expect(result.content).toBeTruthy();
      expect(result.metadata.loreValidation).toBeUndefined();
    });
  });

  describe('performance', () => {
    it('should not significantly impact generation time', async () => {
      mockAIClient.generateContent.mockResolvedValue({
        content: JSON.stringify({
          narrative: 'Test narrative content',
          choices: [],
          metadata: { tags: [] },
        }),
        finishReason: 'STOP',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          isConsistent: true,
          contradictions: [],
          severity: 'none',
          confidence: 'high',
          processingTime: 100,
          validated: true,
        }),
      });

      const request: NarrativeGenerationRequest = {
        worldId: 'world1',
        sessionId: 'session1',
        characterIds: ['char1'],
        narrativeContext: {
          worldId: 'world1',
          currentSceneId: 'scene1',
          characterIds: ['char1'],
          previousSegments: [],
          currentTags: [],
          sessionId: 'session1',
        },
      };

      const startTime = Date.now();
      await generator.generateSegment(request);
      const duration = Date.now() - startTime;

      // Validation should complete quickly (allowing for test overhead)
      expect(duration).toBeLessThan(1000);
    });
  });
});
