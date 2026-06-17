'use client';

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
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
import { HudCloseButton } from './HudCloseButton';
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
import { SceneStatus } from './SceneStatus';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useTheme } from '@/lib/theme/ThemeProvider';

type DrawerType = 'character' | 'inventory' | 'story-summary' | 'choice-history' | 'journal';

interface ActiveGameSessionProps {
  worldId: string;
  sessionId: string;
  world?: World;
  status?: 'active' | 'paused' | 'ended';
  onChoiceSelected: (choiceId: string) => void;
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
  const [isEvaluatingAction, setIsEvaluatingAction] = React.useState(false);
  const [isCharacterSummaryExpanded, setIsCharacterSummaryExpanded] = React.useState(false);
  const [activeDrawer, setActiveDrawer] = React.useState<DrawerType | null>(null);
  const [lastOpenedDrawer, setLastOpenedDrawer] = React.useState<DrawerType | null>(null);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = React.useState(false);

  const characterButtonRef = React.useRef<HTMLButtonElement>(null);
  const toolsButtonRef = React.useRef<HTMLButtonElement>(null);
  const drawerTriggerRef = React.useRef<HTMLElement | null>(null);
  const [isStreamingPreview, setIsStreamingPreview] = React.useState(false);
  const [isEndingSuggestionPreview, setIsEndingSuggestionPreview] = React.useState(false);

  const isProgressiveDisclosureEnabled = isFeatureEnabled('PROGRESSIVE_DISCLOSURE');
  const { theme } = useTheme();
  const isDS3 = theme === 'ds3';

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
  
  // Get narrative store for ending functionality. Scope to just the ending
  // slice (via useShallow) so the game shell doesn't re-render on every
  // narrative-store write — segments stream in continuously during play.
  const { currentEnding, isGeneratingEnding, generateEnding, isSessionEnded } =
    useNarrativeStore(
      useShallow((state) => ({
        currentEnding: state.currentEnding,
        isGeneratingEnding: state.isGeneratingEnding,
        generateEnding: state.generateEnding,
        isSessionEnded: state.isSessionEnded,
      }))
    );

  // Reactively track segment count using a stable snapshot to avoid infinite loops.
  // Selecting derived arrays from Zustand can cause non-cached snapshots.
  const segmentCount = useNarrativeStore((state) => (state.sessionSegments[sessionId]?.length ?? 0));

  // Scene status reflects the absolute latest segment so location and
  // participants track the current scene, not the last segment that happened to
  // list characters (which would leave a newer location/participant set stale).
  const latestSegment = useNarrativeStore((state) => {
    const segmentIds = state.sessionSegments[sessionId] || [];
    if (segmentIds.length === 0) return null;
    return state.segments[segmentIds[segmentIds.length - 1]] || null;
  });

  // Show the scene status surface whenever the latest segment has participants
  // or a location to report; mirrors SceneStatus' own empty check so the shell
  // can collapse the rail column when there's nothing to show.
  const hasSceneStatus =
    !!latestSegment &&
    ((latestSegment.characterIds?.length ?? 0) > 0 ||
      (latestSegment.metadata?.characterIds?.length ?? 0) > 0 ||
      !!latestSegment.metadata?.location);

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
        if (activeDrawer !== null) {
          setActiveDrawer(null);
          drawerTriggerRef.current?.focus();
          drawerTriggerRef.current = null;
          return;
        }
        if (isToolsMenuOpen) {
          setIsToolsMenuOpen(false);
          toolsButtonRef.current?.focus();
          return;
        }
        if (isCharacterSummaryExpanded) {
          setIsCharacterSummaryExpanded(false);
          characterButtonRef.current?.focus();
          return;
        }
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
    setIsEvaluatingAction,
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
  const endStoryAction = !isSessionEnded(sessionId) && (
    <button
      type="button"
      onClick={handleEndStoryClick}
      className="manuscript-warning-action-button"
    >
      End Story
    </button>
  );

  const endingSuggestion = showEndingSuggestion && endingSuggestionReason
    ? {
        reason: endingSuggestionReason,
        onAccept: handleAcceptEndingSuggestion,
        onDismiss: handleRejectEndingSuggestion,
      }
    : isEndingSuggestionPreview
      ? {
          reason: 'Draft ending preview from Tools panel.',
          onAccept: () => {
            setIsEndingSuggestionPreview(false);
            handleEndStoryClick();
          },
          onDismiss: () => setIsEndingSuggestionPreview(false),
        }
      : undefined;

