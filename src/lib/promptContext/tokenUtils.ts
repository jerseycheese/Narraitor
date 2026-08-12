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

