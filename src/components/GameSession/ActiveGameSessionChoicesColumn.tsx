'use client';

import React from 'react';
import { clsx } from 'clsx';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import type { Decision } from '@/types/narrative.types';
import type { WorldSkill } from '@/types/world.types';
import type { InventoryItem } from '@/types/inventory.types';
import type { CharacterSkill } from '@/state/characterStore';
import type { NarrativeError } from '@/lib/narrative/narrativeErrors';

interface ActiveGameSessionChoicesColumnProps {
  currentDecision: Decision | null;
  segmentCount: number;
  status: 'active' | 'paused' | 'ended';
  isGenerating: boolean;
  isGeneratingChoices: boolean;
  isEvaluatingAction?: boolean;
  isSessionEnded: boolean;
  worldSkills: WorldSkill[];
  characterSkills: CharacterSkill[];
  inventoryItems: InventoryItem[];
  onChoiceSelected: (choiceId: string) => void;
  onCustomSubmit: (customText: string) => void;
  inputActions?: React.ReactNode;
  endStoryAction?: React.ReactNode;
  isProgressiveDisclosureEnabled?: boolean;
  hidePrompt?: boolean;
  hideChoices?: boolean;
  hideCustomInput?: boolean;
  dataTutorial?: string;
  className?: string;
  endingSuggestion?: {
    reason: string;
    onAccept: () => void;
    onDismiss: () => void;
  };
  /** Classified narrative-generation failure for the current turn, if any. */
  generationError?: NarrativeError | null;
  /** Retry the failed turn (only meaningful for transient/retryable errors). */
  onRetryGeneration?: () => void;
  /** Suppress ChoiceSelector's number-key shortcuts while a modal/dialog is open over the session (#276). */
  shortcutsSuspended?: boolean;
}

const ActiveGameSessionChoicesColumn: React.FC<
  ActiveGameSessionChoicesColumnProps
