'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';
import { Decision, NarrativeSegment } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import { generateUniqueId } from '@/lib/utils/generateId';
import CharacterSummary from './CharacterSummary';
import { EndingScreen } from './EndingScreen';
import { StoryEndingDialog } from '@/components/StoryEndingDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import type { EndingType } from '@/types/narrative.types';
import { LoadingState } from '@/components/ui/LoadingState';
import { JournalModal } from './JournalModal';
import { JournalFloatingButton } from './JournalFloatingButton';
import { useJournalStore } from '@/state/journalStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { Button } from '@/components/ui/button';

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
  
  // Ending suggestion state
  const [showEndingSuggestion, setShowEndingSuggestion] = React.useState(false);
  const [endingSuggestionReason, setEndingSuggestionReason] = React.useState('');
  const [suggestedEndingType, setSuggestedEndingType] = React.useState<EndingType>('story-complete');
  
  // Manual end story confirmation
  const [showEndConfirmation, setShowEndConfirmation] = React.useState(false);
  
  // Journal modal state (Issue #278)
  const [showJournalModal, setShowJournalModal] = React.useState(false);
  
  // Get character ID from session store
  const characterId = useSessionStore(state => state.characterId);
  
  // Get character details
  const character = useCharacterStore(state => 
    state.characters[characterId || '']
  );
  
  // Get narrative store for ending functionality
  const { currentEnding, isGeneratingEnding, generateEnding, isSessionEnded } = useNarrativeStore();
  const [isGeneratingChoices, setIsGeneratingChoices] = React.useState(false);
  
  // Get journal store for auto-creating entries
  const { addEntry } = useJournalStore();
  // Use a consistent key that doesn't change on remounts for the same session
  const controllerKey = React.useMemo(() => `controller-fixed-${sessionId}`, [sessionId]);
  
  // Auto-save functionality
  const autoSave = useAutoSave();
  
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
        const hasInitialScene = existingSegments.some(seg => 
          seg.type === 'scene' && 
          (seg.metadata?.location === 'Starting Location' || 
           seg.metadata?.location === 'Frontier Town')
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
        }
        else {
          // No segments at all - normal case for new session
          // No existing segments found, will generate initial scene
          setInitialized(true);
          setIsGenerating(false);
        }
      } catch {
        // Error setting up narrative, continue with initialization
        setInitialized(true);
        setIsGenerating(false);
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
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      let summary = sentences[0].trim();
      // Convert from second person to past tense if needed
      summary = summary.replace(/^You\s+/, '').replace(/\byou\b/g, 'the character');
      // Keep it concise - max 60 characters
      return summary.length > 60 ? summary.substring(0, 57) + '...' : summary + '.';
    }
    return 'Something happened in the adventure.';
  };

  // Helper function to create journal entries from narrative segments
  const createJournalEntryFromSegment = (segment: NarrativeSegment, relatedDecisionWeight?: 'minor' | 'major' | 'critical') => {
    if (!characterId) return;
    
    // The narrative generator should now handle JSON parsing, but keep fallback for legacy content
    let cleanContent = segment.content;
    let actualLocation = segment.metadata?.location;
    
    // Fallback: handle any remaining JSON-formatted content that wasn't parsed by the generator
    if (segment.content.includes('```json') || segment.content.startsWith('{')) {
      try {
        let jsonStr = segment.content;
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.replace(/```json\s*/, '').replace(/\s*```/, '');
        }
        
        const parsed = JSON.parse(jsonStr);
        if (parsed.content) {
          cleanContent = parsed.content;
        }
        if (parsed.metadata?.location && !actualLocation) {
          actualLocation = parsed.metadata.location;
          // Update segment metadata if it wasn't already set by the generator
          segment.metadata = { ...segment.metadata, ...parsed.metadata };
        }
      } catch (parseError) {
        console.warn('Could not parse JSON content, using original:', parseError);
      }
    }
    
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
          updatedAt: new Date().toISOString()
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
          updatedAt: new Date().toISOString()
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
    
    // If we have a current decision, update its selected option
    if (currentDecision) {
      useNarrativeStore.getState().selectDecisionOption(currentDecision.id, choiceId);
    }
    
    // Clear current decision to prevent showing stale choices during generation
    setCurrentDecision(null);
    
    onChoiceSelected(choiceId);
    
    // Trigger auto-save after player choice to ensure all state updates are applied
    autoSave.triggerSave('player-choice');
  };

  const handleCustomSubmit = (customText: string) => {
    // Check if session has ended - if so, prevent further generation
    if (isSessionEnded(sessionId)) {
      return;
    }
    
    // Handle custom player input
    const customChoiceId = generateUniqueId('custom');
    
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
  };
  
  // Handle newly generated player choices
  const handleChoicesGenerated = (decision: Decision) => {
    
    if (!decision || !decision.options || decision.options.length === 0) {
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
  
  // Handle ending story functionality with confirmation
  const handleEndStory = async () => {
    if (!characterId || !world) return;
    
    try {
      await generateEnding('player-choice', {
        sessionId,
        characterId,
        worldId: world.id
      });
    } catch (error) {
      console.error('Failed to generate ending:', error);
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
    if (!characterId || !world) return;
    
    try {
      await generateEnding(suggestedEndingType, {
        sessionId,
        characterId,
        worldId: world.id
      });
    } catch (error) {
      console.error('Failed to generate ending:', error);
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

  return (
    <div data-testid="game-session-active" role="region" aria-label="Game session">
      {/* Character Summary Panel */}
      {character && (
        <div className="mb-6">
          {/* Responsive layout: stacked on small screens, side-by-side on larger screens */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <CharacterSummary character={character} />
            </div>
            {/* Auto-save indicator */}
            <div className="flex-shrink-0">
              <SaveIndicator
                status={autoSave.status}
                lastSaveTime={autoSave.lastSaveTime}
                errorMessage={autoSave.errorMessage}
                totalSaves={autoSave.totalSaves}
                onManualSave={autoSave.triggerSave}
                onRetryError={autoSave.retry}
                retryable={true}
                compact={true}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Two-column layout for larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:grid-rows-[max-content]">
        {/* Story Column */}
        <div className="lg:row-span-1 lg:self-stretch">
          {/* Use NarrativeHistoryManager to display narrative content without generation logic */}
          <NarrativeHistoryManager
            key={`display-${controllerKey}`}
            sessionId={sessionId}
          />
          
          {/* Note: Loading indicator is handled by NarrativeHistoryManager itself */}
          
          {/* Hidden controller just to generate content - always include it but hide from view */}
          <div aria-hidden="true" style={{ display: 'none', height: 0, overflow: 'hidden' }}>
            <NarrativeController
              key={`generator-${controllerKey}`}
              worldId={worldId}
              sessionId={sessionId}
              characterId={characterId || undefined}
              triggerGeneration={triggerGeneration || !initialized || shouldTriggerGeneration} // Trigger on choice or initialization
              choiceId={localSelectedChoiceId || selectedChoiceId}
              onNarrativeGenerated={handleNarrativeGenerated}
              onChoicesGenerated={handleChoicesGenerated}
              onEndingSuggested={handleEndingSuggested}
              generateChoices={true}
            />
          </div>
        </div>

        {/* Choices Column */}
        <div className="lg:row-span-1 lg:self-stretch">
          {/* Show AI-generated choices, loading state, or fallback */}
          {currentDecision ? (
            <div className="player-choices-container">
              <ChoiceSelector
                decision={currentDecision}
                onSelect={handleChoiceSelected}
                onCustomSubmit={handleCustomSubmit}
                enableCustomInput={true}
                isDisabled={status !== 'active' || isGenerating || isSessionEnded(sessionId)}
                character={character}
                worldSkills={world?.skills || []}
              />
            </div>
          ) : isGeneratingChoices ? (
            <div className="player-choices-container">
              <LoadingState message="Thinking up some options..." />
            </div>
          ) : choices && choices.length > 0 ? (
            <div className="player-choices-container">
              <ChoiceSelector
                choices={choices}
                onSelect={handleChoiceSelected}
                onCustomSubmit={handleCustomSubmit}
                enableCustomInput={true}
                isDisabled={status !== 'active' || isGenerating || isSessionEnded(sessionId)}
                character={character}
                worldSkills={world?.skills || []}
              />
            </div>
          ) : (
            <div className="player-choices-container">
              <ChoiceSelector
                choices={[]} // No predefined choices
                prompt="What will you do?"
                onSelect={handleChoiceSelected}
                onCustomSubmit={handleCustomSubmit}
                enableCustomInput={true}
                isDisabled={status !== 'active' || isGenerating || isSessionEnded(sessionId)}
                character={character}
                worldSkills={world?.skills || []}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        {/* Session Control Buttons */}
        {onEnd && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              data-testid="game-session-new"
              variant="default"
              className="w-full sm:w-auto"
              onClick={() => {
                // Save current session and clear narrative
                useSessionStore.getState().endSession();
                useNarrativeStore.getState().clearSessionSegments(sessionId);
                
                // Reload the page to start fresh
                window.location.reload();
              }}
            >
              Start New Session
            </Button>
            <Button
              data-testid="game-session-end-story"
              variant="secondary"
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleEndStoryClick}
              disabled={isGeneratingEnding || isSessionEnded(sessionId)}
              title="End your story with an AI-generated epilogue"
            >
              {isGeneratingEnding ? 'Generating...' : 'End Story'}
            </Button>
            <Button
              data-testid="game-session-end"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={onEnd}
            >
              End Session
            </Button>
          </div>
        )}
      </div>

      {/* Ending Suggestion Dialog */}
      <StoryEndingDialog
        isOpen={showEndingSuggestion}
        onClose={handleRejectEndingSuggestion}
        onContinue={handleAcceptEndingSuggestion}
        title="Story Ending Suggested"
        content={
          <div className="space-y-3">
            <p>The AI has detected that your story might be ready to conclude based on natural story progression.</p>
            {endingSuggestionReason && (
              <p className="text-sm text-gray-600 italic">
                Reason: {endingSuggestionReason}
              </p>
            )}
            <p>Would you like to generate an ending now, or continue your adventure?</p>
          </div>
        }
        endingType="default"
        continueText="Generate Ending"
        closeText="Continue Playing"
      />

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
