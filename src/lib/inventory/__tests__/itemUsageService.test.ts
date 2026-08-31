// Test item usage service
// Verifies narrative generation and journal integration for item usage

import {
  processItemUsage,
  generateItemUsageNarrative,
  isNarrativelySignificant,
  buildUsageNarrative,
} from '../itemUsageService';
import { useInventoryStore } from '@/state/inventoryStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useJournalStore } from '@/state/journalStore';
import { useSessionStore } from '@/state/sessionStore';
import type { InventoryItem } from '@/types/inventory.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import * as worldClockUpdates from '@/lib/narrative/applyWorldClockUpdates';
import { PARTIAL_RECONCILIATION_ERROR } from '@/lib/narrative/narrativeErrors';

// Mock AI client
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: jest.fn(() => ({
    generateContent: jest.fn().mockResolvedValue({
      content:
        'The potion courses through your veins, restoring your vitality.',
      tokenUsage: 50,
    }),
  })),
}));

jest.mock('@/lib/narrative/applyWorldClockUpdates', () => ({
  applyWorldClockUpdates: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/narrative/applyWorldStateThreadUpdates', () => ({
  applyWorldStateThreadUpdates: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/ai/narrativeGenerator.npc', () => ({
  ...jest.requireActual('@/lib/ai/narrativeGenerator.npc'),
  syncNpcMetadata: jest.fn(),
}));

jest.mock('@/lib/ai/structuredLoreExtractor', () => ({
  extractStructuredLore: jest.fn().mockResolvedValue({
    characters: [],
    locations: [],
    events: [],
    rules: [],
  }),
}));

jest.mock('@/lib/ai/loreContextHelper', () => ({
  ...jest.requireActual('@/lib/ai/loreContextHelper'),
  getLoreContextForPrompt: jest.fn(() => ''),
}));

