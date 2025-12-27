/**
 * Unicode normalization utilities for lore key generation
 * Handles international characters with NFD decomposition and diacritic removal
 */

import { generateUniqueId } from './generateId';

/**
 * Remove accents and diacritics from text using Unicode NFD decomposition
 *
 * Examples:
 * - François → Francois
 * - Zürich → Zurich
 * - naïve → naive
 *
 * @param text - Text to normalize
 * @returns Text with diacritics removed
 */
export function removeAccents(text: string): string {
  return text
    .normalize('NFD')                    // Decompose: é → e + ´ (combining accent)
    .replace(/[\u0300-\u036f]/g, '')     // Remove combining diacritical marks
    .normalize('NFC');                   // Recompose for consistency
}

/**
 * Detect if text contains non-Latin characters
 *
 * Returns true for:
 * - Cyrillic (Владимир)
 * - CJK (村田さん, 李明)
 * - Arabic (محمد)
 * - Emoji (💀, 🎮)
 * - Other non-Latin scripts
 *
 * Returns false for:
 * - Latin with accents (François, Zürich)
 * - Basic ASCII (John, Smith)
 * - NFD decomposed Latin (e\u0301 → é in NFC)
 *
 * Normalizes to NFC first to handle pre-decomposed (NFD) input consistently.
 * This ensures "François" in both NFC and NFD forms are treated identically.
 *
 * @param text - Text to check
 * @returns true if text contains non-Latin characters
 */
export function hasNonLatinCharacters(text: string): boolean {
  // Normalize to NFC first to handle pre-decomposed input (NFD)
  // This ensures combining diacritics (U+0300-U+036F) are composed with base chars
  const normalized = text.normalize('NFC');

  // Latin-1 Supplement (includes accented chars): U+0000-U+00FF
  // Latin Extended-A: U+0100-U+017F
  // Latin Extended-B: U+0180-U+024F
  // Allow spaces, hyphens, apostrophes, periods, underscores
  // Use * instead of + to match empty string as Latin
  const latinRange = /^[\u0000-\u024F\s\-'._]*$/;
  return !latinRange.test(normalized);
}

/**
 * Generate safe ASCII key with UUID fallback
 *
 * Strategy:
 * 1. Western European (Latin + accents): Normalize accents, lowercase, replace special chars
 * 2. Non-Latin scripts (Cyrillic, CJK, Arabic): UUID fallback
 * 3. Empty/invalid after normalization: UUID fallback
 *
 * Examples:
 * - François → francois
 * - Zürich → zurich
 * - 村田さん → character_uuid-abc123 (with fallbackPrefix='character')
 * - Владимир → uuid-def456 (no prefix)
 * - "!!!" → uuid-ghi789 (symbols only)
 *
 * @param name - Original name to normalize
 * @param fallbackPrefix - Optional prefix for UUID fallback (e.g., 'character', 'location')
 * @returns Normalized key (lowercase alphanumeric + underscores) or UUID
 */
export function generateSafeKey(name: string, fallbackPrefix?: string): string {
  // Early detection: non-Latin scripts → UUID fallback
  if (hasNonLatinCharacters(name)) {
    const uuid = generateUniqueId();
    return fallbackPrefix ? `${fallbackPrefix}_${uuid}` : uuid;
  }

  // Normal flow for Latin-based scripts
  const normalized = removeAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')         // Replace non-alphanumeric with underscores
    .replace(/^_+|_+$/g, '')             // Trim leading/trailing underscores
    .substring(0, 100);                  // Reasonable length limit

  // Validation: require minimum 2 characters
  // If normalization produces empty or too-short result, fall back to UUID
  if (!normalized || normalized.length < 2) {
    const uuid = generateUniqueId();
    return fallbackPrefix ? `${fallbackPrefix}_${uuid}` : uuid;
  }

  return normalized;
}
