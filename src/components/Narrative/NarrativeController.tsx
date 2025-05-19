import React, { useEffect, useState } from 'react';
import { NarrativeDisplay } from './NarrativeDisplay';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { narrativeStore } from '@/state/narrativeStore';
import { NarrativeSegment } from '@/types/narrative.types';

interface NarrativeControllerProps {
  worldId: string;
  sessionId: string;
}

export const NarrativeController: React.FC<NarrativeControllerProps> = ({
  worldId,
  sessionId
}) => {
  const [currentSegment, setCurrentSegment] = useState<NarrativeSegment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addSegment } = narrativeStore();
  const narrativeGenerator = new NarrativeGenerator(createDefaultGeminiClient());

  useEffect(() => {
    // Generate initial scene on mount
    generateInitialNarrative();
  }, []);

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
        metadata: segment.metadata
      });
    } catch {
      setError('Failed to generate narrative');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNextSegment = async () => {
    if (!currentSegment) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await narrativeGenerator.generateSegment({
        worldId,
        sessionId,
        characterIds: [],
        narrativeContext: {
          recentSegments: [currentSegment]
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
        metadata: segment.metadata
      });
    } catch {
      setError('Failed to generate narrative');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="narrative-controller space-y-6">
      <NarrativeDisplay 
        segment={currentSegment} 
        isLoading={isLoading} 
        error={error} 
      />
      
      {currentSegment && !isLoading && !error && (
        <div className="flex justify-center">
          <button
            onClick={generateNextSegment}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};