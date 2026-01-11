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
  onSuggestedActionsToggle?: (isExpanded: boolean) => void;
  endingSuggestion?: {
    reason: string;
    onAccept: () => void;
    onDismiss: () => void;
  };
}

const ActiveGameSessionChoicesColumn: React.FC<ActiveGameSessionChoicesColumnProps> = ({
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
  onSuggestedActionsToggle,
  endingSuggestion,
}) => {
  return (
    <div
      className="lg:flex-[1] min-h-0 flex flex-col"
      id="choices-container"
      aria-busy={isGeneratingChoices}
    >
      <div className="player-choices-container flex-1">
        {/* Render ChoiceSelector if we have a decision OR if this is a resumed session with existing segments */}
        {(currentDecision?.decisionWeight || (currentDecision && segmentCount > 0)) ? (
          <ChoiceSelector
            decision={currentDecision}
            onSelect={onChoiceSelected}
            onCustomSubmit={onCustomSubmit}
            enableCustomInput={true}
            isDisabled={status !== 'active' || isGenerating || isSessionEnded}
            worldSkills={worldSkills}
            characterSkills={characterSkills}
            inventoryItems={inventoryItems}
            onSuggestedActionsToggle={onSuggestedActionsToggle}
            endingSuggestion={endingSuggestion}
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
  );
};

export default ActiveGameSessionChoicesColumn;