  return (
    <ManuscriptSessionShell
      hud={
        <ManuscriptFloatingHud
          characterButtonRef={characterButtonRef}
          toolsButtonRef={toolsButtonRef}
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
              activeDrawer={activeDrawer ?? lastOpenedDrawer}
              onOpenDrawer={(drawerType) => {
                drawerTriggerRef.current = document.activeElement as HTMLElement;
                setActiveDrawer(drawerType);
                setLastOpenedDrawer(drawerType);
                setIsCharacterSummaryExpanded(false);
              }}
              onClosePanel={() => setIsToolsMenuOpen(false)}
              onOpenJournalRoute={() =>
                router.push(`/worlds/${worldId}/play/journal`)
              }
              onOpenCharacterPanel={() => {
                setIsCharacterSummaryExpanded(true);
              }}
              onSimulateTurn={() => {
                const fallbackChoiceId = currentDecision?.options?.[0]?.id;
                if (fallbackChoiceId) {
                  handleChoiceSelected(fallbackChoiceId);
                  return;
                }
                handleCustomSubmit('Simulate next turn');
              }}
              onToggleStreamingPreview={() => {
                setIsStreamingPreview((prev) => !prev);
              }}
              isStreamingPreview={isStreamingPreview}
              onToggleEndingSuggestionPreview={() => {
                setIsEndingSuggestionPreview((prev) => !prev);
              }}
              isEndingSuggestionPreview={isEndingSuggestionPreview}
            />
          )}
          drawerTriggers={isProgressiveDisclosureEnabled}
          characterName={character?.name}
          onOpenDrawer={(drawerType) => {
            drawerTriggerRef.current = document.activeElement as HTMLElement;
            setActiveDrawer(drawerType as DrawerType);
            setLastOpenedDrawer(drawerType as DrawerType);
            setIsCharacterSummaryExpanded(false);
          }}
          onStartNew={onStartNew}
          onBack={onBack}
          onEndStory={handleEndStoryClick}
          saveIndicator={
            <SaveIndicator
              status={autoSave.status}
              lastSaveTime={autoSave.lastSaveTime}
              errorMessage={autoSave.errorMessage}
              totalSaves={autoSave.totalSaves}
              onRetryError={autoSave.retry}
              retryable
              compact
              className="manuscript-save-indicator"
            />
          }
          rightContent={isDS3 ? undefined : (
            <div className="manuscript-hud-right-controls">
              <SaveIndicator
                status={autoSave.status}
                lastSaveTime={autoSave.lastSaveTime}
                errorMessage={autoSave.errorMessage}
                totalSaves={autoSave.totalSaves}
                onRetryError={autoSave.retry}
                retryable
                compact
                className="manuscript-save-indicator"
              />
              <button
                type="button"
                onClick={onStartNew}
                title="Start New Session"
                className="manuscript-hud-text-button manuscript-hud-reset-button"
              >
                Reset
              </button>
              <HudCloseButton variant="text" onBack={onBack} />
            </div>
          )}
        />
      }
      marginContent={hasSceneStatus ? (
        <SceneStatus segment={latestSegment} />
      ) : null}
      actionRail={
        <ManuscriptActionRail
          isStreaming={isGenerating || isGeneratingChoices || isStreamingPreview}
        >
          <div className="manuscript-action-rail-stack">
            <ActiveGameSessionChoicesColumn
              currentDecision={currentDecision}
              segmentCount={segmentCount}
              status={status}
              isGenerating={isGenerating}
              isGeneratingChoices={isGeneratingChoices}
              isEvaluatingAction={isEvaluatingAction}
              isSessionEnded={isSessionEnded(sessionId)}
              worldSkills={world?.skills || []}
              characterSkills={characterSkills}
              inventoryItems={inventoryItems}
              onChoiceSelected={handleChoiceSelected}
              onCustomSubmit={handleCustomSubmit}
              inputActions={null}
              endStoryAction={endStoryAction}
              isProgressiveDisclosureEnabled={isProgressiveDisclosureEnabled}
              endingSuggestion={endingSuggestion}
            />
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
          onOpenChange={(open) => {
            if (!open) {
              setActiveDrawer(null);
              drawerTriggerRef.current?.focus();
              drawerTriggerRef.current = null;
            }
          }}
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
