/**
 * Tests for inventory data access in narrative generation
 * Covers how the narrative engine retrieves and includes inventory data
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { useInventoryStore } from '@/state/inventoryStore';
import { useCharacterStore } from '@/state/characterStore';
import {
  createMockGeminiClient,
  setupTestWorldAndCharacter,
  createMockItem,
  createTestNarrativeContext,
} from './narrativeGenerator.inventory.testHelpers';

describe('NarrativeGenerator - Inventory Data Access', () => {
  let generator: NarrativeGenerator;
  let mockGeminiClient: ReturnType<typeof createMockGeminiClient>;
  let worldId: string;
  let characterId: string;

  beforeEach(() => {
    mockGeminiClient = createMockGeminiClient();
    generator = new NarrativeGenerator(mockGeminiClient);
    ({ worldId, characterId } = setupTestWorldAndCharacter());
  });

  test('should include inventory items in narrative generation prompt', async () => {
    // Add items to character inventory
    useInventoryStore.getState().addItem(
      characterId,
      createMockItem({
        name: 'Magic Sword',
        description: 'A powerful enchanted blade',
        categoryId: 'equipment',
        method: 'loot',
      })
    );

    useInventoryStore.getState().addItem(
      characterId,
      createMockItem({
        name: 'Health Potion',
        description: 'Restores vitality',
        stackable: true,
        quantity: 3,
        categoryId: 'consumables',
        method: 'purchase',
      })
    );

    // Verify items were added
    const items = useInventoryStore.getState().getCharacterItems(characterId);
    expect(items.length).toBeGreaterThan(0);

    // Generate narrative
    const context = createTestNarrativeContext(worldId, characterId);
    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: [characterId],
      narrativeContext: {
        ...context,
        currentLocation: 'Dark Forest',
        currentSituation: 'Facing a dangerous enemy',
        currentTags: ['combat'],
      },
    });

    // Verify geminiClient was called with prompt containing inventory context
    expect(mockGeminiClient.generateContent).toHaveBeenCalled();
    const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
      .calls[0][0] as string;

    // Check that inventory context is included in the prompt with metadata
    expect(generatedPrompt).toContain('## Inventory Summary');
    expect(generatedPrompt).toContain(
      'Magic Sword (equipment, qty 1, acquired via loot'
    );
    expect(generatedPrompt).toContain('A powerful enchanted blade');
  });

  test('should handle empty inventory gracefully', async () => {
    // Character has no items
    const context = createTestNarrativeContext(worldId, characterId);
    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: [characterId],
      narrativeContext: {
        ...context,
        currentTags: ['exploration'],
      },
    });

    // Should not throw error
    expect(mockGeminiClient.generateContent).toHaveBeenCalled();
  });

  test('should retrieve inventory for the correct character', async () => {
    // Create second character
    const character2Id = useCharacterStore.getState().create({
      name: 'Other Hero',
      worldId,
      description: 'Another hero for testing purposes',
      level: 1,
      isPlayer: false,
      status: {
        conditions: [],
      },
      background: {
        history: 'Another adventurer',
        personality: 'Mysterious',
        goals: [],
        fears: [],
        relationships: [],
      },
      attributes: [],
      skills: [],
      derivedStats: [],
      inventory: {
        characterId: '',
        items: [],
        capacity: 0,
        categories: [],
        itemOrder: [],
      },
    });

    useCharacterStore.getState().updateCharacter(character2Id, {
      inventory: {
        characterId: character2Id,
        items: [],
        capacity: 0,
        categories: [],
        itemOrder: [],
      },
    });

    // Add different items to each character
    useInventoryStore.getState().addItem(
      characterId,
      createMockItem({
        name: 'Sword',
        categoryId: 'equipment',
      })
    );

    useInventoryStore.getState().addItem(
      character2Id,
      createMockItem({
        name: 'Staff',
        categoryId: 'equipment',
      })
    );

    // Generate narrative for first character
    const context = createTestNarrativeContext(worldId, characterId);
    await generator.generateSegment({
      worldId,
      sessionId: 'test-session',
      characterIds: [characterId],
      narrativeContext: context,
    });

    const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
      .calls[0][0] as string;

    // Should include first character's item but not second character's
    expect(generatedPrompt).toContain('Sword');
    expect(generatedPrompt).not.toContain('Staff');
  });
});
