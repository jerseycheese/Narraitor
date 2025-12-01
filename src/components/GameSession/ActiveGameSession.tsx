'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';
import { Decision, NarrativeSegment, SkillCheckRoll } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore, Character } from '@/state/characterStore';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import { generateUniqueId, truncate, safeTrim, getTimestamp } from '@/lib/utils';
import CharacterSummary from './CharacterSummary';
import { StorySummarySection } from './StorySummarySection';
import { EndingScreen } from './EndingScreen';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import type { EndingType } from '@/types/narrative.types';
import { LoadingState } from '@/components/ui/LoadingState';
import { JournalModal } from './JournalModal';
import { JournalFloatingButton } from './JournalFloatingButton';
import { useJournalStore } from '@/state/journalStore';
import { GameSessionSkeleton } from './GameSessionSkeleton';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { useAutoSave } from '@/hooks/useAutoSave';
import { InventoryList } from '@/components/inventory/InventoryList';
import { useInventoryStore } from '@/state/inventoryStore';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

const INITIAL_GENERATION_MAX_WAIT_MS = 20000;

interface ActiveGameSessionProps {
  worldId: string;
  sessionId: string;
  world?: World;
  status?: 'active' | 'paused' | 'ended';
  onChoiceSelected: (choiceId: string) => void;
  onEnd?: () => void;
  // Narrative specific props
  existingSegments?: NarrativeSegment[];
  choices?: Array<{
    id: string;
    text: string;
    isSelected?: boolean;
  }>;
  triggerGeneration?: boolean;
  selectedChoiceId?: string;
}

