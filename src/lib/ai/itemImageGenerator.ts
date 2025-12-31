// src/lib/ai/itemImageGenerator.ts

import type { InventoryItem } from '@/types/inventory.types';
import { normalizeText, NORM_NAME, NORM_DESC } from '@/lib/utils/textNormalization';

/**
 * Generates optimized prompts for AI image generation of inventory items.
 *
 * Creates "product photography" style prompts with realistic constraints.
 * Uses simple, direct descriptions to avoid fantasy interpretation.
 */
export class ItemImageGenerator {
  /**
   * Build an image generation prompt for an inventory item.
   *
   * @param item - The inventory item to generate an image for
   * @returns Optimized prompt string for image generation
   */
  async buildItemPrompt(
    item: InventoryItem
  ): Promise<string> {
    const parts: string[] = [];

    // Normalize and clean item data
    const itemName = normalizeText(item.name, NORM_NAME);
    const itemDesc = item.description
      ? normalizeText(item.description, NORM_DESC)
      : '';

    // Build the prompt - simple and direct
    parts.push('Product photography');
    parts.push(itemName);

    // Use description only if it adds clarity
    if (itemDesc && itemDesc.length < 50) {
      parts.push(itemDesc);
    }

    // Realistic constraint to prevent fantasy interpretation
    parts.push('realistic style');
    parts.push('white background');
    parts.push('centered');
    parts.push('clear details');
    parts.push('professional lighting');

    return parts.join(', ');
  }

}
