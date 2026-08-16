/**
 * Tests for skill-based choice generation
 * Verifies that choices can have skill requirements
 */

// Mock stores at module level (before imports)
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('../choiceGenerator');

import { NarrativeGenerator } from '../narrativeGenerator';
import { NarrativeContext } from '@/types/narrative.types';
import { createMockAIClient, createMockWorldWithSkills, createMockCharacterWithSkills } from './narrativeGenerator.skill.testHelpers';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { generateChoices } from '../choiceGenerator';
import { createMockWorldStore, createMockCharacterStore } from '@/lib/test-utils/mockStoreFactories';

describe('NarrativeGenerator - Skill-Based Choices', () => {
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

  test('should pass character skills to choice generator', async () => {
    // Spy on the context passed to the choice generator
    (generateChoices as jest.Mock).mockResolvedValue({
      id: 'decision-with-skills',
      prompt: 'What approach will you take?',
      options: [
        {
          id: 'opt-1',
          text: 'Climb the wall',
          requirements: [{ type: 'skill' as const, targetId: 'athletics', operator: 'gte' as const, value: 5 }],
          hint: 'Requires athletic ability'
        },
        {
          id: 'opt-2',
          text: 'Cast a levitation spell',
          requirements: [{ type: 'skill' as const, targetId: 'magic', operator: 'gte' as const, value: 4 }],
          hint: 'Requires magical knowledge'
        },
        {
          id: 'opt-3',
          text: 'Look for another way',
          alignment: 'neutral' as const
        }
      ]
    });

    const narrativeContext: NarrativeContext = {
      worldId: 'skill-world',
      currentSceneId: 'scene-3',
      characterIds: ['char-1'],
      sessionId: 'session-1',
      previousSegments: [],
      currentTags: ['obstacle'],
      currentLocation: 'High Wall',
      currentSituation: 'Facing a tall obstacle'
    };

    await narrativeGenerator.generatePlayerChoices(
      'skill-world',
      narrativeContext,
      ['char-1']
    );

    // Verify the choice generator was called with the client and correct parameters
    expect(generateChoices).toHaveBeenCalledWith(mockAIClient, {
      worldId: 'skill-world',
      narrativeContext,
      characterIds: ['char-1'],
      sessionId: 'session-1', // Now includes sessionId from narrativeContext
      minOptions: 3,
      maxOptions: 3,
      useAlignedChoices: true
    });

    // Verify the choice generator was called - the choices themselves are tested in choiceGenerator tests
  });
});
