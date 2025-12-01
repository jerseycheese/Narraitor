// src/lib/services/itemImageService.ts

import type { GeneratedImage } from '@/types/common.types';
import { useInventoryStore } from '@/state/inventoryStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ItemImageService');

/**
 * Delay helper for rate limiting
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Service for generating AI images for inventory items.
 *
 * Features:
 * - In-memory caching to prevent duplicate requests
 * - Rate limiting (1.5s delay between requests)
 * - Automatic store updates
 * - Error handling with cache cleanup
 */
class ItemImageService {
  private cache: Map<string, Promise<GeneratedImage>> = new Map();
  private readonly RATE_LIMIT_DELAY_MS = 1500;

  /**
   * Generate an AI image for an inventory item.
   *
   * @param itemId - The item ID
   * @param characterId - The character who owns the item (for world context)
   * @returns Promise that resolves to the GeneratedImage object
   */
  async generateForItem(
    itemId: string,
    characterId: string
  ): Promise<GeneratedImage> {
    // Check cache first
    const cached = this.cache.get(itemId);
    if (cached) {
      logger.debug('generateForItem', `Using cached image for item: ${itemId}`);
      return cached;
    }

    // Get item from store
    const inventoryStore = useInventoryStore.getState();
    const item = inventoryStore.items[itemId];

    if (!item) {
      const error = new Error(`Item not found: ${itemId}`);
      logger.error('generateForItem', 'Item not found', { itemId });
      throw error;
    }

    // Get character for world context
    const characterStore = useCharacterStore.getState();
    const character = characterStore.characters[characterId];

    if (!character) {
      const error = new Error(`Character not found: ${characterId}`);
      logger.error('generateForItem', 'Character not found', { characterId });
      throw error;
    }

    // Get world for genre
    const worldStore = useWorldStore.getState();
    const world = worldStore.worlds[character.worldId];
    const genre = world?.genre;

    // Set generating status and clear any stale errors
    inventoryStore.setGeneratingImage(itemId, true);
    inventoryStore.setImageGenerationError(itemId, null);

    // Create promise and cache it immediately to prevent duplicate requests
    const imagePromise = this._generateImageInternal(item, genre);
    this.cache.set(itemId, imagePromise);

    try {
      const generatedImage = await imagePromise;

      // Update item with generated image
      inventoryStore.updateItem(itemId, { image: generatedImage });

      // Clear generation status
      inventoryStore.setGeneratingImage(itemId, false);
      inventoryStore.setImageGenerationError(itemId, null);


      return generatedImage;
    } catch (error) {
      // Remove from cache on error so it can be retried
      this.cache.delete(itemId);

      // Update error status
      inventoryStore.setGeneratingImage(itemId, false);
      inventoryStore.setImageGenerationError(
        itemId,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  }

  /**
   * Internal method to generate image by calling the API.
   */
  private async _generateImageInternal(
    item: { name: string; description?: string; categoryId: string },
    genre?: string
  ): Promise<GeneratedImage> {
    const payload = {
      item,
      genre,
    };


    const response = await fetch('/api/generate-item-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
   * Bootstrap image generation for all items in a character's inventory that don't have images.
   *
   * @param characterId - The character ID
   */
  async bootstrapItemImages(characterId: string): Promise<void> {
    const characterStore = useCharacterStore.getState();
    const character = characterStore.characters[characterId];

    if (!character) {
      logger.warn('bootstrapItemImages', `Character not found: ${characterId}`);
      return;
    }

    const inventoryStore = useInventoryStore.getState();
    const characterItems = inventoryStore.getCharacterItems(characterId);
    // Include items without images OR with placeholder images (for upgrade path)
    const itemsNeedingImages = characterItems.filter(
      (item) => !item.image || item.image.type === 'placeholder'
    );

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
      {
        characterId,
        itemCount: itemsNeedingImages.length,
      }
    );

    // Set generating status for all items
    itemsNeedingImages.forEach((item) => {
      inventoryStore.setGeneratingImage(item.id, true);
    });

    // Generate images with rate limiting
    for (let i = 0; i < itemsNeedingImages.length; i++) {
      const item = itemsNeedingImages[i];

      try {
        await this.generateForItem(item.id, characterId);

        // Add delay between requests (except after last one)
        if (i < itemsNeedingImages.length - 1) {
          await delay(this.RATE_LIMIT_DELAY_MS);
        }
      } catch (error) {
        logger.warn(
          'bootstrapItemImages',
          `Failed to generate image for item: ${item.name}`,
          {
            itemId: item.id,
            error,
          }
        );
        // Continue with next item even if this one fails
      }
    }

    logger.info('bootstrapItemImages', 'Bootstrap complete', { characterId });
  }

  /**
   * Clear the in-memory cache (useful for testing).
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const itemImageService = new ItemImageService();
