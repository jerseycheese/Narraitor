// src/lib/services/__tests__/itemImageService.test.ts

import { itemImageService } from '../itemImageService';
import { useInventoryStore } from '@/state/inventoryStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import type { GeneratedImage } from '@/types/common.types';

// Mock fetch
global.fetch = jest.fn();

describe('ItemImageService', () => {
  const mockImage: GeneratedImage = {
    type: 'ai-generated',
    url: 'data:image/png;base64,mock-image-data',
    generatedAt: '2025-01-15T12:00:00Z',
    prompt: 'Test prompt',
  };

  beforeEach(() => {
    // Reset stores
    useInventoryStore.getState().reset();
    useCharacterStore.getState().reset();
    useWorldStore.getState().reset();

    // Clear service cache
    itemImageService.clearCache();

    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ image: mockImage }),
    });
  });

  describe('generateForItem', () => {
    test('generates image and updates store', async () => {
      // Setup stores
      const worldId = useWorldStore.getState().create({
        name: 'Test World',
        genre: 'fantasy',
        description: 'A test world',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20,
        },
      });

      const characterId = useCharacterStore.getState().create({
        name: 'Test Character',
        description: 'A test character',
        worldId: worldId,
        level: 1,
        isPlayer: true,
        status: {
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
        background: {
          physicalDescription: '',
          history: '',
          personality: '',
          goals: [],
          fears: [],
          relationships: [],
        },
        attributes: [],
        skills: [],
        derivedStats: [],
      });

      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Health Potion',
        description: 'Restores health',
        stackable: true,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: '2025-01-15T12:00:00Z',
        },
        acquisition: {
          acquiredAt: '2025-01-15T12:00:00Z',
          method: 'manual',
          quantity: 1,
        },
      });

      const result = await itemImageService.generateForItem(
        itemId,
        characterId
      );

      expect(result).toEqual(mockImage);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate-item-image',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Check that item was updated with image
      const updatedItem = useInventoryStore.getState().items[itemId];
      expect(updatedItem.image).toEqual(mockImage);
    });

    test('uses cache to prevent duplicate requests', async () => {
      const worldId = useWorldStore.getState().create({
        name: 'Test World',
        genre: 'fantasy',
        description: 'A test world',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20,
        },
      });

      const characterId = useCharacterStore.getState().create({
        name: 'Test Character',
        description: 'A test character',
        worldId: worldId,
        level: 1,
        isPlayer: true,
        status: {
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
        background: {
          physicalDescription: '',
          history: '',
          personality: '',
          goals: [],
          fears: [],
          relationships: [],
        },
        attributes: [],
        skills: [],
        derivedStats: [],
      });

      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Health Potion',
        description: 'Restores health',
        stackable: true,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: '2025-01-15T12:00:00Z',
        },
        acquisition: {
          acquiredAt: '2025-01-15T12:00:00Z',
          method: 'manual',
          quantity: 1,
        },
      });

      // Call twice
      const promise1 = itemImageService.generateForItem(itemId, characterId);
      const promise2 = itemImageService.generateForItem(itemId, characterId);

      await Promise.all([promise1, promise2]);

      // Should only call API once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('throws error when item not found', async () => {
      await expect(
        itemImageService.generateForItem('non-existent', 'char-1')
      ).rejects.toThrow('Item not found');
    });

    test('throws error when character not found', async () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Test Item',
        stackable: true,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: '2025-01-15T12:00:00Z',
        },
        acquisition: {
          acquiredAt: '2025-01-15T12:00:00Z',
          method: 'manual',
          quantity: 1,
        },
      });

      await expect(
        itemImageService.generateForItem(itemId, 'non-existent-char')
      ).rejects.toThrow('Character not found');
    });

    test('removes from cache on error', async () => {
      const worldId = useWorldStore.getState().create({
        name: 'Test World',
        genre: 'fantasy',
        description: 'A test world',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20,
        },
      });

      const characterId = useCharacterStore.getState().create({
        name: 'Test Character',
        description: 'A test character',
        worldId: worldId,
        level: 1,
        isPlayer: true,
        status: {
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
        background: {
          physicalDescription: '',
          history: '',
          personality: '',
          goals: [],
          fears: [],
          relationships: [],
        },
        attributes: [],
        skills: [],
        derivedStats: [],
      });

      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Health Potion',
        description: 'Restores health',
        stackable: true,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: '2025-01-15T12:00:00Z',
        },
        acquisition: {
          acquiredAt: '2025-01-15T12:00:00Z',
          method: 'manual',
          quantity: 1,
        },
      });

      // Mock API failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        itemImageService.generateForItem(itemId, characterId)
      ).rejects.toThrow();

      // Second call should try again (not use cached error)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ image: mockImage }),
      });

      await itemImageService.generateForItem(itemId, characterId);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('bootstrapItemImages', () => {
    test('generates images for all items without images in character inventory', async () => {
      const worldId = useWorldStore.getState().create({
        name: 'Test World',
        genre: 'fantasy',
        description: 'A test world',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20,
        },
      });

      const characterId = useCharacterStore.getState().create({
        name: 'Test Character',
        description: 'A test character',
        worldId: worldId,
        level: 1,
        isPlayer: true,
        status: {
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
        background: {
          physicalDescription: '',
          history: '',
          personality: '',
          goals: [],
          fears: [],
          relationships: [],
        },
        attributes: [],
        skills: [],
        derivedStats: [],
      });

      // Add 3 items without images
      useInventoryStore.getState().addItem(characterId, {
        name: 'Item 1',
        stackable: true,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: '2025-01-15T12:00:00Z',
        },
        acquisition: {
          acquiredAt: '2025-01-15T12:00:00Z',
          method: 'manual',
          quantity: 1,
        },
      });

      useInventoryStore.getState().addItem(characterId, {
        name: 'Item 2',
        stackable: true,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: '2025-01-15T12:00:00Z',
        },
        acquisition: {
          acquiredAt: '2025-01-15T12:00:00Z',
          method: 'manual',
          quantity: 1,
        },
      });

      await itemImageService.bootstrapItemImages(characterId);

      // Should have called API twice (with rate limiting delay between)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('skips items that already have images', async () => {
      const worldId = useWorldStore.getState().create({
        name: 'Test World',
        genre: 'fantasy',
        description: 'A test world',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20,
        },
      });

      const characterId = useCharacterStore.getState().create({
        name: 'Test Character',
        description: 'A test character',
        worldId: worldId,
        level: 1,
        isPlayer: true,
        status: {
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
        background: {
          physicalDescription: '',
          history: '',
          personality: '',
          goals: [],
          fears: [],
          relationships: [],
        },
        attributes: [],
        skills: [],
        derivedStats: [],
      });

      // Add item WITH image
      useInventoryStore.getState().addItem(characterId, {
        name: 'Item with image',
        stackable: true,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: '2025-01-15T12:00:00Z',
        },
        acquisition: {
          acquiredAt: '2025-01-15T12:00:00Z',
          method: 'manual',
          quantity: 1,
        },
        image: mockImage,
      });

      await itemImageService.bootstrapItemImages(characterId);

      // Should not call API since item already has image
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('continues on individual item failures', async () => {
      const worldId = useWorldStore.getState().create({
        name: 'Test World',
        genre: 'fantasy',
        description: 'A test world',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20,
        },
      });

      const characterId = useCharacterStore.getState().create({
        name: 'Test Character',
        description: 'A test character',
        worldId: worldId,
        level: 1,
        isPlayer: true,
        status: {
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
        background: {
          physicalDescription: '',
          history: '',
          personality: '',
          goals: [],
          fears: [],
          relationships: [],
        },
        attributes: [],
        skills: [],
        derivedStats: [],
      });

      // Add 2 items
      useInventoryStore.getState().addItem(characterId, {
        name: 'Item 1',
        stackable: true,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: '2025-01-15T12:00:00Z',
        },
        acquisition: {
          acquiredAt: '2025-01-15T12:00:00Z',
          method: 'manual',
          quantity: 1,
        },
      });

      useInventoryStore.getState().addItem(characterId, {
        name: 'Item 2',
        stackable: true,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: '2025-01-15T12:00:00Z',
        },
        acquisition: {
          acquiredAt: '2025-01-15T12:00:00Z',
          method: 'manual',
          quantity: 1,
        },
      });

      // First call fails, second succeeds
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ image: mockImage }),
        });

      await itemImageService.bootstrapItemImages(characterId);

      // Should have attempted both items
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
