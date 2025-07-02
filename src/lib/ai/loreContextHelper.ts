/**
 * Helper to include lore context in AI prompts
 */

import { useLoreStore } from '@/state/loreStore';
import { formatLoreForConsistency } from './narrativeConsistencyValidator';
import type { EntityID } from '@/types';

/**
 * Get lore context string for AI prompt inclusion
 */
export function getLoreContextForPrompt(worldId: EntityID): string {
  const { getLoreContext, getFacts } = useLoreStore.getState();
  const facts = getFacts({ worldId });
  
  if (facts.length === 0) {
    return '';
  }
  
  // Use enhanced formatting for consistency
  const loreContext = formatLoreForConsistency(worldId);
  
  if (loreContext.formattedContext) {
    // Add consistency instructions
    const consistencyInstructions = generateConsistencyInstructions(facts);
    return loreContext.formattedContext + consistencyInstructions;
  }
  
  // Fallback to basic context
  const context = getLoreContext(worldId);
  return `\nEstablished World Facts:\n${context.facts.join('\n')}\n`;
}

/**
 * Generate consistency instructions based on lore categories
 */
function generateConsistencyInstructions(facts: Array<{ category: string; value: string; metadata?: { description?: string } }>): string {
  const categories = new Set(facts.map(f => f.category));
  const instructions: string[] = ['\nCONSISTENCY REQUIREMENTS:'];
  
  if (categories.has('characters')) {
    instructions.push('- Always refer to established characters by their correct names');
  }
  
  if (categories.has('locations')) {
    instructions.push('- Maintain consistent descriptions of locations');
  }
  
  if (categories.has('rules')) {
    instructions.push('- Respect established world rules and magical systems');
  }
  
  if (categories.has('events')) {
    instructions.push('- Build upon previously established events');
  }
  
  instructions.push('- Maintain consistency with previously established facts');
  instructions.push('- Do not contradict the established lore');
  
  return instructions.join('\n') + '\n';
}