const ActiveGameSession: React.FC<ActiveGameSessionProps> = ({
  worldId,
  sessionId,
  world,
  status = 'active',
  onChoiceSelected,
  onEnd,
  /* existingSegments - not currently used */
  choices,
  triggerGeneration = false,
  selectedChoiceId,
}) => {
  const [isGenerating, setIsGenerating] = React.useState(true);
  const [initialized, setInitialized] = React.useState(false);
  const [currentDecision, setCurrentDecision] = React.useState<Decision | null>(null);
  const [localSelectedChoiceId, setLocalSelectedChoiceId] = React.useState<string | undefined>();
  const [shouldTriggerGeneration, setShouldTriggerGeneration] = React.useState(false);
  const choiceGenerationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Game readiness state for coordinated loading
  const [isGeneratingChoices, setIsGeneratingChoices] = React.useState(false);
  
  // Ending suggestion state
  const [showEndingSuggestion, setShowEndingSuggestion] = React.useState(false);
  const [endingSuggestionReason, setEndingSuggestionReason] = React.useState('');
  const [suggestedEndingType, setSuggestedEndingType] = React.useState<EndingType>('story-complete');
  
  // Manual end story confirmation
  const [showEndConfirmation, setShowEndConfirmation] = React.useState(false);

  // Journal modal state (Issue #278)
  const [showJournalModal, setShowJournalModal] = React.useState(false);

  // Skill check roll results
  const [skillCheckResults, setSkillCheckResults] = React.useState<SkillCheckRoll[]>([]);


  // Check for test data to support visual regression tests (guarded for SSR)
  const testCharacters =
    typeof window !== 'undefined'
      ? (window as typeof window & { __TEST_CHARACTERS__?: Record<string, Character> }).__TEST_CHARACTERS__
      : undefined;
  const isTestMode = !!testCharacters;
  
  // Get character ID from session store
  const characterId = useSessionStore(state => state.characterId);
  
  // Always call hooks - handle test mode logic after
  const storeCharacter = useCharacterStore((state) => state.characters[characterId || '']);
  
  // Get character details - use test data in test mode or store data in normal mode
  const character = isTestMode 
    ? Object.values(testCharacters || {}).find((char: Character) => char.worldId === worldId)
    : storeCharacter;
  
  const getInventoryItems = useInventoryStore((state) => state.getCharacterItems);
  const inventoryItems = React.useMemo(
    () => (characterId ? getInventoryItems(characterId) : []),
    [characterId, getInventoryItems]
  );
  const characterSkills = character?.skills ?? [];
  
  // Get narrative store for ending functionality
  const { currentEnding, isGeneratingEnding, generateEnding, isSessionEnded } = useNarrativeStore();

  // Reactively track segment count using a stable snapshot to avoid infinite loops.
  // Selecting derived arrays from Zustand can cause non-cached snapshots.
  const segmentCount = useNarrativeStore((state) => (state.sessionSegments[sessionId]?.length ?? 0));

  const hasExistingNarrative = segmentCount > 0;

  // Simple computed state - game is ready when we have content and are not in loading states
  // For sessions with existing narrative, we need either a current decision OR actual choices
  // Don't show interface if we only have fallback choices (indicates failed AI generation)
  const hasValidChoices = currentDecision || (choices && choices.length > 0);

  // Game is ready when:
  // 1. We're initialized
  // 2. We have narrative content OR we're not generating narrative
  // 3. We have valid choices OR we're still generating choices (don't show broken state)
  // Consider the game ready as soon as we have narrative content.
  // Choices may still be generating; the active layout will render
  // and the choices column will populate when ready.
  const isGameReady = initialized && hasExistingNarrative;

  // Get journal store for auto-creating entries
  const { addEntry } = useJournalStore();
  // Use a consistent key that doesn't change on remounts for the same session
  const controllerKey = React.useMemo(() => `controller-fixed-${sessionId}`, [sessionId]);
  const autoSave = useAutoSave();
  

  // Debug: log key state changes to help diagnose skeleton readiness
  // (Commented out to reduce console noise)

  // Safety net: if no narrative segment arrives within a reasonable window,
  // inject a minimal fallback scene so the UI can progress.
  // Only trigger if we're not actively generating content.
  React.useEffect(() => {
    if (!initialized) return;
    if (segmentCount > 0) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      // Don't inject fallback if AI generation is still in progress
      if (isGenerating) return;

      try {
        const now = new Date();
        const fallback: NarrativeSegment = {
          id: `seg-${sessionId}-bootstrap-${now.getTime()}`,
          content: 'You take a breath as your adventure begins. The world awaits your first move.',
          type: 'scene',
          metadata: { location: 'Starting Location', tags: ['intro', 'bootstrap'] },
          sessionId,
          worldId,
          timestamp: now,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        } as NarrativeSegment;
        // Add to store only; NarrativeHistoryManager reads from store
        useNarrativeStore.getState().addSegment(sessionId, {
          content: fallback.content,
          type: fallback.type,
          characterIds: [],
          metadata: fallback.metadata,
          updatedAt: fallback.updatedAt,
          timestamp: fallback.timestamp,
        });
        // Begin generating choices after bootstrap
        setIsGeneratingChoices(true);
      } catch {
        // Ignore errors; controller may be mid-flight
      }
    }, 4000); // Increased timeout to 4 seconds to give AI more time
    return () => { cancelled = true; clearTimeout(t); };
  }, [initialized, segmentCount, sessionId, worldId, isGenerating]);

  // Ensure we eventually release the generating flag to allow safety fallbacks
  React.useEffect(() => {
    if (!initialized) return;
    if (segmentCount > 0) return;
    if (!isGenerating) return;

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setIsGenerating(false);
    }, INITIAL_GENERATION_MAX_WAIT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [initialized, segmentCount, isGenerating]);
  
  // Initialize the narrative only once per session
  // instead of clearing and recreating each time
  React.useEffect(() => {
    // Initialize session with unique controller key
    let isMounted = true;
    
    // Set initial loading state
    setIsGenerating(true);
    
    // Function to check existing narrative and set up if needed
    const setupNarrative = async () => {
      try {
        // Dynamically import the narrativeStore to avoid circular dependencies
        const { useNarrativeStore } = await import('@/state/narrativeStore');
        
        // Only proceed if still mounted
        if (!isMounted) return;
        
        // Check if we already have segments for this session
        const existingSegments = useNarrativeStore.getState().getSessionSegments(sessionId);
        // Check for 'intro' tag which is more stable than checking specific location strings
        const hasInitialScene = existingSegments.some(seg =>
          seg.metadata?.tags?.includes('intro')
        );
        
        // Check for existing decisions in the store
        const existingDecisions = useNarrativeStore.getState().getSessionDecisions(sessionId);
        
        // If we have existing decisions, use the latest one
        if (existingDecisions.length > 0) {
          const latestDecision = existingDecisions[existingDecisions.length - 1];
          setCurrentDecision(latestDecision);
        }
        
        if (hasInitialScene || existingSegments.length > 0) {
          // If we have any segments at all, use them
          // Don't clear existing narrative history
          setInitialized(true);
          setIsGenerating(false);
          // Choice generation will be triggered by NarrativeController after narrative generation
        }
        else {
          // No segments at all - normal case for new session
          // Keep UI in generating state until first segment arrives or we explicitly fallback
          setInitialized(true);
          setIsGenerating(true);
        }
      } catch {
        // Error setting up narrative, continue with initialization
        setInitialized(true);
        setIsGenerating(true);
      }
    };
    
    // Check existing narrative and set up if needed
    setupNarrative();
    
    return () => {
      // Mark component as unmounted to prevent state updates after unmounting
      isMounted = false;
      
      // Clear any pending choice generation timeout
      if (choiceGenerationTimeoutRef.current) {
        clearTimeout(choiceGenerationTimeoutRef.current);
        choiceGenerationTimeoutRef.current = null;
      }
    };
  }, [sessionId, worldId, controllerKey]);

  // Helper function to generate AI summary for journal entries
  const generateJournalSummary = async (content: string, type: string, location?: string, decisionWeight?: 'minor' | 'major' | 'critical'): Promise<{summary: string, entryType: string, significance: string}> => {
    try {
      const response = await fetch('/api/narrative/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type,
          location,
          decisionWeight,
          instructions: 'Create a concise journal entry summary of what happened. Focus on key actions, discoveries, or events only. Avoid sensory details.'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.summary && data.entryType && data.significance) {
          return {
            summary: data.summary,
            entryType: data.entryType,
            significance: data.significance
          };
        }
      }
    } catch (error) {
      console.warn('Failed to generate AI summary for journal entry:', error);
    }
    
    // Return fallback values using decision weight for significance
    const fallbackSignificance = decisionWeight || 'minor';
    return {
      summary: createFallbackSummary(content),
      entryType: 'character_event',
      significance: fallbackSignificance
    };
  };

  // Fallback summary method when AI fails
  const createFallbackSummary = (content: string): string => {
    // Extract first sentence and clean it up
    const sentences = content.split(/[.!?]+/).filter(s => safeTrim(s).length > 10);
    if (sentences.length > 0) {
      let summary = safeTrim(sentences[0]);
      // Convert from second person to past tense if needed
      summary = summary.replace(/^You\s+/, '').replace(/\byou\b/g, 'the character');
      // Keep it concise - max 60 characters
      return summary.length > 60 ? truncate(summary, 57) : summary + '.';
    }
    return 'Something happened in the adventure.';
  };

  // Regex patterns for cleaning decision prompts
  const YOU_PREFIX_REGEX = /^you\s+/i; // Remove leading "you" (case-insensitive) and following whitespace
  const QUESTION_MARK_SUFFIX_REGEX = /\?$/; // Remove trailing question mark

  /**
   * Creates a journal entry for a decision made by the character.
   *
   * @param {Decision} decision - The decision object containing options and prompt.
   * @param {string} selectedChoiceId - The ID of the selected choice, or the custom choice text if isCustomChoice is true.
   * @param {boolean} isCustomChoice - If true, indicates that the selected choice is a custom user input rather than a predefined option.
   *   When true, selectedChoiceId is treated as the custom choice text itself.
   */
  const createDecisionJournalEntry = (decision: Decision, selectedChoiceId: string, isCustomChoice: boolean) => {
    if (!characterId) return;
    
    // Find the selected choice
    const selectedChoice = decision.options.find(option => option.id === selectedChoiceId);
    const choiceText = selectedChoice?.text || (isCustomChoice ? selectedChoiceId : 'Unknown choice');
    
    // Format decision content for readability
    const formatDecisionContent = (choice: string, prompt: string): string => {
      const cleanChoice = choice.toLowerCase();
      const cleanPrompt = prompt
        .toLowerCase()
        .replace(YOU_PREFIX_REGEX, '')
        .replace(QUESTION_MARK_SUFFIX_REGEX, '');
      return `Chose to ${cleanChoice} when ${cleanPrompt}`;
    };
    
    // Map decision weight to significance
    const significance: 'minor' | 'major' | 'critical' = decision.decisionWeight || 'minor';
    
    try {
      addEntry(sessionId, {
        worldId: worldId,
        characterId: characterId,
        type: 'decision',
        title: '', // No title for MVP - content is sufficient
        content: formatDecisionContent(choiceText, decision.prompt),
        significance: significance,
        isRead: false,
        relatedEntities: [],
        metadata: {
          tags: ['decision'],
          automaticEntry: true,
          decisionId: decision.id,
          choiceText: choiceText,
          decisionPrompt: decision.prompt
        },
        updatedAt: getTimestamp()
      });
    } catch (error) {
      console.warn('Failed to create decision journal entry:', error);
    }
  };

  // Helper function to create journal entries from narrative segments
  const createJournalEntryFromSegment = (segment: NarrativeSegment, relatedDecisionWeight?: 'minor' | 'major' | 'critical') => {
    if (!characterId) return;

    const cleanContent = segment.content;
    const actualLocation = segment.metadata?.location;

    // Generate AI summary, type, and significance for journal entry (async)
    generateJournalSummary(cleanContent, segment.type, actualLocation, relatedDecisionWeight).then(aiResult => {
      try {
        addEntry(sessionId, {
          worldId: worldId,
          characterId: characterId,
          type: aiResult.entryType as 'character_event' | 'discovery' | 'achievement' | 'world_event' | 'relationship_change',
          title: '', // No title for MVP - content is sufficient
          content: aiResult.summary,
          significance: aiResult.significance as 'minor' | 'major' | 'critical',
          isRead: false, // Read status no longer used but kept for type compatibility
          relatedEntities: [],
          metadata: {
            tags: [segment.type],
            automaticEntry: true,
            narrativeSegmentId: segment.id
          },
          updatedAt: getTimestamp()
        });
      } catch (error) {
        console.warn('Failed to create journal entry from narrative segment:', error);
      }
    }).catch(error => {
      console.warn('Failed to generate journal summary, using fallback:', error);
      // Use fallback if AI completely fails
      try {
        const fallbackSignificance = relatedDecisionWeight || 'minor';
        const fallbackContent = createFallbackSummary(cleanContent);
        addEntry(sessionId, {
          worldId: worldId,
          characterId: characterId,
          type: 'character_event',
          title: '', // No title for MVP - content is sufficient
          content: fallbackContent,
          significance: fallbackSignificance,
          isRead: false, // Read status no longer used but kept for type compatibility
          relatedEntities: [],
          metadata: {
            tags: [segment.type],
            automaticEntry: true,
            narrativeSegmentId: segment.id
          },
          updatedAt: getTimestamp()
        });
      } catch (fallbackError) {
        console.warn('Failed to create fallback journal entry:', fallbackError);
      }
    });
  };

  const handleNarrativeGenerated = (segment: NarrativeSegment) => {
    // Narrative segment was successfully generated
    setIsGenerating(false);
    setShouldTriggerGeneration(false); // Reset trigger
    // Start generating choices
    setIsGeneratingChoices(true);
    
    // Auto-create journal entry for significant narrative events
    if (characterId && segment.content) {
      // Use the current decision weight to determine journal significance
      const decisionWeight = currentDecision?.decisionWeight;
      createJournalEntryFromSegment(segment, decisionWeight);
    }
    
    // Set a fallback timer to ensure choices eventually appear
    // Use a ref to track this timeout so we can clear it if AI choices arrive
    const timeoutId = setTimeout(() => {
      // If we're still generating choices after 15 seconds, create fallback choices
      setIsGeneratingChoices(prev => {
        if (prev && !currentDecision) {
          const fallbackId = `decision-timeout-${Date.now()}`;
          const fallbackDecision: Decision = {
            id: fallbackId,
            prompt: "What will you do?",
            options: [
              { id: `option-${fallbackId}-1`, text: "Investigate further", alignment: 'neutral' },
              { id: `option-${fallbackId}-2`, text: "Talk to nearby characters", alignment: 'lawful' },
              { id: `option-${fallbackId}-3`, text: "Move to a new location", alignment: 'neutral' }
            ],
            decisionWeight: 'minor',
            contextSummary: 'Waiting for player action (timeout fallback).'
          };
          
          setCurrentDecision(fallbackDecision);
          return false; // Stop generating
        }
        return prev;
      });
    }, 15000); // 15 second timeout (increased from 10)
    
    // Store timeout ID for potential cleanup
    choiceGenerationTimeoutRef.current = timeoutId;

    void autoSave.triggerSave('scene-change');
  };

  const handleChoiceSelected = (choiceId: string) => {
    // Check if session has ended - if so, prevent further generation
    if (isSessionEnded(sessionId)) {
      return;
    }

    // Player choice was selected
    setIsGenerating(true);
    setIsGeneratingChoices(true); // Start generating new choices
    setLocalSelectedChoiceId(choiceId);
    setShouldTriggerGeneration(true); // Trigger narrative generation
    
    // Create decision journal entry (Issue #174)
    if (currentDecision && characterId) {
      createDecisionJournalEntry(currentDecision, choiceId, false);
    }
    
    // If we have a current decision, update its selected option
    if (currentDecision) {
      useNarrativeStore.getState().selectDecisionOption(currentDecision.id, choiceId, characterId || undefined);
    }
    
    // Clear current decision to prevent showing stale choices during generation
    setCurrentDecision(null);
    
    onChoiceSelected(choiceId);

    void autoSave.triggerSave('player-choice');
  };

  const handleCustomSubmit = (customText: string) => {
    // Check if session has ended - if so, prevent further generation
    if (isSessionEnded(sessionId)) {
      return;
    }
    
    // Handle custom player input
    const customChoiceId = generateUniqueId('custom');
    
    // Create decision journal entry for custom choice (Issue #174)
    if (currentDecision && characterId) {
      createDecisionJournalEntry(currentDecision, customText, true);
    }
    
    // Create a custom decision option and add it to the current decision in the store
    if (currentDecision) {
      const customOption = {
        id: customChoiceId,
        text: customText,
        isCustomInput: true,
        customText: customText
      };
      
      // Update the decision in the store with the new custom option and select it
      useNarrativeStore.getState().updateDecision(currentDecision.id, {
        options: [...currentDecision.options, customOption],
        selectedOptionId: customChoiceId
      });
    }
    
    // Clear current decision to prevent showing stale choices during generation
    setCurrentDecision(null);
    
    // Trigger narrative generation with the custom choice
    setIsGenerating(true);
    setIsGeneratingChoices(true); // Start generating new choices
    setLocalSelectedChoiceId(customChoiceId);
    setShouldTriggerGeneration(true);
    
    onChoiceSelected(customChoiceId);

    void autoSave.triggerSave('player-choice');
  };
  
  // Handle newly generated player choices
  const handleChoicesGenerated = (decision: Decision) => {

    if (!decision || !decision.options || (decision.options?.length || 0) === 0) {
      setIsGeneratingChoices(false);
      return;
    }

    // Clear the fallback timeout since we have real AI choices
    if (choiceGenerationTimeoutRef.current) {
      clearTimeout(choiceGenerationTimeoutRef.current);
      choiceGenerationTimeoutRef.current = null;
    }

    // Force update with a new object reference to ensure React detects the change
    const decisionCopy: Decision = {
      id: decision.id,
      prompt: decision.prompt,
      options: [...decision.options],
      selectedOptionId: decision.selectedOptionId,
      decisionWeight: decision.decisionWeight,
      contextSummary: decision.contextSummary,
    };

    // Update the current decision state with the copy
    setCurrentDecision(decisionCopy);
    // Stop the choice generation loading state
    setIsGeneratingChoices(false);
    
    // Convert AI-generated decision to player choices format for the session
    const playerChoices = decision.options.map(option => ({
      id: option.id,
      text: option.text,
      isSelected: option.id === decision.selectedOptionId
    }));
    
    // Update session store with AI-generated choices
    useSessionStore.getState().setPlayerChoices(playerChoices);
  };

  const handleSkillCheckPerformed = (results: SkillCheckRoll[]) => {
    setSkillCheckResults(results);
  };

  // Handle ending story functionality with confirmation
  const handleEndStory = async () => {
    if (!characterId || !world || !character) return;

    try {
      await generateEnding('player-choice', {
        sessionId,
        characterId,
        worldId: world.id,
        world: world,  // Pass the full world object
        character: character  // Pass the full character object
      });
    } catch (error) {
      console.error('Failed to load ending:', error);
    }
  };
  
  // Handle ending suggestion from AI
  const handleEndingSuggested = (reason: string, endingType: EndingType) => {
    setEndingSuggestionReason(reason);
    setSuggestedEndingType(endingType);
    setShowEndingSuggestion(true);
  };
  
  // Accept AI ending suggestion
  const handleAcceptEndingSuggestion = async () => {
    setShowEndingSuggestion(false);
    if (!characterId || !world || !character) return;

    try {
      await generateEnding(suggestedEndingType, {
        sessionId,
        characterId,
        worldId: world.id,
        world: world,  // Pass the full world object
        character: character  // Pass the full character object
      });
    } catch (error) {
      console.error('Failed to load ending:', error);
    }
  };
  
  // Reject AI ending suggestion
  const handleRejectEndingSuggestion = () => {
    setShowEndingSuggestion(false);
  };
  
  // Handle manual end story button click
  const handleEndStoryClick = () => {
    setShowEndConfirmation(true);
  };
  
  // Confirm manual end story
  const handleConfirmEndStory = () => {
    setShowEndConfirmation(false);
    handleEndStory();
  };

  // Global event handlers to support hero action buttons from parent pages
  React.useEffect(() => {
    const onEndStory = () => handleEndStoryClick();
    const onEndSession = async () => {
      // Dispatch event to trigger final checkpoint before ending session
      window.dispatchEvent(new CustomEvent('narraitor:finalize-checkpoint'));
      // Small delay to allow checkpoint to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      if (onEnd) onEnd();
    };
    const onNewSession = async () => {
      const sessionStore = useSessionStore.getState();
      const narrativeStore = useNarrativeStore.getState();
      narrativeStore.clearSessionSegments(sessionId);
      narrativeStore.clearSessionDecisions(sessionId);
      narrativeStore.clearEnding();
      sessionStore.endSession();
      Object.keys(sessionStore.savedSessions).forEach(savedSessionId => {
        const savedSession = sessionStore.savedSessions[savedSessionId];
        if (savedSession.worldId === worldId && savedSession.characterId === characterId) {
          sessionStore.deleteSavedSession(savedSessionId);
        }
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      const url = new URL(window.location.href);
      url.searchParams.set('fresh', 'true');
      window.location.href = url.toString();
    };

    window.addEventListener('narraitor:end-story', onEndStory as EventListener);
    window.addEventListener('narraitor:end-session', onEndSession as EventListener);
    window.addEventListener('narraitor:new-session', onNewSession as EventListener);
    return () => {
      window.removeEventListener('narraitor:end-story', onEndStory as EventListener);
      window.removeEventListener('narraitor:end-session', onEndSession as EventListener);
      window.removeEventListener('narraitor:new-session', onNewSession as EventListener);
    };
  }, [sessionId, worldId, characterId, onEnd]);

  // If we have an ending, show the ending screen instead
  if (currentEnding) {
    return <EndingScreen />;
  }
  
  // If generating ending, show loading state
  if (isGeneratingEnding) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Writing your story's ending..." />
      </div>
    );
  }

  // Show skeleton until the first narrative segment exists, but
  // always mount the hidden NarrativeController to drive generation.
  if (!isGameReady) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <GameSessionSkeleton />
        {/* Hidden controller that actually performs generation while skeleton shows */}
        <div aria-hidden="true" className="hidden h-0 overflow-hidden">
          <NarrativeController
            key={`generator-${controllerKey}`}
            worldId={worldId}
            sessionId={sessionId}
            characterId={characterId || undefined}
            triggerGeneration={triggerGeneration || !initialized || shouldTriggerGeneration}
            choiceId={localSelectedChoiceId || selectedChoiceId}
            onNarrativeGenerated={handleNarrativeGenerated}
            onChoicesGenerated={handleChoicesGenerated}
            onEndingSuggested={handleEndingSuggested}
            onSkillCheckPerformed={handleSkillCheckPerformed}
            generateChoices={true}
          />
        </div>

        {/* Character Summary Panel - show immediately when character data is available */}
        {character && (
          <div className="mt-6">
            <CharacterSummary character={character} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="game-session-active" role="region" aria-label="Game session" className="flex-1 min-h-0 flex flex-col">

      {/* Two-column layout for larger screens */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch flex-1 min-h-0 lg:overflow-hidden">
        {/* Story Column */}
        <div
          className="lg:flex-1 min-h-0 flex flex-col lg:overflow-hidden relative"
          id="narrative-container"
          style={{
            maxHeight: segmentCount > 1 ? '500px' : 'none'
          }}
        >
          {/* Fade-out overlay at top when multiple segments */}
          {segmentCount > 1 && (
            <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10 bg-gradient-to-b from-background to-transparent" />
          )}
          {/* Use NarrativeHistoryManager to display narrative content without generation logic */}
          <NarrativeHistoryManager
            key={`display-${controllerKey}`}
            sessionId={sessionId}
            className="flex flex-col flex-1 min-h-0"
            disableInitialAutoScroll={false}
          />

          {/* Hidden controller just to generate content - always include it but hide from view */}
          <div aria-hidden="true" className="hidden h-0 overflow-hidden">
            <NarrativeController
              key={`generator-${controllerKey}`}
              worldId={worldId}
              sessionId={sessionId}
              characterId={characterId || undefined}
              triggerGeneration={triggerGeneration || !initialized || shouldTriggerGeneration}
              choiceId={localSelectedChoiceId || selectedChoiceId}
              onNarrativeGenerated={handleNarrativeGenerated}
              onChoicesGenerated={handleChoicesGenerated}
              onEndingSuggested={handleEndingSuggested}
              onSkillCheckPerformed={handleSkillCheckPerformed}
              generateChoices={true}
            />
          </div>
        </div>

        {/* Choices Column */}
        <div
          className="lg:flex-1 min-h-0 flex flex-col"
          id="choices-container"
        >
          <div className="player-choices-container flex-1">
            {/* Render ChoiceSelector if we have a decision OR if this is a resumed session with existing segments */}
            {(currentDecision?.decisionWeight || (currentDecision && segmentCount > 0)) ? (
              <ChoiceSelector
                decision={currentDecision}
                onSelect={handleChoiceSelected}
                onCustomSubmit={handleCustomSubmit}
                enableCustomInput={true}
                isDisabled={status !== 'active' || isGenerating || isSessionEnded(sessionId)}
                worldSkills={world?.skills || []}
                characterSkills={characterSkills}
                inventoryItems={inventoryItems}
                skillCheckResults={skillCheckResults}
                endingSuggestion={showEndingSuggestion && endingSuggestionReason ? {
                  reason: endingSuggestionReason,
                  onAccept: handleAcceptEndingSuggestion,
                  onDismiss: handleRejectEndingSuggestion,
                } : undefined}
              />
            ) : (
              <div className="space-y-4 p-4">
                {/* Choice decision skeleton - matches ChoiceSelector layout */}
                <div className="space-y-3">
                  {/* Choice prompt skeleton */}
                  <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse" />

                  {/* Choice buttons skeleton */}
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-gray-200 border border-gray-300 rounded-lg animate-pulse"
                    />
                  ))}

                  {/* Custom input skeleton */}
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/3 animate-pulse" />
                    <div className="h-10 bg-gray-200 border border-gray-300 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character Summary Panel below hero */}
      {character && (
        <div className="mt-6">
          <CharacterSummary character={character} />
        </div>
      )}

      {/* Inventory Display */}
      {characterId && (
        <div className="mt-6" data-testid="inventory-collapsible">
          <CollapsibleSection title="Inventory" initialCollapsed>
            <InventoryList characterId={characterId} />
          </CollapsibleSection>
        </div>
      )}

      <StorySummarySection worldId={worldId} sessionId={sessionId} characterId={characterId || undefined} />

      {/* Autosave indicator anchored under the main content */}
      <div className="mt-4">
        <SaveIndicator
          status={autoSave.status}
          lastSaveTime={autoSave.lastSaveTime}
          errorMessage={autoSave.errorMessage}
          totalSaves={autoSave.totalSaves}
          onManualSave={autoSave.triggerSave}
          onRetryError={autoSave.retry}
          retryable
          compact
          className="text-xs sm:text-sm"
        />
      </div>


      {/* Manual End Story Confirmation */}
      <ConfirmationDialog
        isOpen={showEndConfirmation}
        onConfirm={handleConfirmEndStory}
        onClose={() => setShowEndConfirmation(false)}
        title="End Story"
        message="Are you sure you want to end your story? This will write a final ending based on your current progress and cannot be undone."
        variant="warning"
        confirmText="End Story"
        cancelText="Cancel"
      />

      {/* Journal Modal - Issue #278: AC2,AC4,AC5 */}
      <JournalModal
        isOpen={showJournalModal}
        onClose={() => setShowJournalModal(false)}
        sessionId={sessionId}
        characterId={character?.id}
      />

      {/* Journal Floating Button - Issue #562 */}
      {character && (
        <JournalFloatingButton
          onClick={() => setShowJournalModal(true)}
        />
      )}
    </div>
  );
};

export default ActiveGameSession;
