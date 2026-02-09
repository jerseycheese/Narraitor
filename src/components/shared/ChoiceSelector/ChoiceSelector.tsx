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
import { normalizeDecisionOptions } from './optionNormalizer';
import {
  SkillRequirementBadges,
  ItemRequirementBadges,
} from './RequirementBadges';
import {
  getAlignmentIcon,
  getAlignmentClasses,
  getDecisionWeightStyling,
} from './choiceStyling';

interface ChoiceSelectorProps {
  decision: Decision;

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

  // Suggested actions UI callbacks
  onSuggestedActionsToggle?: (isExpanded: boolean) => void;
}

/**
 * Choice selector component for handling complex decisions
 */
const ChoiceSelector: React.FC<ChoiceSelectorProps> = ({
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
  onSuggestedActionsToggle,
}) => {
  // Custom input state
  const [customInputText, setCustomInputText] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Ref for auto-focusing input
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Create character object for requirement evaluation
  const requirementEvaluationContext = {
    skills: characterSkills,
    inventory: {
      items: inventoryItems,
    },
  };

  // Normalize the data into a common format
  const normalizedOptions = normalizeDecisionOptions(
    decision,
    selectedOptionId,
    worldSkills,
    requirementEvaluationContext
  );

  // Use normalized options without custom input option
  const allOptions = normalizedOptions;

  // Determine the prompt text
  const displayPrompt = prompt || decision.prompt;

  // Auto-focus input when custom input is enabled
  useEffect(() => {
    if (enableCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [enableCustomInput]);

  // Handle option selection
  const handleOptionSelect = useCallback(
    (optionId: string, isDisabledByReqs: boolean) => {
      // Don't allow selection if option is disabled by requirements
      if (isDisabledByReqs) {
        return;
      }
      setSelectedOptionId(optionId);
      onSelect(optionId);
    },
    [onSelect]
  );

  // Handle custom input submission
  const handleCustomSubmit = useCallback(() => {
    const trimmedText = safeTrim(customInputText);
    if (trimmedText && onCustomSubmit) {
      onCustomSubmit(trimmedText);
      setCustomInputText('');
    }
  }, [customInputText, onCustomSubmit]);

  // Handle Enter key in textarea
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleCustomSubmit();
      }
    },
    [handleCustomSubmit]
  );

  // Handle input change with character limit
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= maxCustomLength) {
        setCustomInputText(value);
      }
    },
    [maxCustomLength]
  );

  // Calculate character count styling
  const characterCount = customInputText.length;
  const characterCountClass =
    characterCount >= maxCustomLength
      ? ''
      : characterCount >= maxCustomLength * 0.8
        ? ''
        : '';

  // Don't render if no options and custom input is disabled
  if (allOptions.length === 0 && !enableCustomInput) {
    return null;
  }

  // Get decision weight styling
  const decisionWeight = decision.decisionWeight;
  const weightStyling = getDecisionWeightStyling(decisionWeight);

  return (
    <div
      data-testid="choice-selector"
      className={`choice-selector${weightStyling.container}${className}`}
      role="group"
      aria-labelledby="choices-heading"
    >
      <div>
        {/* Ending Suggestion Banner */}
        {endingSuggestion && (
          <EndingSuggestionBanner
            reason={endingSuggestion.reason}
            onAccept={endingSuggestion.onAccept}
            onDismiss={endingSuggestion.onDismiss}
          />
        )}

        {/* Context Summary */}
        {decision.contextSummary && (
          <div data-testid="context-summary">
            <p>{decision.contextSummary}</p>
          </div>
        )}

        <h3 id="choices-heading">{displayPrompt}</h3>

        {/* Custom input field - shown first when enabled */}
        {enableCustomInput && (
          <div>
            <Textarea
              id="custom-input"
              ref={inputRef}
              value={customInputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={customInputPlaceholder}
              disabled={isDisabled}
              aria-label="Custom response input"
              rows={3}
            />
            <div>
              <span className={`${characterCountClass}`}>
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
          <CollapsibleSection
            title="Suggested Actions"
            initialCollapsed={true}
            onToggle={onSuggestedActionsToggle}
          >
            {/* Regular choice options */}
            <div role="radiogroup" aria-labelledby="choices-heading">
              {allOptions.map((option) => {
                const isOptionDisabled =
                  isDisabled || (option.isDisabledByRequirements ?? false);

                return (
                  <Button
                    key={option.id}
                    data-testid={`choice-option-${option.id}`}
                    variant="ghost"
                    title={isOptionDisabled ? option.disabledReason : undefined}
                    data-disabled-reason={
                      isOptionDisabled ? option.disabledReason : undefined
                    }
                    className={`${
                      option.isSelected
                        ? ''
                        : getAlignmentClasses(
                            option.alignment,
                            isOptionDisabled
                          )
                    }`}
                    onClick={() =>
                      handleOptionSelect(
                        option.id,
                        option.isDisabledByRequirements ?? false
                      )
                    }
                    disabled={isOptionDisabled}
                    aria-checked={option.isSelected}
                    role="radio"
                  >
                    <div>
                      {option.isSelected && <ChevronRight aria-hidden="true" />}
                      {!option.isSelected &&
                        getAlignmentIcon(option.alignment) && (
                          <span>{getAlignmentIcon(option.alignment)}</span>
                        )}
                      <span>{option.text}</span>
                    </div>
                    {showHints && option.hint && <div>{option.hint}</div>}
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
