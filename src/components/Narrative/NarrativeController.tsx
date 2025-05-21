import React, { useEffect, useState, useRef } from 'react';
import { NarrativeHistory } from './NarrativeHistory';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { narrativeStore } from '@/state/narrativeStore';
import { Decision, NarrativeContext, NarrativeSegment } from '@/types/narrative.types';

interface NarrativeControllerProps {
  worldId: string;
  sessionId: string;
  onNarrativeGenerated?: (segment: NarrativeSegment) => void;
  onChoicesGenerated?: (decision: Decision) => void;
  triggerGeneration?: boolean;
  choiceId?: string; // ID of the choice that triggered this narrative
  className?: string;
  generateChoices?: boolean; // Whether to generate choices after narrative
}

export const NarrativeController: React.FC<NarrativeControllerProps> = ({
  worldId,
  sessionId,
  onNarrativeGenerated,
  onChoicesGenerated,
  triggerGeneration = true,
  choiceId,
  className,
  generateChoices = true
}) => {
  const [segments, setSegments] = useState<NarrativeSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingChoices, setIsGeneratingChoices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Access store methods in a way that works with testing
  const addSegment = narrativeStore(state => state.addSegment);
  const getSessionSegments = narrativeStore(state => state.getSessionSegments);
  const narrativeGenerator = new NarrativeGenerator(createDefaultGeminiClient());

  // Track if we've already generated a narrative for this session
  const [sessionKey, setSessionKey] = useState('');
  const [initialGenerationCompleted, setInitialGenerationCompleted] = useState(false);
  const [processedChoices, setProcessedChoices] = useState<Set<string>>(new Set());
  const mountedRef = useRef(false);
  const generateCount = useRef(0);
  // Use a ref to track if we've initiated generation in this component instance
  const initialGenerationInitiated = useRef(false);

  // Load existing segments on mount and reset state when session changes
  useEffect(() => {
    // Create a unique session key to track this instance
    const instanceKey = `${sessionId}-${Date.now()}`;
    setSessionKey(instanceKey);
    
    // Initialize controller for the session
    
    // Reset state when session changes
    setProcessedChoices(new Set());
    setError(null);
    generateCount.current = 0;
    
    // Load segments for the current session
    const existingSegments = getSessionSegments(sessionId);
    setSegments(existingSegments);
    
    // Check if we already have an initial scene - more precise than just checking if any segments exist
    const hasInitialScene = existingSegments.some(segment => 
      segment.type === 'scene' && segment.metadata?.location === 'Starting Location'
    );
    
    // Critical: mark initial generation as completed if we already have an initial scene
    // This MUST be done before any effect that might trigger generation
    setInitialGenerationCompleted(hasInitialScene);
    
    if (hasInitialScene) {
      initialGenerationInitiated.current = true; // Prevent any attempt to generate an initial scene
    }

    // Set mounted flag
    mountedRef.current = true;
    
    return () => {
      // Clear mounted flag when component unmounts
      mountedRef.current = false;
      initialGenerationInitiated.current = false; // Reset generation init flag
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
      if (segments.length === 0 && !initialGenerationCompleted && !initialGenerationInitiated.current) {
        // Set both state and refs to prevent duplicate generation
        setInitialGenerationCompleted(true);
        initialGenerationInitiated.current = true;
        
        generateCount.current += 1;
        generateInitialNarrative();
      } 
      // Choice-based generation (only if we haven't processed this choice already)
      else if (choiceId && !processedChoices.has(choiceId)) {
        // Mark this choice as processed BEFORE generating
        // This prevents multiple generations from triggering
        setProcessedChoices(prev => {
          const updated = new Set(prev);
          updated.add(choiceId);
          return updated;
        });
        
        generateCount.current += 1;
        generateNextSegment(choiceId);
      }
      // Log if we're skipping generation
      else if (segments.length > 0 && initialGenerationCompleted) {
      } else {
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerGeneration, choiceId, segments.length, isLoading, sessionId, sessionKey]);

  const generateInitialNarrative = async () => {
    // CHECK FIRST: Don't generate an initial scene if one already exists
    // Do a fresh check of the store to get the latest state
    const existingSegments = getSessionSegments(sessionId);
    const hasInitialScene = existingSegments.some(segment => 
      segment.type === 'scene' && segment.metadata?.location === 'Starting Location'
    );
    
    if (hasInitialScene) {
      setInitialGenerationCompleted(true);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await narrativeGenerator.generateInitialScene(worldId, []);
      
      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
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
      
      // Generate choices if enabled
      if (generateChoices && !isGeneratingChoices) {
        generatePlayerChoices();
      }
    } catch (err) {
      console.error(`Error generating narrative:`, err);
      setError('Failed to generate narrative');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const generateNextSegment = async (triggeringChoiceId: string) => {
    if (segments.length === 0) {
      return;
    }
    
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
      
      // Generate choices if enabled
      if (generateChoices && !isGeneratingChoices) {
        generatePlayerChoices();
      }
    } catch (err) {
      console.error(`Error generating narrative:`, err);
      setError('Failed to generate narrative');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Generate player choices based on current narrative context
   */
  const generatePlayerChoices = async () => {
    if (!mountedRef.current || segments.length === 0) return;
    
    setIsGeneratingChoices(true);
    
    try {
      // Use recent segments for context
      const recentSegments = segments.slice(-5);
      
      // Create narrative context for choice generation
      const narrativeContext: NarrativeContext = {
        recentSegments,
        currentLocation: recentSegments[recentSegments.length - 1]?.metadata?.location || undefined
      };
      
      // Generate choices
      const decision = await narrativeGenerator.generatePlayerChoices(
        worldId,
        narrativeContext,
        []
      );
      
      // Skip if component unmounted during async operation
      if (!mountedRef.current) return;
      
      // Add decision to store
      narrativeStore.getState().addDecision(sessionId, {
        prompt: decision.prompt,
        options: decision.options
      });
      
      // Notify parent component
      if (onChoicesGenerated) {
        onChoicesGenerated(decision);
      }
    } catch (error) {
      console.error('Error generating player choices:', error);
      setError('Failed to generate player choices');
    } finally {
      if (mountedRef.current) {
        setIsGeneratingChoices(false);
      }
    }
  };

  return (
    <div className={`narrative-controller ${className || ''}`}>
      <NarrativeHistory 
        segments={segments}
        isLoading={isLoading || isGeneratingChoices}
        error={error || undefined}
      />
    </div>
  );
};