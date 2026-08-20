/**
 * Lore Context Builder
 * 
 * Builds structured lore context with formatting and importance ranking
 * for AI consistency instruction generation.
 */

import { LoreFact, ConsistencyLoreContext } from '../../types/lore.types';
import { safeTrim } from '../utils';

/**
 * Builds structured lore context from raw lore facts
 * @param loreFacts Array of raw lore facts from the lore store
 * @returns Structured and prioritized lore context for consistency instructions
 */
export function buildLoreContext(loreFacts: LoreFact[]): ConsistencyLoreContext {
  if (!Array.isArray(loreFacts)) {
    return createEmptyContext();
  }

  const context: ConsistencyLoreContext = {
    characters: [],
    locations: [],
    worldRules: [],
    historicalEvents: []
  };

  for (const fact of loreFacts) {
    if (!fact || !fact.value || typeof fact.value !== 'string') {
      continue; // Skip invalid facts
    }

    try {
      switch (fact.category) {
        case 'characters':
          const character = parseCharacterFact(fact);
          if (character) context.characters.push(character);
          break;

        case 'locations':
          const location = parseLocationFact(fact);
          if (location) context.locations.push(location);
          break;

        case 'rules':
          const worldRule = parseWorldRuleFact(fact);
          if (worldRule) context.worldRules.push(worldRule);
          break;

        case 'events':
          const historicalEvent = parseHistoricalEventFact(fact);
          if (historicalEvent) context.historicalEvents.push(historicalEvent);
          break;

        default:
          // Ignore unknown categories
          break;
      }
    } catch {
      // Skip malformed facts
      continue;
    }
  }

  return context;
}

/**
 * Creates an empty lore context
 */
function createEmptyContext(): ConsistencyLoreContext {
  return {
    characters: [],
    locations: [],
    worldRules: [],
    historicalEvents: []
  };
}

/**
 * Parses character fact into enhanced character format
 */
function parseCharacterFact(fact: LoreFact): ConsistencyLoreContext['characters'][0] | null {
  const value = safeTrim(fact.value);
  if (!value) return null;

  // Extract name (usually before first dash or colon)
  const nameMatch = value.match(/^([^-:]+?)(?:\s*[-:]\s*(.+))?$/);
  if (!nameMatch) return null;

  const name = safeTrim(nameMatch[1]);
  const description = safeTrim(nameMatch[2] || '') || value;

  const traits = extractTraitsFromDescription(description);
  
  const background = extractBackgroundFromDescription(description);

  // Determine importance based on source and content
  const importance = determineImportance(fact, description);

  return {
    name,
    traits,
    background,
    importance
  };
}

function parseLocationFact(fact: LoreFact): ConsistencyLoreContext['locations'][0] | null {
  const value = safeTrim(fact.value);
  if (!value) return null;

  // Extract name and description
  const nameMatch = value.match(/^([^-:]+?)(?:\s*[-:]\s*(.+))?$/);
  if (!nameMatch) return null;

  const name = safeTrim(nameMatch[1]);
  const description = safeTrim(nameMatch[2] || '') || value;

  const type = extractLocationTypeFromDescription(description);

  const importance = determineImportance(fact, description);

  return {
    name,
    type,
    description,
    importance
  };
}

function parseWorldRuleFact(fact: LoreFact): ConsistencyLoreContext['worldRules'][0] | null {
  const value = safeTrim(fact.value);
  if (!value) return null;

  // Extract rule and description
  const ruleMatch = value.match(/^([^-:]+?)(?:\s*[-:]\s*(.+))?$/);
  const rule = ruleMatch ? safeTrim(ruleMatch[1]) : value;
  const description = safeTrim(ruleMatch?.[2] || '') || rule;

  // Determine importance (rules from manual source are typically high importance)
  const importance = determineImportance(fact, value);

  return {
    rule,
    description,
    importance
  };
}

function parseHistoricalEventFact(fact: LoreFact): ConsistencyLoreContext['historicalEvents'][0] | null {
  const value = safeTrim(fact.value);
  if (!value) return null;

  // Extract event name and description
  const eventMatch = value.match(/^([^-:]+?)(?:\s*[-:]\s*(.+))?$/);
  if (!eventMatch) return null;

  const event = safeTrim(eventMatch[1]);
  const description = safeTrim(eventMatch[2] || '') || value;

  const importance = determineImportance(fact, description);

  return {
    event,
    description,
    importance
  };
}

