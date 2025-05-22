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

  /**
   * Generate player choices based on current narrative context
   */
  const generatePlayerChoices = async () => {
    if (!mountedRef.current) {
      return;
    }
    
    // Get fresh segments from the store instead of relying on component state
    const currentSegments = narrativeStore.getState().getSessionSegments(sessionId);
    
    if (currentSegments.length === 0) {
      return;
    }
    
    setIsGeneratingChoices(true);
    
    // Create fallback choices upfront - we'll use these immediately if something fails
    const fallbackDecision = createFallbackDecision();
    
    try {
      // Use recent segments for context - get from fresh data
      const recentSegments = currentSegments.slice(-5);
      
      // Create narrative context for choice generation
      const narrativeContext: NarrativeContext = {
        recentSegments,
        currentLocation: recentSegments[recentSegments.length - 1]?.metadata?.location || undefined
      };
      
      // Generate choices with a 5-second timeout
      let decision;
      try {
        // Set up a race between the AI generation and a timeout
        const timeoutPromise = new Promise<Decision>((_, reject) => {
          setTimeout(() => reject(new Error('AI choice generation timed out')), 5000);
        });
        
        decision = await Promise.race([
          narrativeGenerator.generatePlayerChoices(worldId, narrativeContext, []),
          timeoutPromise
        ]);
        
      } catch (error) {
        console.error('⚡ CHOICE GENERATION: Generation failed or timed out, using fallback', error);
        decision = fallbackDecision;
      }
      
      // Skip if component unmounted during async operation
      if (!mountedRef.current) {
        return;
      }
      
      // Verify decision structure and use fallback if invalid
      if (!decision || !decision.options || decision.options.length === 0) {
        console.error('⚡ CHOICE GENERATION: Invalid decision structure, using fallback');
        decision = fallbackDecision;
      }
      
      
      // Add decision to store
      narrativeStore.getState().addDecision(sessionId, {
        prompt: decision.prompt,
        options: decision.options
      });
      
      // Only notify parent component if we have AI-generated choices (not fallback)
      if (decision !== fallbackDecision) {
        
        if (onChoicesGenerated) {
          try {
            // Create a deep copy of the decision to ensure React state updates
            const decisionCopy = JSON.parse(JSON.stringify(decision));
            onChoicesGenerated(decisionCopy);
          } catch (error) {
            console.error('⚡ CHOICE GENERATION: Error calling onChoicesGenerated:', error);
          }
        }
      } else {
      }
    } catch (error) {
      console.error('⚡ CHOICE GENERATION: Unhandled error in generatePlayerChoices:', error);
      setError('Failed to generate player choices');
      
      // Even if we get an unhandled error, try to provide fallback choices
      
      try {
        // Only try to create fallback choices if we haven't already added any for this session
        const existingDecisions = narrativeStore.getState().getSessionDecisions(sessionId);
        
        if (existingDecisions.length === 0 && mountedRef.current) {
          // Create and add fallback choices to the store
          const fallbackId = `decision-fallback-error-${Date.now()}`;
          const fallbackDecision: Decision = {
            id: fallbackId,
            prompt: "What will you do now?",
            options: [
              { id: `option-${fallbackId}-1`, text: "Investigate the situation" },
              { id: `option-${fallbackId}-2`, text: "Speak with someone nearby" },
              { id: `option-${fallbackId}-3`, text: "Move to a different area" }
            ]
          };
          
          // Add to store
          narrativeStore.getState().addDecision(sessionId, {
            prompt: fallbackDecision.prompt,
            options: fallbackDecision.options
          });
          
          // Notify parent
          if (onChoicesGenerated && mountedRef.current) {
            const decisionCopy = JSON.parse(JSON.stringify(fallbackDecision));
            onChoicesGenerated(decisionCopy);
          }
        }
      } catch (fallbackError) {
        console.error('⚡ CHOICE GENERATION: Failed to provide fallback choices:', fallbackError);
      }
    } finally {
      if (mountedRef.current) {
        setIsGeneratingChoices(false);
      }
    }
  };

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
      
      // Generate choices if enabled - always generate for initial narrative
      if (generateChoices) {
        console.log('Initial narrative generated, now generating choices');
        
        // Start generating AI choices immediately without showing fallback choices first
        setTimeout(() => {
          console.log('⏱️ TIMEOUT: Now running delayed generatePlayerChoices for initial narrative');
          generatePlayerChoices();
        }, 500); // Reduced timeout since we're not showing immediate choices
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
      
      // Generate choices if enabled - always generate after a new segment
      if (generateChoices) {
        console.log('New narrative segment generated, now generating choices');
        
        // Start generating AI choices immediately without showing fallback choices first
        setTimeout(() => {
          console.log('⏱️ TIMEOUT: Now running delayed generatePlayerChoices for next segment');
          generatePlayerChoices();
        }, 500); // Reduced timeout since we're not showing immediate choices
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