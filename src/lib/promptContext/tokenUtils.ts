/**
 * Estimates the number of tokens in a given text string.
 *
 * Uses heuristics that approximate common LLM tokenization patterns without
 * pulling in a tokenizer dependency.
 *
 * @param text - The text to estimate token count for
 * @returns The estimated number of tokens in the text, or 0 if text is empty/null/undefined
 */
export function estimateTokenCount(text: string | undefined | null): number {
  if (!text) {
    return 0;
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }

  // Count punctuation marks roughly as separate tokens.
  const punctuationMatches = trimmed.match(/[.,!?;:'"()\[\]{}@#$%^&*+=<>\/\\|`~-]+/g) || [];
  let totalTokens = punctuationMatches.reduce((sum, match) => sum + match.length, 0);

  // Split by whitespace to get words.
  const words = trimmed.split(/\s+/).filter(Boolean);

  for (const rawWord of words) {
    // Strip most punctuation for analysis; keep hyphens for segment analysis.
    const word = rawWord.replace(/[.,!?;:'"()\[\]{}@#$%^&*+=<>\/\\|`~]+/g, '');
    if (!word) continue;

    // Hyphenated words: count each part.
    const parts = word.includes('-') ? word.split('-').filter(Boolean) : [word];

    for (const part of parts) {
      if (!part) continue;

      // CamelCase: treat segments as heavier than simple words.
      const camelSegments = part.split(/(?=[A-Z])/).filter(Boolean);
      if (camelSegments.length > 1) {
        totalTokens += Math.ceil(camelSegments.length * 1.5);
        continue;
      }

      // Long words: approximate ~4.5 chars/token.
      if (part.length > 10) {
        totalTokens += Math.ceil(part.length / 4.5);
        continue;
      }

      // Short words: 1 token.
      if (part.length <= 2) {
        totalTokens += 1;
        continue;
      }

      // Typical words: ~1.3 tokens.
      totalTokens += 1.3;
    }
  }

  return Math.max(0, Math.round(totalTokens));
}

/**
 * Truncates text to fit within an estimated token limit.
 *
 * Uses a binary search over character boundaries to find the largest prefix
 * that stays within the limit. Best-effort only: token estimation is heuristic.
 *
 * @param text - The text to truncate
 * @param limit - Max estimated tokens to allow
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