function extractTraitsFromDescription(description: string): string[] {
  const traits: string[] = [];
  
  // Common trait keywords
  const traitKeywords = [
    'wise', 'brave', 'noble', 'cruel', 'kind', 'fierce', 'gentle', 'mysterious',
    'powerful', 'weak', 'strong', 'intelligent', 'cunning', 'honest', 'dishonest',
    'loyal', 'treacherous', 'patient', 'impatient', 'calm', 'aggressive',
    'peaceful', 'violent', 'magical', 'skilled', 'experienced', 'young', 'old',
    'ancient', 'determined', 'reluctant', 'helpful', 'selfish', 'generous',
    'greedy', 'humble', 'arrogant', 'confident', 'insecure', 'charismatic',
    'withdrawn', 'social', 'antisocial', 'emotional', 'logical', 'creative',
    'analytical', 'artistic', 'scholarly', 'warrior', 'healer', 'leader',
    'follower', 'independent', 'dependent', 'trustworthy', 'untrustworthy'
  ];

  const lowerDescription = description.toLowerCase();
  traitKeywords.forEach(keyword => {
    if (lowerDescription.includes(keyword)) {
      traits.push(keyword);
    }
  });

  return traits.length > 0 ? traits : ['undefined'];
}

function extractBackgroundFromDescription(description: string): string {
  // Remove common prefixes and return cleaned description
  const result = description
    .replace(/^[^-:]*[-:]\s*/, '') // Remove name prefix
    .replace(/^(a|an|the)\s+/i, ''); // Remove articles
  
  return safeTrim(result);
}

function extractLocationTypeFromDescription(description: string): string {
  const lowerDescription = description.toLowerCase();
  
  // Common location types
  const locationTypes = [
    'city', 'town', 'village', 'castle', 'fortress', 'tower', 'dungeon',
    'forest', 'mountain', 'river', 'lake', 'ocean', 'desert', 'plains',
    'valley', 'cave', 'temple', 'shrine', 'library', 'tavern', 'inn',
    'market', 'shop', 'house', 'palace', 'cottage', 'farm', 'mine',
    'bridge', 'road', 'path', 'gate', 'wall', 'harbor', 'port',
    'island', 'continent', 'realm', 'kingdom', 'empire', 'province',
    'region', 'territory', 'land', 'world', 'dimension', 'plane'
  ];

  for (const type of locationTypes) {
    if (lowerDescription.includes(type)) {
      return type;
    }
  }

  return 'location'; // Default type
}

/**
 * Determines importance level based on fact source and content
 */
function determineImportance(fact: LoreFact, content: string): 'high' | 'medium' | 'low' {
  // Manual sources are typically high importance
  if (fact.source === 'manual') {
    return 'high';
  }

  // Check for importance keywords in content
  const lowerContent = content.toLowerCase();
  const highImportanceKeywords = [
    'main', 'hero', 'villain', 'protagonist', 'antagonist', 'king', 'queen',
    'emperor', 'empress', 'lord', 'lady', 'prince', 'princess', 'chosen',
    'destiny', 'fate', 'prophecy', 'ancient', 'legendary', 'mythical',
    'powerful', 'dangerous', 'critical', 'important', 'essential', 'vital',
    'forbidden', 'sacred', 'holy', 'divine', 'cursed', 'evil', 'dark lord',
    'capital', 'throne', 'crown', 'royal', 'imperial', 'supreme'
  ];

  const lowImportanceKeywords = [
    'minor', 'small', 'little', 'simple', 'basic', 'common', 'ordinary',
    'regular', 'normal', 'typical', 'standard', 'average', 'random',
    'background', 'guard', 'soldier', 'peasant', 'merchant', 'trader'
  ];

  // Check for high importance keywords
  for (const keyword of highImportanceKeywords) {
    if (lowerContent.includes(keyword)) {
      return 'high';
    }
  }

  // Check for low importance keywords
  for (const keyword of lowImportanceKeywords) {
    if (lowerContent.includes(keyword)) {
      return 'low';
    }
  }

  // Default to medium importance for narrative source
  return 'medium';
}