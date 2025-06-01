/**
 * Estimates the number of tokens in a given text string.
 *
 * This function provides a simplified token estimation approach by splitting text
 * on whitespace and punctuation. It's designed for approximate token counting
 * rather than exact LLM tokenization.
 *
 * @param text - The text to estimate token count for
 * @returns The estimated number of tokens in the text, or 0 if text is empty/null/undefined
 */
export function estimateTokenCount(text: string | undefined | null): number {
  if (!text) {
    return 0;
  }

  // Basic implementation: split by whitespace and punctuation
  // This is a simplified approach based on the test requirements.
  const tokens = text.split(/\s+|[.,!?;:]+/).filter(token => token.length > 0);

  return tokens.length;
}