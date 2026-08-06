import { useState, useEffect, useRef, useMemo } from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  tokenizeForBufferedRendering,
  buildBufferedChunks,
  clampBufferInterval,
} from '@/lib/narrativeStreaming/bufferedRendering';

interface UseBufferedNarrativeSegmentsOptions {
  intervalMs?: number;
  chunkSize?: number;
}

/**
 * Hook to progressively reveal the latest narrative segment when BUFFERED_STREAMING is enabled.
 * Historical segments are rendered immediately.
 */
export function useBufferedNarrativeSegments(
  segments: NarrativeSegment[],
  options: UseBufferedNarrativeSegmentsOptions = {}
) {
  // A typical narrative beat runs roughly 1000-2000 characters. At the
  // minimum clamp interval (50ms), a chunk size of 15 tokens clears that in
  // about 1-2 seconds — fast enough to read as a reveal, not a second wait.
  const { intervalMs = 50, chunkSize = 15 } = options;
  const enabled = isFeatureEnabled('BUFFERED_STREAMING');

  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [visibleChunkIndex, setVisibleChunkIndex] = useState(-1);
  const [isBuffering, setIsBuffering] = useState(false);

  const revealedSegmentIds = useRef<Set<string>>(new Set(segments.map((s) => s.id)));

  const latestSegment = segments.length > 0 ? segments[segments.length - 1] : null;

  useEffect(() => {
    if (!enabled || !latestSegment) return;

    if (latestSegment.id !== activeSegmentId && !revealedSegmentIds.current.has(latestSegment.id)) {
      setActiveSegmentId(latestSegment.id);
      setVisibleChunkIndex(-1);
      setIsBuffering(true);
    }
  }, [latestSegment, enabled, activeSegmentId]);

  const chunks = useMemo(() => {
    if (!activeSegmentId || !latestSegment || latestSegment.id !== activeSegmentId) return [];
    return buildBufferedChunks(tokenizeForBufferedRendering(latestSegment.content), chunkSize);
  }, [activeSegmentId, latestSegment, chunkSize]);

  const hasPendingChunks = useMemo(() => {
    return chunks.length > 0 && visibleChunkIndex < chunks.length - 1;
  }, [chunks.length, visibleChunkIndex]);

  useEffect(() => {
    if (!enabled || !activeSegmentId || !latestSegment) return;
    if (latestSegment.id !== activeSegmentId) return;

    if (!isBuffering && hasPendingChunks) {
      setIsBuffering(true);
    }
  }, [enabled, activeSegmentId, latestSegment, isBuffering, hasPendingChunks]);

  useEffect(() => {
    if (!isBuffering || !activeSegmentId || chunks.length === 0) return;

    if (visibleChunkIndex >= chunks.length - 1) {
      setIsBuffering(false);
      revealedSegmentIds.current.add(activeSegmentId);
      return;
    }

    const timeoutId = setTimeout(() => {
      setVisibleChunkIndex((prev) => prev + 1);
    }, clampBufferInterval(intervalMs));

    return () => clearTimeout(timeoutId);
  }, [isBuffering, activeSegmentId, chunks.length, visibleChunkIndex, intervalMs]);

  const renderedSegments = useMemo(() => {
    if (!enabled) return segments;

    return segments.map((segment) => {
      if (segment.id === activeSegmentId && hasPendingChunks) {
        if (visibleChunkIndex === -1) {
          return { ...segment, content: '' };
        }
        return {
          ...segment,
          content: chunks.slice(0, visibleChunkIndex + 1).join(''),
        };
      }
      return segment;
    });
  }, [segments, enabled, activeSegmentId, chunks, visibleChunkIndex, hasPendingChunks]);

  return {
    renderedSegments,
    isBuffering,
  };
}
