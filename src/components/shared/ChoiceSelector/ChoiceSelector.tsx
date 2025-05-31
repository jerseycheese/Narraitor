'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Decision, ChoiceAlignment } from '@/types/narrative.types';

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
  
  // Custom input props
  enableCustomInput?: boolean;
  onCustomSubmit?: (customText: string) => void;
  customInputPlaceholder?: string;
  maxCustomLength?: number;
}

/**
 * Get CSS classes for alignment-based styling
 */
const getAlignmentClasses = (alignment?: ChoiceAlignment): string => {
  switch (alignment) {
    case 'lawful':
      return 'bg-blue-50 border-blue-300 hover:bg-blue-100';
    case 'chaos':
      return 'bg-red-50 border-red-300 hover:bg-red-100';
    case 'neutral':
    default:
      return 'bg-white border-gray-200 hover:bg-gray-50';
  }
};

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
  enableCustomInput = false,
  onCustomSubmit,
  customInputPlaceholder = 'Type your custom response...',
  maxCustomLength = 250,
}) => {
  // Custom input state
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputText, setCustomInputText] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  
  // Ref for auto-focusing input
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Determine what data we're working with
  const isDecisionMode = !!decision;
  
  // Normalize the data into a common format
  const normalizedOptions: Array<{
    id: string;
    text: string;
    hint?: string;
    isSelected?: boolean;
    alignment?: ChoiceAlignment;
  }> = isDecisionMode
    ? (decision.options || []).map(opt => ({
        id: opt.id,
        text: opt.text,
        hint: opt.hint,
        isSelected: opt.id === decision.selectedOptionId || opt.id === selectedOptionId,
        alignment: opt.alignment,
      }))
    : (choices || []).map(choice => ({
        id: choice.id,
        text: choice.text,
        isSelected: choice.isSelected || choice.id === selectedOptionId,
        alignment: 'neutral' as ChoiceAlignment, // Default for simple choices
      }));

  // Add custom input option if enabled
  const customOption = enableCustomInput ? {
    id: 'custom-input',
    text: 'Custom response...',
    isSelected: showCustomInput,
    hint: undefined,
    alignment: 'neutral' as ChoiceAlignment,
  } : null;

  // Combine options with custom option at the top
  const allOptions = customOption ? [customOption, ...normalizedOptions] : normalizedOptions;

  // Determine the prompt text
  const displayPrompt = prompt || (isDecisionMode ? decision.prompt : 'What will you do?');

  // Auto-focus input when revealed
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  // Handle option selection
  const handleOptionSelect = useCallback((optionId: string) => {
    if (optionId === 'custom-input') {
      setShowCustomInput(true);
      setSelectedOptionId('custom-input');
    } else {
      setShowCustomInput(false);
      setSelectedOptionId(optionId);
      onSelect(optionId);
    }
  }, [onSelect]);

  // Handle custom input submission
  const handleCustomSubmit = useCallback(() => {
    const trimmedText = customInputText.trim();
    if (trimmedText && onCustomSubmit) {
      onCustomSubmit(trimmedText);
      setCustomInputText('');
      // Keep input field visible after submission
    }
  }, [customInputText, onCustomSubmit]);

  // Handle Enter key in textarea
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSubmit();
    }
  }, [handleCustomSubmit]);

  // Handle input change with character limit
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxCustomLength) {
      setCustomInputText(value);
    }
  }, [maxCustomLength]);

  // Calculate character count styling
  const characterCount = customInputText.length;
  const characterCountClass = characterCount >= maxCustomLength 
    ? 'text-red-600' 
    : characterCount >= maxCustomLength * 0.8 
    ? 'text-amber-600' 
    : 'text-gray-500';

  // Don't render if no options
  if (allOptions.length === 0) {
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
        {allOptions.map((option) => (
          <div key={option.id}>
            <button
              data-testid={`choice-option-${option.id}`}
              className={`block w-full text-left p-3 border rounded transition-colors ${
                option.isSelected
                  ? 'bg-blue-100 border-blue-500 font-bold'
                  : getAlignmentClasses(option.alignment)
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => handleOptionSelect(option.id)}
              disabled={isDisabled}
              aria-checked={option.isSelected}
              role="radio"
            >
              {option.isSelected ? '➤ ' : ''}{option.text}
              {showHints && option.hint && (
                <span className="block text-sm text-gray-500 mt-1">{option.hint}</span>
              )}
            </button>
            
            {/* Custom input field */}
            {option.id === 'custom-input' && showCustomInput && (
              <div className="mt-3 ml-6 mr-2 bg-gray-50 p-4 rounded border">
                <textarea
                  ref={inputRef}
                  value={customInputText}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={customInputPlaceholder}
                  disabled={isDisabled}
                  aria-label="Custom response input"
                  className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  rows={3}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-sm ${characterCountClass}`}>
                    {characterCount}/{maxCustomLength}
                  </span>
                  <button
                    onClick={handleCustomSubmit}
                    disabled={isDisabled || !customInputText.trim()}
                    className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChoiceSelector;