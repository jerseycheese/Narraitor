'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Decision } from '@/types/narrative.types';
import { WorldSkill } from '@/types/world.types';
import { InventoryItem } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EndingSuggestionBanner } from '@/components/GameSession/EndingSuggestionBanner';
import { ArrowUp } from 'lucide-react';
import { cssClasses, safeTrim } from '@/lib/utils';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { normalizeDecisionOptions } from './optionNormalizer';
import type { NormalizedOption } from './optionNormalizer';
import {
  SkillRequirementBadges,
  ItemRequirementBadges,
} from './RequirementBadges';
import {
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
  hidePrompt?: boolean;
  hideCustomInput?: boolean;

  // Custom input props
  enableCustomInput?: boolean;
  onCustomSubmit?: (customText: string) => void;
  customInputPlaceholder?: string;
  maxCustomLength?: number;
  
  // Custom actions for the input row (e.g. End Session button)
  inputActions?: React.ReactNode;

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
 * Choice selector component for handling complex decisions
 */
const ChoiceSelector: React.FC<ChoiceSelectorProps> = ({
  decision,
  prompt,
  onSelect,
  isDisabled = false,
  className = '',
  hidePrompt = false,
  hideCustomInput = false,
  enableCustomInput = false,
  onCustomSubmit,
  customInputPlaceholder = 'Or write your own action...',
  maxCustomLength = 250,
  inputActions,
  worldSkills = [],
  characterSkills = [],
  inventoryItems = [],
  endingSuggestion,
}) => {
  const { theme } = useTheme();

  // Custom input state
  const [customInputText, setCustomInputText] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Ref for auto-focusing input
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Keep a compact set while preserving alignment variety when possible.
  const allOptions = selectVisibleOptions(normalizedOptions, 3);

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

  // Handle Enter key in input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomSubmit();
      }
    },
    [handleCustomSubmit]
  );

  // Handle input change with character limit
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value.length <= maxCustomLength) {
        setCustomInputText(value);
      }
    },
    [maxCustomLength]
  );

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
      className={['choice-selector', 'manuscript-choice-selector', weightStyling.container, className]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-labelledby="choices-heading"
    >
      <div className="manuscript-choice-selector-body">
        {/* Ending Suggestion Banner */}
        {endingSuggestion && (
          <EndingSuggestionBanner
            reason={endingSuggestion.reason}
            onAccept={endingSuggestion.onAccept}
            onDismiss={endingSuggestion.onDismiss}
          />
        )}

        {!hidePrompt && (
          <h3 id="choices-heading" className="manuscript-choice-prompt">
            {displayPrompt}
          </h3>
        )}

        {allOptions.length > 0 && (
          <div className="manuscript-suggested-actions-section">
            {/* Regular choice options */}
            <div
              role="radiogroup"
              aria-labelledby="choices-heading"
              className="manuscript-suggested-actions-grid"
            >
              {allOptions.map((option, index) => {
                const isOptionDisabled =
                  isDisabled || (option.isDisabledByRequirements ?? false);

                return (
                  <Button
                    key={option.id}
                    data-testid={`choice-option-${option.id}`}
                    variant="secondary"
                    title={isOptionDisabled ? option.disabledReason : (option.hint || undefined)}
                    data-disabled-reason={
                      isOptionDisabled ? option.disabledReason : undefined
                    }
                    className={cssClasses(
                      'manuscript-suggested-action',
                      option.isSelected
                        ? 'is-selected manuscript-suggested-action-selected'
                        : getAlignmentClasses(
                            option.alignment,
                            isOptionDisabled
                          )
                    )}
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
                    {theme === 'ds3' && (
                      <span className="manuscript-choice-kbd" aria-hidden="true">{index + 1}</span>
                    )}
                    <div className="manuscript-suggested-action-content">
                      <div className="manuscript-suggested-action-title-row">
                        {theme === 'ds2' && (
                          <span className="manuscript-choice-footnote" aria-hidden="true">{index + 1}.</span>
                        )}
                        <span className="manuscript-suggested-action-label">{option.text}</span>
                      </div>

                      <div className="manuscript-suggested-action-badges">
                        <SkillRequirementBadges
                          requirements={option.skillRequirements || []}
                          optionId={option.id}
                        />
                        <ItemRequirementBadges
                          groups={option.itemRequirementGroups || []}
                          optionId={option.id}
                        />
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom input field - now shown AFTER suggested actions */}
        {enableCustomInput && !hideCustomInput && (
          <>
            {theme === 'ds2' && (
              <span className="manuscript-input-label">or write your own</span>
            )}
            <div className="manuscript-input-row">
              <Input
                id="manuscript-input"
                ref={inputRef}
                value={customInputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  customInputPlaceholder !== 'Or write your own action...'
                    ? customInputPlaceholder
                    : theme === 'ds2'
                      ? 'What do you do?'
                      : theme === 'ds3'
                        ? 'Describe your action...'
                        : customInputPlaceholder
                }
                disabled={isDisabled}
                aria-label="Custom response input"
                className="manuscript-custom-input"
              />
              {theme === 'ds3' && (
                <span className="manuscript-input-counter">
                  {customInputText.length}/{maxCustomLength}
                </span>
              )}
              <button
                id="manuscript-send"
                type="button"
                onClick={handleCustomSubmit}
                disabled={isDisabled || !safeTrim(customInputText)}
                className="manuscript-send-button"
              >
                {theme === 'ds3' ? <ArrowUp size={18} aria-hidden="true" /> : 'Send'}
              </button>
              {inputActions}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChoiceSelector;

const selectVisibleOptions = (
  options: NormalizedOption[],
  maxVisible: number
): NormalizedOption[] => {
  if (options.length <= maxVisible) {
    return options;
  }

  const base = options.slice(0, maxVisible);
  const hasLawful = base.some((option) => option.alignment === 'lawful');
  const hasChaotic = base.some((option) => option.alignment === 'chaotic');

  if (hasLawful && hasChaotic) {
    return base;
  }

  const desiredAlignments: Array<'lawful' | 'chaotic'> = [];
  if (!hasLawful) desiredAlignments.push('lawful');
  if (!hasChaotic) desiredAlignments.push('chaotic');

  const existingIds = new Set(base.map((option) => option.id));
  const result = [...base];

  for (const alignment of desiredAlignments) {
    const candidate = options.find(
      (option) => option.alignment === alignment && !existingIds.has(option.id)
    );
    if (!candidate) continue;

    // Prefer replacing the last neutral option so we keep lawful/chaotic variety.
    let replaceIndex = -1;
    for (let i = result.length - 1; i >= 0; i -= 1) {
      if (result[i].alignment === 'neutral') {
        replaceIndex = i;
        break;
      }
    }
    if (replaceIndex === -1) {
      replaceIndex = result.length - 1;
    }

    existingIds.delete(result[replaceIndex].id);
    result[replaceIndex] = candidate;
    existingIds.add(candidate.id);
  }

  return result;
};
