/**
 * Tokenizes text into words and whitespace sequences for stable reconstruction.
 * Preserves all characters including multiple spaces and newlines.
 */
export function tokenizeForBufferedRendering(text: string): string[] {
  if (!text) return [];
  // Split by newlines or non-whitespace sequences or whitespace sequences
  return text.match(/\n|\r\n|[^\s]+|[^\S\n\r]+/g) || [];
}

/**
 * Groups tokens into chunks for buffered progressive reveal.
 * @param tokens Array of string tokens
 * @param chunkSize Number of tokens to include in each chunk
 */
export function buildBufferedChunks(tokens: string[], chunkSize: number): string[] {
  if (tokens.length === 0) return [];
  
  const chunks: string[] = [];
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunkTokens = tokens.slice(i, i + chunkSize);
    chunks.push(chunkTokens.join(''));
  }
  
  return chunks;
}

/**
 * Enforces a safe buffer interval window (50-100ms).
 */
export function clampBufferInterval(intervalMs: number): number {
  return Math.min(Math.max(intervalMs, 50), 100);
}
