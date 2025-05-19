import React, { useEffect, useState } from 'react';
import { NarrativeHistory } from './NarrativeHistory';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { narrativeStore } from '@/state/narrativeStore';
import { NarrativeSegment } from '@/types/narrative.types';

interface NarrativeControllerProps {
  worldId: string;
  sessionId: string;
  onNarrativeGenerated?: (segment: NarrativeSegment) => void;
  triggerGeneration?: boolean;
  choiceId?: string; // ID of the choice that triggered this narrative
  className?: string;
}

export const NarrativeController: React.FC<NarrativeControllerProps> = ({
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
  
  const { addSegment, getSessionSegments } = narrativeStore();
  const narrativeGenerator = new NarrativeGenerator(createDefaultGeminiClient());

  // Load existing segments on mount
  useEffect(() => {
    const existingSegments = getSessionSegments(sessionId);
    setSegments(existingSegments);
  }, [sessionId, getSessionSegments]);

  useEffect(() => {
    // Generate narrative when triggered
    if (triggerGeneration) {
      if (segments.length === 0) {
        // Generate initial scene if no segments exist
        generateInitialNarrative();
      } else if (choiceId) {
        // Generate continuation based on choice
        generateNextSegment(choiceId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerGeneration, choiceId]);

  const generateInitialNarrative = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await narrativeGenerator.generateInitialScene(worldId, []);
      const now = new Date();
      const newSegment: NarrativeSegment = {
        id: `seg-${Date.now()}`,
        content: result.content,
        type: result.segmentType,
        metadata: result.metadata,
        timestamp: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      // Add to local state
      setSegments(prev => [...prev, newSegment]);
      
      // Add to store
      addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        characterIds: newSegment.characterIds || [],
        metadata: newSegment.metadata,
        updatedAt: newSegment.updatedAt,
        timestamp: newSegment.timestamp
      });
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }
    } catch {
      setError('Failed to generate narrative');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNextSegment = async (triggeringChoiceId: string) => {
    if (segments.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use recent segments for context (last 3-5 segments)
      const recentSegments = segments.slice(-5);
      
      const result = await narrativeGenerator.generateSegment({
        worldId,
        sessionId,
        characterIds: [],
        narrativeContext: {
          recentSegments,
          currentSituation: `Player selected choice: ${triggeringChoiceId}`
        },
        generationParameters: {
          segmentType: 'scene',
          includedTopics: [triggeringChoiceId]
        }
      });
      
      const now = new Date();
      const newSegment: NarrativeSegment = {
        id: `seg-${Date.now()}`,
        content: result.content,
        type: result.segmentType,
        metadata: result.metadata,
        timestamp: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      // Add to local state
      setSegments(prev => [...prev, newSegment]);
      
      // Add to store
      addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        characterIds: newSegment.characterIds || [],
        metadata: newSegment.metadata,
        updatedAt: newSegment.updatedAt,
        timestamp: newSegment.timestamp
      });
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }
    } catch {
      setError('Failed to generate narrative');
    } finally {
      setIsLoading(false);
    }
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