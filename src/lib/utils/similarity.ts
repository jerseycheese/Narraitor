/**
 * Calculates Jaccard similarity between two strings based on token overlap.
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score between 0 and 1 (1 = identical tokens)
 */
export function calculateJaccardSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const tokens1 = new Set(normalize(str1));
  const tokens2 = new Set(normalize(str2));
  
  if (tokens1.size === 0 && tokens2.size === 0) return 1.0;
  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return intersection.size / union.size;
}
