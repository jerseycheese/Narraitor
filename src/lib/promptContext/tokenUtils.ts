/**
 * Token estimation utilities for context window management
 *
 * Provides enhanced token counting heuristics that approximate LLM tokenization
 * without requiring external tokenizer dependencies.
 *
 * @module tokenUtils
 */

/**
 * Confidence level for token estimation
 */
export type EstimationConfidence = 'low' | 'medium' | 'high';

/**
 * Detailed breakdown of token estimation
 */
export interface TokenBreakdown {
  wordCount: number;
  punctuationCount: number;
  camelCaseCount: number;
  longWordCount: number;
  specialCharCount: number;
}

/**
 * Result of detailed token estimation
 */
export interface TokenEstimation {
  tokenCount: number;
  confidence: EstimationConfidence;
  breakdown: TokenBreakdown;
  warnings: string[];
}

/**
 * Estimates the number of tokens in a given text string.
 *
 * This function provides enhanced token estimation using heuristics that
 * approximate LLM tokenization patterns:
 * - Short words (1-2 chars) = 1 token
 * - Normal words = ~1.3x multiplier
 * - Punctuation counted separately
 * - CamelCase/hyphenated words split into segments
 * - Long words (>10 chars) estimated by character count
 *
 * @param text - The text to estimate token count for
 * @returns The estimated number of tokens in the text, or 0 if text is empty/null/undefined
 */
export function estimateTokenCount(text: string | undefined | null): number {
  if (!text) {
    return 0;
  }

  const estimation = estimateWithMetadata(text);
  return estimation.tokenCount;
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

/**
 * Provides detailed token estimation with confidence and breakdown
 *
 * @param text - The text to estimate
 * @returns Detailed estimation with confidence level and breakdown
 */
export function estimateWithMetadata(text: string): TokenEstimation {
  if (!text || text.trim().length === 0) {
    return {
      tokenCount: 0,
      confidence: 'high',
      breakdown: {
        wordCount: 0,
        punctuationCount: 0,
        camelCaseCount: 0,
        longWordCount: 0,
        specialCharCount: 0,
      },
      warnings: [],
    };
  }

  const breakdown: TokenBreakdown = {
    wordCount: 0,
    punctuationCount: 0,
    camelCaseCount: 0,
    longWordCount: 0,
    specialCharCount: 0,
  };

  const warnings: string[] = [];
  let totalTokens = 0;

  // Count punctuation marks
  const punctuationMatches = text.match(/[.,!?;:'"()\[\]{}@#$%^&*+=<>\/\\|`~-]+/g) || [];
  breakdown.punctuationCount = punctuationMatches.reduce((sum, match) => sum + match.length, 0);
  totalTokens += breakdown.punctuationCount;

  // Count special characters that aren't punctuation
  const specialCharMatches = text.match(/[$%@#&*^+=|\\<>~`]+/g) || [];
  breakdown.specialCharCount = specialCharMatches.reduce((sum, match) => sum + match.length, 0);

  // Split by whitespace to get words
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  for (const word of words) {
    // Strip punctuation from word for analysis
    // Keep hyphens for segment analysis (they're already counted in punctuationCount)
    const cleanWord = word.replace(/[.,!?;:'"()\[\]{}@#$%^&*+=<>\/\\|`~]+/g, '');

    if (cleanWord.length === 0) {
      continue;
    }

    // Check for hyphenated words (count parts, hyphen already counted separately)
    if (cleanWord.includes('-')) {
      const parts = cleanWord.split('-').filter((p) => p.length > 0);
      for (const part of parts) {
        // Re-run the same heuristics on each part
        const camelCaseSegments = part.split(/(?=[A-Z])/);
        if (camelCaseSegments.length > 1 && camelCaseSegments.every((s) => s.length > 0)) {
          breakdown.camelCaseCount += camelCaseSegments.length;
          totalTokens += camelCaseSegments.length * 1.5;
          continue;
        }

        if (part.length > 10) {
          breakdown.longWordCount++;
          totalTokens += Math.ceil(part.length / 4.5);
          continue;
        }

        if (part.length <= 2) {
          breakdown.wordCount++;
          totalTokens += 1;
          continue;
        }

        breakdown.wordCount++;
        totalTokens += 1.3;
      }
      continue;
    }

    // Check for CamelCase
    const camelCaseSegments = cleanWord.split(/(?=[A-Z])/);
    if (camelCaseSegments.length > 1 && camelCaseSegments.every((s) => s.length > 0)) {
      breakdown.camelCaseCount += camelCaseSegments.length;
      totalTokens += camelCaseSegments.length * 1.5;
      continue;
    }

    // Check for long words
    if (cleanWord.length > 10) {
      breakdown.longWordCount++;
      // Estimate ~4.5 characters per token for long words
      totalTokens += Math.ceil(cleanWord.length / 4.5);
      continue;
    }

    // Short words (1-2 chars) = 1 token
    if (cleanWord.length <= 2) {
      breakdown.wordCount++;
      totalTokens += 1;
      continue;
    }

    // Normal words with 1.3x multiplier
    breakdown.wordCount++;
    totalTokens += 1.3;
  }

  // Apply minimum word count multiplier if needed
  if (breakdown.wordCount > 0 && totalTokens < breakdown.wordCount) {
    totalTokens = breakdown.wordCount;
  }

  // Determine confidence based on text characteristics
  const confidence = determineConfidence(breakdown, text);

  // Add warnings for edge cases
  if (breakdown.specialCharCount > text.length * 0.1) {
    warnings.push('High special character density may affect accuracy');
  }
  if (breakdown.longWordCount > words.length * 0.3) {
    warnings.push('Many long words detected - estimation may be less accurate');
  }
  if (/[=;{}()\[\]]/.test(text) && /\b(const|let|var|function|class|import|export)\b/.test(text)) {
    warnings.push('Code-like content detected - LLM tokenization may differ');
  }

  return {
    tokenCount: Math.max(0, Math.round(totalTokens)),
    confidence,
    breakdown,
    warnings,
  };
}

/**
 * Determine estimation confidence based on text characteristics
 */
function determineConfidence(
  breakdown: TokenBreakdown,
  text: string
): EstimationConfidence {
  // High special character ratio = low confidence
  if (breakdown.specialCharCount > text.length * 0.15) {
    return 'low';
  }

  // Code-like patterns = low confidence
  if (/[=;{}()\[\]]/.test(text) && /\b(const|let|var|function|class|import|export)\b/.test(text)) {
    return 'low';
  }

  // Many long words or CamelCase = medium confidence
  const totalWords = breakdown.wordCount + breakdown.camelCaseCount + breakdown.longWordCount;
  if (totalWords > 0) {
    const complexWordRatio = (breakdown.camelCaseCount + breakdown.longWordCount) / totalWords;
    if (complexWordRatio > 0.3) {
      return 'medium';
    }
  }

  // Simple narrative text = high confidence
  return 'high';
}

/**
 * Estimates tokens for an array of text segments
 *
 * @param segments - Array of text segments
 * @returns Total estimated token count
 */
export function estimateTotalTokens(segments: (string | undefined | null)[]): number {
  return segments.reduce((total, segment) => total + estimateTokenCount(segment), 0);
}

/**
 * Checks if text exceeds a token limit
 *
 * @param text - The text to check
 * @param limit - The token limit
 * @returns True if estimated tokens exceed the limit
 */
export function exceedsTokenLimit(text: string | undefined | null, limit: number): boolean {
  return estimateTokenCount(text) > limit;
}
