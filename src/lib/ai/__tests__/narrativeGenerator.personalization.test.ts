/**
 * MVP-level tests for NarrativeGenerator personalization integration
 * Focus on acceptance criteria: AI generates personalized narrative content
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { PersonalizationEngine } from '../personalizationEngine';
import { playerDecisionTracker } from '../playerDecisionTracker';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

// Mock the stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

// Mock the AI client
const mockGeminiClient = {
  generateContent: jest.fn()
};

// Mock the personalization components
jest.mock('../personalizationEngine');
jest.mock('../playerDecisionTracker');

describe('NarrativeGenerator Personalization - MVP Tests', () => {
  let generator: NarrativeGenerator;
  let mockUseWorldStore: jest.MockedFunction<typeof useWorldStore>;
  let mockUseCharacterStore: jest.MockedFunction<typeof useCharacterStore>;

  const mockWorld = {
    id: 'world-1',
    name: 'Test World',
    description: 'A test world',
    genre: 'fantasy',
    toneSettings: {
      narrativeStyle: 'adventurous',
      contentRating: 'teen',
      languageComplexity: 'moderate',
      customInstructions: ''
    }
  };

  const mockCharacter = {
    id: 'char-1',
    name: 'Test Hero',
    background: 'A brave adventurer',
    attributes: { Strength: 8, Intelligence: 6 },
    skills: [{ name: 'Swordplay', level: 7 }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    generator = new NarrativeGenerator(mockGeminiClient as any);
    
    mockUseWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;
    mockUseCharacterStore = useCharacterStore as jest.MockedFunction<typeof useCharacterStore>;

    // Setup store mocks
    mockUseWorldStore.mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({ worlds: { 'world-1': mockWorld } });
      }
      return { worlds: { 'world-1': mockWorld } };
    });

    mockUseCharacterStore.mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({ characters: { 'char-1': mockCharacter } });
      }
      return { characters: { 'char-1': mockCharacter } };
    });

    // Mock AI response
    mockGeminiClient.generateContent.mockResolvedValue({
      content: 'Generated narrative content with character details.',
      tokenUsage: 100
    });
  });

  describe('Core Personalization Integration', () => {
    test('includes character context in narrative generation', async () => {
      const request = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1',
        narrativeContext: {
          currentLocation: 'Forest',
          currentSituation: 'Exploring'
        }
      };

      await generator.generateSegment(request);

      // Verify AI client was called with enhanced prompt
      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Test Hero')
      );
      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('brave adventurer')
      );
    });

    test('integrates player decision history in prompts', async () => {
      // Mock decision tracker to return some decisions
      const mockGetWorldDecisions = jest.fn().mockReturnValue([
        {
          id: 'dec-1',
          choiceType: 'helpful',
          prompt: 'Help stranger?',
          choiceText: 'Yes, help them'
        }
      ]);
      
      (playerDecisionTracker.getWorldDecisions as jest.Mock) = mockGetWorldDecisions;

      const request = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      await generator.generateSegment(request);

      // Verify decision tracker was called
      expect(mockGetWorldDecisions).toHaveBeenCalledWith('world-1');
      
      // Verify AI prompt includes decision context
      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('helpful')
      );
    });

    test('generates initial scene with character personalization', async () => {
      const result = await generator.generateInitialScene('world-1', ['char-1']);

      expect(result).toBeDefined();
      expect(result.content).toBe('Generated narrative content with character details.');
      
      // Verify character context was included in prompt
      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Test Hero')
      );
      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('brave adventurer')
      );
    });
  });

  describe('MVP Acceptance Criteria', () => {
    test('narrative content references specific character details', async () => {
      const request = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      const result = await generator.generateSegment(request);

      // Verify the prompt sent to AI includes character-specific information
      const promptCall = mockGeminiClient.generateContent.mock.calls[0][0];
      
      expect(promptCall).toContain('Test Hero');
      expect(promptCall).toContain('brave adventurer');
      expect(promptCall).toContain('Swordplay');
      expect(promptCall).toContain('Strength: 8');
    });

    test('maintains consistent tone with world settings', async () => {
      const request = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      await generator.generateSegment(request);

      const promptCall = mockGeminiClient.generateContent.mock.calls[0][0];
      
      expect(promptCall).toContain('adventurous');
      expect(promptCall).toContain('fantasy');
    });

    test('builds upon previous story elements', async () => {
      const request = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1',
        narrativeContext: {
          recentSegments: [{
            id: 'seg-1',
            content: 'You entered the dark forest.',
            type: 'scene' as const,
            metadata: { location: 'Forest' }
          }]
        }
      };

      await generator.generateSegment(request);

      const promptCall = mockGeminiClient.generateContent.mock.calls[0][0];
      
      // Should reference previous narrative
      expect(promptCall).toContain('dark forest');
    });

    test('filters and validates content appropriately', async () => {
      const request = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      const result = await generator.generateSegment(request);

      // Basic content validation
      expect(result.content).toBeTruthy();
      expect(typeof result.content).toBe('string');
      expect(result.content.length).toBeGreaterThan(0);
      
      // Should have appropriate segment type
      expect(['scene', 'dialogue', 'action', 'transition']).toContain(result.segmentType);
    });
  });

  describe('Edge Cases', () => {
    test('handles missing character gracefully', async () => {
      mockUseCharacterStore.mockReturnValue({ characters: {} });

      const request = {
        worldId: 'world-1',
        characterIds: ['missing-char'],
        sessionId: 'session-1'
      };

      const result = await generator.generateSegment(request);

      expect(result).toBeDefined();
      // Should still generate content without character personalization
      expect(mockGeminiClient.generateContent).toHaveBeenCalled();
    });

    test('handles empty decision history', async () => {
      const mockGetWorldDecisions = jest.fn().mockReturnValue([]);
      (playerDecisionTracker.getWorldDecisions as jest.Mock) = mockGetWorldDecisions;

      const request = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      const result = await generator.generateSegment(request);

      expect(result).toBeDefined();
      expect(mockGeminiClient.generateContent).toHaveBeenCalled();
    });

    test('continues working if personalization fails', async () => {
      // Mock personalization to throw error
      const mockPersonalizationEngine = PersonalizationEngine as jest.MockedClass<typeof PersonalizationEngine>;
      mockPersonalizationEngine.prototype.createPersonalizedContext = jest.fn().mockImplementation(() => {
        throw new Error('Personalization failed');
      });

      const request = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      // Should not throw - should fall back gracefully
      const result = await generator.generateSegment(request);
      
      expect(result).toBeDefined();
      expect(mockGeminiClient.generateContent).toHaveBeenCalled();
    });
  });
});