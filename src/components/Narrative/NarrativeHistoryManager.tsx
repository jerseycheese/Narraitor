import React, { useEffect, useState } from 'react';
import { NarrativeHistory } from './NarrativeHistory';
import { narrativeStore } from '@/state/narrativeStore';
import { NarrativeSegment } from '@/types/narrative.types';

/**
 * NarrativeHistoryManager is a component that only displays existing narrative segments
 * without generating new ones, to avoid duplication issues.
 */
interface NarrativeHistoryManagerProps {
  sessionId: string;
  className?: string;
}

export const NarrativeHistoryManager: React.FC<NarrativeHistoryManagerProps> = ({
  sessionId,
  className
}) => {
  const [segments, setSegments] = useState<NarrativeSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // We define error state but don't currently use setError - this is for future error handling
  const [error] = useState<string | null>(null);
  
  // Get segments from the store
  const getSegments = narrativeStore(state => state.getSessionSegments);
  
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
      console.log('📚 NARRATIVE HISTORY:', {
        sessionId,
        existingSegmentsCount: existingSegments.length,
        uniqueSegmentsCount: uniqueSegments.length,
        segments: uniqueSegments.map(s => ({ 
          id: s.id, 
          type: s.type, 
          content: s.content.substring(0, 50) + '...' 
        }))
      });
      
      if (uniqueSegments.length !== existingSegments.length) {
        console.debug(
          `NarrativeHistoryManager: Deduplicated segments for session ${sessionId} ` +
          `(${existingSegments.length} → ${uniqueSegments.length})`
        );
      }
      
      // Set state with final deduplicated segments
      setSegments(uniqueSegments);
    };
    
    // Load initial segments
    loadSegments();
    
    // Subscribe to store updates
    const unsubscribe = narrativeStore.subscribe(loadSegments);
    
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
    
    // First, handle initial scenes
    // If we have more than one segment with type "scene" and location that indicates an initial scene,
    // only keep the most recent one
    const initialSceneLocations = ['Starting Location', 'Frontier Town', 'Town Square', 'Village Center'];
    
    const initialScenes = segments.filter(
      segment => segment.type === 'scene' && 
                 segment.metadata?.location && 
                 initialSceneLocations.includes(segment.metadata.location)
    );
    
    let processedSegments = [...segments];
    
    if (initialScenes.length > 1) {
      // Sort by timestamp (newest first)
      initialScenes.sort((a, b) => 
        new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime()
      );
      
      // Keep only the newest initial scene
      const newestInitialScene = initialScenes[0];
      
      // Filter out all but the newest initial scene
      processedSegments = segments.filter(segment => 
        segment.id === newestInitialScene.id || 
        !(segment.type === 'scene' && 
          segment.metadata?.location && 
          initialSceneLocations.includes(segment.metadata.location))
      );
    }
    
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
      
      // For segment deduplication, create a key based on content and type
      // Trim and normalize the content to reduce minor variations
      const normalizedContent = segment.content.trim().replace(/\s+/g, ' ').slice(0, 100);
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
    }, 1000);  // Wait for 1 second to ensure all segments are loaded and deduplicated
    
    // Cleanup timer on unmount or when segments change again
    return () => {
      clearTimeout(stabilizeTimer);
    };
  }, [sessionId, segments.length]);
  
  // Reset stabilized state when session changes
  useEffect(() => {
    setStabilized(false);
    setIsLoading(true);
  }, [sessionId]);

  return (
    <div className={`narrative-history-manager ${className || ''}`}>
      <NarrativeHistory 
        // Only show segments when they've stabilized
        segments={stabilized ? segments : []}
        // Always show loading animation until stabilized, regardless of whether we have segments
        isLoading={isLoading || !stabilized}
        error={error || undefined}
      />
    </div>
  );
};