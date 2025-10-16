// Test item usage service
// Verifies narrative generation and journal integration for item usage

import { processItemUsage, generateItemUsageNarrative, isNarrativelySignificant } from '../itemUsageService';
import { useInventoryStore } from '@/state/inventoryStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useJournalStore } from '@/state/journalStore';
import { useSessionStore } from '@/state/sessionStore';
import type { InventoryItem } from '@/types/inventory.types';

// Mock AI client
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  defaultGeminiClient: {
    generateContent: jest.fn().mockResolvedValue({
      content: 'The potion courses through your veins, restoring your vitality.',
      tokenUsage: 50,
    }),
  },
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
    useSessionStore.getState().reset();

    // Create test world
    worldId = useWorldStore.getState().create({
      name: 'Fantasy Realm',
      description: 'A magical world',
      genre: 'fantasy',
      attributes: [],
    });

    // Create test character
    characterId = useCharacterStore.getState().create({
      name: 'Aria the Brave',
      worldId,
      background: { summary: 'A courageous warrior' },
      attributes: [],
      skills: [],
    });

    // Create session
    sessionId = useSessionStore.getState().createSession(worldId, characterId);
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
        acquisitionHistory: [{
          method: 'quest',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        }],
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
        acquisitionHistory: [{
          method: 'reward',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        }],
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
        acquisitionHistory: [{
          method: 'purchase',
          acquiredAt: new Date().toISOString(),
          quantity: 5,
        }],
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
        acquisitionHistory: [{
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        }],
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
        acquisitionHistory: [{
          method: 'purchase',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const narrative = await generateItemUsageNarrative(item, characterId, worldId);

      expect(narrative).toBeTruthy();
      expect(typeof narrative).toBe('string');
      expect(narrative.length).toBeGreaterThan(0);
    });

    it('should handle AI generation failures gracefully', async () => {
      // Mock failure
      const { defaultGeminiClient } = await import('@/lib/ai/defaultGeminiClient');
      (defaultGeminiClient.generateContent as jest.Mock).mockRejectedValueOnce(
        new Error('AI service unavailable')
      );

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
        acquisitionHistory: [{
          method: 'quest',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const narrative = await generateItemUsageNarrative(item, characterId, worldId);

      // Should return fallback narrative
      expect(narrative).toBeTruthy();
      expect(narrative).toContain(item.name);
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

      const result = await processItemUsage(characterId, itemId, sessionId);

      expect(result.success).toBe(true);
      expect(result.narrative).toBeTruthy();
      expect(typeof result.narrative).toBe('string');
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

      await processItemUsage(characterId, itemId, sessionId);

      // Verify journal entry was created
      const journalEntries = useJournalStore.getState().getEntriesBySession(sessionId);
      const usageEntry = journalEntries.find(entry =>
        entry.title.includes('Telescope') || entry.content.includes('Telescope')
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

      const journalCountBefore = useJournalStore.getState().getEntriesBySession(sessionId).length;

      await processItemUsage(characterId, itemId, sessionId);

      const journalCountAfter = useJournalStore.getState().getEntriesBySession(sessionId).length;

      // Journal entry count should not increase for insignificant items
      expect(journalCountAfter).toBe(journalCountBefore);
    });
  });
});
