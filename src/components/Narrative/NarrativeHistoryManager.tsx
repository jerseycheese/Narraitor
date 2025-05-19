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
    console.log(`[NarrativeHistoryManager] Setting up subscription for session ${sessionId}`);
    
    // Initial load
    const loadSegments = () => {
      const existingSegments = getSegments(sessionId);
      console.log(`[NarrativeHistoryManager] Loaded ${existingSegments.length} segments for session ${sessionId}`);
      
      // Remove duplicate segments before setting state
      const uniqueSegments = removeDuplicateSegments(existingSegments);
      
      if (uniqueSegments.length !== existingSegments.length) {
        console.log(`[NarrativeHistoryManager] Removed ${existingSegments.length - uniqueSegments.length} duplicate segments`);
      }
      
      setSegments(uniqueSegments);
    };
    
    // Load initial segments
    loadSegments();
    
    // Subscribe to store updates
    const unsubscribe = narrativeStore.subscribe(loadSegments);
    
    // Cleanup on unmount
    return () => {
      console.log(`[NarrativeHistoryManager] Cleaning up subscription for session ${sessionId}`);
      unsubscribe();
    };
  }, [sessionId, getSegments]);
  
  // Remove duplicate segments based on content and type
  const removeDuplicateSegments = (segments: NarrativeSegment[]): NarrativeSegment[] => {
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

  // Show loading state if no segments yet
  useEffect(() => {
    if (segments.length === 0) {
      setIsLoading(true);
      
      // Set a timeout to stop showing loading if it takes too long
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [segments.length]);

  return (
    <div className={`narrative-history-manager ${className || ''}`}>
      <NarrativeHistory 
        segments={segments}
        isLoading={isLoading}
        error={error || undefined}
      />
    </div>
  );
};