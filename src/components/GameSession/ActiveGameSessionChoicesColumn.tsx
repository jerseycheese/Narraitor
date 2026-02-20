'use client';

import React from 'react';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import type { Decision } from '@/types/narrative.types';
import type { WorldSkill } from '@/types/world.types';
import type { InventoryItem } from '@/types/inventory.types';
import type { CharacterSkill } from '@/state/characterStore';

interface ActiveGameSessionChoicesColumnProps {
  currentDecision: Decision | null;
  segmentCount: number;
  status: 'active' | 'paused' | 'ended';
  isGenerating: boolean;
  isGeneratingChoices: boolean;
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
}

const ActiveGameSessionChoicesColumn: React.FC<
  ActiveGameSessionChoicesColumnProps
> = ({
  currentDecision,
  segmentCount,
  status,
  isGenerating,
  isGeneratingChoices,
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
}) => {
  const [showSuggestedActions, setShowSuggestedActions] = React.useState(false);
  const renderEndStoryAction = React.useCallback(() => {
    if (!endStoryAction) {
      return null;
    }

    return React.isValidElement(endStoryAction)
      ? React.cloneElement(endStoryAction)
      : endStoryAction;
  }, [endStoryAction]);

  const resolvedInputActions = isProgressiveDisclosureEnabled ? (
    <>
      {inputActions}
      <span className="hidden lg:inline-flex">{renderEndStoryAction()}</span>
    </>
  ) : (
    inputActions
  );

  return (
    <div className={className} aria-busy={isGeneratingChoices}>
      <div className="player-choices-container" data-tutorial={dataTutorial}>
        {/* Context summary shown above suggested actions toggle on mobile, and above selector on desktop */}
        {isProgressiveDisclosureEnabled && currentDecision?.contextSummary && !hidePrompt && (
          <p className="manuscript-context-summary mb-1.5 px-1">
            {currentDecision.contextSummary}
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
            <span className="lg:hidden">{renderEndStoryAction()}</span>
          </div>
        )}

        {/* Render ChoiceSelector if we have a decision OR if this is a resumed session with existing segments */}
        {currentDecision?.decisionWeight ||
        (currentDecision && segmentCount > 0) ? (
          !hideChoices && (
            <div className={isProgressiveDisclosureEnabled ? (showSuggestedActions ? 'show-mobile-actions' : 'hide-mobile-actions') : ''}>
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
              />
            </div>
          )
        ) : (
          !hideChoices && (
            <div className="choice-selector manuscript-choice-selector animate-pulse">
              <div className="manuscript-choice-selector-body">
                {/* Choice prompt skeleton */}
                {!hidePrompt && <div className="manuscript-choice-prompt bg-muted rounded h-6 w-3/4 mb-4" />}

                {/* Choice buttons skeleton */}
                <div className="manuscript-suggested-actions-grid">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="manuscript-suggested-action bg-muted rounded h-[4.125rem]" />
                  ))}
                </div>

                {/* Custom input skeleton */}
                {!hideCustomInput && (
                  <div className="manuscript-input-row mt-4">
                    <div className="manuscript-custom-input bg-muted rounded flex-1" />
                    <div className="manuscript-send-button bg-muted rounded w-16" />
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ActiveGameSessionChoicesColumn;
