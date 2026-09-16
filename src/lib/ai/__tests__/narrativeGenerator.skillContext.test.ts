/**
 * Tests for skill context integration in narrative generation
 * Verifies that character skill information is included in prompts
 */

// Mock stores at module level (before imports)
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/aiContextStore', () => ({
  useAiContextStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/npcStore', () => ({
  useNPCStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/loreStore', () => ({
  useLoreStore: {
    getState: jest.fn()
  }
}));
jest.mock('../loreContextHelper', () => ({
  getLoreContextForPrompt: jest.fn().mockReturnValue(''),
  checkAndRecordLoreMentions: jest.fn()
}));

import { NarrativeGenerator } from '../narrativeGenerator';
import { createMockAIClient, createMockWorldWithSkills, createMockCharacterWithSkills } from './narrativeGenerator.skill.testHelpers';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useNPCStore } from '@/state/npcStore';
import { useLoreStore } from '@/state/loreStore';
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
      currentWorldId: 'skill-world'
    }));

    (useCharacterStore.getState as jest.Mock).mockReturnValue(createMockCharacterStore({
      characters: { 'char-1': mockCharacter }
    }));

    (useAiContextStore.getState as jest.Mock).mockReturnValue({
      buildContextForSession: jest.fn().mockReturnValue({
        activeGoals: [],
        goalContext: ''
      })
    });

    (useInventoryStore.getState as jest.Mock).mockReturnValue({
      getCharacterItems: jest.fn().mockReturnValue([])
    });

    (useNPCStore.getState as jest.Mock).mockReturnValue({
      getNPCsByWorld: jest.fn().mockReturnValue([])
    });

    (useLoreStore.getState as jest.Mock).mockReturnValue({
      getLoreContext: jest.fn().mockReturnValue({ factIds: [] }),
      recordLoreMentions: jest.fn(),
      recordLoreUsage: jest.fn(),
      addStructuredLore: jest.fn()
    });

    mockAIClient = createMockAIClient();
    narrativeGenerator = new NarrativeGenerator(mockAIClient);
  });

  /**
   * What the scene prompt carries about the player character: the background,
   * the player-identity rules that keep the narrator from writing the player as
   * a third party, and (the part #1912 was about) the character's skills and
   * notable attributes under names the model can actually read. The labels are
   * asserted with their descriptors attached ("Athletics (Master)") so this
   * can't pass off a stray "Athletics" from somewhere else in the 16k prompt.
   */
  test('carries the player character background, skills and attributes into the scene prompt', async () => {
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
    });

    const calledPrompt = mockAIClient.generateContent.mock.calls[0][0] as string;

    expect(calledPrompt).toContain('Skilled adventurer with years of experience');
    expect(calledPrompt).toContain('Brave and resourceful');
    expect(calledPrompt).toContain('The player IS Test Hero');

    // Every skill the player invested in, named and rated.
    expect(calledPrompt).toContain('Athletics (Master)');
    expect(calledPrompt).toContain('Magic (Expert)');
    expect(calledPrompt).toContain('Stealth (Competent)');

    // Notable attributes only. Dexterity sits at 4 and stays out.
    expect(calledPrompt).toContain('Strength (Exceptional)');
    expect(calledPrompt).toContain('Intelligence (High)');
    expect(calledPrompt).not.toContain('Dexterity (');
  });
});
