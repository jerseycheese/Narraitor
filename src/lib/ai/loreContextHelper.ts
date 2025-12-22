/**
 * Helper to include lore context in AI prompts
 */

import { useLoreStore } from '@/state/loreStore';
import type { EntityID } from '@/types';

/**
 * Get lore context string for AI prompt inclusion
 */
export function getLoreContextForPrompt(worldId: EntityID): string {
  const { getLoreContext } = useLoreStore.getState();
  const context = getLoreContext(worldId);

  if (context.factCount === 0) {
    return '';
  }

  // Log the lore context order for debugging
  console.log('[LoreContext] Facts sent to AI (in importance order):', {
    count: context.factCount,
    facts: context.facts
  });

  return `\nEstablished World Facts:\n${context.facts.join('\n')}\n`;
}

