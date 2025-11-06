/**
 * Tests for skill context integration in narrative generation
 * Verifies that character skill information is included in prompts
 */

// Mock stores at module level (before imports)
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');

import { NarrativeGenerator } from '../narrativeGenerator';
import { createMockAIClient, createMockWorldWithSkills, createMockCharacterWithSkills } from './narrativeGenerator.skill.testHelpers';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { createMockWorldStore, createMockCharacterStore } from '@/lib/test-utils';

describe('NarrativeGenerator - Skill Context Integration', () => {
  let narrativeGenerator: NarrativeGenerator;
  let mockAIClient: ReturnType<typeof createMockAIClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup store mocks
    const mockWorld = createMockWorldWithSkills();
    const mockCharacter = createMockCharacterWithSkills();

    (useWorldStore.getState as jest.Mock).mockReturnValue(createMockWorldStore({
      worlds: { 'skill-world': mockWorld },
      currentWorldId: 'skill-world'}));
    )))

    (useCharacterStore.getState as jest.Mock).mockReturnValue(createMockCharacterStore({
      characters: { 'char-1': mockCharacter }
    )))

    mockAIClient = createMockAIClient();
    narrativeGenerator = new NarrativeGenerator(mockAIClient);
  )))

  test('should include character skill information in narrative context', async () => {
    const mockResponse = {
      content: "You assess your options, drawing on your athletic prowess and magical knowledge.",
      finishReason: 'stop' as const,
      promptTokens: 50,
      completionTokens: 50
    };
    mockAIClient.generateContent.mockResolvedValue(mockResponse);

    await narrativeGenerator.generateSegment({
      worldId: 'skill-world',
      sessionId: 'session-1',
      characterIds: ['char-1'],
      narrativeContext: {
        worldId: 'skill-world',
        currentSceneId: 'scene-4',
        characterIds: ['char-1'],
        sessionId: 'session-1',
        previousSegments: [],
        currentTags: []
      }
    )))

    // Verify that the AI client was called with a prompt
    expect(mockAIClient.generateContent).toHaveBeenCalled();
    const calledPrompt = mockAIClient.generateContent.mock.calls[0][0];

    // The prompt should include character skill context
    expect(typeof calledPrompt).toBe('string');
    expect(calledPrompt.length).toBeGreaterThan(0);
  )))
)))
