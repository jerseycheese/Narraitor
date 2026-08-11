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
import { ManuscriptDecisionBlock } from './ManuscriptDecisionBlock';
import { ManuscriptDrawer } from './ManuscriptDrawer';
import {
  CharacterDrawerContent,
  InventoryDrawerContent,
  StorySummaryDrawerContent,
  ChoiceHistoryDrawerContent,
  JournalSnapshotDrawerContent,
} from './ManuscriptDrawerPanels';
import { CharacterSnapshot } from './CharacterSnapshot';
import { SceneStatus } from './SceneStatus';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { isFeatureEnabled } from '@/lib/featureFlags';

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
  // Live preview of the segment currently generating (issue #1476), fed by
  // the hidden NarrativeController via onStreamingPreviewChange. Cleared
  // whenever a turn stops generating, for whatever reason (completion,
  // error, retry) — isGenerating already tracks all of those.
  const [streamingPreview, setStreamingPreview] = React.useState('');
  React.useEffect(() => {
    if (!isGenerating) {
      setStreamingPreview('');
    }
  }, [isGenerating]);
  const [initialized, setInitialized] = React.useState(false);
  const [currentDecision, setCurrentDecision] = React.useState<Decision | null>(null);
  const [localSelectedChoiceId, setLocalSelectedChoiceId] = React.useState<string | undefined>();
  const [shouldTriggerGeneration, setShouldTriggerGeneration] = React.useState(false);
  const [retryToken, setRetryToken] = React.useState(0);
  const choiceGenerationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Track choice generation for UI state
  const [isGeneratingChoices, setIsGeneratingChoices] = React.useState(false);
  const [isEvaluatingAction, setIsEvaluatingAction] = React.useState(false);
  const [isCharacterSummaryExpanded, setIsCharacterSummaryExpanded] = React.useState(false);
  const [activeDrawer, setActiveDrawer] = React.useState<DrawerType | null>(null);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = React.useState(false);

  const characterButtonRef = React.useRef<HTMLButtonElement>(null);
  const drawerTriggerRef = React.useRef<HTMLElement | null>(null);

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

  // Live story-generation failure for the current turn (timeout, network,
  // provider 429/5xx, bad key). Captured in the store by NarrativeController so
  // the choices column can surface inline error + Retry — see issue #1478.
  const generationError = useNarrativeStore((state) => state.generationError);

  // A failure must drop the "Continuing your story..." spinner/skeleton —
  // otherwise the turn hangs on the loading state forever (the original #1478
  // bug). Clearing both generation flags lets the error surface take over.
  React.useEffect(() => {
    if (generationError) {
      setIsGenerating(false);
      setIsGeneratingChoices(false);
    }
  }, [generationError]);

  // Retry the failed turn: show the spinner again and bump the token the
  // NarrativeController watches to re-run the last generation.
  const handleRetryGeneration = React.useCallback(() => {
    setIsGenerating(true);
    setRetryToken((token) => token + 1);
  }, []);

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

  // Escape for the drawer belongs to Radix, which closes it through
  // onOpenChange and restores focus via the drawer's restoreFocusRef. The
  // character panel is a plain popover with no dialog behaviour of its own,
  // so it still needs its own Escape and focus return.
  React.useEffect(() => {
    if (!isCharacterSummaryExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCharacterSummaryExpanded(false);
        characterButtonRef.current?.focus();
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

  // Every path into a drawer records what had focus, so closing it returns the
  // player where they were. Routing the keyboard shortcut through here too
  // keeps a stale HUD icon from stealing focus back after a `j` open.
  const openDrawer = React.useCallback((drawerType: DrawerType) => {
    drawerTriggerRef.current = document.activeElement as HTMLElement | null;
    setActiveDrawer(drawerType);
    setIsCharacterSummaryExpanded(false);
  }, []);

  // Journal opens as a drawer under progressive disclosure, otherwise it's a
  // route (matches the two "Open Journal" entry points already in the HUD /
  // ActiveGameSessionControls).
  const handleOpenJournalShortcut = React.useCallback(() => {
    if (isProgressiveDisclosureEnabled) {
      openDrawer('journal');
    } else {
      router.push(`/worlds/${worldId}/play/journal`);
    }
  }, [isProgressiveDisclosureEnabled, openDrawer, router, worldId]);

  const handleToggleCharacterShortcut = React.useCallback(() => {
    setIsCharacterSummaryExpanded((prev) => !prev);
  }, []);

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

  // True while any modal/dialog is up over the session (shortcuts help, a
  // progressive-disclosure drawer, or the End Story confirmation). Global
  // hotkeys - both the j/c/? bindings below and ChoiceSelector's number keys
  // - must not fire while one of these is open: the underlying content stays
  // mounted behind the overlay, so without this gate a player reading the
  // shortcuts dialog could press "1" and silently advance the turn behind it
  // (#276 review follow-up). The character summary panel is deliberately
  // excluded - it's non-modal and doesn't trap focus.
  const isModalOpen = isShortcutsHelpOpen || activeDrawer !== null || showEndConfirmation;

  // Game-session keyboard shortcuts (#276): number keys for choices live in
  // ChoiceSelector itself since that's where the option list is. These cover
  // the remaining common actions the issue calls out - journal, character
  // sheet, and a discoverable reference for all of it. Only active once the
  // session has rendered its real HUD (isGameReady) and no modal is already
  // covering it.
  const gameSessionShortcuts = React.useMemo(
    () => [
      {
        key: '?',
        description: 'Show keyboard shortcuts',
        action: () => setIsShortcutsHelpOpen(true),
      },
      {
        key: 'j',
        description: 'Open journal',
        action: handleOpenJournalShortcut,
      },
      {
        key: 'c',
        description: 'Toggle character sheet',
        action: handleToggleCharacterShortcut,
      },
    ],
    [handleOpenJournalShortcut, handleToggleCharacterShortcut]
  );
  useKeyboardShortcuts(gameSessionShortcuts, isGameReady && !isModalOpen);

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

  // One modal decision at a time (#1536): the End Story confirmation renders
  // without a focus trap, so the HUD Close/Reset controls stay reachable while
  // it is open. Those controls hand off to page-level confirmation dialogs, so
  // close the End Story confirmation first or both dialogs mount at once.
  const handleHudBack = React.useCallback(() => {
    handleCloseEndStory();
    onBack?.();
  }, [handleCloseEndStory, onBack]);

  const handleHudStartNew = React.useCallback(() => {
    handleCloseEndStory();
    onStartNew?.();
  }, [handleCloseEndStory, onStartNew]);

  // If we have an ending, show the ending screen instead
  if (currentEnding) {
    return <EndingScreen />;
  }
  
  // If generating ending, show loading state
  if (isGeneratingEnding) {
    return (
      <div className="manuscript-loading-shell">
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
    : undefined;

  return (
    <ManuscriptSessionShell
      hud={
        <ManuscriptFloatingHud
          characterButtonRef={characterButtonRef}
          onToggleCharacterSummary={() => {
            setIsCharacterSummaryExpanded((prev) => !prev);
          }}
          isCharacterSummaryExpanded={isCharacterSummaryExpanded}
          characterSummaryPanel={character && <CharacterSnapshot character={character} />}
          drawerTriggers={isProgressiveDisclosureEnabled}
          characterName={character?.name}
          characterPortrait={character?.portrait}
          onOpenDrawer={(drawerType) => openDrawer(drawerType as DrawerType)}
          onStartNew={handleHudStartNew}
          onBack={handleHudBack}
          onEndStory={handleEndStoryClick}
          onShowShortcuts={() => setIsShortcutsHelpOpen(true)}
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
        />
      }
      marginContent={hasSceneStatus ? (
        <SceneStatus segment={latestSegment} />
      ) : null}
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
        retryToken={retryToken}
        isGenerating={isGenerating}
        streamingContent={streamingPreview}
        onStreamingPreviewChange={setStreamingPreview}
      />

      <ManuscriptDecisionBlock isStreaming={isGenerating || isGeneratingChoices}>
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
          generationError={generationError}
          onRetryGeneration={handleRetryGeneration}
          shortcutsSuspended={isModalOpen}
        />
      </ManuscriptDecisionBlock>

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
          restoreFocusRef={drawerTriggerRef}
          onOpenChange={(open) => {
            if (!open) {
              setActiveDrawer(null);
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
                            // Session-scoped drawers show the world name as
                            // readable context — never the raw persistence ID,
                            // which truncated to "Session session-" (#1534).
                            // No world name means no subtitle at all.
                            activeDrawer === 'character'
                              ? character?.name
                              : activeDrawer === 'inventory'
                                ? `Items for ${character?.name}`
                                : activeDrawer === 'story-summary' || activeDrawer === 'choice-history' || activeDrawer === 'journal'
                                  ? world?.name
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

      <KeyboardShortcutsDialog
        open={isShortcutsHelpOpen}
        onOpenChange={setIsShortcutsHelpOpen}
      />
    </ManuscriptSessionShell>
  );
};

export default ActiveGameSession;
