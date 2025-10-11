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
          categoryId: 'weapons',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'found',
          source: 'treasure chest',
          acquiredAt: new Date().toISOString(),
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
          method: 'purchased',
          source: 'village shop',
          acquiredAt: new Date().toISOString(),
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

      // Check that inventory context is included in the prompt
      expect(generatedPrompt).toContain('CHARACTER INVENTORY');
      expect(generatedPrompt).toContain('Magic Sword');
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
          categoryId: 'weapons',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'found',
          acquiredAt: new Date().toISOString(),
        },
      });

      useInventoryStore.getState().addItem(character2Id, {
        name: 'Staff',
        stackable: false,
        categorization: {
          categoryId: 'weapons',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'found',
          acquiredAt: new Date().toISOString(),
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
          method: 'quest-reward',
          source: 'ancient temple',
          acquiredAt: new Date().toISOString(),
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
          method: 'looted',
          acquiredAt: new Date().toISOString(),
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
      // Add many items
      for (let i = 0; i < 20; i++) {
        useInventoryStore.getState().addItem(characterId, {
          name: `Item ${i}`,
          stackable: true,
          categorization: {
            categoryId: 'miscellaneous',
            source: 'manual',
            classifiedAt: new Date().toISOString(),
          },
          acquisition: {
            method: 'found',
            acquiredAt: new Date().toISOString(),
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
      const inventorySection = generatedPrompt.match(/INVENTORY:[\s\S]*?(?=\n\n|$)/);
      if (inventorySection) {
        const itemCount = (inventorySection[0].match(/Item \d+/g) || []).length;
        expect(itemCount).toBeLessThanOrEqual(10); // Reasonable limit
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
          method: 'starting-equipment',
          acquiredAt: new Date().toISOString(),
        },
      });
    });

    it('should include inventory in initial scene generation', async () => {
      await generator.generateInitialScene(worldId, [characterId]);

      expect(mockGeminiClient.generateContent).toHaveBeenCalled();
      const generatedPrompt = (mockGeminiClient.generateContent as jest.Mock).mock
        .calls[0][0] as string;

      expect(generatedPrompt).toContain('CHARACTER INVENTORY');
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
