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
  const [error, setError] = useState<string | null>(null);
  
  // Get segments from the store
  const getSegments = narrativeStore(state => state.getSessionSegments);
  
  // Load segments on mount or when sessionId changes
  useEffect(() => {
    console.log(`[NarrativeHistoryManager] Loading segments for session ${sessionId}`);
    const existingSegments = getSegments(sessionId);
    
    // Remove duplicate segments before setting state
    const uniqueSegments = removeDuplicateSegments(existingSegments);
    
    if (uniqueSegments.length !== existingSegments.length) {
      console.log(`[NarrativeHistoryManager] Removed ${existingSegments.length - uniqueSegments.length} duplicate segments`);
    }
    
    setSegments(uniqueSegments);
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