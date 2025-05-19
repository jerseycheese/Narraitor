import React, { useEffect, useState } from 'react';
import { NarrativeDisplay } from './NarrativeDisplay';
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
}

export const NarrativeController: React.FC<NarrativeControllerProps> = ({
  worldId,
  sessionId,
  onNarrativeGenerated,
  triggerGeneration = true,
  choiceId
}) => {
  const [currentSegment, setCurrentSegment] = useState<NarrativeSegment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addSegment } = narrativeStore();
  const narrativeGenerator = new NarrativeGenerator(createDefaultGeminiClient());

  useEffect(() => {
    // Generate narrative when triggered
    if (triggerGeneration) {
      if (!currentSegment) {
        // Generate initial scene if no current segment
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
      const segment: NarrativeSegment = {
        id: `seg-${Date.now()}`,
        content: result.content,
        type: result.segmentType,
        metadata: result.metadata,
        timestamp: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      setCurrentSegment(segment);
      addSegment(sessionId, {
        content: segment.content,
        type: segment.type,
        characterIds: segment.characterIds || [],
        metadata: segment.metadata,
        updatedAt: segment.updatedAt,
        timestamp: segment.timestamp
      });
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(segment);
      }
    } catch {
      setError('Failed to generate narrative');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNextSegment = async (triggeringChoiceId: string) => {
    if (!currentSegment) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await narrativeGenerator.generateSegment({
        worldId,
        sessionId,
        characterIds: [],
        narrativeContext: {
          recentSegments: [currentSegment],
          currentSituation: `Player selected choice: ${triggeringChoiceId}`
        },
        generationParameters: {
          segmentType: 'scene',
          includedTopics: [triggeringChoiceId]
        }
      });
      
      const now = new Date();
      const segment: NarrativeSegment = {
        id: `seg-${Date.now()}`,
        content: result.content,
        type: result.segmentType,
        metadata: result.metadata,
        timestamp: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      setCurrentSegment(segment);
      addSegment(sessionId, {
        content: segment.content,
        type: segment.type,
        characterIds: segment.characterIds || [],
        metadata: segment.metadata,
        updatedAt: segment.updatedAt,
        timestamp: segment.timestamp
      });
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(segment);
      }
    } catch {
      setError('Failed to generate narrative');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="narrative-controller">
      <NarrativeDisplay 
        segment={currentSegment} 
        isLoading={isLoading} 
        error={error || undefined} 
      />
    </div>
  );
};