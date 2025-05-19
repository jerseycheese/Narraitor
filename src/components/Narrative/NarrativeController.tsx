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

  // Track if we've already generated a narrative for this session
  const [sessionKey, setSessionKey] = useState('');
  const [initialGenerationCompleted, setInitialGenerationCompleted] = useState(false);
  const [processedChoices, setProcessedChoices] = useState<Set<string>>(new Set());
  const mountedRef = useRef(false);
  const generateCount = useRef(0);

  // Load existing segments on mount and reset state when session changes
  useEffect(() => {
    // Create a unique session key to track this instance
    const instanceKey = `${sessionId}-${Date.now()}`;
    setSessionKey(instanceKey);
    
    console.log(`[NarrativeController ${instanceKey}] Initializing for session ${sessionId}`);
    
    // Reset state when session changes
    setInitialGenerationCompleted(false);
    setProcessedChoices(new Set());
    setError(null);
    generateCount.current = 0;
    
    // Load segments for the current session
    const existingSegments = getSessionSegments(sessionId);
    setSegments(existingSegments);
    
    // If we already have segments, mark initial generation as completed
    if (existingSegments.length > 0) {
      setInitialGenerationCompleted(true);
      console.log(`[NarrativeController ${instanceKey}] Loaded ${existingSegments.length} existing segments for session ${sessionId}`);
    }

    // Set mounted flag
    mountedRef.current = true;
    
    return () => {
      // Clear mounted flag when component unmounts
      mountedRef.current = false;
      console.log(`[NarrativeController ${instanceKey}] Unmounting controller for session ${sessionId}`);
    };
  }, [sessionId, getSessionSegments]);

  // Deduplicate segments by ID to ensure we don't have duplicates in localStorage
  useEffect(() => {
    if (segments.length > 0) {
      // Check for duplicates
      const ids = new Set();
      const hasDuplicates = segments.some(segment => {
        if (ids.has(segment.id)) return true;
        ids.add(segment.id);
        return false;
      });
      
      if (hasDuplicates) {
        console.log(`[NarrativeController ${sessionKey}] Detected duplicate segments, deduplicating...`);
        // Deduplicate by keeping only the first occurrence of each ID
        const uniqueSegments = [];
        const seenIds = new Set();
        
        for (const segment of segments) {
          if (!seenIds.has(segment.id)) {
            uniqueSegments.push(segment);
            seenIds.add(segment.id);
          }
        }
        
        // Update local state with deduplicated segments
        setSegments(uniqueSegments);
      }
    }
  }, [segments, sessionKey]);

  // Primary generation effect
  useEffect(() => {
    // Skip if component is unmounted
    if (!mountedRef.current) return;
    
    // Generate narrative when triggered
    if (triggerGeneration && !isLoading) {
      // Initial narrative generation (only if we have no segments and haven't generated one yet)
      if (segments.length === 0 && !initialGenerationCompleted) {
        generateCount.current += 1;
        console.log(`[NarrativeController ${sessionKey}] Generating initial narrative #${generateCount.current} for session ${sessionId}`);
        generateInitialNarrative();
        setInitialGenerationCompleted(true);
      } 
      // Choice-based generation (only if we haven't processed this choice already)
      else if (choiceId && !processedChoices.has(choiceId)) {
        generateCount.current += 1;
        console.log(`[NarrativeController ${sessionKey}] Generating narrative #${generateCount.current} for choice ${choiceId}`);
        generateNextSegment(choiceId);
        
        // Mark this choice as processed
        setProcessedChoices(prev => {
          const updated = new Set(prev);
          updated.add(choiceId);
          return updated;
        });
      }
      // Log if we're skipping generation
      else if (segments.length > 0 && initialGenerationCompleted) {
        console.log(`[NarrativeController ${sessionKey}] Skipping generation - already have ${segments.length} segments`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerGeneration, choiceId, segments.length, isLoading, sessionId, sessionKey]);

  const generateInitialNarrative = async () => {
    const generationId = `initial-${Date.now()}`;
    console.log(`[NarrativeController ${sessionKey}] Starting initial narrative generation ${generationId}`);
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await narrativeGenerator.generateInitialScene(worldId, []);
      
      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        console.log(`[NarrativeController ${sessionKey}] Skipping generation ${generationId} - component unmounted`);
        return;
      }
      
      const segmentId = `seg-${worldId}-${Date.now()}`;
      const now = new Date();
      const newSegment: NarrativeSegment = {
        id: segmentId,
        content: result.content,
        type: result.segmentType,
        metadata: result.metadata,
        sessionId, // Explicitly set sessionId
        worldId,   // Explicitly set worldId
        timestamp: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      console.log(`[NarrativeController ${sessionKey}] Created new segment ${segmentId} for generation ${generationId}`);
      
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
      
      console.log(`[NarrativeController ${sessionKey}] Added segment ${segmentId} to store for session ${sessionId}`);
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }
    } catch (err) {
      console.error(`[NarrativeController ${sessionKey}] Error generating narrative:`, err);
      setError('Failed to generate narrative');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      console.log(`[NarrativeController ${sessionKey}] Completed generation ${generationId}`);
    }
  };

  const generateNextSegment = async (triggeringChoiceId: string) => {
    if (segments.length === 0) {
      console.log(`[NarrativeController ${sessionKey}] Cannot generate next segment - no existing segments`);
      return;
    }
    
    const generationId = `choice-${triggeringChoiceId}-${Date.now()}`;
    console.log(`[NarrativeController ${sessionKey}] Starting choice-based generation ${generationId}`);
    
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
      
      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        console.log(`[NarrativeController ${sessionKey}] Skipping generation ${generationId} - component unmounted`);
        return;
      }
      
      const segmentId = `seg-${worldId}-${triggeringChoiceId}-${Date.now()}`;
      const now = new Date();
      const newSegment: NarrativeSegment = {
        id: segmentId,
        content: result.content,
        type: result.segmentType,
        metadata: result.metadata,
        sessionId, // Explicitly set sessionId
        worldId,   // Explicitly set worldId
        timestamp: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      console.log(`[NarrativeController ${sessionKey}] Created new segment ${segmentId} for generation ${generationId}`);
      
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
      
      console.log(`[NarrativeController ${sessionKey}] Added segment ${segmentId} to store for session ${sessionId}`);
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
      }
    } catch (err) {
      console.error(`[NarrativeController ${sessionKey}] Error generating narrative:`, err);
      setError('Failed to generate narrative');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      console.log(`[NarrativeController ${sessionKey}] Completed generation ${generationId}`);
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