'use client';

import React from 'react';
import { Decision } from '@/types/narrative.types';

// Simple choice interface for backwards compatibility
export interface SimpleChoice {
  id: string;
  text: string;
  isSelected?: boolean;
}

// Unified props that can accept either simple choices or a Decision
interface ChoiceSelectorProps {
  // Either simple choices or a decision object
  choices?: SimpleChoice[];
  decision?: Decision;
  
  // Common props
  prompt?: string; // Override prompt text
  onSelect: (choiceId: string) => void;
  isDisabled?: boolean;
  className?: string;
  showHints?: boolean; // Whether to show hints when available
}

/**
 * Unified choice selector component that handles both simple choices and complex decisions
 */
const ChoiceSelector: React.FC<ChoiceSelectorProps> = ({
  choices,
  decision,
  prompt,
  onSelect,
  isDisabled = false,
  className = '',
  showHints = true,
}) => {
  // Determine what data we're working with
  const isDecisionMode = !!decision;
  
  // Normalize the data into a common format
  const normalizedOptions: Array<{
    id: string;
    text: string;
    hint?: string;
    isSelected?: boolean;
  }> = isDecisionMode
    ? (decision.options || []).map(opt => ({
        id: opt.id,
        text: opt.text,
        hint: opt.hint,
        isSelected: opt.id === decision.selectedOptionId,
      }))
    : (choices || []).map(choice => ({
        id: choice.id,
        text: choice.text,
        isSelected: choice.isSelected,
      }));

  // Determine the prompt text
  const displayPrompt = prompt || (isDecisionMode ? decision.prompt : 'What will you do?');

  // Don't render if no options
  if (normalizedOptions.length === 0) {
    return null;
  }

  return (
    <div 
      data-testid="choice-selector" 
      className={`choice-selector mt-6 ${className}`}
    >
      <h3 
        className="text-lg font-semibold mb-2" 
        id="choices-heading"
      >
        {displayPrompt}
      </h3>
      
      <div 
        className="space-y-2" 
        role="radiogroup" 
        aria-labelledby="choices-heading"
      >
        {normalizedOptions.map((option) => (
          <button
            key={option.id}
            data-testid={`choice-option-${option.id}`}
            className={`block w-full text-left p-3 border rounded transition-colors ${
              option.isSelected
                ? 'bg-blue-100 border-blue-500 font-bold'
                : 'bg-white hover:bg-gray-50'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => onSelect(option.id)}
            disabled={isDisabled}
            aria-checked={option.isSelected}
            role="radio"
          >
            {option.isSelected ? '➤ ' : ''}{option.text}
            {showHints && option.hint && (
              <span className="block text-sm text-gray-500 mt-1">{option.hint}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChoiceSelector;