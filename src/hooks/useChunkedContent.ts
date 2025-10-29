/**
 * Hook for managing progressive disclosure of chunked narrative content.
 * Handles chunk visibility state and reveal interactions.
 *
 * **Usage Note:** Most AI-generated narrative segments are 50-100 words and don't need
 * intra-segment chunking. This hook is intended for edge cases:
 * - Unusually long AI responses (>200 words)
 * - Manually authored content with long paragraphs
 * - Testing chunking behavior
 *
 * For typical usage, consider session-level pacing solutions instead of chunking
 * individual segments. See session pacing features for managing long reading sessions.
 */

import { useState, useEffect, useMemo } from 'react';
import { chunkNarrativeText, type TextChunk, type ChunkingOptions } from '@/lib/utils/textChunker';

export interface UseChunkedContentOptions extends ChunkingOptions {
  /** Enable auto-reveal when scrolling near bottom (good for mobile) */
  autoRevealOnScroll?: boolean;
  /** Reveal all chunks immediately (disables progressive disclosure) */
  revealAll?: boolean;
}

export interface UseChunkedContentReturn {
  /** All text chunks */
  chunks: TextChunk[];
  /** Currently visible chunks */
  visibleChunks: TextChunk[];
  /** Number of chunks currently visible */
  visibleCount: number;
  /** Total number of chunks */
  totalCount: number;
  /** Whether there are more chunks to reveal */
  hasMore: boolean;
  /** Whether all chunks are revealed */
  isComplete: boolean;
  /** Reveal the next chunk */
  revealNext: () => void;
  /** Reveal all remaining chunks */
  revealAll: () => void;
  /** Reset to initial state (first chunk only) */
  reset: () => void;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Manages progressive disclosure of chunked narrative content.
 *
 * @param content - The narrative text to chunk and manage
 * @param options - Configuration options for chunking and reveal behavior
 * @returns State and controls for progressive content reveal
 *
 * @example
 * ```tsx
 * const { visibleChunks, hasMore, revealNext } = useChunkedContent(narrativeText);
 *
 * return (
 *   <div>
 *     {visibleChunks.map(chunk => (
 *       <div key={chunk.id}>{chunk.content}</div>
 *     ))}
 *     {hasMore && <button onClick={revealNext}>Continue Reading</button>}
 *   </div>
 * );
 * ```
 */
export function useChunkedContent(
  content: string,
  options: UseChunkedContentOptions = {}
): UseChunkedContentReturn {
  const { autoRevealOnScroll = false, revealAll: shouldRevealAll = false, ...chunkingOptions } = options;

  // Memoize chunks to avoid re-chunking on every render
  const chunks = useMemo(
    () => chunkNarrativeText(content, chunkingOptions),
    [content, chunkingOptions.targetWordsPerChunk, chunkingOptions.maxWordsPerChunk, chunkingOptions.minWordsPerChunk, chunkingOptions.isMobile]
  );

  // Track how many chunks are currently visible
  const [visibleCount, setVisibleCount] = useState(1);

  // Reset visible count when content changes
  useEffect(() => {
    setVisibleCount(1);
  }, [content]);

  // Auto-reveal all chunks if requested
  useEffect(() => {
    if (shouldRevealAll && chunks.length > 0) {
      setVisibleCount(chunks.length);
    }
  }, [shouldRevealAll, chunks.length]);

  // Calculate visible chunks
  const visibleChunks = useMemo(
    () => chunks.slice(0, visibleCount),
    [chunks, visibleCount]
  );

  // Calculate state
  const hasMore = visibleCount < chunks.length;
  const isComplete = visibleCount >= chunks.length;
  const progress = chunks.length > 0 ? Math.round((visibleCount / chunks.length) * 100) : 100;

  // Reveal controls
  const revealNext = () => {
    setVisibleCount(prev => Math.min(prev + 1, chunks.length));
  };

  const revealAll = () => {
    setVisibleCount(chunks.length);
  };

  const reset = () => {
    setVisibleCount(1);
  };

  return {
    chunks,
    visibleChunks,
    visibleCount,
    totalCount: chunks.length,
    hasMore,
    isComplete,
    revealNext,
    revealAll,
    reset,
    progress,
  };
}
