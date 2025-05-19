import React, { useEffect, useState, useCallback } from 'react';
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
  // Define error state but don't currently set it - for future error handling
  const [error] = useState<string | null>(null);
  const [lastChoiceId, setLastChoiceId] = useState<string | null>(null);
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false);

  // Load existing segments on mount
  useEffect(() => {
    const existingSegments = narrativeStore.getState().getSessionSegments(sessionId);
    setSegments(existingSegments);
    
    // If we already have segments, mark initial generation as completed
    if (existingSegments.length > 0) {
      setHasGeneratedInitial(true);
    }
  }, [sessionId]);

  // Function to generate a narrative segment
  const generateNarrative = useCallback((isInitial: boolean, currentChoiceId?: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Simulate async generation
    setTimeout(() => {
      const choice = currentChoiceId || 'explore';
      const content = isInitial
        ? 'You find yourself at the entrance of a mysterious cave. The air is cool and damp, and you can hear the distant sound of dripping water echoing from within. Strange symbols are carved into the stone archway.'
        : `You chose to ${choice}. The path ahead leads deeper into the unknown. You notice more symbols glowing faintly in the darkness.`;
      
      const newSegment: NarrativeSegment = {
        id: `seg-${Date.now()}`,
        content,
        type: isInitial ? 'scene' : 'action',  // Using 'action' instead of 'exploration' to match valid types
        sessionId,
        worldId,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: isInitial ? ['opening', 'introduction'] : ['exploration', 'action'],
          mood: 'mysterious'
        }
      };
      
      // Add to local state
      setSegments(prev => [...prev, newSegment]);
      
      // Add to store
      narrativeStore.getState().addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        worldId: newSegment.worldId,
        timestamp: new Date(), // Make sure we're passing a Date object
        updatedAt: newSegment.updatedAt,
        metadata: newSegment.metadata
      });
      
      setIsLoading(false);
      
      if (currentChoiceId) {
        setLastChoiceId(currentChoiceId);
      }
      
      if (isInitial) {
        setHasGeneratedInitial(true);
      }
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }
    }, 1000);
  }, [isLoading, sessionId, worldId, onNarrativeGenerated]);

  // Handle initial narrative generation
  useEffect(() => {
    if (triggerGeneration && !hasGeneratedInitial && segments.length === 0) {
      generateNarrative(true);
    }
  }, [triggerGeneration, hasGeneratedInitial, segments.length, generateNarrative]);

  // Handle choice-based generation
  useEffect(() => {
    if (choiceId && choiceId !== lastChoiceId) {
      generateNarrative(false, choiceId);
    }
  }, [choiceId, lastChoiceId, generateNarrative]);

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