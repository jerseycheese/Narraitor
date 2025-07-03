/**
 * Enhanced AI Consistency Instructions Generator (Issue #184)
 * 
 * Generates enhanced consistency instructions for AI narrative generation
 * to ensure adherence to established lore and world rules.
 */

import { ConsistencyLoreContext } from '../../types/lore.types';

/**
 * Generates enhanced consistency instructions for AI narrative generation
 * @param loreContext Enhanced lore context with structured and prioritized information
 * @returns Formatted consistency instructions for AI consumption
 */
export function enhanceConsistencyInstructions(loreContext: ConsistencyLoreContext): string {
  if (!loreContext || typeof loreContext !== 'object') {
    return 'Maintain consistency with any established narrative elements and avoid contradictions.';
  }

  const instructions: string[] = [];
  
  // Header for consistency requirements
  instructions.push('NARRATIVE CONSISTENCY REQUIREMENTS:');
  instructions.push('You must maintain strict consistency with the following established lore:');
  instructions.push('');

  // Process characters by importance
  const sortedCharacters = (loreContext.characters || [])
    .sort((a, b) => getImportanceScore(b.importance) - getImportanceScore(a.importance));

  if (sortedCharacters.length > 0) {
    instructions.push('CHARACTER CONSISTENCY:');
    sortedCharacters.forEach(character => {
      if (character.name && character.traits) {
        const traitsText = Array.isArray(character.traits) ? character.traits.join(', ') : character.traits;
        instructions.push(`- ${character.name}: Always portray as ${traitsText}${character.background ? ` (${character.background})` : ''}`);
      }
    });
    instructions.push('');
  }

  // Process locations by importance
  const sortedLocations = (loreContext.locations || [])
    .sort((a, b) => getImportanceScore(b.importance) - getImportanceScore(a.importance));

  if (sortedLocations.length > 0) {
    instructions.push('LOCATION CONSISTENCY:');
    sortedLocations.forEach(location => {
      if (location.name && location.description) {
        instructions.push(`- ${location.name}: Must always be described as ${location.description}`);
      }
    });
    instructions.push('');
  }

  // Process world rules by importance
  const sortedWorldRules = (loreContext.worldRules || [])
    .sort((a, b) => getImportanceScore(b.importance) - getImportanceScore(a.importance));

  if (sortedWorldRules.length > 0) {
    instructions.push('WORLD RULES - NEVER CONTRADICT:');
    sortedWorldRules.forEach(rule => {
      if (rule.rule) {
        instructions.push(`- ${rule.rule}${rule.description ? ` (${rule.description})` : ''}`);
      }
    });
    instructions.push('');
  }

  // Process historical events by importance
  const sortedEvents = (loreContext.historicalEvents || [])
    .sort((a, b) => getImportanceScore(b.importance) - getImportanceScore(a.importance));

  if (sortedEvents.length > 0) {
    instructions.push('HISTORICAL EVENTS - MAINTAIN TIMELINE:');
    sortedEvents.forEach(event => {
      if (event.event && event.description) {
        instructions.push(`- ${event.event}: ${event.description}`);
      }
    });
    instructions.push('');
  }

  // Final consistency reminder
  instructions.push('CRITICAL: Never contradict the above established lore. If unsure, maintain existing narrative consistency over introducing new elements.');

  return instructions.join('\n').trim();
}

/**
 * Converts importance level to numeric score for sorting
 */
function getImportanceScore(importance: string | undefined): number {
  switch (importance) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}