> = ({
  currentDecision,
  segmentCount,
  status,
  isGenerating,
  isGeneratingChoices,
  isEvaluatingAction = false,
  isSessionEnded,
  worldSkills,
  characterSkills,
  inventoryItems,
  onChoiceSelected,
  onCustomSubmit,
  inputActions,
  endStoryAction,
  isProgressiveDisclosureEnabled = false,
  hidePrompt = false,
  hideChoices = false,
  hideCustomInput = false,
  dataTutorial = 'player-choices',
  className = '',
  endingSuggestion,
  generationError = null,
  onRetryGeneration,
  shortcutsSuspended = false,
}) => {
  const [showSuggestedActions, setShowSuggestedActions] = React.useState(false);

  // Show the failure surface only once the turn has settled into an error —
  // never mid-generation — so a Retry that flips isGenerating back on hides it
  // immediately instead of flashing under the spinner.
  const showGenerationError =
    !!generationError &&
    !isGenerating &&
    !isGeneratingChoices &&
    !isEvaluatingAction;
  const renderEndStoryAction = React.useCallback(() => {
    if (!endStoryAction) {
      return null;
    }

    return React.isValidElement(endStoryAction)
      ? React.cloneElement(endStoryAction)
      : endStoryAction;
  }, [endStoryAction]);

  // The decision goes null for a beat while the next turn generates. Letting
  // the context summary blink out with it slides the whole choice block up and
  // back down again, so hold the last one until a new decision replaces it.
  // Tracking the whole decision, not just a non-empty summary: a replacement
  // decision that legitimately has no summary must clear the held one rather
  // than leave the previous turn's context sitting over the new choices.
  const lastContextSummary = React.useRef<string | undefined>(undefined);
  if (currentDecision) {
    lastContextSummary.current = currentDecision.contextSummary;
  }
  const contextSummary =
    currentDecision?.contextSummary ?? lastContextSummary.current;

  // The skeleton wears the same visibility class as the real selector so it
  // predicts the same height — below the desktop breakpoint that means the
  // prompt is hidden in both, not just in the choices that replace it.
  const mobileActionsClass = isProgressiveDisclosureEnabled
    ? showSuggestedActions
      ? 'show-mobile-actions'
      : 'hide-mobile-actions'
    : '';

  const resolvedInputActions = isProgressiveDisclosureEnabled ? (
    <>
      {inputActions}
      <span className="manuscript-end-story-desktop">{renderEndStoryAction()}</span>
    </>
  ) : (
    inputActions
  );

  return (
    <div
      className={clsx('manuscript-choices-column', className)}
      aria-busy={isGeneratingChoices || isEvaluatingAction}
    >
      {/* The slot stays mounted whether or not a turn is in flight, so the
          status line appearing doesn't shove the choices down the rail. */}
      <div className="manuscript-turn-status-slot">
        {isEvaluatingAction ? (
          <div className="manuscript-evaluating-indicator" role="status">
            <span className="manuscript-evaluating-die" aria-hidden="true" />
            <span className="manuscript-evaluating-label">Evaluating action...</span>
          </div>
        ) : (
          (isGenerating || isGeneratingChoices) && (
            <div className="manuscript-streaming-indicator">
              <span className="manuscript-streaming-dot" />
              <span className="manuscript-streaming-label">Continuing your story...</span>
            </div>
          )
        )}
      </div>
      <div className="player-choices-container" data-tutorial={dataTutorial}>
        {showGenerationError ? (
          <div
            className={`manuscript-generation-error${
              generationError.retryable ? '' : ' manuscript-generation-error-terminal'
            }`}
            role="alert"
          >
            <p className="manuscript-generation-error-title">
              {generationError.title}
            </p>
            <p className="manuscript-generation-error-message">
              {generationError.message}
            </p>
            {generationError.suggestion && (
              <p className="manuscript-generation-error-suggestion">
                {generationError.suggestion}
              </p>
            )}
            {generationError.retryable && onRetryGeneration && (
              <button
                type="button"
                className="manuscript-generation-error-retry"
                onClick={onRetryGeneration}
              >
                {generationError.retryLabel}
              </button>
            )}
          </div>
        ) : (
        <>
        {/* Context summary shown above suggested actions toggle on mobile, and above selector on desktop */}
        {isProgressiveDisclosureEnabled && contextSummary && !hidePrompt && (
          <p className="manuscript-context-summary">
            {contextSummary}
          </p>
        )}

        {/* Mobile-only top controls for Suggested Actions toggle and End Story */}
        {isProgressiveDisclosureEnabled && (
          <div className="manuscript-mobile-rail-top-controls">
            <button
              type="button"
              className="manuscript-mobile-suggested-actions-toggle"
              aria-expanded={showSuggestedActions}
              onClick={() => setShowSuggestedActions(!showSuggestedActions)}
            >
              {showSuggestedActions
                ? 'Hide Suggested Actions'
                : 'Suggested Actions'}
            </button>
            <span className="manuscript-end-story-mobile">{renderEndStoryAction()}</span>
          </div>
        )}

        {/* Render ChoiceSelector if we have a decision OR if this is a resumed
            session with existing segments — but while the next turn's choices
            are generating, fall through to the skeleton so stale choices don't
            linger then flip (F48). */}
        {(currentDecision?.decisionWeight ||
          (currentDecision && segmentCount > 0)) &&
        !isGeneratingChoices ? (
          !hideChoices && (
            <div className={clsx('manuscript-choice-selector-wrapper', mobileActionsClass)}>
              <ChoiceSelector
                decision={currentDecision}
                onSelect={onChoiceSelected}
                onCustomSubmit={onCustomSubmit}
                enableCustomInput={true}
                hidePrompt={hidePrompt}
                hideCustomInput={hideCustomInput}
                isDisabled={status !== 'active' || isGenerating || isSessionEnded}
                worldSkills={worldSkills}
                characterSkills={characterSkills}
                inventoryItems={inventoryItems}
                endingSuggestion={endingSuggestion}
                inputActions={resolvedInputActions}
                shortcutsSuspended={shortcutsSuspended}
              />
            </div>
          )
        ) : (
          !hideChoices && (
            <div className={`choice-selector manuscript-choice-selector manuscript-choices-skeleton ${mobileActionsClass}`}>
              <div className="manuscript-choice-selector-body">
                {/* Choice prompt skeleton */}
                {!hidePrompt && <div className="manuscript-choices-skeleton-prompt manuscript-skeleton-pulse" />}

                {/* Choice buttons skeleton. Wrapped in the same section the
                    real selector uses so it inherits the scroll region and the
                    swap between them doesn't move the pinned composer. */}
                <div className="manuscript-suggested-actions-section">
                  <div className="manuscript-suggested-actions-grid">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="manuscript-choices-skeleton-action manuscript-skeleton-pulse" />
                    ))}
                  </div>
                </div>

                {/* Custom input skeleton */}
                {!hideCustomInput && (
                  <div className="manuscript-choices-skeleton-input-row">
                    <div className="manuscript-choices-skeleton-input manuscript-skeleton-pulse" />
                    <div className="manuscript-choices-skeleton-send manuscript-skeleton-pulse" />
                  </div>
                )}
              </div>
            </div>
          )
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default ActiveGameSessionChoicesColumn;
