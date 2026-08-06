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
  /**
   * True while the caller is still loading/deduping persisted segments (e.g.
   * NarrativeHistoryManager mounts with an empty array before its
   * stabilization timer supplies the real stored segments). While true, any
   * segments passed in are treated as historical, not newly generated.
   */
  isHydrating?: boolean;
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
  const { intervalMs = 50, chunkSize = 15, isHydrating = false } = options;
  const enabled = isFeatureEnabled('BUFFERED_STREAMING');

  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [visibleChunkIndex, setVisibleChunkIndex] = useState(-1);
  const [isBuffering, setIsBuffering] = useState(false);

  const revealedSegmentIds = useRef<Set<string>>(new Set(segments.map((s) => s.id)));
  const wasHydratingRef = useRef(isHydrating);

  // A caller may mount with an empty segments array while it loads and dedupes
  // persisted history, only supplying the real stored segments once hydration
  // finishes. Without this, the "detect a new segment" effect below would see
  // the most recent STORED segment for the first time and mistake it for one
  // that was just generated, replaying the reveal animation on content the
  // player already read. This effect runs before that one (declared first),
  // so it marks the just-hydrated batch as already revealed before the check
  // happens.
  useEffect(() => {
    if (wasHydratingRef.current && !isHydrating) {
      segments.forEach((segment) => revealedSegmentIds.current.add(segment.id));
    }
    wasHydratingRef.current = isHydrating;
  }, [isHydrating, segments]);

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
