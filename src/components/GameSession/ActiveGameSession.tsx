'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { Decision, NarrativeSegment } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore, Character } from '@/state/characterStore';
import CharacterSummary from './CharacterSummary';
import { EndingScreen } from './EndingScreen';
import { LoadingState } from '@/components/ui/LoadingState';
import { GameSessionSkeleton } from './GameSessionSkeleton';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useInventoryStore } from '@/state/inventoryStore';
import { useRouter } from 'next/navigation';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { LogOut, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActiveGameSessionNarrativeColumn from './ActiveGameSessionNarrativeColumn';
import ActiveGameSessionChoicesColumn from './ActiveGameSessionChoicesColumn';
import ActiveGameSessionControls from './ActiveGameSessionControls';
import { useActiveGameSessionEffects } from './hooks/useActiveGameSessionEffects';
import { useActiveGameSessionJournal } from './hooks/useActiveGameSessionJournal';
import { useActiveGameSessionActions } from './hooks/useActiveGameSessionActions';
import { useActiveGameSessionEnding } from './hooks/useActiveGameSessionEnding';
import { useTutorial } from '@/components/TutorialProvider';
import { ManuscriptSessionShell } from './ManuscriptSessionShell';
import { ManuscriptFloatingHud } from './ManuscriptFloatingHud';
import { ManuscriptActionRail } from './ManuscriptActionRail';
import { ManuscriptDrawer } from './ManuscriptDrawer';
import { CharacterDrawerContent, InventoryDrawerContent } from './ManuscriptDrawerPanels';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { Book, Package } from 'lucide-react';

interface ActiveGameSessionProps {
  worldId: string;
  sessionId: string;
  world?: World;
  status?: 'active' | 'paused' | 'ended';
  onChoiceSelected: (choiceId: string) => void;
  onEnd?: () => void;
  onStartNew?: () => void;
  onBack?: () => void;
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

// Force recompile for manuscript layout migration
const ActiveGameSession: React.FC<ActiveGameSessionProps> = ({
  worldId,
  sessionId,
  world,
  status = 'active',
  onChoiceSelected,
  onEnd,
  onStartNew,
  onBack,
  /* existingSegments - not currently used */
  triggerGeneration = false,
  selectedChoiceId,
}) => {
  const [isGenerating, setIsGenerating] = React.useState(true);
  const [initialized, setInitialized] = React.useState(false);
  const [currentDecision, setCurrentDecision] = React.useState<Decision | null>(null);
  const [localSelectedChoiceId, setLocalSelectedChoiceId] = React.useState<string | undefined>();
  const [shouldTriggerGeneration, setShouldTriggerGeneration] = React.useState(false);
  const choiceGenerationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Track choice generation for UI state
  const [isGeneratingChoices, setIsGeneratingChoices] = React.useState(false);
  const [isCharacterSummaryExpanded, setIsCharacterSummaryExpanded] = React.useState(false);
  const [activeDrawer, setActiveDrawer] = React.useState<'character' | 'inventory' | null>(null);
  
  const isProgressiveDisclosureEnabled = isFeatureEnabled('PROGRESSIVE_DISCLOSURE');
  
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

  // Game is ready when:
  // 1. We're initialized
  // 2. We have narrative content OR we're not generating narrative
  // 3. We have valid choices OR we're still generating choices (don't show broken state)
  // Consider the game ready as soon as we have narrative content.
  // Choices may still be generating; the active layout will render
  // and the choices column will populate when ready.
  const isGameReady = initialized && hasExistingNarrative;

  // Use a consistent key that doesn't change on remounts for the same session
  const controllerKey = React.useMemo(() => `controller-fixed-${sessionId}`, [sessionId]);
  const autoSave = useAutoSave();
  const router = useRouter();
  const { startTour, isTourActive } = useTutorial();
  const shouldShowTour = useSessionStore(state => state.shouldShowTutorialPhase('firstPlay'));

  React.useEffect(() => {
    if (!isCharacterSummaryExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCharacterSummaryExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCharacterSummaryExpanded]);

  React.useEffect(() => {
    if (!isGameReady) return;
    if (!shouldShowTour || isTourActive) return;

    const timer = setTimeout(() => {
      startTour('firstPlay');
    }, 500);

    return () => clearTimeout(timer);
  }, [isGameReady, shouldShowTour, isTourActive, startTour]);

  const { createDecisionJournalEntry, createJournalEntryFromSegment } = useActiveGameSessionJournal({
    sessionId,
    worldId,
    characterId: characterId || undefined,
  });

  const {
    showEndingSuggestion,
    endingSuggestionReason,
    isFatalEnding,
    showEndConfirmation,
    handleEndingSuggested,
    handleAcceptEndingSuggestion,
    handleRejectEndingSuggestion,
    handleEndStoryClick,
    handleConfirmEndStory,
    handleCloseEndStory,
  } = useActiveGameSessionEnding({
    sessionId,
    characterId: characterId || undefined,
    world,
    character,
    generateEnding,
  });

  const { scheduleChoiceFallback } = useActiveGameSessionEffects({
    sessionId,
    worldId,
    controllerKey,
    initialized,
    isGenerating,
    segmentCount,
    characterId: characterId || undefined,
    onEnd,
    onEndStoryClick: handleEndStoryClick,
    setIsGenerating,
    setInitialized,
    setCurrentDecision,
    setIsGeneratingChoices,
    choiceGenerationTimeoutRef,
  });

  const {
    handleNarrativeGenerated,
    handleChoiceSelected,
    handleCustomSubmit,
    handleChoicesGenerated,
  } = useActiveGameSessionActions({
    sessionId,
    characterId: characterId || undefined,
    currentDecision,
    setCurrentDecision,
    setIsGenerating,
    setShouldTriggerGeneration,
    setIsGeneratingChoices,
    setLocalSelectedChoiceId,
    choiceGenerationTimeoutRef,
    scheduleChoiceFallback,
    onChoiceSelected,
    autoSave,
    isSessionEnded,
    createDecisionJournalEntry,
    createJournalEntryFromSegment,
  });

  // If we have an ending, show the ending screen instead
  if (currentEnding) {
    return <EndingScreen />;
  }
  
  // If generating ending, show loading state
  if (isGeneratingEnding) {
    return (
      <div>
        <LoadingState
          message={isFatalEnding ? "Game Over" : "Writing your story's ending..."}
        />
      </div>
    );
  }

  // Show skeleton until the first narrative segment exists, but
  // always mount the hidden NarrativeController to drive generation.
  if (!isGameReady) {
    return (
      <div className="relative min-h-screen">
        <GameSessionSkeleton />
        {/* Hidden controller that actually performs generation while skeleton shows */}
        <div aria-hidden="true" className="sr-only">
          <NarrativeController
            key={`generator-${controllerKey}`}
            worldId={worldId}
            sessionId={sessionId}
            characterId={characterId || undefined}
            decisionWeight={currentDecision?.decisionWeight}
            triggerGeneration={triggerGeneration || !initialized || shouldTriggerGeneration}
            choiceId={localSelectedChoiceId || selectedChoiceId}
            onNarrativeGenerated={handleNarrativeGenerated}
            onChoicesGenerated={handleChoicesGenerated}
            onEndingSuggested={handleEndingSuggested}
            generateChoices={true}
          />
        </div>
      </div>
    );
  }

  return (
    <ManuscriptSessionShell
      hud={
        <ManuscriptFloatingHud
          onToggleCharacterSummary={() => setIsCharacterSummaryExpanded(!isCharacterSummaryExpanded)}
          isCharacterSummaryExpanded={isCharacterSummaryExpanded}
          characterSummaryPanel={character && <CharacterSummary character={character} />}
          drawerTriggers={isProgressiveDisclosureEnabled && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveDrawer('character')}
                title="Character Sheet"
                aria-label="Character Sheet"
                className="rounded-full shadow-md bg-background/80 backdrop-blur-sm"
              >
                <Book className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveDrawer('inventory')}
                title="Inventory"
                aria-label="Inventory"
                className="rounded-full shadow-md bg-background/80 backdrop-blur-sm"
              >
                <Package className="h-5 w-5" />
              </Button>
            </div>
          )}
          leftContent={
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              title="Back to World"
              className="rounded-full shadow-md bg-background/80 backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          }
          rightContent={
            <div className="flex items-center gap-2">
              <SaveIndicator
                status={autoSave.status}
                lastSaveTime={autoSave.lastSaveTime}
                errorMessage={autoSave.errorMessage}
                totalSaves={autoSave.totalSaves}
                onManualSave={autoSave.triggerSave}
                onRetryError={autoSave.retry}
                retryable
                compact
              />
              <Button
                variant="outline"
                size="icon"
                onClick={onStartNew}
                title="Start New Session"
                className="rounded-full shadow-md bg-background/80 backdrop-blur-sm"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          }
        />
      }
      marginContent={isProgressiveDisclosureEnabled && (
        <ActiveGameSessionChoicesColumn
          currentDecision={currentDecision}
          segmentCount={segmentCount}
          status={status}
          isGenerating={isGenerating}
          isGeneratingChoices={isGeneratingChoices}
          isSessionEnded={isSessionEnded(sessionId)}
          worldSkills={world?.skills || []}
          characterSkills={characterSkills}
          inventoryItems={inventoryItems}
          onChoiceSelected={handleChoiceSelected}
          onCustomSubmit={handleCustomSubmit}
          hidePrompt={true}
          hideCustomInput={true}
        />
      )}
      actionRail={
        <ManuscriptActionRail>
          <div className="flex flex-col gap-4">
            <ActiveGameSessionChoicesColumn
              currentDecision={currentDecision}
              segmentCount={segmentCount}
              status={status}
              isGenerating={isGenerating}
              isGeneratingChoices={isGeneratingChoices}
              isSessionEnded={isSessionEnded(sessionId)}
              worldSkills={world?.skills || []}
              characterSkills={characterSkills}
              inventoryItems={inventoryItems}
              onChoiceSelected={handleChoiceSelected}
              onCustomSubmit={handleCustomSubmit}
              className={isProgressiveDisclosureEnabled ? "lg:hidden" : ""}
              endingSuggestion={showEndingSuggestion && endingSuggestionReason ? {
                reason: endingSuggestionReason,
                onAccept: handleAcceptEndingSuggestion,
                onDismiss: handleRejectEndingSuggestion,
              } : undefined}
            />
            
            {isProgressiveDisclosureEnabled && (
              <ActiveGameSessionChoicesColumn
                currentDecision={currentDecision}
                segmentCount={segmentCount}
                status={status}
                isGenerating={isGenerating}
                isGeneratingChoices={isGeneratingChoices}
                isSessionEnded={isSessionEnded(sessionId)}
                worldSkills={world?.skills || []}
                characterSkills={characterSkills}
                inventoryItems={inventoryItems}
                onChoiceSelected={handleChoiceSelected}
                onCustomSubmit={handleCustomSubmit}
                hideChoices={true}
                hidePrompt={true}
                className="hidden lg:block"
              />
            )}
            
            {!isSessionEnded(sessionId) && (
              <div className="flex justify-end items-center gap-4 border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.dispatchEvent(new Event('narraitor:end-session'))}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  End Session
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEndStoryClick}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  End Story
                </Button>
              </div>
            )}
          </div>
        </ManuscriptActionRail>
      }
    >
      <ActiveGameSessionNarrativeColumn
        controllerKey={controllerKey}
        worldId={worldId}
        sessionId={sessionId}
        characterId={characterId || undefined}
        decisionWeight={currentDecision?.decisionWeight}
        triggerGeneration={triggerGeneration}
        initialized={initialized}
        shouldTriggerGeneration={shouldTriggerGeneration}
        localSelectedChoiceId={localSelectedChoiceId}
        selectedChoiceId={selectedChoiceId}
        onNarrativeGenerated={handleNarrativeGenerated}
        onChoicesGenerated={handleChoicesGenerated}
        onEndingSuggested={handleEndingSuggested}
        segmentCount={segmentCount}
      />

      <div className="mt-8 border-t pt-8">
        <ActiveGameSessionControls
          character={character}
          characterId={characterId || undefined}
          worldId={worldId}
          sessionId={sessionId}
          showEndConfirmation={showEndConfirmation}
          onConfirmEndStory={handleConfirmEndStory}
          onCloseEndStory={handleCloseEndStory}
          onOpenJournal={() => router.push(`/worlds/${worldId}/play/journal`)}
        />
      </div>

      {isProgressiveDisclosureEnabled && (
        <ManuscriptDrawer
          open={activeDrawer !== null}
          onOpenChange={(open) => !open && setActiveDrawer(null)}
          title={activeDrawer === 'character' ? 'Character Sheet' : 'Inventory'}
        >
          {activeDrawer === 'character' && character && (
            <CharacterDrawerContent character={character} />
          )}
          {activeDrawer === 'inventory' && characterId && (
            <InventoryDrawerContent characterId={characterId} />
          )}
        </ManuscriptDrawer>
      )}
    </ManuscriptSessionShell>
  );
};

export default ActiveGameSession;
