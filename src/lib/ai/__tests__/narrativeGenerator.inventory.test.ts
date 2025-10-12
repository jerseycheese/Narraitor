// Test inventory integration in narrative generation
// Tests that the Narrative Engine has access to character inventory data
// and includes relevant items in generated narrative prompts

import { NarrativeGenerator } from '../narrativeGenerator';
import { useInventoryStore } from '@/state/inventoryStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { AIClient } from '../types';

describe('NarrativeGenerator - Inventory Integration', () => {
  let generator: NarrativeGenerator;
  let mockGeminiClient: AIClient;
  let worldId: string;
  let characterId: string;

  beforeEach(() => {
    // Reset stores
    useInventoryStore.getState().reset();
    useWorldStore.getState().reset();
    useCharacterStore.getState().reset();

    // Create mock Gemini client
    mockGeminiClient = {
      generateContent: jest.fn().mockResolvedValue({
        content: 'Test narrative content',
        tokenUsage: 100,
      }),
    };

    generator = new NarrativeGenerator(mockGeminiClient);

    // Create test world
    worldId = useWorldStore.getState().create({
      name: 'Test World',
      description: 'A world for testing',
      genre: 'fantasy',
      attributes: [],
    });
    useWorldStore.getState().setCurrent(worldId);

    // Create test character
    characterId = useCharacterStore.getState().create({
      name: 'Test Hero',
      worldId,
      background: { summary: 'A brave adventurer' },
      attributes: [],
      skills: [],
    });
  });

  describe('Inventory data access', () => {
    it('should include inventory items in narrative generation prompt', async () => {
      // Add items to character inventory
      useInventoryStore.getState().addItem(characterId, {
        name: 'Magic Sword',
        description: 'A powerful enchanted blade',
        stackable: false,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          description: 'Found in treasure chest',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      useInventoryStore.getState().addItem(characterId, {
        name: 'Health Potion',
        description: 'Restores vitality',
        stackable: true,
        quantity: 3,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'purchase',
          description: 'Bought at village shop',
          acquiredAt: new Date().toISOString(),
          quantity: 3,
        },
      });

      // Verify items were added
      const items = useInventoryStore.getState().getCharacterItems(characterId);
      expect(items.length).toBeGreaterThan(0);

      // Generate narrative
      await generator.generateSegment({
        worldId,
        sessionId: 'test-session',
        characterIds: [characterId],
        narrativeContext: {
          worldId,
          currentSceneId: 'scene-1',
          characterIds: [characterId],
          previousSegments: [],
          currentTags: ['combat'],
          sessionId: 'test-session',
          currentLocation: 'Dark Forest',
          currentSituation: 'Facing a dangerous enemy',
        },
      });

      // Verify geminiClient was called with prompt containing inventory context
      expect(mockGeminiClient.generateContent).toHaveBeenCalled();
      const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
        .calls[0][0] as string;

      // Check that inventory context is included in the prompt with metadata
      expect(generatedPrompt).toContain('## Inventory Summary');
      expect(generatedPrompt).toContain('Magic Sword (equipment, qty 1, acquired via loot');
      expect(generatedPrompt).toContain('A powerful enchanted blade');
    });

    it('should handle empty inventory gracefully', async () => {
      // Character has no items

      await generator.generateSegment({
        worldId,
        sessionId: 'test-session',
        characterIds: [characterId],
        narrativeContext: {
          worldId,
          currentSceneId: 'scene-1',
          characterIds: [characterId],
          previousSegments: [],
          currentTags: ['exploration'],
          sessionId: 'test-session',
        },
      });

      // Should not throw error
      expect(mockGeminiClient.generateContent).toHaveBeenCalled();
    });

    it('should retrieve inventory for the correct character', async () => {
      // Create second character
      const character2Id = useCharacterStore.getState().create({
        name: 'Other Hero',
        worldId,
        background: { summary: 'Another adventurer' },
        attributes: [],
        skills: [],
      });

      // Add different items to each character
      useInventoryStore.getState().addItem(characterId, {
        name: 'Sword',
        stackable: false,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      useInventoryStore.getState().addItem(character2Id, {
        name: 'Staff',
        stackable: false,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      // Generate narrative for first character
      await generator.generateSegment({
        worldId,
        sessionId: 'test-session',
        characterIds: [characterId],
        narrativeContext: {
          worldId,
          currentSceneId: 'scene-1',
          characterIds: [characterId],
          previousSegments: [],
          currentTags: [],
          sessionId: 'test-session',
        },
      });

      const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
        .calls[0][0] as string;

      // Should include first character's item but not second character's
      expect(generatedPrompt).toContain('Sword');
      expect(generatedPrompt).not.toContain('Staff');
    });
  });

  describe('Item prioritization', () => {
    it('should prioritize narratively significant items', async () => {
      // Add mix of significant and mundane items
      useInventoryStore.getState().addItem(characterId, {
        name: 'Legendary Artifact',
        description: 'A powerful ancient relic',
        stackable: false,
        categorization: {
          categoryId: 'quest-items',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'quest',
          description: 'Reward from ancient temple quest',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      useInventoryStore.getState().addItem(characterId, {
        name: 'Rusty Nail',
        description: 'A common rusty nail',
        stackable: true,
        quantity: 10,
        categorization: {
          categoryId: 'miscellaneous',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 10,
        },
      });

      await generator.generateSegment({
        worldId,
        sessionId: 'test-session',
        characterIds: [characterId],
        narrativeContext: {
          worldId,
          currentSceneId: 'scene-1',
          characterIds: [characterId],
          previousSegments: [],
          currentTags: [],
          sessionId: 'test-session',
        },
      });

      const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
        .calls[0][0] as string;

      // Legendary item should appear in prompt
      expect(generatedPrompt).toContain('Legendary Artifact');

      // Should prioritize significant items over common ones
      // Note: We can't guarantee mundane items won't appear, but significant items should be mentioned
    });

    it('should limit inventory mentions to prevent overwhelming the AI', async () => {
      // Add many items with longer descriptions to exceed token limit
      for (let i = 0; i < 20; i++) {
        useInventoryStore.getState().addItem(characterId, {
          name: `Item ${i}`,
          description: `This is a detailed description for item ${i} that adds significant token usage to ensure truncation happens`,
          stackable: true,
          categorization: {
            categoryId: 'miscellaneous',
            source: 'manual',
            classifiedAt: new Date().toISOString(),
          },
          acquisition: {
            method: 'loot',
            acquiredAt: new Date().toISOString(),
            quantity: 1,
          },
        });
      }

      await generator.generateSegment({
        worldId,
        sessionId: 'test-session',
        characterIds: [characterId],
        narrativeContext: {
          worldId,
          currentSceneId: 'scene-1',
          characterIds: [characterId],
          previousSegments: [],
          currentTags: [],
          sessionId: 'test-session',
        },
      });

      const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
        .calls[0][0] as string;

      // Count how many items are mentioned (should be limited, not all 20)
      const inventorySection = generatedPrompt.split('## Inventory Summary')[1] || '';
      const itemLines = inventorySection
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- ') && !line.startsWith('+ '));

      // Should not include all 20 items - either limited by max items (8) or token limit
      expect(itemLines.length).toBeLessThan(20);
      expect(itemLines.length).toBeLessThanOrEqual(8);

      // When truncated, should show summary of omitted items
      if (itemLines.length < 20) {
        expect(inventorySection).toContain('more items');
      }
    });
  });

  describe('Integration with generation methods', () => {
    beforeEach(() => {
      // Add a sample item for all integration tests
      useInventoryStore.getState().addItem(characterId, {
        name: 'Adventure Pack',
        description: 'Essential supplies for travel',
        stackable: false,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'manual',
          description: 'Starting equipment',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });
    });

    it('should include inventory in initial scene generation', async () => {
      await generator.generateInitialScene(worldId, [characterId]);

      expect(mockGeminiClient.generateContent).toHaveBeenCalled();
      const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
        .calls[0][0] as string;

      expect(generatedPrompt).toContain('## Inventory Summary');
      expect(generatedPrompt).toContain('Adventure Pack');
    });

    it('should include inventory in skill acknowledgment generation', async () => {
      await generator.generateSkillAcknowledgment(
        worldId,
        {
          worldId,
          currentSceneId: 'scene-1',
          characterIds: [characterId],
          previousSegments: [],
          currentTags: [],
          sessionId: 'test-session',
        },
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
});
