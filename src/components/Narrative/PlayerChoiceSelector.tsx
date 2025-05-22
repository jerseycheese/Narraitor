'use client';

import React from 'react';
import { Decision } from '@/types/narrative.types';

interface PlayerChoiceSelectorProps {
  decision: Decision;
  onSelect: (optionId: string) => void;
  isDisabled?: boolean;
  className?: string;
}

/**
 * PlayerChoiceSelector component for displaying decision options to the player
 */
const PlayerChoiceSelector: React.FC<PlayerChoiceSelectorProps> = ({
  decision,
  onSelect,
  isDisabled = false,
  className = '',
}) => {
  if (!decision || !decision.options || decision.options.length === 0) {
    return null;
  }

  return (
    <div 
      data-testid="player-choice-selector" 
      className={`player-choice-selector mt-6 ${className}`}
    >
      <h3 
        className="text-lg font-semibold mb-2" 
        id="choices-heading"
      >
        {decision.prompt}
      </h3>
      
      <div 
        className="space-y-2" 
        role="radiogroup" 
        aria-labelledby="choices-heading"
      >
        {decision.options.map((option) => (
          <button
            key={option.id}
            data-testid={`player-choice-option-${option.id}`}
            className={`block w-full text-left p-3 border rounded transition-colors ${
              option.id === decision.selectedOptionId
                ? 'bg-blue-100 border-blue-500 font-bold'
                : 'bg-white hover:bg-gray-50'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => onSelect(option.id)}
            disabled={isDisabled}
            aria-checked={option.id === decision.selectedOptionId}
            role="radio"
          >
            {option.id === decision.selectedOptionId ? '➤ ' : ''}{option.text}
            {option.hint && (
              <span className="block text-sm text-gray-500 mt-1">{option.hint}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlayerChoiceSelector;