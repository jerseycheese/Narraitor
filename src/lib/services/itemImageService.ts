// src/lib/services/itemImageService.ts

import type { GeneratedImage } from '@/types/common.types';
import { useInventoryStore } from '@/state/inventoryStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import Logger from '@/lib/utils/logger';
import { ImageRequestCoordinator } from './imageRequestCoordinator';
import { aiFetch } from '@/lib/ai/aiFetch';

const logger = new Logger('ItemImageService');

/**
 * Service for generating AI images for inventory items.
 *
 * Features:
 * - In-memory caching to prevent duplicate requests
 * - Rate limiting between batched requests
 * - Inventory-store lifecycle updates (generating flag, error, image)
 */
class ItemImageService {
  private readonly coordinator = new ImageRequestCoordinator<GeneratedImage>();

  async generateForItem(
    itemId: string,
    characterId: string
  ): Promise<GeneratedImage> {
    const inventoryStore = useInventoryStore.getState();
    const item = inventoryStore.items[itemId];

    if (!item) {
      logger.error('generateForItem', 'Item not found', { itemId });
      throw new Error(`Item not found: ${itemId}`);
    }

    const character = useCharacterStore.getState().characters[characterId];
    if (!character) {
      logger.error('generateForItem', 'Character not found', { characterId });
      throw new Error(`Character not found: ${characterId}`);
    }

    const genre = useWorldStore.getState().worlds[character.worldId]?.genre;

    inventoryStore.setGeneratingImage(itemId, true);
    inventoryStore.setImageGenerationError(itemId, null);

    try {
      const generatedImage = await this.coordinator.run(itemId, () =>
        this._fetchImage(item, genre)
      );

      inventoryStore.updateItem(itemId, { image: generatedImage });
      inventoryStore.setGeneratingImage(itemId, false);
      inventoryStore.setImageGenerationError(itemId, null);

      return generatedImage;
    } catch (error) {
      inventoryStore.setGeneratingImage(itemId, false);
      inventoryStore.setImageGenerationError(
        itemId,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private async _fetchImage(
    item: { name: string; description?: string; categoryId: string },
    genre?: string
  ): Promise<GeneratedImage> {
    const response = await aiFetch('/api/generate-item-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, genre }),
    });

    if (!response.ok) {
      throw new Error(
        `Image generation failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const generatedImage = data.image;

    if (!generatedImage) {
      throw new Error('Image not found in response');
    }

    return generatedImage;
  }

  /**
   * Bootstrap image generation for every item in a character's inventory that
   * lacks an AI-generated image.
   */
  async bootstrapItemImages(characterId: string): Promise<void> {
    const character = useCharacterStore.getState().characters[characterId];
    if (!character) {
      logger.warn('bootstrapItemImages', `Character not found: ${characterId}`);
      return;
    }

    const inventoryStore = useInventoryStore.getState();
    const itemsNeedingImages = inventoryStore
      .getCharacterItems(characterId)
      .filter((item) => !item.image || item.image.type === 'placeholder');

    if (itemsNeedingImages.length === 0) {
      logger.debug(
        'bootstrapItemImages',
        `No items need images for character: ${characterId}`
      );
      return;
    }

    logger.info(
      'bootstrapItemImages',
      `Generating images for ${itemsNeedingImages.length} items`,
      { characterId, itemCount: itemsNeedingImages.length }
    );

    itemsNeedingImages.forEach((item) => {
      inventoryStore.setGeneratingImage(item.id, true);
    });

    await this.coordinator.runBatch(itemsNeedingImages, async (item) => {
      try {
        await this.generateForItem(item.id, characterId);
      } catch (error) {
        logger.warn(
          'bootstrapItemImages',
          `Failed to generate image for item: ${item.name}`,
          { itemId: item.id, error }
        );
        throw error;
      }
    });

    logger.info('bootstrapItemImages', 'Bootstrap complete', { characterId });
  }

  /** Clear the in-memory cache (useful for testing). */
  clearCache(): void {
    this.coordinator.clearCache();
  }
}

export const itemImageService = new ItemImageService();
