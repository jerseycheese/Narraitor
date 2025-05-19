'use client';

import React from 'react';

interface Choice {
  id: string;
  text: string;
  isSelected?: boolean;
}

interface PlayerChoicesProps {
  choices: Choice[];
  onChoiceSelected: (choiceId: string) => void;
  isDisabled?: boolean;
}

const PlayerChoices: React.FC<PlayerChoicesProps> = ({
  choices,
  onChoiceSelected,
  isDisabled = false,
}) => {
  if (!choices || choices.length === 0) {
    return null;
  }

  return (
    <div data-testid="player-choices" className="mt-4">
      <h3 className="text-lg font-semibold mb-2" id="choices-heading">
        What will you do?
      </h3>
      <div className="space-y-2" role="radiogroup" aria-labelledby="choices-heading">
        {choices.map((choice) => (
          <button
            key={choice.id}
            data-testid={`player-choice-${choice.id}`}
            className={`block w-full text-left p-3 border rounded transition-colors ${
              choice.isSelected
                ? 'bg-blue-100 border-blue-500 font-bold'
                : 'bg-white hover:bg-gray-50'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => onChoiceSelected(choice.id)}
            disabled={isDisabled}
            aria-checked={choice.isSelected}
            role="radio"
          >
            {choice.isSelected ? '➤ ' : ''}{choice.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlayerChoices;