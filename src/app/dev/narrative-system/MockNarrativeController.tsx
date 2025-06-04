import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
    console.log(`[MockNarrativeController] Initializing for session ${sessionId}`);
    
    const existingSegments = narrativeStore.getState().getSessionSegments(sessionId);
    console.log(`[MockNarrativeController] Found ${existingSegments.length} existing segments`);
    
    // Check for initial scenes to avoid duplication
    const hasInitialScene = existingSegments.some(segment => 
      segment.type === 'scene' && segment.metadata?.location === 'Frontier Town'
    );
    
    console.log(`[MockNarrativeController] Has initial scene: ${hasInitialScene}`);
    
    // If we have an initial scene already, make sure we don't generate another
    if (hasInitialScene) {
      setHasGeneratedInitial(true);
      console.log('[MockNarrativeController] Marked initial generation as completed');
    } else {
      // Reset state for new sessions
      setHasGeneratedInitial(false);
      console.log('[MockNarrativeController] Reset initial generation flag');
    }
    
    // Update segments state
    setSegments(existingSegments);
    
    // Reset loading state
    setIsLoading(false);
    
    // Reset lastChoiceId for new sessions
    setLastChoiceId(null);
    
    // Cleanup function - important for unmounting properly
    return () => {
      console.log(`[MockNarrativeController] Unmounting controller for session ${sessionId}`);
    };
  }, [sessionId]);

  // Function to generate a narrative segment
  const generateNarrative = useCallback((isInitial: boolean, currentChoiceId?: string) => {
    if (isLoading) {
      console.log('Already loading, skipping generation');
      return;
    }
    
    console.log(`Starting narrative generation: ${isInitial ? 'Initial Scene' : 'Choice Response'}`);
    setIsLoading(true);
    
    // Simulate async generation with clear log messages
    setTimeout(() => {
      console.log('Generating narrative content after timeout');
      const choice = currentChoiceId || 'explore';
      
      // Sample theme-specific content for Western theme
      const content = isInitial
        ? 'You arrive at the dusty frontier town of Redemption. The wooden buildings line the main street, and a hot wind carries the scent of desert sage. The townsfolk eye you warily as you tie your horse to the hitching post outside the saloon.'
        : `You decided to ${choice}. The locals watch carefully as you make your way down the dirt road. In the distance, you hear the faint sound of a piano playing from within the saloon.`;
      
      const newSegment: NarrativeSegment = {
        id: `seg-${Date.now()}`,
        content,
        type: isInitial ? 'scene' : 'action',
        sessionId,
        worldId,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          location: 'Frontier Town', // Add Western-specific location
          tags: isInitial ? ['opening', 'western'] : ['action', 'western'],
          mood: 'tense'
        }
      };
      
      console.log('Created new segment:', newSegment.id);
      
      // Add to local state
      setSegments(prev => [...prev, newSegment]);
      
      // Check for existing initial scene before adding
      if (isInitial) {
        const checkSegments = narrativeStore.getState().getSessionSegments(sessionId);
        const hasExistingInitialScene = checkSegments.some(segment => 
          segment.type === 'scene' && segment.metadata?.location === 'Frontier Town'
        );
        
        if (hasExistingInitialScene) {
          console.log('[MockNarrativeController] Detected existing initial scene, skipping store update');
          return; // Skip adding a duplicate
        }
      }
      
      // Add to store
      console.log(`[MockNarrativeController] Adding segment to store: ${newSegment.id}`);
      narrativeStore.getState().addSegment(sessionId, {
        content: newSegment.content,
        type: newSegment.type,
        worldId: newSegment.worldId,
        timestamp: new Date(), // Make sure we're passing a Date object
        updatedAt: newSegment.updatedAt,
        metadata: newSegment.metadata
      });
      
      console.log('Setting loading to false');
      setIsLoading(false);
      
      if (currentChoiceId) {
        setLastChoiceId(currentChoiceId);
      }
      
      if (isInitial) {
        setHasGeneratedInitial(true);
      }
      
      if (onNarrativeGenerated) {
        onNarrativeGenerated(newSegment);
        console.log('Called onNarrativeGenerated callback');
      }
    }, 2000); // Increased to 2 seconds to make loading state more visible
  }, [isLoading, sessionId, worldId, onNarrativeGenerated]);

  // Handle initial narrative generation
  useEffect(() => {
    console.log('Trigger check:', { triggerGeneration, hasGeneratedInitial, segmentsLength: segments.length });
    
    if (triggerGeneration && !hasGeneratedInitial && segments.length === 0) {
      console.log('Generating initial narrative in MockNarrativeController');
      generateNarrative(true);
    }
  }, [triggerGeneration, hasGeneratedInitial, segments.length, generateNarrative]);

  // Handle choice-based generation
  useEffect(() => {
    if (choiceId && choiceId !== lastChoiceId) {
      generateNarrative(false, choiceId);
    }
  }, [choiceId, lastChoiceId, generateNarrative]);

  // Deduplicate segments before rendering
  const deduplicatedSegments = useMemo(() => {
    // First, identify duplicate initial scenes
    const initialScenes = segments.filter(
      segment => segment.type === 'scene' && segment.metadata?.location === 'Frontier Town'
    );
    
    if (initialScenes.length > 1) {
      console.log(`[MockNarrativeController] Found ${initialScenes.length} initial scenes, deduplicating`);
      
      // Sort by timestamp (newest first)
      initialScenes.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Keep only the newest initial scene
      const keepScene = initialScenes[0];
      console.log(`[MockNarrativeController] Keeping initial scene ID: ${keepScene.id}`);
      
      // Filter out all other initial scenes
      const filteredSegments = segments.filter(segment => 
        segment.id === keepScene.id || 
        !(segment.type === 'scene' && segment.metadata?.location === 'Frontier Town')
      );
      
      return filteredSegments;
    }
    
    return segments;
  }, [segments]);
  
  return (
    <div className={`narrative-controller ${className || ''}`}>
      <NarrativeHistory 
        segments={deduplicatedSegments}
        isLoading={isLoading}
        error={error || undefined}
      />
    </div>
  );
};
