import { NarrativeGenerator } from '../narrativeGeneratorWithFallback';
import { AIClient } from '../types';
import { FallbackContentManager } from '@/lib/narrative/fallback/FallbackContentManager';
import { NarrativeGenerationRequest } from '@/types/narrative.types';

// Mock the fallback manager
jest.mock('@/lib/narrative/fallback/FallbackContentManager');

// Use real stores, not mocks
jest.unmock('@/state/worldStore');
jest.unmock('@/state/characterStore');
import { worldStore } from '@/state/worldStore';

describe('NarrativeGenerator - Fallback Integration', () => {
  let generator: NarrativeGenerator;
  let mockClient: jest.Mocked<AIClient>;
  let mockFallbackManager: jest.Mocked<FallbackContentManager>;

  const mockWorld = {
    id: 'world-1',
    name: 'Test World',
    description: 'A fantasy world',
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

  const mockRequest: NarrativeGenerationRequest = {
    worldId: 'world-1',
    sessionId: 'session-1',
    characterIds: ['char-1'],
    context: {
      worldId: 'world-1',
      currentSceneId: 'scene-1',
      characterIds: ['char-1'],
      previousSegments: [],
      currentTags: ['forest'],
      sessionId: 'session-1'
    },
    generationParameters: {
      segmentType: 'scene',
      includeChoices: true,
      maxLength: 500
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AI client
    mockClient = {
      generateContent: jest.fn(),
      generateStructuredContent: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true)
    } as jest.Mocked<AIClient>;

    // Mock fallback manager
    mockFallbackManager = new FallbackContentManager() as jest.Mocked<FallbackContentManager>;
    (FallbackContentManager as jest.Mock).mockImplementation(() => mockFallbackManager);

    generator = new NarrativeGenerator(mockClient);

    // Setup world store
    worldStore.setState({ 
      worlds: { [mockWorld.id]: mockWorld },
      currentWorldId: mockWorld.id 
    });
  });

  describe('fallback activation', () => {
    it('should use fallback content when AI service fails', async () => {
      // Make AI fail
      mockClient.generateContent.mockRejectedValue(new Error('Service unavailable'));
      
      // Setup fallback content
      const fallbackContent = {
        id: 'fallback-1',
        type: 'scene' as const,
        themes: ['fantasy'],
        tags: ['forest'],
        content: 'You continue through the forest...',
        choices: [
          { text: 'Go deeper', outcome: 'You venture deeper...', tags: ['deep_forest'] },
          { text: 'Turn back', outcome: 'You decide to return...', tags: ['return'] }
        ]
      };
      
      mockFallbackManager.getContent.mockReturnValue(fallbackContent);

      const result = await generator.generateSegment(mockRequest);

      expect(result.content).toBe(fallbackContent.content);
      expect(result.isAIGenerated).toBe(false);
      expect(result.fallbackReason).toBe('service_unavailable');
      expect(result.choices).toHaveLength(2);
    });

    it('should use fallback content on timeout', async () => {
      // Simulate timeout
      mockClient.generateContent.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const fallbackContent = {
        id: 'fallback-timeout',
        type: 'scene' as const,
        themes: ['fantasy'],
        tags: [],
        content: 'Time seems to slow down...'
      };
      
      mockFallbackManager.getContent.mockReturnValue(fallbackContent);

      const result = await generator.generateSegment(mockRequest);

      expect(result.content).toBe(fallbackContent.content);
      expect(result.isAIGenerated).toBe(false);
      expect(result.fallbackReason).toBe('timeout');
    });

    it('should throw error if no fallback content available', async () => {
      mockClient.generateContent.mockRejectedValue(new Error('Service error'));
      mockFallbackManager.getContent.mockReturnValue(null);

      await expect(generator.generateSegment(mockRequest))
        .rejects.toThrow('Failed to generate narrative segment');
    });

    it('should prefer AI content when available', async () => {
      const aiResponse = {
        content: 'AI generated content...',
        choices: []
      };
      
      mockClient.generateContent.mockResolvedValue(aiResponse);

      const result = await generator.generateSegment(mockRequest);

      expect(result.content).toBe(aiResponse.content);
      expect(result.isAIGenerated).toBe(true);
      expect(result.fallbackReason).toBeUndefined();
      expect(mockFallbackManager.getContent).not.toHaveBeenCalled();
    });

    it('should maintain narrative context with fallback content', async () => {
      mockClient.generateContent.mockRejectedValue(new Error('Service error'));
      
      const fallbackContent = {
        id: 'contextual-fallback',
        type: 'scene' as const,
        themes: ['fantasy'],
        tags: ['forest', 'continuation'],
        content: 'The forest path continues...'
      };
      
      mockFallbackManager.getContent.mockReturnValue(fallbackContent);

      const result = await generator.generateSegment(mockRequest);

      // Verify fallback manager was called with correct context
      expect(mockFallbackManager.getContent).toHaveBeenCalledWith(
        'scene',
        mockRequest.context,
        mockWorld
      );

      expect(result.content).toBe(fallbackContent.content);
      expect(result.metadata?.tags).toEqual(fallbackContent.tags);
    });
  });

  describe('retry mechanism', () => {
    it('should attempt retry before falling back', async () => {
      // First call fails, second succeeds
      mockClient.generateContent
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ content: 'Success on retry', choices: [] });

      const result = await generator.generateSegment(mockRequest);

      expect(mockClient.generateContent).toHaveBeenCalledTimes(2);
      expect(result.content).toBe('Success on retry');
      expect(result.isAIGenerated).toBe(true);
    });

    it('should use fallback after max retries', async () => {
      // All retries fail
      mockClient.generateContent.mockRejectedValue(new Error('Persistent error'));
      
      const fallbackContent = {
        id: 'fallback-after-retry',
        type: 'scene' as const,
        themes: ['fantasy'],
        tags: [],
        content: 'The journey continues despite difficulties...'
      };
      
      mockFallbackManager.getContent.mockReturnValue(fallbackContent);

      const result = await generator.generateSegment(mockRequest);

      expect(mockClient.generateContent).toHaveBeenCalledTimes(3); // 1 attempt + 2 retries
      expect(result.content).toBe(fallbackContent.content);
      expect(result.isAIGenerated).toBe(false);
    });
  });

  describe('initial scene fallback', () => {
    it('should use initial scene fallback for new sessions', async () => {
      mockClient.generateContent.mockRejectedValue(new Error('Service error'));
      
      const initialFallback = {
        id: 'initial-fallback',
        type: 'initial' as const,
        themes: ['fantasy'],
        tags: ['beginning'],
        content: 'Your adventure begins in a mysterious land...'
      };
      
      mockFallbackManager.getContent.mockReturnValue(initialFallback);

      const result = await generator.generateInitialScene('world-1', ['char-1']);

      expect(mockFallbackManager.getContent).toHaveBeenCalledWith(
        'initial',
        expect.any(Object),
        mockWorld
      );
      expect(result.content).toBe(initialFallback.content);
      expect(result.isAIGenerated).toBe(false);
    });
  });

  describe('fallback metadata', () => {
    it('should include detailed fallback metadata', async () => {
      mockClient.generateContent.mockRejectedValue(new Error('Rate limit exceeded'));
      
      const fallbackContent = {
        id: 'rate-limit-fallback',
        type: 'scene' as const,
        themes: ['fantasy'],
        tags: [],
        content: 'The story continues...'
      };
      
      mockFallbackManager.getContent.mockReturnValue(fallbackContent);

      const result = await generator.generateSegment(mockRequest);

      expect(result.metadata).toMatchObject({
        timestamp: expect.any(String),
        isAIGenerated: false,
        fallbackReason: 'rate_limit',
        contentId: 'rate-limit-fallback',
        retryAttempts: 2
      });
    });
  });
});