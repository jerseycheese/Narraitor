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
  const [processedChoices, setProcessedChoices] = useState<Set<string>>(new Set());

  // Load existing segments on mount
  useEffect(() => {
    const existingSegments = narrativeStore.getState().getSessionSegments(sessionId);
    setSegments(existingSegments);
  }, [sessionId]);

  // Initial narrative generation
  useEffect(() => {
    // Only generate initial narrative if no segments exist
    if (triggerGeneration && segments.length === 0 && !isLoading) {
      generateNarrative();
    }
  }, [triggerGeneration, segments.length]);

  // Process choice selection
  useEffect(() => {
    // Only process if we have a choice and we haven't processed this choice already
    if (choiceId && !processedChoices.has(choiceId) && !isLoading) {
      console.log(`Processing choice: ${choiceId}`);
      generateNarrative(choiceId);
      
      // Mark this choice as processed
      setProcessedChoices(prev => {
        const updated = new Set(prev);
        updated.add(choiceId);
        return updated;
      });
    }
  }, [choiceId, processedChoices]);

  // Generate narrative content
  const generateNarrative = (choice?: string) => {
    setIsLoading(true);
    console.log(`Generating narrative${choice ? ` for choice: ${choice}` : ''}`);
    
    // Simulate async generation
    setTimeout(() => {
      const content = segments.length === 0
        ? 'You find yourself at the entrance of a mysterious cave. The air is cool and damp, and you can hear the distant sound of dripping water echoing from within. Strange symbols are carved into the stone archway.'
        : `You chose to ${choice || 'explore'}. The path ahead leads deeper into the unknown. You notice more symbols glowing faintly in the darkness.`;
      
      const newSegment: NarrativeSegment = {
        id: `seg-${Date.now()}`,
        content,
        type: segments.length === 0 ? 'scene' : 'exploration',
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
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }
      
      console.log('Narrative generation complete');
    }, 1000);
  };

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