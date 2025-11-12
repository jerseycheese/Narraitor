// src/lib/ai/itemImageGenerator.ts

import type { InventoryItem, StandardInventoryCategory } from '@/types/inventory.types';
import { normalizeText, NORM_NAME, NORM_DESC } from '@/lib/utils/textNormalization';
import { safeTrim } from '@/lib/utils';

/**
 * Generates optimized prompts for AI image generation of inventory items.
 *
 * Creates "product photography" style prompts that work well with image generation models.
 * Includes genre context for style consistency and category-specific visual cues.
 */
export class ItemImageGenerator {
  /**
   * Build an image generation prompt for an inventory item.
   *
   * @param item - The inventory item to generate an image for
   * @param genre - Optional world genre for style consistency (e.g., 'fantasy', 'sci-fi')
   * @returns Optimized prompt string for image generation
   */
  async buildItemPrompt(
    item: InventoryItem,
    genre?: string
  ): Promise<string> {
    const parts: string[] = [];

    // Normalize and clean item data
    const itemName = normalizeText(item.name, NORM_NAME);
    const itemDesc = item.description
      ? normalizeText(item.description, NORM_DESC)
      : '';

    // Get category-specific styling hints
    const categoryStyle = this.getCategoryStyle(item.categoryId);

    // Build the prompt in product photography style
    parts.push('Product photography of');
    parts.push(itemName);

    if (itemDesc) {
      parts.push(`(${itemDesc})`);
    }

    // Add genre styling if provided
    if (genre) {
      const normalizedGenre = safeTrim(genre.toLowerCase());
      parts.push(`${normalizedGenre} style`);
    }

    // Add category context for visual consistency
    if (categoryStyle) {
      parts.push(categoryStyle);
    }

    // Standard photography directives for clean results
    parts.push('clear background');
    parts.push('detailed view');
    parts.push('high quality');
    parts.push('centered composition');

    return parts.join(', ');
  }

  /**
   * Get category-specific style hints for visual consistency.
   *
   * @param categoryId - The standard inventory category
   * @returns Style description string
   */
  getCategoryStyle(categoryId: StandardInventoryCategory): string {
    const categoryStyles: Record<StandardInventoryCategory, string> = {
      'consumables': 'potion bottle or vial aesthetic',
      'equipment': 'tool or weapon presentation',
      'valuables': 'treasure or precious gem style',
      'documents': 'scroll or parchment appearance',
      'personal': 'clothing or personal accessory style',
      'quest-items': 'special unique artifact aesthetic',
      'miscellaneous': 'general item presentation',
    };

    return categoryStyles[categoryId] || 'general item presentation';
  }
}
