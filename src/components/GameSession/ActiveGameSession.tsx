'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { Decision, NarrativeSegment } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore, Character } from '@/state/characterStore';
import { EndingScreen } from './EndingScreen';
import { LoadingState } from '@/components/ui/LoadingState';
import { GameSessionSkeleton } from './GameSessionSkeleton';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useInventoryStore } from '@/state/inventoryStore';
import { useRouter } from 'next/navigation';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
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
import {
  CharacterDrawerContent,
  InventoryDrawerContent,
  StorySummaryDrawerContent,
  ChoiceHistoryDrawerContent,
  JournalSnapshotDrawerContent,
  ToolsMenuPanelContent,
} from './ManuscriptDrawerPanels';
import { CharacterSnapshot } from './CharacterSnapshot';
import { ManuscriptCharactersRail } from './ManuscriptCharactersRail';
import { isFeatureEnabled } from '@/lib/featureFlags';

type DrawerType = 'character' | 'inventory' | 'story-summary' | 'choice-history' | 'journal';

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
  const [activeDrawer, setActiveDrawer] = React.useState<DrawerType | null>(null);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = React.useState(false);

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

  // Get the latest narrative segment for the characters rail
  // We look for the most recent segment that actually has participants, matching prototype logic
  const latestSegmentWithParticipants = useNarrativeStore((state) => {
    const segmentIds = state.sessionSegments[sessionId] || [];
    if (segmentIds.length === 0) return null;
    
    // Search backwards for a segment with characters
    for (let i = segmentIds.length - 1; i >= 0; i--) {
      const segment = state.segments[segmentIds[i]];
      if (segment && ((segment.characterIds?.length ?? 0) > 0 || (segment.metadata?.characterIds?.length ?? 0) > 0)) {
        return segment;
      }
    }
    
    // Fallback to absolute latest segment
    return state.segments[segmentIds[segmentIds.length - 1]] || null;
  });

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
    if (!isCharacterSummaryExpanded && !isToolsMenuOpen && activeDrawer === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCharacterSummaryExpanded(false);
        setIsToolsMenuOpen(false);
        setActiveDrawer(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCharacterSummaryExpanded, isToolsMenuOpen, activeDrawer]);

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
      <div className="manuscript-loading-shell">
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
            hideHistory={true}
          />
        </div>
      </div>
    );
  }

  // Progressive disclosure responsive strategy (when flag ON):
  // - marginContent slot: suggested actions in right margin (desktop only, hides prompt/custom input)
  // - Action rail primary ChoicesColumn: full choices + prompt (mobile only via lg:hidden)
  // - Action rail secondary ChoicesColumn: custom input only (desktop only via hidden lg:block)
  const sessionActions = !isSessionEnded(sessionId) && (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('narraitor:end-session'))}
      className="manuscript-warning-action-button"
    >
      End Session
    </button>
  );

  const endStoryAction = !isSessionEnded(sessionId) && (
    <button
      type="button"
      onClick={handleEndStoryClick}
      className="manuscript-warning-action-button"
    >
      End Story
    </button>
  );

  return (
    <ManuscriptSessionShell
      hud={
        <ManuscriptFloatingHud
          onToggleCharacterSummary={() => {
            setIsCharacterSummaryExpanded((prev) => {
              const next = !prev;
              if (next) {
                setIsToolsMenuOpen(false);
              }
              return next;
            });
          }}
          isCharacterSummaryExpanded={isCharacterSummaryExpanded}
          onToggleToolsMenu={() => {
            setIsToolsMenuOpen(!isToolsMenuOpen);
            setIsCharacterSummaryExpanded(false);
          }}
          isToolsMenuOpen={isToolsMenuOpen}
          characterSummaryPanel={character && <CharacterSnapshot character={character} />}
          toolsMenuPanel={isProgressiveDisclosureEnabled && (
            <ToolsMenuPanelContent
              activeDrawer={activeDrawer}
              onOpenDrawer={(drawerType) => {
                setActiveDrawer(drawerType);
                setIsToolsMenuOpen(false);
                setIsCharacterSummaryExpanded(false);
              }}
              onClosePanel={() => setIsToolsMenuOpen(false)}
              onOpenJournalRoute={() =>
                router.push(`/worlds/${worldId}/play/journal`)
              }
            />
          )}
          drawerTriggers={isProgressiveDisclosureEnabled}
          rightContent={
            <div className="manuscript-hud-right-controls">
              <SaveIndicator
                status={autoSave.status}
                lastSaveTime={autoSave.lastSaveTime}
                errorMessage={autoSave.errorMessage}
                totalSaves={autoSave.totalSaves}
                onRetryError={autoSave.retry}
                retryable
                compact
              />
              <button
                type="button"
                onClick={onStartNew}
                title="Start New Session"
                className="manuscript-hud-text-button"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onBack}
                title="Back to World"
                className="manuscript-hud-text-button"
              >
                Close
              </button>
            </div>
          }
        />
      }
      marginContent={isProgressiveDisclosureEnabled && latestSegmentWithParticipants &&
        ((latestSegmentWithParticipants.characterIds?.length ?? 0) > 0 ||
         (latestSegmentWithParticipants.metadata?.characterIds?.length ?? 0) > 0) ? (
        <ManuscriptCharactersRail segment={latestSegmentWithParticipants} />
      ) : null}
      actionRail={
        <ManuscriptActionRail isStreaming={isGenerating || isGeneratingChoices}>
          <div className="manuscript-action-rail-stack">
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
              inputActions={sessionActions}
              endStoryAction={endStoryAction}
              isProgressiveDisclosureEnabled={isProgressiveDisclosureEnabled}
              endingSuggestion={showEndingSuggestion && endingSuggestionReason ? {
                reason: endingSuggestionReason,
                onAccept: handleAcceptEndingSuggestion,
                onDismiss: handleRejectEndingSuggestion,
              } : undefined}
            />
          </div>
        </ManuscriptActionRail>
      }
    >
      {isProgressiveDisclosureEnabled && (
        <ManuscriptCharactersRail segment={latestSegmentWithParticipants} variant="mobile-bar" />
      )}
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

      <div className="manuscript-secondary-controls">
        <ActiveGameSessionControls
          character={character}
          characterId={characterId || undefined}
          worldId={worldId}
          sessionId={sessionId}
          showEndConfirmation={showEndConfirmation}
          onConfirmEndStory={handleConfirmEndStory}
          onCloseEndStory={handleCloseEndStory}
          onOpenJournal={() => router.push(`/worlds/${worldId}/play/journal`)}
          isProgressiveDisclosureEnabled={isProgressiveDisclosureEnabled}
        />
      </div>

      {isProgressiveDisclosureEnabled && (
        <ManuscriptDrawer
          open={activeDrawer !== null}
          onOpenChange={(open) => !open && setActiveDrawer(null)}
          title={
            activeDrawer === 'character'
              ? 'Character Sheet'
              : activeDrawer === 'inventory'
                ? 'Inventory'
                              : activeDrawer === 'story-summary'
                                ? 'Story So Far'
                                : activeDrawer === 'choice-history'
                                  ? 'Choice History'
                                  : activeDrawer === 'journal'
                                    ? 'Journal Snapshot'
                                    : ''
                          }
                          subtitle={
                            activeDrawer === 'character'
                              ? character?.name
                              : activeDrawer === 'inventory'
                                ? `Items for ${character?.name}`
                                : activeDrawer === 'story-summary' || activeDrawer === 'choice-history' || activeDrawer === 'journal'
                                  ? `Session ${sessionId.slice(0, 8)}`
                                  : undefined
                          }
                
        >
          {activeDrawer === 'character' && character && (
            <CharacterDrawerContent character={character} />
          )}
          {activeDrawer === 'inventory' && characterId && (
            <InventoryDrawerContent characterId={characterId} />
          )}
          {activeDrawer === 'story-summary' && (
            <StorySummaryDrawerContent
              worldId={worldId}
              sessionId={sessionId}
              characterId={characterId || undefined}
            />
          )}
          {activeDrawer === 'choice-history' && (
            <ChoiceHistoryDrawerContent sessionId={sessionId} />
          )}
          {activeDrawer === 'journal' && (
            <JournalSnapshotDrawerContent sessionId={sessionId} />
          )}
        </ManuscriptDrawer>
      )}
    </ManuscriptSessionShell>
  );
};

export default ActiveGameSession;
