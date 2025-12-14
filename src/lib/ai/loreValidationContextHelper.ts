import type { EntityID } from '@/types/common.types';
import type { LoreValidationContext } from '@/types/lore.types';
import { useLoreStore } from '@/state/loreStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { estimateTokenCount } from '@/lib/promptContext/tokenUtils';

/**
 * Maximum tokens allocated for lore context in validation requests
 */
const MAX_LORE_CONTEXT_TOKENS = 500;

/**
 * Maximum number of lore facts to consider
 */
const MAX_RECENT_FACTS = 50;

/**
 * Assembles lore validation context from stores
 *
 * Gathers relevant lore facts, character data, world rules, and historical events,
 * filtered by importance and recency with token budget management.
 *
 * @param worldId - World to gather lore for
 * @param characterIds - Characters involved in the narrative
 * @returns Complete lore validation context
 */
export async function assembleLoreValidationContext(
  worldId: EntityID,
  characterIds: EntityID[]
): Promise<LoreValidationContext> {
  const loreStore = useLoreStore.getState();
  const characterStore = useCharacterStore.getState();
  const worldStore = useWorldStore.getState();

  // Get all lore facts for this world
  const allFacts = loreStore.getFacts({ worldId });

  // Filter to recent and important facts
  const recentFacts = allFacts.slice(0, MAX_RECENT_FACTS);
  const importantFacts = recentFacts.filter(
    f => f.metadata?.importance === 'high' || f.metadata?.importance === 'medium'
  );

  // Use important facts if we have them, otherwise use all recent
  const factsToUse = importantFacts.length > 0 ? importantFacts : recentFacts;

  // Extract character data for mentioned characters
  const characters = characterIds
    .map(id => {
      const char = characterStore.characters[id];
      if (!char) return null;

      return {
        id: char.id,
        name: char.name,
        background: char.background.history || '',
        personality: char.background.personality || '',
        physicalDescription: char.background.physicalDescription,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  // Extract world rules from lore facts
  const worldRules = factsToUse
    .filter(f => f.category === 'rules')
    .map(f => ({
      rule: f.key.split(':').pop() || f.key,
      description: f.value,
      importance: (f.metadata?.importance || 'medium') as 'low' | 'medium' | 'high',
    }));

  // Extract locations from lore facts
  const locations = factsToUse
    .filter(f => f.category === 'locations')
    .map(f => ({
      name: f.value,
      type: f.metadata?.type || 'unknown',
      description: f.metadata?.description || '',
    }));

  // Get historical events from world state
  const worldState = worldStore.worldStates?.[worldId];
  const historicalEvents = worldState?.majorEvents
    ? worldState.majorEvents.map(e => ({
        description: e.description,
        timestamp: e.timestamp,
        characterIds: [e.characterId],
      }))
    : [];

  // Build context
  let context: LoreValidationContext = {
    characters,
    worldRules,
    historicalEvents,
    locations,
  };

  // Apply token budget management
  context = applyTokenBudget(context, MAX_LORE_CONTEXT_TOKENS);

  return context;
}

/**
 * Apply token budget limits to context by truncating if necessary
 */
function applyTokenBudget(
  context: LoreValidationContext,
  maxTokens: number
): LoreValidationContext {
  // Estimate current token count
  const contextString = JSON.stringify(context);
  const estimatedTokens = estimateTokenCount(contextString);

  // If under budget, return as-is
  if (estimatedTokens <= maxTokens) {
    return context;
  }

  // Need to truncate - prioritize by importance
  // Keep all characters (usually small)
  // Reduce rules, events, and locations proportionally

  const targetReduction = estimatedTokens - maxTokens;
  const rulesTokens = estimateTokenCount(JSON.stringify(context.worldRules));
  const eventsTokens = estimateTokenCount(JSON.stringify(context.historicalEvents));
  const locationsTokens = estimateTokenCount(JSON.stringify(context.locations));

  const totalReducible = rulesTokens + eventsTokens + locationsTokens;

  if (totalReducible === 0) {
    return context;
  }

  // Calculate reduction ratio
  const reductionRatio = Math.max(0, (totalReducible - targetReduction) / totalReducible);

  return {
    characters: context.characters, // Keep all characters
    worldRules: context.worldRules.slice(0, Math.ceil(context.worldRules.length * reductionRatio)),
    historicalEvents: context.historicalEvents.slice(0, Math.ceil(context.historicalEvents.length * reductionRatio)),
    locations: context.locations.slice(0, Math.ceil(context.locations.length * reductionRatio)),
  };
}

/**
 * Get recent narrative context for validation
 * Returns last 2-3 segments as context string
 */
export function getRecentNarrativeContext(
  _sessionId: EntityID,
  _maxSegments: number = 3
): string | undefined {
  // This would integrate with narrativeStore
  // For now, return undefined - can be enhanced later
  return undefined;
}
