import { normalizeText, NORM_NAME } from '../lib/utils/textNormalization';
import { safeTrim } from '@/lib/utils';
import { generateSafeKey } from '@/lib/utils/unicodeNormalization';

/**
 * Maximum number of events to extract per narrative segment
 * Prevents transcript-dump effect from overwhelming the lore store
 */
export const MAX_EVENTS_PER_EXTRACTION = 3;

/**
 * Generates a normalized lore key with Unicode-safe handling, which keeps IDs stable
 * even when names include diacritics or non-Latin scripts.
 *
 * Handles international characters via NFD decomposition and diacritic removal:
 * - Western European: François → world-123:character_francois
 * - Non-Latin scripts: 村田さん → world-123:character_character_uuid-abc123
 *
 * @param worldId - World identifier.
 * @param category - Lore category (character, location, event, rule).
 * @param name - Original name (preserves Unicode in fact.value).
 * @param maxLength - Optional maximum length for truncation.
 * @returns Normalized lore key in format: {worldId}:{category}_{normalizedName}.
 */
export function generateLoreKey(worldId: string, category: string, name: string, maxLength?: number): string {
  const safeKey = generateSafeKey(name, category);

  // Don't truncate UUID keys - they need to remain valid
  const hasUUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(safeKey);
  const truncatedKey = (maxLength && !hasUUID) ? safeKey.substring(0, maxLength) : safeKey;

  return `${worldId}:${category}_${truncatedKey}`;
}

/**
 * Generic NPC words that, when they make up the entire name, mark it as a
 * non-specific group rather than a stored entity. Pair with the structural
 * "plural" check below for harder cases like "Dothraki warriors".
 */
const GENERIC_NPC_DENYLIST = new Set([
  'guards', 'guard',
  'villagers',
  'soldiers',
  'warriors',
  'townsfolk', 'townspeople',
  'citizens',
  'peasants',
  'merchants',
  'travelers',
  'workers',
  'farmers',
  'bandits',
  'thieves',
  'mages',
  'knights',
  'crowd', 'mob', 'group', 'party',
  'people', 'men', 'women', 'children',
  'man', 'woman', 'child', 'boy', 'girl',
  'figure', 'figures',
  'stranger', 'strangers',
  'person', 'persons',
]);

/**
 * Filters out generic/unnamed characters that shouldn't be stored as named entities,
 * which avoids cluttering the lore store with placeholders or vague groups.
 *
 * Rejects:
 * - Unnamed placeholders (e.g., "Unnamed warrior", "Unknown person")
 * - Descriptive phrases (e.g., "Man with sword")
 * - Plural/group entities (e.g., "guards", "Dothraki warriors") via a denylist
 *   plus a structural plural heuristic
 * - Sentence-like names (too many words)
 *
 * Accepts faction-style names that include "of" ("Brothers of Steel") or a
 * possessive ("King's Guard") even when they trip the plural heuristic.
 *
 * @param name - The character name to validate.
 * @returns True if the name should be stored, false otherwise.
 */
export function shouldStoreExtractedCharacterName(name: string): boolean {
  const canonicalName = safeTrim(name).replace(/\s+/g, ' ');
  if (!canonicalName) return false;

  const normalized = normalizeText(canonicalName, NORM_NAME).toLowerCase();
  if (!normalized) return false;

  // Explicitly reject unnamed placeholders and descriptive phrases.
  if (normalized.startsWith('unnamed ') || normalized.startsWith('unknown ')) return false;
  if (normalized.includes(' with ')) return false;

  const tokens = normalized.split(/\s+/).filter(Boolean);

  // Avoid sentence-like "names".
  if (tokens.length > 6) return false;

  const stopWords = new Set(['the', 'a', 'an']);
  const meaningfulTokens = tokens.filter((token) => !stopWords.has(token));

  // Every meaningful token is a generic NPC word → reject ("guards", "the villagers").
  if (
    meaningfulTokens.length > 0 &&
    meaningfulTokens.every((token) => GENERIC_NPC_DENYLIST.has(token))
  ) {
    return false;
  }

  // Faction-style names with "of" or a possessive are explicit signals — accept
  // even when the plural heuristic would otherwise reject ("Brothers of Steel",
  // "King's Guard").
  if (/\bof\b/i.test(canonicalName) || canonicalName.includes("'")) {
    return true;
  }

  // Structural plural heuristic: short multi-word names whose tokens end in 's'
  // are usually generic groups ("Dothraki warriors", "town guards"). Allow
  // single-token proper nouns ending in 's' through ("James", "Artemis").
  const isPluralGroup =
    tokens.length >= 2 &&
    tokens.length <= 3 &&
    tokens.some((token) => token.endsWith('s'));
  if (isPluralGroup) return false;

  return true;
}

/**
 * Canonicalizes location names to prevent fragmentation, so micro-locations get
 * grouped under a single parent while their original phrasing is kept as aliases.
 *
 * Collapses micro-locations into their parent location:
 * - "X marketplace edge" → "X marketplace" (with "X marketplace edge" as alias)
 * - "X edge" → "X" (with "X edge" as alias)
 *
 * @param name - The location name to canonicalize.
 * @returns Object with the canonicalName and derivedAliases.
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
 * Ranks importance levels for sorting, which makes it easy to pick the most
 * meaningful items first.
 *
 * @param importance - Optional importance value ("low" | "medium" | "high").
 * @returns Numeric rank, higher is more important.
 */
export function importanceRank(importance?: string): number {
  if (importance === 'high') return 3;
  if (importance === 'medium') return 2;
  if (importance === 'low') return 1;
  return 0;
}
