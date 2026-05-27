import { countTokens } from './tokenizer';

/**
 * Estimates the number of tokens in a given text string using the Gemini tokenizer.
 *
 * @param text - The text to estimate token count for
 * @returns The number of tokens, or 0 if text is empty/null/undefined
 */
export function estimateTokenCount(text: string | undefined | null): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return countTokens(trimmed);
}

/**
 * Truncates text to fit within a token limit.
 *
 * Uses binary search over character boundaries to find the largest prefix
 * that stays within the limit. Best-effort: splits on word boundaries where
 * possible.
 *
 * @param text - The text to truncate
 * @param limit - Max tokens to allow
 * @returns Truncated text (or empty string if limit <= 0)
 */
export function truncateToTokenLimit(
  text: string | undefined | null,
  limit: number
): string {
  if (!text) return '';
  if (limit <= 0) return '';

  const original = text;
  if (estimateTokenCount(original) <= limit) {
    return original;
  }

  let low = 0;
  let high = original.length;
  let best = '';

  // ~log2(200k) < 18; cap iterations for safety
  for (let i = 0; i < 20 && low <= high; i++) {
    const mid = Math.floor((low + high) / 2);
    let candidate = original.slice(0, mid).trimEnd();

    // Avoid returning a partial trailing word where possible
    if (mid < original.length && /\S$/.test(candidate) && /\S/.test(original[mid])) {
      candidate = candidate.replace(/\s+\S*$/, '').trimEnd();
    }

    const tokens = estimateTokenCount(candidate);
    if (tokens <= limit) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (!best) return '';

  const suffix = '\n…';
  if (estimateTokenCount(best + suffix) <= limit) {
    return best + suffix;
  }

  return best;
}
