import { NarrativeGenerator } from '@/lib/ai/narrativeGeneratorWithFallback';
import { AIClient } from '@/lib/ai/types';
import { NarrativeGenerationRequest } from '@/types/narrative.types';

// Use real stores, not mocks
jest.unmock('@/state/worldStore');
jest.unmock('@/state/characterStore');
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';

describe('Fallback System Integration', () => {
  let generator: NarrativeGenerator;
  let mockClient: jest.Mocked<AIClient>;

  const mockWorld = {
    id: 'world-1',
    name: 'Fantasy Kingdom',
    description: 'A magical realm',
    theme: 'fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 30,
      skillPointPool: 30
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockCharacter = {
    id: 'char-1',
    name: 'Test Hero',
    worldId: 'world-1',
    background: 'A brave adventurer',
    attributes: {},
    skills: {},
    portraitUrl: '',
    playerControlled: true,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClient = {
      generateContent: jest.fn(),
      generateStructuredContent: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true)
    };

    generator = new NarrativeGenerator(mockClient);

    // Setup stores
    worldStore.setState({ 
      worlds: { [mockWorld.id]: mockWorld },
      currentWorldId: mockWorld.id 
    });

    characterStore.setState({
      characters: { [mockCharacter.id]: mockCharacter },
      currentCharacterId: mockCharacter.id
    });
  });

  describe('End-to-end scenarios', () => {
    it('should provide seamless fallback when AI fails', async () => {
      // Simulate AI failure
      mockClient.generateContent.mockRejectedValue(new Error('Service unavailable'));

      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        sessionId: 'session-1',
        characterIds: ['char-1'],
        context: {
          worldId: 'world-1',
          currentSceneId: 'scene-1',
          characterIds: ['char-1'],
          previousSegments: [],
          currentTags: ['forest', 'day'],
          sessionId: 'session-1'
        },
        generationParameters: {
          segmentType: 'scene'
        }
      };

      const result = await generator.generateSegment(request);

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.isAIGenerated).toBe(false);
      expect(result.fallbackReason).toBe('service_unavailable');
      expect(result.metadata.tags).toContain('forest');
    });

    it('should handle initial scene generation with fallback', async () => {
      mockClient.generateContent.mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await generator.generateInitialScene('world-1', ['char-1']);

      expect(result).toBeDefined();
      expect(result.content).toContain('begin');
      expect(result.isAIGenerated).toBe(false);
      expect(result.fallbackReason).toBe('rate_limit');
      expect(result.segmentType).toBe('initialScene');
    });

    it('should provide choices in fallback content', async () => {
      mockClient.generateContent.mockRejectedValue(new Error('Timeout'));

      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        sessionId: 'session-1',
        characterIds: ['char-1'],
        context: {
          worldId: 'world-1',
          currentSceneId: 'scene-1',
          characterIds: ['char-1'],
          previousSegments: [],
          currentTags: ['forest', 'mysterious'],
          sessionId: 'session-1'
        },
        generationParameters: {
          segmentType: 'scene',
          includeChoices: true
        }
      };

      const result = await generator.generateSegment(request);

      expect(result.choices).toBeDefined();
      expect(result.choices!.length).toBeGreaterThan(0);
      expect(result.choices![0]).toHaveProperty('text');
      expect(result.choices![0]).toHaveProperty('outcome');
    });

    it('should retry before falling back', async () => {
      // First call fails, second succeeds
      mockClient.generateContent
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ 
          content: 'AI generated content',
          finishReason: 'stop'
        });

      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        sessionId: 'session-1',
        characterIds: ['char-1'],
        generationParameters: { segmentType: 'scene' }
      };

      const result = await generator.generateSegment(request);

      expect(mockClient.generateContent).toHaveBeenCalledTimes(2);
      expect(result.content).toBe('AI generated content');
      expect(result.isAIGenerated).toBe(true);
      expect(result.fallbackReason).toBeUndefined();
    });

    it('should handle different world themes', async () => {
      // Update world to sci-fi
      const scifiWorld = { ...mockWorld, id: 'world-2', theme: 'scifi' };
      worldStore.setState({ 
        worlds: { [scifiWorld.id]: scifiWorld },
        currentWorldId: scifiWorld.id 
      });

      mockClient.generateContent.mockRejectedValue(new Error('Service error'));

      const request: NarrativeGenerationRequest = {
        worldId: 'world-2',
        sessionId: 'session-1',
        characterIds: ['char-1'],
        context: {
          worldId: 'world-2',
          currentSceneId: 'scene-1',
          characterIds: ['char-1'],
          previousSegments: [],
          currentTags: ['spaceship', 'interior'],
          sessionId: 'session-1'
        },
        generationParameters: { segmentType: 'scene' }
      };

      const result = await generator.generateSegment(request);

      expect(result.content).toContain('ship');
      expect(result.metadata.tags).toContain('spaceship');
    });

    it('should track retry attempts in metadata', async () => {
      // All retries fail
      mockClient.generateContent.mockRejectedValue(new Error('Persistent error'));

      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        sessionId: 'session-1',
        characterIds: ['char-1'],
        generationParameters: { segmentType: 'scene' }
      };

      const result = await generator.generateSegment(request);

      expect(result.metadata.retryAttempts).toBe(2); // 2 retries after initial attempt
    });

    it('should handle missing context gracefully', async () => {
      mockClient.generateContent.mockRejectedValue(new Error('Service error'));

      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        sessionId: 'session-1',
        characterIds: ['char-1'],
        // No context provided
        generationParameters: { segmentType: 'scene' }
      };

      const result = await generator.generateSegment(request);

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.isAIGenerated).toBe(false);
    });

    it('should use generic content as last resort', async () => {
      // Create world with unsupported theme
      const unusualWorld = { ...mockWorld, id: 'world-3', theme: 'noir' };
      worldStore.setState({ 
        worlds: { [unusualWorld.id]: unusualWorld },
        currentWorldId: unusualWorld.id 
      });

      mockClient.generateContent.mockRejectedValue(new Error('Service error'));

      const request: NarrativeGenerationRequest = {
        worldId: 'world-3',
        sessionId: 'session-1',
        characterIds: ['char-1'],
        generationParameters: { segmentType: 'scene' }
      };

      const result = await generator.generateSegment(request);

      // Should fall back to generic content
      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should generate fallback content quickly', async () => {
      // Create a generator with no retries for performance test
      const fastGenerator = new NarrativeGenerator(mockClient);
      // @ts-expect-error - accessing private property for test
      fastGenerator.maxRetries = 0;
      
      mockClient.generateContent.mockRejectedValue(new Error('Immediate failure'));

      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        sessionId: 'session-1',
        characterIds: ['char-1'],
        generationParameters: { segmentType: 'scene' }
      };

      const start = Date.now();
      const result = await fastGenerator.generateSegment(request);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(500); // Should be fast even with some overhead
    });
  });
});