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
      const existingSegments = getSegments(sessionId);
      
      // ========= DIRECT FIX FOR MULTIPLE INITIAL SEGMENTS ==========
      // First, identify all initial scenes by location
      const initialScenes = existingSegments.filter(
        segment => segment.type === 'scene' && 
                  (segment.metadata?.location === 'Starting Location' || 
                   segment.metadata?.location === 'Frontier Town')
      );
      
      let processedSegments = [...existingSegments];
      
      // If we have multiple initial scenes, remove all but the most recent one
      if (initialScenes.length > 1) {
        
        // Sort by timestamp (newest first)
        initialScenes.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Keep only the newest initial scene
        const keepScene = initialScenes[0];
        
        // Remove all other initial scenes
        processedSegments = existingSegments.filter(segment => 
          segment.id === keepScene.id || 
          !(segment.type === 'scene' && 
            (segment.metadata?.location === 'Starting Location' || 
             segment.metadata?.location === 'Frontier Town'))
        );
        
      }
      
      // Now apply regular deduplication as a second pass
      const uniqueSegments = removeDuplicateSegments(processedSegments);
      
      if (uniqueSegments.length !== processedSegments.length) {
        // This block is intentionally left empty. In the future, we may add logging
        // or handle specific actions when deduplication changes occur.
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
    // If we have more than one segment with type "scene" and location "Starting Location",
    // only keep the most recent one
    const initialScenes = segments.filter(
      segment => segment.type === 'scene' && 
                 segment.metadata?.location === 'Starting Location'
    );
    
    if (initialScenes.length > 1) {
      
      // Sort by timestamp (newest first)
      initialScenes.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Keep only the newest initial scene
      const newestInitialScene = initialScenes[0];
      
      // Filter out all but the newest initial scene
      const filtered = segments.filter(segment => 
        segment.id === newestInitialScene.id || 
        !(segment.type === 'scene' && segment.metadata?.location === 'Starting Location')
      );
      
      return filtered;
    }
    
    // For other types of segments, use normal deduplication
    const uniqueSegments: NarrativeSegment[] = [];
    const contentMap = new Map<string, boolean>();
    
    for (const segment of segments) {
      // Create a key based on content and type
      const key = `${segment.type}-${segment.content.trim()}`;
      
      if (!contentMap.has(key)) {
        uniqueSegments.push(segment);
        contentMap.set(key, true);
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