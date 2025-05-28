/**
 * Simple helper to include lore context in AI prompts
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
  
  return `\nEstablished World Facts:\n${context.facts.join('\n')}\n`;
}

/**
 * Extract facts from AI-generated narrative
 */
export function extractFactsFromNarrative(
  narrative: string, 
  worldId: EntityID, 
  sessionId?: EntityID
): void {
  const { extractFactsFromText } = useLoreStore.getState();
  extractFactsFromText(narrative, worldId, sessionId);
}