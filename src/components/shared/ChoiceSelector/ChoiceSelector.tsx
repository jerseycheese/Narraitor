'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scale, Flame, ChevronRight } from 'lucide-react';
import {
  Decision,
  ChoiceAlignment,
  DecisionWeight,
  DecisionRequirement,
  DecisionItemRequirementGroup,
  DecisionItemRequirements,
  RequirementLogic,
} from '@/types/narrative.types';
import { WorldSkill } from '@/types/world.types';
import { InventoryItem } from '@/types/inventory.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { resolveSkillData } from '@/lib/utils/gameDataResolver';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { safeTrim } from '@/lib/utils';
import { evaluateRequirement } from '@/lib/utils/requirementEvaluator';

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
}

/**
 * Get icon for choice alignment
 */
const getAlignmentIcon = (alignment?: ChoiceAlignment): React.ReactNode => {
  switch (alignment) {
    case 'lawful':
      return <Scale className="w-4 h-4" aria-hidden="true" />; // Scales of justice for lawful
    case 'chaotic':
      return <Flame className="w-4 h-4" aria-hidden="true" />; // Fire for chaotic/unpredictable
    case 'neutral':
    default:
      return null; // No icon for neutral
  }
};

/**
 * Get CSS classes for alignment-based styling
 */
const getAlignmentClasses = (alignment?: ChoiceAlignment, isDisabled?: boolean): string => {
  const baseClasses = {
    lawful: 'bg-blue-50 border-blue-300',
    chaotic: 'bg-red-200 border-red-300',
    neutral: 'bg-white border-gray-200'
  };
  
  const hoverClasses = {
    lawful: 'hover:bg-blue-100',
    chaotic: 'hover:bg-red-100', 
    neutral: 'hover:bg-gray-100'
  };
  
  const alignmentKey = alignment || 'neutral';
  const base = baseClasses[alignmentKey];
  const hover = isDisabled ? '' : hoverClasses[alignmentKey];
  
  return `${base} ${hover}`;
};

/**
 * Get styling for decision weight using border thickness and strategic colors
 * Critical decisions use bright red, while choice alignments use muted red
 */
const getDecisionWeightStyling = (weight?: DecisionWeight) => {
  switch (weight) {
    case 'critical':
      return {
        container: 'border-4 border-red-500 bg-red-200/50 shadow-lg shadow-red-200',
        dot: 'bg-red-500',
        label: 'text-red-700'
      };
    case 'major':
      return {
        container: 'border-2 border-amber-500 bg-amber-50/60 shadow-md shadow-amber-200',
        dot: 'bg-amber-500',
        label: 'text-amber-700'
      };
    case 'minor':
    default:
      return {
        container: 'border-0 bg-gray-100/5',
        dot: 'bg-gray-700',
        label: 'text-gray-900'
      };
  }
};

const DEFAULT_REQUIREMENT_LOGIC: RequirementLogic = 'all';

const isDecisionItemRequirementGroup = (
  value: unknown
): value is DecisionItemRequirementGroup => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'requirements' in value &&
      Array.isArray((value as DecisionItemRequirementGroup).requirements)
  );
};

const ensureItemRequirementGroup = (
  requirements: DecisionRequirement[] | undefined,
  logic?: RequirementLogic
): DecisionItemRequirementGroup | null => {
  const filtered = (requirements || []).filter((req) => req.type === 'item');
  if (filtered.length === 0) {
    return null;
  }

  return {
    logic: logic ?? DEFAULT_REQUIREMENT_LOGIC,
    requirements: filtered,
  };
};

