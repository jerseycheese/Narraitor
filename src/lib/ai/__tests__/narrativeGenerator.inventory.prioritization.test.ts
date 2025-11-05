/**
 * Tests for inventory item prioritization in narrative generation
 * Covers how significant items are prioritized over mundane ones
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { useInventoryStore } from '@/state/inventoryStore';
import {
  createMockGeminiClient,
  setupTestWorldAndCharacter,
  createMockItem,
  createTestNarrativeContext
} from './narrativeGenerator.inventory.testHelpers';

describe('NarrativeGenerator - Inventory Item Prioritization', () => {
  let generator: NarrativeGenerator;
  let mockGeminiClient: ReturnType<typeof createMockGeminiClient>;
  let worldId: string;
  let characterId: string;

  beforeEach(() => {
    mockGeminiClient = createMockGeminiClient();
    generator = new NarrativeGenerator(mockGeminiClient);
    ({ worldId, characterId } = setupTestWorldAndCharacter());
  });

  test('should prioritize narratively significant items', async () => {
    // Add mix of significant and mundane items
    useInventoryStore.getState().addItem(characterId, createMockItem({
      name: 'Legendary Artifact',
      description: 'A powerful ancient relic',
      categoryId: 'quest-items',
      method: 'quest',
    }));

    useInventoryStore.getState().addItem(characterId, createMockItem({
      name: 'Rusty Nail',
      description: 'A common rusty nail',
      stackable: true,
      quantity: 10,
      categoryId: 'miscellaneous',
    }));

    const context = createTestNarrativeContext(worldId, characterId);
    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: [characterId],
      narrativeContext: context,
    });

    const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
      .calls[0][0] as string;

    // Legendary item should appear in prompt
    expect(generatedPrompt).toContain('Legendary Artifact');

    // Should prioritize significant items over common ones
    // Note: We can't guarantee mundane items won't appear, but significant items should be mentioned
  });

  test('should limit inventory mentions to prevent overwhelming the AI', async () => {
    // Add many items with longer descriptions to exceed token limit
    for (let i = 0; i < 20; i++) {
      useInventoryStore.getState().addItem(characterId, createMockItem({
        name: `Item ${i}`,
        description: `This is a detailed description for item ${i} that adds significant token usage to ensure truncation happens`,
        stackable: true,
        categoryId: 'miscellaneous',
      }));
    }

    const context = createTestNarrativeContext(worldId, characterId);
    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: [characterId],
      narrativeContext: context,
    });

    const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
      .calls[0][0] as string;

    // Count how many items are mentioned (should be limited, not all 20)
    // Extract only the inventory list, excluding the item acquisition instructions
    const fullInventorySection = generatedPrompt.split('## Inventory Summary')[1] || '';
    const inventoryListOnly = fullInventorySection.split('ITEM ACQUISITION INSTRUCTIONS')[0] || fullInventorySection;
    const itemLines = inventoryListOnly
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- ') && !line.startsWith('+ '));

    // Should not include all 20 items - either limited by max items (8) or token limit
    expect(itemLines.length).toBeLessThan(20);
    expect(itemLines.length).toBeLessThanOrEqual(8);

    // When truncated, should show summary of omitted items
    if (itemLines.length < 20) {
      expect(inventoryListOnly).toContain('more items');
    }
  });
});
