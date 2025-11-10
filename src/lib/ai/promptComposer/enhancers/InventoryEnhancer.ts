/**
 * InventoryEnhancer
 *
 * Enhances prompts with character inventory context
 * Includes narratively significant items to help AI reference them naturally
 */

import { PromptEnhancer } from '../types';
import { NarrativeGenerationContext } from '../../narrativeGenerationContext';
import { buildInventoryContext } from '@/lib/promptContext/inventoryContextBuilder';

export class InventoryEnhancer implements PromptEnhancer {
  readonly name = 'InventoryEnhancer';

  enhance(prompt: string, context: NarrativeGenerationContext): string {
    try {
      if (!context.inventoryItems || context.inventoryItems.length === 0) {
        return prompt;
      }

      const { context: inventorySection } = buildInventoryContext(
        context.inventoryItems,
        { equippedItemIds: context.equippedItemIds }
      );

      if (!inventorySection) {
        return prompt;
      }

      const guidance =
        'When generating narrative, naturally reference these items only if they matter to the current situation. Avoid forced mentions or repetitive callbacks.';

      return `${prompt}\n\n${inventorySection}\n\n${guidance}`;
    } catch {
      return prompt;
    }
  }
}
