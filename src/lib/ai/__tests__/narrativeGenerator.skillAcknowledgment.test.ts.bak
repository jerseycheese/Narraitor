/**
 * Tests for skill acknowledgment in narrative generation
 * Verifies that skill usage (success/failure) is properly acknowledged
 */

// Mock stores at module level (before imports)
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

import { NarrativeGenerator } from '../narrativeGenerator';
import { NarrativeContext } from '@/types/narrative.types';
import { createMockAIClient, createMockWorldWithSkills, createMockCharacterWithSkills } from './narrativeGenerator.skill.testHelpers';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { createMockWorldStore, createMockCharacterStore } from '@/lib/test-utils/mockStoreFactories';

jest.mock('../../promptTemplates/narrativeTemplateManager', () => ({
  narrativeTemplateManager: {
    getTemplate: jest.fn().mockImplementation((key: string) => {
      if (key === 'narrative/scene') {
        return jest.fn().mockImplementation((context: { characterSkillContext?: string }) => {
          const characterSkillContext = context.characterSkillContext || '';
          return `Generate a scene...${characterSkillContext}`;
        });
      }
      if (key === 'narrative/skillAcknowledgment') {
        return jest.fn().mockReturnValue('Generate skill acknowledgment...');
      }
      return jest.fn().mockReturnValue('Template not found');
    })
  }
}));

describe('NarrativeGenerator - Skill Acknowledgment', () => {
  let narrativeGenerator: NarrativeGenerator;
  let mockAIClient: ReturnType<typeof createMockAIClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup store mocks
    const mockWorld = createMockWorldWithSkills();
    const mockCharacter = createMockCharacterWithSkills();

    (useWorldStore.getState as jest.Mock).mockReturnValue(createMockWorldStore({
      worlds: { 'skill-world': mockWorld },
      currentWorldId: 'skill-world'
    }));

    (useCharacterStore.getState as jest.Mock).mockReturnValue(createMockCharacterStore({
      characters: { 'char-1': mockCharacter }
    }));

    mockAIClient = createMockAIClient();
    narrativeGenerator = new NarrativeGenerator(mockAIClient);
  });

  test('should generate narrative that acknowledges successful skill usage', async () => {
    // Mock AI response that acknowledges skill usage
    const mockResponse = {
      content: JSON.stringify({
        content: "Your athletic training pays off as you leap across the chasm with ease. The crowd cheers as you land gracefully on the other side, your strength clearly evident in the powerful jump.",
        metadata: {
          location: "Canyon Bridge",
          mood: "triumphant",
          tags: ["skill-success", "athletics", "crowd-reaction"],
          characterIds: ["char-1"]
        }
      }),
      finishReason: 'stop' as const,
      promptTokens: 75,
      completionTokens: 75
    };
    mockAIClient.generateContent.mockResolvedValue(mockResponse);

    const narrativeContext: NarrativeContext = {
      worldId: 'skill-world',
      currentSceneId: 'scene-1',
      characterIds: ['char-1'],
      sessionId: 'session-1',
      previousSegments: [],
      currentTags: ['athletics-used'],
      currentLocation: 'Canyon Bridge',
      currentSituation: 'After successfully using athletics to leap the chasm'
    };

    const result = await narrativeGenerator.generateSegment({
      worldId: 'skill-world',
      sessionId: 'session-1',
      characterIds: ['char-1'],
      narrativeContext
    });

    expect(result.content).toContain('athletic training pays off');
    expect(result.content).toContain('strength clearly evident');
    expect(result.metadata.tags).toContain('skill-success');
    expect(result.metadata.location).toBe('Canyon Bridge');
  });

  test('should generate narrative that handles failed skill checks', async () => {
    // Mock AI response for skill failure
    const mockResponse = {
      content: JSON.stringify({
        content: "Despite your best efforts, the spell fizzles out before completion. Your magical energy feels drained, and you realize you need more practice with this level of enchantment.",
        metadata: {
          location: "Magic Tower",
          mood: "tense",
          tags: ["skill-failure", "magic", "consequence"],
          characterIds: ["char-1"]
        }
      }),
      finishReason: 'stop' as const,
      promptTokens: 70,
      completionTokens: 70
    };
    mockAIClient.generateContent.mockResolvedValue(mockResponse);

    const narrativeContext: NarrativeContext = {
      worldId: 'skill-world',
      currentSceneId: 'scene-2',
      characterIds: ['char-1'],
      sessionId: 'session-1',
      previousSegments: [],
      currentTags: ['magic-failed'],
      currentLocation: 'Magic Tower',
      currentSituation: 'After failing a magic skill check'
    };

    const result = await narrativeGenerator.generateSegment({
      worldId: 'skill-world',
      sessionId: 'session-1',
      characterIds: ['char-1'],
      narrativeContext
    });

    expect(result.content).toContain('spell fizzles out');
    expect(result.content).toContain('need more practice');
    expect(result.metadata.tags).toContain('skill-failure');
    expect(result.metadata.mood).toBe('tense');
  });

  test('should generate different narrative responses based on skill success/failure context', async () => {
    // Test successful skill usage narrative
    const successResponse = {
      content: "Your expertise shines through as you execute the maneuver perfectly.",
      finishReason: 'stop' as const,
      promptTokens: 45,
      completionTokens: 45
    };
    mockAIClient.generateContent.mockResolvedValueOnce(successResponse);

    const successContext: NarrativeContext = {
      worldId: 'skill-world',
      currentSceneId: 'scene-success',
      characterIds: ['char-1'],
      sessionId: 'session-1',
      previousSegments: [],
      currentTags: ['skill-success', 'athletics'],
      currentSituation: 'Successfully completed athletic challenge'
    };

    const successResult = await narrativeGenerator.generateSegment({
      worldId: 'skill-world',
      sessionId: 'session-1',
      characterIds: ['char-1'],
      narrativeContext: successContext
    });

    expect(successResult.content).toContain('expertise');

    // Test failed skill usage narrative
    const failureResponse = {
      content: "You struggle with the technique, clearly needing more practice.",
      finishReason: 'stop' as const,
      promptTokens: 42,
      completionTokens: 43
    };
    mockAIClient.generateContent.mockResolvedValueOnce(failureResponse);

    const failureContext: NarrativeContext = {
      worldId: 'skill-world',
      currentSceneId: 'scene-failure',
      characterIds: ['char-1'],
      sessionId: 'session-1',
      previousSegments: [],
      currentTags: ['skill-failure', 'magic'],
      currentSituation: 'Failed magical attempt'
    };

    const failureResult = await narrativeGenerator.generateSegment({
      worldId: 'skill-world',
      sessionId: 'session-1',
      characterIds: ['char-1'],
      narrativeContext: failureContext
    });

    expect(failureResult.content).toContain('struggle');
  });

  test('should handle worlds without skills gracefully', async () => {
    // Reset mocks and use a simple successful response
    mockAIClient.generateContent.mockResolvedValue({
      content: "You proceed with your adventure in this simple world.",
      finishReason: 'stop' as const,
      promptTokens: 35,
      completionTokens: 35
    });

    const result = await narrativeGenerator.generateSegment({
      worldId: 'skill-world',
      sessionId: 'session-1',
      characterIds: ['char-1'],
      narrativeContext: {
        worldId: 'skill-world',
        currentSceneId: 'scene-simple',
        characterIds: ['char-1'],
        sessionId: 'session-1',
        previousSegments: [],
        currentTags: []
      }
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(result.content).toBe("You proceed with your adventure in this simple world.");
  });
});