const getNormalizedItemRequirementGroups = (
  requiredItems: DecisionItemRequirements | undefined,
  fallbackRequirements: DecisionRequirement[] | undefined
): DecisionItemRequirementGroup[] => {
  if (!requiredItems) {
    const fallbackGroup = ensureItemRequirementGroup(fallbackRequirements);
    return fallbackGroup ? [fallbackGroup] : [];
  }

  if (Array.isArray(requiredItems)) {
    if (requiredItems.length === 0) {
      return [];
    }

    const first = requiredItems[0] as DecisionRequirement | DecisionItemRequirementGroup;
    if (isDecisionItemRequirementGroup(first)) {
      return (requiredItems as DecisionItemRequirementGroup[])
        .map((group) => ensureItemRequirementGroup(group.requirements, group.logic))
        .filter((group): group is DecisionItemRequirementGroup => Boolean(group));
    }

    const fallbackGroup = ensureItemRequirementGroup(requiredItems as DecisionRequirement[]);
    return fallbackGroup ? [fallbackGroup] : [];
  }

  if (isDecisionItemRequirementGroup(requiredItems)) {
    const group = ensureItemRequirementGroup(
      requiredItems.requirements,
      requiredItems.logic
    );
    return group ? [group] : [];
  }

  const fallbackGroup = ensureItemRequirementGroup(fallbackRequirements);
  return fallbackGroup ? [fallbackGroup] : [];
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
  worldSkills = [],
  characterSkills = [],
  inventoryItems = [],
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
  const normalizedOptions: Array<{
    id: string;
    text: string;
    hint?: string;
    isSelected?: boolean;
    alignment?: ChoiceAlignment;
    isDisabledByRequirements?: boolean;
    disabledReason?: string;
    skillRequirements?: Array<{
      requirement: DecisionRequirement;
      skillName?: string;
      met: boolean;
    }>;
    itemRequirementGroups?: Array<{
      logic: RequirementLogic;
      met: boolean;
      requirements: Array<{
        requirement: DecisionRequirement;
        itemName: string;
        met: boolean;
        current: number;
        required: number;
      }>;
    }>;
  }> = isDecisionMode
    ? (decision.options || []).map(opt => {
        // Process skill requirements
        const skillRequirements = opt.requirements?.filter(req => req.type === 'skill').map(req => {
          const skillData = resolveSkillData(req.targetId, worldSkills);
          const evaluation = evaluateRequirement(req, requirementEvaluationContext);

          return {
            requirement: req,
            skillName: skillData?.name || 'Unknown Skill',
            met: evaluation.success
          };
        }) || [];

        // Process item requirements (normalized groups)
        const normalizedGroups = getNormalizedItemRequirementGroups(
          opt.requiredItems,
          opt.requirements
        );
        const itemRequirementGroups = normalizedGroups.map(group => {
          const logic: RequirementLogic = group.logic ?? DEFAULT_REQUIREMENT_LOGIC;
          const evaluatedRequirements = group.requirements.map(req => {
          const evaluation = evaluateRequirement(req, requirementEvaluationContext);

            return {
              requirement: req,
              itemName: evaluation.itemName || req.targetId,
              met: evaluation.success,
              current: evaluation.current,
              required: typeof evaluation.required === 'number' ? evaluation.required : 0
            };
          });

          const groupMet = logic === 'any'
            ? evaluatedRequirements.some(req => req.met)
            : evaluatedRequirements.every(req => req.met);

          return {
            logic,
            met: groupMet,
            requirements: evaluatedRequirements
          };
        });

        const allSkillRequirementsMet = skillRequirements.every(r => r.met);
        const allItemGroupsMet =
          itemRequirementGroups.length === 0 ||
          itemRequirementGroups.every(group => group.met);

        const disabledReasonParts: string[] = [];
        if (!allSkillRequirementsMet) {
          const missingSkills = skillRequirements
            .filter(req => !req.met)
            .map(req => req.skillName || 'Required skill');
          if (missingSkills.length > 0) {
            disabledReasonParts.push(`Skills: ${missingSkills.join(', ')}`);
          }
        }

        if (!allItemGroupsMet) {
          const missingItems = itemRequirementGroups
            .filter(group => !group.met)
            .flatMap(group =>
              group.requirements.map(req => {
                if (req.met) {
                  return null;
                }
                const requiredAmount = req.required > 0 ? `${req.current}/${req.required}` : `${req.current}`;
                return `${req.itemName}${req.required > 0 ? ` (${requiredAmount})` : ''}`;
              }).filter((value): value is string => Boolean(value))
            );
          if (missingItems.length > 0) {
            disabledReasonParts.push(`Items: ${missingItems.join(', ')}`);
          }
        }

        const disabledReason = disabledReasonParts.length > 0
          ? `Requires ${disabledReasonParts.join(' | ')}`
          : undefined;

        return {
          id: opt.id,
          text: opt.text,
          hint: opt.hint,
          isSelected: opt.id === decision.selectedOptionId || opt.id === selectedOptionId,
          alignment: opt.alignment,
          isDisabledByRequirements: !(allSkillRequirementsMet && allItemGroupsMet),
          disabledReason,
          skillRequirements,
          itemRequirementGroups
        };
      })
    : (choices || []).map(choice => ({
        id: choice.id,
        text: choice.text,
        isSelected: choice.isSelected || choice.id === selectedOptionId,
        alignment: 'neutral' as ChoiceAlignment, // Default for simple choices
        isDisabledByRequirements: false,
        disabledReason: undefined,
        skillRequirements: [],
        itemRequirementGroups: []
      }));

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
    ? 'text-red-500' 
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
                      ? 'bg-blue-100 border-blue-500 font-bold'
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
                  {option.skillRequirements && option.skillRequirements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {option.skillRequirements.map((skillReq, index) => {
                        const label = `${skillReq.skillName}`;

                        return (
                          <Badge
                            key={`${option.id}-skill-${index}`}
                            variant="skill-requirement"
                          >
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  {option.itemRequirementGroups && option.itemRequirementGroups.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {option.itemRequirementGroups.map((group, groupIndex) => (
                        <div key={`${option.id}-item-group-${groupIndex}`}>
                          <p className="text-xs font-medium text-muted-foreground">
                            {group.logic === 'any' ? 'Requires any of:' : 'Requires all:'}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {group.requirements.map((itemReq, reqIndex) => {
                              const label = itemReq.met
                                ? itemReq.itemName
                                : `${itemReq.itemName} (${itemReq.current}/${itemReq.required})`;

                              return (
                                <Badge
                                  key={`${option.id}-item-${groupIndex}-${reqIndex}`}
                                  variant={itemReq.met ? 'success' : 'destructive'}
                                >
                                  {label}
                                  {!itemReq.met && <span className="sr-only"> - missing</span>}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
