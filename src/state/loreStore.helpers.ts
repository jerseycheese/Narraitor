import { normalizeText, NORM_NAME } from '../lib/utils/textNormalization';
import { safeTrim } from '@/lib/utils';
import { generateSafeKey } from '@/lib/utils/unicodeNormalization';

/**
 * Maximum number of events to extract per narrative segment
 * Prevents transcript-dump effect from overwhelming the lore store
 */
export const MAX_EVENTS_PER_EXTRACTION = 3;

/**
 * Helper function to generate normalized lore keys with Unicode support
 *
 * Handles international characters via NFD decomposition and diacritic removal:
 * - Western European: François → world-123:character_francois
 * - Non-Latin scripts: 村田さん → world-123:character_character_uuid-abc123
 *
 * @param worldId - World identifier
 * @param category - Lore category (character, location, event, rule)
 * @param name - Original name (preserves Unicode in fact.value)
 * @param maxLength - Optional maximum length for truncation
 * @returns Normalized lore key in format: {worldId}:{category}_{normalizedName}
 */
export function generateLoreKey(worldId: string, category: string, name: string, maxLength?: number): string {
  const safeKey = generateSafeKey(name, category);
  const truncatedKey = maxLength ? safeKey.substring(0, maxLength) : safeKey;
  return `${worldId}:${category}_${truncatedKey}`;
}

/**
 * Filters out generic/unnamed characters that shouldn't be stored as named entities
 *
 * Rejects:
 * - Unnamed placeholders (e.g., "Unnamed warrior", "Unknown person")
 * - Descriptive phrases (e.g., "Man with sword")
 * - Plural/group entities (e.g., "guards", "villagers")
 * - Sentence-like names (too many words)
 *
 * @param name - The character name to validate
 * @returns true if the name should be stored, false otherwise
 */
export function shouldStoreExtractedCharacterName(name: string): boolean {
  const canonicalName = safeTrim(name).replace(/\s+/g, ' ');
  if (!canonicalName) return false;

  const normalized = normalizeText(canonicalName, NORM_NAME).toLowerCase();
  if (!normalized) return false;

  // Explicitly reject unnamed placeholders and descriptive phrases.
  if (normalized.startsWith('unnamed ') || normalized.startsWith('unknown ')) return false;
  if (normalized.includes(' with ')) return false;

  // Reject obvious group/plural entities (usually not a stable, named character).
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const isPluralGroup =
    tokens.length <= 3 &&
    tokens.some((token) => token.endsWith('s')) &&
    !canonicalName.includes("'"); // allow possessives/aliases like "King's Guard"
  if (isPluralGroup) return false;

  // Avoid sentence-like "names".
  if (tokens.length > 6) return false;

  return true;
}

/**
 * Canonicalizes location names to prevent fragmentation
 *
 * Collapses micro-locations into their parent location:
 * - "X marketplace edge" → "X marketplace" (with "X marketplace edge" as alias)
 * - "X edge" → "X" (with "X edge" as alias)
 *
 * @param name - The location name to canonicalize
 * @returns Object with canonicalName and derivedAliases
 */
export function canonicalizeLocationName(name: string): {
  canonicalName: string;
  derivedAliases: string[];
} {
  const derivedAliases: string[] = [];
  let canonicalName = safeTrim(name).replace(/\s+/g, ' ');
  if (!canonicalName) {
    return { canonicalName: '', derivedAliases };
  }

  const original = canonicalName;

  // "The X" → "X" (e.g., "The sewers" → "sewers")
  const theMatch = canonicalName.match(/^The\s+(.+)$/i);
  if (theMatch?.[1]) {
    derivedAliases.push(original);
    canonicalName = safeTrim(theMatch[1]);
  }

  // "Under X" / "Beneath X" / "Inside X" / "Within X" → "X" (e.g., "Under Derry" → "Derry")
  const prepMatch = canonicalName.match(/^(Under|Beneath|Inside|Within)\s+(.+)$/i);
  if (prepMatch?.[2]) {
    derivedAliases.push(original);
    canonicalName = safeTrim(prepMatch[2]);
  }

  // "Sewers beneath X" / "Tunnels under X" → "X sewers/tunnels"
  const locTypeMatch = canonicalName.match(/^(Sewers|Tunnels|Caves|Catacombs)\s+(beneath|under|of)\s+(.+)$/i);
  if (locTypeMatch?.[1] && locTypeMatch?.[3]) {
    derivedAliases.push(original);
    canonicalName = `${safeTrim(locTypeMatch[3])} ${locTypeMatch[1].toLowerCase()}`;
  }

  // "X marketplace edge" → "X marketplace"
  const marketplaceEdgeMatch = canonicalName.match(/^(.*)\s+marketplace\s+edge$/i);
  if (marketplaceEdgeMatch?.[1]) {
    derivedAliases.push(original);
    canonicalName = `${safeTrim(marketplaceEdgeMatch[1])} marketplace`;
  }

  // "X edge" → "X"
  const edgeMatch = canonicalName.match(/^(.*)\s+edge$/i);
  if (edgeMatch?.[1]) {
    derivedAliases.push(original);
    canonicalName = safeTrim(edgeMatch[1]);
  }

  return { canonicalName, derivedAliases };
}

/**
 * Ranks importance levels for sorting
 */
export function importanceRank(importance?: string): number {
  if (importance === 'high') return 3;
  if (importance === 'medium') return 2;
  if (importance === 'low') return 1;
  return 0;
}
