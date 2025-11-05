/**
 * Tests for inventory integration with various generation methods
 * Covers how inventory is included across different narrative generation scenarios
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { useInventoryStore } from '@/state/inventoryStore';
import {
  createMockGeminiClient,
  setupTestWorldAndCharacter,
  createMockItem,
  createTestNarrativeContext
} from './narrativeGenerator.inventory.testHelpers';

describe('NarrativeGenerator - Inventory Integration', () => {
  let generator: NarrativeGenerator;
  let mockGeminiClient: ReturnType<typeof createMockGeminiClient>;
  let worldId: string;
  let characterId: string;

  beforeEach(() => {
    mockGeminiClient = createMockGeminiClient();
    generator = new NarrativeGenerator(mockGeminiClient);
    ({ worldId, characterId } = setupTestWorldAndCharacter());

    // Add a sample item for all integration tests
    useInventoryStore.getState().addItem(characterId, createMockItem({
      name: 'Adventure Pack',
      description: 'Essential supplies for travel',
      categoryId: 'equipment',
      method: 'manual',
    }));
  });

  test('should include inventory in initial scene generation', async () => {
    await generator.generateInitialScene(worldId, [characterId]);

    expect(mockGeminiClient.generateContent).toHaveBeenCalled();
    const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
      .calls[0][0] as string;

    expect(generatedPrompt).toContain('## Inventory Summary');
    expect(generatedPrompt).toContain('Adventure Pack');
  });

  test('should include inventory in skill acknowledgment generation', async () => {
    const context = createTestNarrativeContext(worldId, characterId);
    await generator.generateSkillAcknowledgment(
      worldId,
      context,
      [characterId],
      {
        skillId: 'skill-1',
        skillName: 'Climbing',
        success: true,
        difficulty: 5,
      }
    );

    expect(mockGeminiClient.generateContent).toHaveBeenCalled();
    const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
      .calls[0][0] as string;

    expect(generatedPrompt).toContain('Adventure Pack');
  });
});
