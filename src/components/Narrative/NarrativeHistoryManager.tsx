import React, { useEffect, useState } from 'react';
import { NarrativeHistory } from './NarrativeHistory';
import { useNarrativeStore } from '@/state/narrativeStore';
import { NarrativeSegment } from '@/types/narrative.types';

/**
 * NarrativeHistoryManager is a component that only displays existing narrative segments
 * without generating new ones, to avoid duplication issues.
 */
interface NarrativeHistoryManagerProps {
  sessionId: string;
  className?: string;
  onStabilized?: () => void;
  disableInitialAutoScroll?: boolean;
  /**
   * True while a NarrativeController elsewhere in the tree is actively
   * generating the next turn. This component only displays
   * persisted segments, so it has no generation state of its own — a
   * composer that hides its own NarrativeController's history (the live play
   * surface does, via ActiveGameSessionNarrativeColumn) passes its
   * isGenerating/streamingContent through here instead.
   */
  isGenerating?: boolean;
  /** The active generation's narrative prose so far — see isGenerating. */
  streamingContent?: string;
}

export const NarrativeHistoryManager: React.FC<NarrativeHistoryManagerProps> = ({
  sessionId,
  className,
  onStabilized,
  disableInitialAutoScroll = false,
  isGenerating = false,
  streamingContent
}) => {
  const [segments, setSegments] = useState<NarrativeSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // We define error state but don't currently use setError - this is for future error handling
  const [error] = useState<string | null>(null);
  
  const getSegments = useNarrativeStore(state => state.getSessionSegments);
  
  // Subscribe to narrative store updates
  useEffect(() => {
    
    // Initial load
    const loadSegments = () => {
      // Get segments from store
      const existingSegments = getSegments(sessionId);
      
      // Apply consistent deduplication using our utility function
      // This handles both initial scenes and content duplicates
      const uniqueSegments = removeDuplicateSegments(existingSegments);
      
      // Log deduplication info for debugging
      if (uniqueSegments.length !== existingSegments.length) {
        // Deduplication occurred - segments were merged
      }
      
      // Set state with final deduplicated segments
      setSegments(uniqueSegments);
    };
    
    // Load initial segments
    loadSegments();

    // Only re-run the dedup/sort when THIS session's segment list actually
    // changes, instead of on every narrative-store write. Segments stream in
    // token-by-token during play (each a store write), and addSegment replaces
    // sessionSegments[sessionId] with a new array, so a reference check catches
    // every add/remove for this session.
    let prevSegmentIds = useNarrativeStore.getState().sessionSegments[sessionId];
    const unsubscribe = useNarrativeStore.subscribe((state) => {
      const nextSegmentIds = state.sessionSegments[sessionId];
      if (nextSegmentIds === prevSegmentIds) return;
      prevSegmentIds = nextSegmentIds;
      loadSegments();
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [sessionId, getSegments]);
  
  // Remove duplicate segments based on content and type
  // This is a more aggressive deduplication to fix the multiple initial segments issue
  const removeDuplicateSegments = (segments: NarrativeSegment[]): NarrativeSegment[] => {
    if (!segments || segments.length === 0) {
      return [];
    }
    
    // Skip the overly aggressive initial scene deduplication
    // The problem is that all segments are getting the same location metadata
    // Instead, just do simple content-based deduplication
    const processedSegments = [...segments];
    
    // Second, handle general deduplication by content
    const uniqueSegments: NarrativeSegment[] = [];
    const contentMap = new Map<string, boolean>();
    const idMap = new Map<string, boolean>();
    
    // Sort by timestamp (oldest first) to preserve narrative order
    processedSegments.sort((a, b) => 
      new Date(a.timestamp || a.createdAt).getTime() - new Date(b.timestamp || b.createdAt).getTime()
    );
    
    for (const segment of processedSegments) {
      // Skip if this exact ID has already been included
      if (idMap.has(segment.id)) {
        continue;
      }
      
      // For segment deduplication, only dedupe if content is EXACTLY the same
      // Don't use partial content matching as it removes valid segments
      const normalizedContent = segment.content.trim().replace(/\s+/g, ' ');
      const key = `${segment.type}-${normalizedContent}`;
      
      if (!contentMap.has(key)) {
        uniqueSegments.push(segment);
        contentMap.set(key, true);
        idMap.set(segment.id, true);
      }
    }
    
    return uniqueSegments;
  };

  // State to track if we've stabilized the segments (no more deduplication needed)
  const [stabilized, setStabilized] = useState(false);
  
  // Show loading state until segments are stabilized
  useEffect(() => {
    // Always start in loading state when segments change
    setIsLoading(true);
    
    // Create debounced stabilization (prevents flashing during load and deduplication)
    const stabilizeTimer = setTimeout(() => {
      setStabilized(true);
      setIsLoading(false);

      // Notify parent that stabilization is complete
      if (onStabilized) {
        onStabilized();
      }
    }, 50);  // Reduced to 50ms for faster response
    
    // Cleanup timer on unmount or when segments change again
    return () => {
      clearTimeout(stabilizeTimer);
    };
  }, [sessionId, segments.length, onStabilized]);
  
  // Reset stabilized state when session changes
  useEffect(() => {
    setStabilized(false);
    setIsLoading(true);
  }, [sessionId]);

  return (
    <div className={['narrative-history-manager', className].filter(Boolean).join(' ')}>
      <NarrativeHistory
        // Only show segments when they've stabilized
        segments={stabilized ? segments : []}
        // Always show loading animation until stabilized, regardless of whether we have segments —
        // also true while a sibling NarrativeController generates the next turn.
        isLoading={isLoading || !stabilized || isGenerating}
        streamingContent={streamingContent}
        // Segments withheld pre-stabilization are historical, not newly generated —
        // tell the buffered-reveal hook so it doesn't replay the reveal animation on
        // a stored segment once stabilization finally supplies it. Deliberately just
        // `!stabilized`, not `isLoading || !stabilized`: isLoading also flips briefly
        // on later live appends, and stabilized itself doesn't reset for those.
        isHydrating={!stabilized}
        error={error || undefined}
        className={className}
        disableInitialAutoScroll={disableInitialAutoScroll}
      />
    </div>
  );
};
