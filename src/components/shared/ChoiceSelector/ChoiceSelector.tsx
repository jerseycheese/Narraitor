'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { Decision } from '@/types/narrative.types';
import { WorldSkill } from '@/types/world.types';
import { InventoryItem } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { EndingSuggestionBanner } from '@/components/GameSession/EndingSuggestionBanner';
import { safeTrim } from '@/lib/utils';
import { normalizeDecisionOptions, normalizeSimpleChoices } from './optionNormalizer';
import { SkillRequirementBadges, ItemRequirementBadges } from './RequirementBadges';
import { getAlignmentIcon, getAlignmentClasses, getDecisionWeightStyling } from './choiceStyling';

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

  // Requirement evaluation props
  worldSkills?: WorldSkill[];
  characterSkills?: Array<{
    id: string;
    characterId: string;
    worldSkillId?: string;
    name: string;
    level: number;
    category?: string;
  }>;
  inventoryItems?: InventoryItem[];

  // Ending suggestion props
  endingSuggestion?: {
    reason: string;
    onAccept: () => void;
    onDismiss: () => void;
  };
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
  enableCustomInput = false,
  onCustomSubmit,
  customInputPlaceholder = 'Type your custom response...',
  maxCustomLength = 250,
  worldSkills = [],
  characterSkills = [],
  inventoryItems = [],
  endingSuggestion,
}) => {
  // Custom input state
  const [customInputText, setCustomInputText] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  
  // Ref for auto-focusing input
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Determine what data we're working with
  const isDecisionMode = !!decision;

  // Create character object for requirement evaluation
  const requirementEvaluationContext = {
    skills: characterSkills,
    inventory: {
      items: inventoryItems
    }
  };

  // Normalize the data into a common format
  const normalizedOptions = isDecisionMode
    ? normalizeDecisionOptions(decision, selectedOptionId, worldSkills, requirementEvaluationContext)
    : normalizeSimpleChoices(choices || [], selectedOptionId);

  // Use normalized options without custom input option
  const allOptions = normalizedOptions;

  // Determine the prompt text
  const displayPrompt = prompt || (isDecisionMode ? decision.prompt : 'What will you do?');

  // Auto-focus input when custom input is enabled
  useEffect(() => {
    if (enableCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [enableCustomInput]);

  // Handle option selection
  const handleOptionSelect = useCallback((optionId: string, isDisabledByReqs: boolean) => {
    // Don't allow selection if option is disabled by requirements
    if (isDisabledByReqs) {
      return;
    }
    setSelectedOptionId(optionId);
    onSelect(optionId);
  }, [onSelect]);

  // Handle custom input submission
  const handleCustomSubmit = useCallback(() => {
    const trimmedText = safeTrim(customInputText);
    if (trimmedText && onCustomSubmit) {
      onCustomSubmit(trimmedText);
      setCustomInputText('');
    }
  }, [customInputText, onCustomSubmit]);

  // Handle Enter key in textarea
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    ? 'text-destructive'
    : characterCount >= maxCustomLength * 0.8
    ? 'text-amber-500'
    : 'text-gray-500';

  // Don't render if no options and custom input is disabled
  if (allOptions.length === 0 && !enableCustomInput) {
    return null;
  }

  // Get decision weight styling
  const decisionWeight = isDecisionMode ? decision.decisionWeight : undefined;
  const weightStyling = getDecisionWeightStyling(decisionWeight);
  

  return (
    <div
      data-testid="choice-selector"
      className={`choice-selector rounded-lg ${weightStyling.container} ${className}`}
      role="group"
      aria-labelledby="choices-heading"
    >
      <div className="p-4">

      {/* Ending Suggestion Banner */}
      {endingSuggestion && (
        <EndingSuggestionBanner
          reason={endingSuggestion.reason}
          onAccept={endingSuggestion.onAccept}
          onDismiss={endingSuggestion.onDismiss}
        />
      )}

      {/* Context Summary */}
      {isDecisionMode && decision.contextSummary && (
        <div
          data-testid="context-summary"
          className="mb-4 p-3 bg-white/50 rounded border border-gray-200"
        >
          <p className="text-sm text-gray-700 italic">
            {decision.contextSummary}
          </p>
        </div>
      )}
      
      <h3 
        className="text-lg font-bold mb-4 text-gray-900" 
        id="choices-heading"
      >
        {displayPrompt}
      </h3>
      
      {/* Custom input field - shown first when enabled */}
      {enableCustomInput && (
        <div className="mb-4 bg-gray-100 p-4 rounded border">
          <Textarea
            id="custom-input"
            ref={inputRef}
            value={customInputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={customInputPlaceholder}
            disabled={isDisabled}
            aria-label="Custom response input"
            className="w-full resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-sm ${characterCountClass}`}>
              {characterCount}/{maxCustomLength}
            </span>
            <Button
              onClick={handleCustomSubmit}
              disabled={isDisabled || !safeTrim(customInputText)}
              size="sm"
            >
              Submit
            </Button>
          </div>
        </div>
      )}
      
      {allOptions.length > 0 && (
        <CollapsibleSection title="Suggested Actions" initialCollapsed={true}>
          {/* Regular choice options */}
          <div 
            className="space-y-2" 
            role="radiogroup" 
            aria-labelledby="choices-heading"
          >
            {allOptions.map((option) => {
              const isOptionDisabled = isDisabled || (option.isDisabledByRequirements ?? false);

              return (
                <Button
                  key={option.id}
                  data-testid={`choice-option-${option.id}`}
                  variant="ghost"
                  title={isOptionDisabled ? option.disabledReason : undefined}
                  data-disabled-reason={isOptionDisabled ? option.disabledReason : undefined}
                  className={`block w-full text-left p-3 border rounded transition-colors h-auto whitespace-normal ${
                    option.isSelected
                      ? 'bg-primary/10 border-primary font-bold'
                      : getAlignmentClasses(option.alignment, isOptionDisabled)
                  } ${isOptionDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => handleOptionSelect(option.id, option.isDisabledByRequirements ?? false)}
                  disabled={isOptionDisabled}
                  aria-checked={option.isSelected}
                  role="radio"
                >
                  <div className="flex items-start gap-2">
                    {option.isSelected && <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />}
                    {!option.isSelected && getAlignmentIcon(option.alignment) && (
                      <span className="flex-shrink-0 mt-0.5">{getAlignmentIcon(option.alignment)}</span>
                    )}
                    <span className="flex-1">{option.text}</span>
                  </div>
                  {showHints && option.hint && (
                    <div className="text-sm text-gray-500 mt-1">{option.hint}</div>
                  )}
                  <SkillRequirementBadges
                    requirements={option.skillRequirements || []}
                    optionId={option.id}
                  />
                  <ItemRequirementBadges
                    groups={option.itemRequirementGroups || []}
                    optionId={option.id}
                  />
                </Button>
              );
            })}
          </div>
        </CollapsibleSection>
      )}
      </div>
    </div>
  );
};

export default ChoiceSelector;
