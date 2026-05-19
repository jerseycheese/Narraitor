import type { InventoryItem } from '@/types/inventory.types';
import { normalizeText, NORM_NAME, NORM_DESC } from '@/lib/utils/textNormalization';

/**
 * Build a "product photography" prompt for AI image generation of an inventory item.
 * Uses simple, direct descriptions to avoid fantasy interpretation.
 */
export function buildItemPrompt(item: InventoryItem): string {
  const itemName = normalizeText(item.name, NORM_NAME);
  const itemDesc = item.description
    ? normalizeText(item.description, NORM_DESC)
    : '';

  const parts: string[] = ['Product photography', itemName];

  if (itemDesc && itemDesc.length < 50) {
    parts.push(itemDesc);
  }

  parts.push('realistic style', 'white background', 'centered', 'clear details', 'professional lighting');

  return parts.join(', ');
}