describe('Item Usage Service', () => {
  let worldId: string;
  let characterId: string;
  let sessionId: string;

  beforeEach(() => {
    // Reset all stores
    useInventoryStore.getState().reset();
    useCharacterStore.getState().reset();
    useWorldStore.getState().reset();
    useJournalStore.getState().reset();
    useNarrativeStore.getState().reset();

    // Create test world
    worldId = useWorldStore.getState().create({
      name: 'Fantasy Realm',
      description: 'A magical world',
      genre: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });

    // Create test character
    characterId = useCharacterStore.getState().create({
      name: 'Aria the Brave',
      worldId,
      description: 'A courageous warrior of the realm',
      level: 1,
      isPlayer: true,
      status: {
        conditions: [],
      },
      inventory: {
        characterId: characterId,
        items: [],
        capacity: 0,
        categories: [],
        itemOrder: [],
      },
      background: {
        history: 'A courageous warrior',
        personality: 'Brave',
        goals: [],
        fears: [],
        relationships: [],
      },
      attributes: [],
      skills: [],
      derivedStats: [],
    });

    // Create session ID and set up session state
    sessionId = `session-${worldId}-${characterId}-${Date.now()}`;
    useSessionStore.getState().setSessionId(sessionId);
    useSessionStore.getState().setCharacterId(characterId);
    useSessionStore.setState({ worldId });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isNarrativelySignificant', () => {
    it('should identify quest items as narratively significant', () => {
      const questItem: InventoryItem = {
        id: 'item-1',
        name: 'Ancient Key',
        description: 'Opens the sealed door',
        quantity: 1,
        stackable: false,
        categoryId: 'quest-items',
        categorization: {
          categoryId: 'quest-items',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisitionHistory: [
          {
            method: 'quest',
            acquiredAt: new Date().toISOString(),
            quantity: 1,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isNarrativelySignificant(questItem)).toBe(true);
    });

    it('should identify equipment as narratively significant', () => {
      const equipment: InventoryItem = {
        id: 'item-2',
        name: 'Enchanted Compass',
        description: 'Points to hidden treasures',
        quantity: 1,
        stackable: false,
        categoryId: 'equipment',
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisitionHistory: [
          {
            method: 'reward',
            acquiredAt: new Date().toISOString(),
            quantity: 1,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isNarrativelySignificant(equipment)).toBe(true);
    });

    it('should mark common consumables as not narratively significant', () => {
      const commonItem: InventoryItem = {
        id: 'item-3',
        name: 'Bread',
        description: 'Common food',
        quantity: 5,
        stackable: true,
        categoryId: 'consumables',
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisitionHistory: [
          {
            method: 'purchase',
            acquiredAt: new Date().toISOString(),
            quantity: 5,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isNarrativelySignificant(commonItem)).toBe(false);
    });

    it('should mark documents as narratively significant', () => {
      const document: InventoryItem = {
        id: 'item-4',
        name: 'Ancient Scroll',
        description: 'Contains mysterious writings',
        quantity: 1,
        stackable: false,
        categoryId: 'documents',
        categorization: {
          categoryId: 'documents',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisitionHistory: [
          {
            method: 'loot',
            acquiredAt: new Date().toISOString(),
            quantity: 1,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isNarrativelySignificant(document)).toBe(true);
    });
  });

  describe('generateItemUsageNarrative', () => {
    it('should generate narrative describing item effects', async () => {
      const item: InventoryItem = {
        id: 'item-5',
        name: 'Healing Potion',
        description: 'Restores health',
        quantity: 1,
        stackable: true,
        categoryId: 'consumables',
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisitionHistory: [
          {
            method: 'purchase',
            acquiredAt: new Date().toISOString(),
            quantity: 1,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const narrative = await generateItemUsageNarrative(
        item,
        characterId,
        worldId,
        sessionId,
        {
          wasConsumed: false,
          remainingQuantity: item.quantity,
          previousQuantity: item.quantity,
        }
      );

      expect(narrative.content).toBeTruthy();
      expect(typeof narrative.content).toBe('string');
      expect(narrative.content.length).toBeGreaterThan(0);
    });

    it('should handle AI generation failures gracefully', async () => {
      // Mock failure
      const { createDefaultGeminiClient } = await import(
        '@/lib/ai/defaultGeminiClient'
      );
      (createDefaultGeminiClient as jest.Mock).mockReturnValueOnce({
        generateContent: jest
          .fn()
          .mockRejectedValueOnce(new Error('AI service unavailable')),
      });

      const item: InventoryItem = {
        id: 'item-6',
        name: 'Magic Stone',
        description: 'Glows faintly',
        quantity: 1,
        stackable: false,
        categoryId: 'quest-items',
        categorization: {
          categoryId: 'quest-items',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisitionHistory: [
          {
            method: 'quest',
            acquiredAt: new Date().toISOString(),
            quantity: 1,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const narrative = await generateItemUsageNarrative(
        item,
        characterId,
        worldId,
        sessionId,
        {
          wasConsumed: true,
          remainingQuantity: 0,
          previousQuantity: 1,
        }
      );

      // Should return fallback narrative
      expect(narrative.content).toBeTruthy();
      expect(narrative.content).toContain(item.name);
    });
  });

  describe('processItemUsage', () => {
    it('should use item and generate narrative for significant items', async () => {
      // Add quest item
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Crystal Orb',
        description: 'A mystical sphere',
        stackable: false,
        categorization: {
          categoryId: 'quest-items',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'quest',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      const result = await processItemUsage({
        characterId,
        itemId,
        sessionId,
        worldId,
      });

      expect(result.success).toBe(true);
      expect(result.narrative).toBeTruthy();
      expect(typeof result.narrative).toBe('string');
      expect(result.segmentId).toBeTruthy();
      expect(result.previousQuantity).toBe(1);

      const segments = useNarrativeStore
        .getState()
        .getSessionSegments(sessionId);
      const segment = segments.find((seg) => seg.id === result.segmentId);
      expect(segment?.metadata.tags).toEqual(
        expect.arrayContaining(['item-usage'])
      );
    });

    it('should create journal entry for significant item usage', async () => {
      // Add equipment item
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Telescope',
        description: 'Views distant objects',
        stackable: false,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'reward',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      const result = await processItemUsage({
        characterId,
        itemId,
        sessionId,
        worldId,
      });
      expect(result.segmentId).toBeTruthy();
      expect(result.previousQuantity).toBe(1);

      // Verify journal entry was created
      const journalEntries = useJournalStore
        .getState()
        .getSessionEntries(sessionId);
      const usageEntry = journalEntries.find(
        (entry) =>
          entry.title.includes('Telescope') ||
          entry.content.includes('Telescope')
      );

      expect(usageEntry).toBeDefined();
    });

    it('should not create journal entry for insignificant items', async () => {
      // Add common consumable
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Water',
        description: 'Common drinking water',
        stackable: true,
        quantity: 5,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'purchase',
          acquiredAt: new Date().toISOString(),
          quantity: 5,
        },
      });

      const journalCountBefore = useJournalStore
        .getState()
        .getSessionEntries(sessionId).length;

      const result = await processItemUsage({
        characterId,
        itemId,
        sessionId,
        worldId,
      });

      const journalCountAfter = useJournalStore
        .getState()
        .getSessionEntries(sessionId).length;

      // Journal entry count should not increase for insignificant items
      expect(journalCountAfter).toBe(journalCountBefore);
      expect(result.segmentId).toBeTruthy();
      expect(result.narrative).toBeTruthy();
      expect(result.previousQuantity).toBe(5);
    });

    it('surfaces the non-retryable pause state after partial settlement', async () => {
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Cracked Compass',
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
      useNarrativeStore.getState().addDecision(sessionId, {
        prompt: 'Existing decision',
        options: [{ id: 'existing-1', text: 'Wait' }],
      });
      jest
        .spyOn(worldClockUpdates, 'applyWorldClockUpdates')
        .mockRejectedValueOnce(new Error('clock unavailable'));

      const result = await processItemUsage({
        characterId,
        itemId,
        sessionId,
        worldId,
      });

      expect(result.success).toBe(true);
      expect(useNarrativeStore.getState().generationError).toEqual(
        PARTIAL_RECONCILIATION_ERROR
      );
      expect(
        useNarrativeStore.getState().getSessionDecisions(sessionId)
      ).toEqual([
        expect.objectContaining({ prompt: 'Existing decision' }),
      ]);
    });
  });

  describe('buildUsageNarrative', () => {
    const mockItem: InventoryItem = {
      id: 'test-item',
      name: 'Health Potion',
      description: 'Restores vitality',
      categoryId: 'consumables',
      quantity: 5,
      stackable: true,
      acquisitionHistory: [],
      categorization: {
        categoryId: 'consumables',
        source: 'manual',
        classifiedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    describe('simple tone', () => {
      it('should generate narrative for consumed item with remaining quantity', () => {
        const result = buildUsageNarrative(
          mockItem,
          { wasConsumed: true, previousQuantity: 5, remainingQuantity: 4 },
          'simple'
        );

        expect(result).toContain('You use one of the Health Potion');
        expect(result).toContain('4 remaining');
      });

      it('should generate narrative for last consumed item', () => {
        const result = buildUsageNarrative(
          mockItem,
          { wasConsumed: true, previousQuantity: 1, remainingQuantity: 0 },
          'simple'
        );

        expect(result).toContain('You use the last of the Health Potion');
      });

      it('should generate narrative for non-consumed item', () => {
        const result = buildUsageNarrative(
          mockItem,
          { wasConsumed: false, previousQuantity: 3, remainingQuantity: 3 },
          'simple'
        );

        expect(result).toContain('You use the Health Potion');
        expect(result).toContain('Restores vitality');
      });

      it('should handle item without description', () => {
        const itemNoDesc = { ...mockItem, description: '' };
        const result = buildUsageNarrative(
          itemNoDesc,
          { wasConsumed: false, previousQuantity: 1 },
          'simple'
        );

        expect(result).toContain('You use the Health Potion.');
        expect(result).not.toContain('Restores vitality');
      });
    });

    describe('detailed tone', () => {
      it('should generate detailed narrative for consumed item with remaining quantity', () => {
        const result = buildUsageNarrative(
          mockItem,
          { wasConsumed: true, previousQuantity: 5, remainingQuantity: 4 },
          'detailed'
        );

        expect(result).toContain('You use one of the Health Potion');
        expect(result).toContain('4 remaining pieces to draw upon');
      });

      it('should generate detailed narrative for last consumed item', () => {
        const result = buildUsageNarrative(
          mockItem,
          { wasConsumed: true, previousQuantity: 1, remainingQuantity: 0 },
          'detailed'
        );

        expect(result).toContain('You use the Health Potion');
        expect(result).toContain('That was the last of this item');
      });

      it('should use singular form when one remains', () => {
        const result = buildUsageNarrative(
          mockItem,
          { wasConsumed: true, previousQuantity: 2, remainingQuantity: 1 },
          'detailed'
        );

        expect(result).toContain('1 remaining');
        expect(result).not.toContain('remaining pieces');
      });

      it('should use plural form when multiple remain', () => {
        const result = buildUsageNarrative(
          mockItem,
          { wasConsumed: true, previousQuantity: 5, remainingQuantity: 3 },
          'detailed'
        );

        expect(result).toContain('3 remaining pieces');
      });

      it('should generate narrative for non-consumed item', () => {
        const result = buildUsageNarrative(
          mockItem,
          { wasConsumed: false, previousQuantity: 3, remainingQuantity: 3 },
          'detailed'
        );

        expect(result).toContain('You use one of the Health Potion');
        expect(result).toContain('The item remains firmly in your grasp');
      });
    });

    describe('edge cases', () => {
      it('should handle missing previousQuantity by using item.quantity', () => {
        const result = buildUsageNarrative(
          mockItem,
          { wasConsumed: true },
          'simple'
        );

        expect(result).toBeTruthy();
        expect(result).toContain('Health Potion');
      });

      it('should calculate remainingQuantity when not provided', () => {
        const result = buildUsageNarrative(
          mockItem,
          { wasConsumed: true, previousQuantity: 3 },
          'detailed'
        );

        expect(result).toContain('2 remaining pieces');
      });

      it('should default to simple tone when not specified', () => {
        const result = buildUsageNarrative(mockItem, {
          wasConsumed: false,
          previousQuantity: 2,
        });

        // Simple tone doesn't include "firmly in your grasp"
        expect(result).not.toContain('firmly in your grasp');
        expect(result).toContain('You use the Health Potion');
      });
    });
  });
});
