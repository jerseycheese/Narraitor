/**
 * Text chunking utility for progressive disclosure of narrative content.
 * Splits long text into readable chunks at natural boundaries (sentences, paragraphs).
 */

export interface TextChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  isComplete: boolean;
}

export interface ChunkingOptions {
  /** Target words per chunk for optimal reading (default: 50) */
  targetWordsPerChunk?: number;
  /** Maximum words before forcing a chunk split (default: 150) */
  maxWordsPerChunk?: number;
  /** Minimum words to avoid overly small chunks (default: 20) */
  minWordsPerChunk?: number;
  /** Mobile mode uses smaller chunks for better mobile UX (default: false) */
  isMobile?: boolean;
}

/**
 * Common abbreviations that shouldn't trigger sentence splits
 */
const ABBREVIATIONS = new Set([
  'Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Sr', 'Jr',
  'vs', 'etc', 'i.e', 'e.g', 'approx', 'dept',
]);

/**
 * Count words in a string
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Check if a period is likely an abbreviation
 */
function isAbbreviation(text: string, index: number): boolean {
  // Extract word before the period
  const beforePeriod = text.substring(0, index).trim().split(/\s+/).pop() || '';

  // Check if it's a known abbreviation
  if (ABBREVIATIONS.has(beforePeriod)) {
    return true;
  }

  // Check if it's a single letter (initials)
  if (beforePeriod.length === 1 && /[A-Z]/.test(beforePeriod)) {
    return true;
  }

  return false;
}

/**
 * Find sentence boundaries in text
 */
function findSentenceBoundaries(text: string): number[] {
  const boundaries: number[] = [];
  const sentenceEnders = /[.!?]/g;
  let match;

  while ((match = sentenceEnders.exec(text)) !== null) {
    const index = match.index;

    // Skip if it's an abbreviation
    if (match[0] === '.' && isAbbreviation(text, index)) {
      continue;
    }

    // Add boundary after the sentence ender and any following whitespace
    let endIndex = index + 1;
    while (endIndex < text.length && /\s/.test(text[endIndex])) {
      endIndex++;
    }

    boundaries.push(endIndex);
  }

  return boundaries;
}

/**
 * Find paragraph boundaries (double newlines)
 */
function findParagraphBoundaries(text: string): number[] {
  const boundaries: number[] = [];
  const paragraphBreak = /\n\s*\n/g;
  let match;

  while ((match = paragraphBreak.exec(text)) !== null) {
    boundaries.push(match.index + match[0].length);
  }

  return boundaries;
}

/**
 * Split text at word boundaries when sentences are too long
 */
function splitAtWordBoundary(text: string, maxWords: number): number {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) {
    return text.length;
  }

  // Find the position after the max-th word
  let wordCount = 0;
  let position = 0;

  for (let i = 0; i < text.length; i++) {
    if (/\s/.test(text[i]) && i > 0 && !/\s/.test(text[i - 1])) {
      wordCount++;
      if (wordCount >= maxWords) {
        position = i;
        // Skip trailing whitespace
        while (position < text.length && /\s/.test(text[position])) {
          position++;
        }
        return position;
      }
    }
  }

  return text.length;
}

/**
 * Chunk narrative text into readable segments at natural boundaries.
 *
 * @param text - The narrative text to chunk
 * @param options - Chunking configuration options
 * @returns Array of text chunks with metadata
 */
export function chunkNarrativeText(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  // Normalize whitespace but preserve paragraph breaks
  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  // Set defaults based on mobile mode
  const defaults: Required<ChunkingOptions> = {
    targetWordsPerChunk: options.isMobile ? 40 : 50,
    maxWordsPerChunk: options.isMobile ? 80 : 150,
    minWordsPerChunk: options.isMobile ? 15 : 20,
    isMobile: false,
  };

  const opts: Required<ChunkingOptions> = { ...defaults, ...options };

  // Find all potential boundaries
  const sentenceBoundaries = findSentenceBoundaries(normalizedText);
  const paragraphBoundaries = findParagraphBoundaries(normalizedText);

  // Combine and sort all boundaries
  const allBoundaries = [...new Set([...sentenceBoundaries, ...paragraphBoundaries])].sort((a, b) => a - b);

  const chunks: TextChunk[] = [];
  let currentStart = 0;
  let bufferStart = 0;
  let buffer = '';

  for (const boundary of allBoundaries) {
    const segment = normalizedText.substring(currentStart, boundary).trim();

    if (!segment) {
      currentStart = boundary;
      continue;
    }

    const segmentWordCount = countWords(segment);

    // If this is the start of a new buffer, record the position
    if (!buffer) {
      bufferStart = currentStart;
    }

    // Check if we should combine with buffer
    if (buffer) {
      const combinedText = `${buffer} ${segment}`;
      const combinedWordCount = countWords(combinedText);

      // If combined still below min, keep buffering
      if (combinedWordCount < opts.minWordsPerChunk) {
        buffer = combinedText;
        currentStart = boundary;
        continue;
      }

      // If combined exceeds max, output buffer and start fresh with segment
      if (combinedWordCount > opts.maxWordsPerChunk) {
        chunks.push({
          id: `chunk-${chunks.length}`,
          content: buffer,
          startIndex: bufferStart,
          endIndex: currentStart,
          isComplete: false,
        });
        buffer = '';
        bufferStart = currentStart;
      } else {
        // Combined is in acceptable range, output it
        chunks.push({
          id: `chunk-${chunks.length}`,
          content: combinedText,
          startIndex: bufferStart,
          endIndex: boundary,
          isComplete: false,
        });
        buffer = '';
        currentStart = boundary;
        continue;
      }
    }

    // Handle current segment
    if (segmentWordCount < opts.minWordsPerChunk) {
      // Too small, buffer it
      buffer = segment;
      bufferStart = currentStart;
      currentStart = boundary;
    } else if (segmentWordCount > opts.maxWordsPerChunk) {
      // Too large, split it
      let remainingText = segment;
      let segmentStart = currentStart;

      while (remainingText.length > 0) {
        const splitPoint = splitAtWordBoundary(remainingText, opts.maxWordsPerChunk);
        const part = remainingText.substring(0, splitPoint).trim();

        if (part) {
          chunks.push({
            id: `chunk-${chunks.length}`,
            content: part,
            startIndex: segmentStart,
            endIndex: segmentStart + splitPoint,
            isComplete: false,
          });
        }

        remainingText = remainingText.substring(splitPoint).trim();
        segmentStart += splitPoint;
      }

      currentStart = boundary;
    } else {
      // Just right, output as chunk
      chunks.push({
        id: `chunk-${chunks.length}`,
        content: segment,
        startIndex: currentStart,
        endIndex: boundary,
        isComplete: false,
      });
      currentStart = boundary;
    }
  }

  // Handle remaining buffer or text
  if (buffer || currentStart < normalizedText.length) {
    const remaining = buffer || normalizedText.substring(currentStart).trim();

    if (remaining) {
      chunks.push({
        id: `chunk-${chunks.length}`,
        content: remaining,
        startIndex: buffer ? bufferStart : currentStart,
        endIndex: normalizedText.length,
        isComplete: false,
      });
    }
  }

  // Mark the last chunk as complete
  if (chunks.length > 0) {
    chunks[chunks.length - 1].isComplete = true;
  }

  return chunks;
}
