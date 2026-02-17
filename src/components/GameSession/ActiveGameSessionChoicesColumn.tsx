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
  const suggestedActionsCount = React.useMemo(() => {
    if (!currentDecision) {
      return 0;
    }

    const suggestedOptions = currentDecision.options.filter(
      (option) => !option.isCustomInput
    );
    return Math.min(suggestedOptions.length, 3);
  }, [currentDecision]);
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
                : `Suggested Actions (${suggestedActionsCount})`}
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
                isProgressiveDisclosureEnabled={isProgressiveDisclosureEnabled}
              />
            </div>
          )
        ) : (
          !hideChoices && (
            <div>
              {/* Choice decision skeleton - matches ChoiceSelector layout */}
              <div>
                {/* Choice prompt skeleton */}
                <div />

                {/* Choice buttons skeleton */}
                {[1, 2, 3].map((i) => (
                  <div key={i} />
                ))}

                {/* Custom input skeleton */}
                <div>
                  <div />
                  <div />
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ActiveGameSessionChoicesColumn;
