import React, { useEffect, useState } from 'react';
import { NarrativeHistory } from '@/components/Narrative/NarrativeHistory';
import { narrativeStore } from '@/state/narrativeStore';
import { NarrativeSegment } from '@/types/narrative.types';

interface MockNarrativeControllerProps {
  worldId: string;
  sessionId: string;
  onNarrativeGenerated?: (segment: NarrativeSegment) => void;
  triggerGeneration?: boolean;
  choiceId?: string;
  className?: string;
}

export const MockNarrativeController: React.FC<MockNarrativeControllerProps> = ({
  worldId,
  sessionId,
  onNarrativeGenerated,
  triggerGeneration = true,
  choiceId,
  className
}) => {
  const [segments, setSegments] = useState<NarrativeSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Load existing segments on mount
  useEffect(() => {
    const existingSegments = narrativeStore.getState().getSessionSegments(sessionId);
    setSegments(existingSegments);
    if (existingSegments.length > 0) {
      setHasGenerated(true);
    }
  }, [sessionId]);

  // Generate mock narrative
  useEffect(() => {
    if (triggerGeneration && !isLoading) {
      const shouldGenerate = (segments.length === 0 && !hasGenerated) || choiceId;
      
      if (shouldGenerate) {
        setIsLoading(true);
        
        // Simulate async generation
        const timer = setTimeout(() => {
          const content = segments.length === 0
            ? 'You find yourself at the entrance of a mysterious cave. The air is cool and damp, and you can hear the distant sound of dripping water echoing from within. Strange symbols are carved into the stone archway.'
            : `You chose to ${choiceId}. The path ahead leads deeper into the unknown...`;
          
          const newSegment: NarrativeSegment = {
            id: `seg-${Date.now()}`,
            content,
            type: segments.length === 0 ? 'scene' : choiceId ? 'exploration' : 'scene',
            sessionId,
            worldId,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          // Add to local state
          setSegments(prev => [...prev, newSegment]);
          
          // Add to store
          narrativeStore.getState().addSegment(sessionId, {
            content: newSegment.content,
            type: newSegment.type,
            worldId: newSegment.worldId,
            timestamp: newSegment.timestamp,
            updatedAt: newSegment.updatedAt
          });
          
          setIsLoading(false);
          setHasGenerated(true);
          
          if (onNarrativeGenerated) {
            onNarrativeGenerated(newSegment);
          }
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [triggerGeneration, choiceId, segments.length, hasGenerated, isLoading, worldId, sessionId, onNarrativeGenerated]);

  return (
    <div className={`narrative-controller ${className || ''}`}>
      <NarrativeHistory 
        segments={segments}
        isLoading={isLoading}
        error={error || undefined}
      />
    </div>
  );
};