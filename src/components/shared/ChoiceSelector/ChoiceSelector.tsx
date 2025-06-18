'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Decision, ChoiceAlignment, DecisionWeight, DecisionRequirement } from '@/types/narrative.types';
// Import removed - using local character type definition to match store structure
import { WorldSkill } from '@/types/world.types';
import SkillRequirementBadge from '@/components/ui/SkillRequirementBadge';
import { evaluateRequirement } from '@/lib/utils/requirementEvaluator';
import { resolveSkillData } from '@/lib/utils/gameDataResolver';

// Local character type definition that matches the actual store structure
// to avoid type mismatches with the main Character type
interface Character {
  id: string;
  name: string;
  description: string;
  worldId: string;
  level: number;
  attributes: Array<{
    id: string;
    characterId: string;
    worldAttributeId?: string;
    name: string;
    baseValue: number;
    modifiedValue: number;
    category?: string;
  }>;
  skills: Array<{
    id: string;
    characterId: string;
    worldSkillId?: string;
    name: string;
    level: number;
    category?: string;
  }>;
  background: {
    history: string;
    personality: string;
    goals: string[];
    fears: string[];
    relationships: unknown[];
  };
  isPlayer: boolean;
  status: {
    health: number;
    maxHealth: number;
    conditions: string[];
  };
  inventory: {
    characterId: string;
    items: unknown[];
    capacity: number;
    categories: string[];
  };
}

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

  // Skill requirement props
  character?: Character;
  worldSkills?: WorldSkill[];
}

/**
 * Get icon for choice alignment
 */
const getAlignmentIcon = (alignment?: ChoiceAlignment): string => {
  switch (alignment) {
    case 'lawful':
      return '⚖️'; // Scales of justice for lawful
    case 'chaotic':
      return '🔥'; // Fire for chaotic/unpredictable
    case 'neutral':
    default:
      return ''; // No icon for neutral
  }
};

/**
 * Get CSS classes for alignment-based styling
 */
const getAlignmentClasses = (alignment?: ChoiceAlignment, isDisabled?: boolean): string => {
  const baseClasses = {
    lawful: 'bg-blue-50 border-blue-300',
    chaotic: 'bg-red-50 border-red-300',
    neutral: 'bg-white border-gray-200'
  };
  
  const hoverClasses = {
    lawful: 'hover:bg-blue-100',
    chaotic: 'hover:bg-red-100', 
    neutral: 'hover:bg-gray-50'
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
        container: 'border-4 border-red-500 bg-red-50/50 shadow-lg shadow-red-200',
        dot: 'bg-red-600',
        label: 'text-red-800'
      };
    case 'major':
      return {
        container: 'border-2 border-amber-400 bg-amber-50/60 shadow-md shadow-amber-200',
        dot: 'bg-amber-600',
        label: 'text-amber-800'
      };
    case 'minor':
    default:
      return {
        container: 'border-0 bg-gray-500/5',
        dot: 'bg-gray-600',
        label: 'text-gray-800'
      };
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
  character,
  worldSkills = [],
}) => {
  // Custom input state
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
    skillRequirements?: Array<{
      requirement: DecisionRequirement;
      skillName?: string;
      isAvailable: boolean;
    }>;
  }> = isDecisionMode
    ? (decision.options || []).map(opt => {
        const skillRequirements = opt.requirements?.filter(req => req.type === 'skill').map(req => {
          const skillData = resolveSkillData(req.targetId, worldSkills);
          const isAvailable = character ? evaluateRequirement(req, character).success : false;
          return {
            requirement: req,
            skillName: skillData?.name,
            isAvailable
          };
        }) || [];

        return {
          id: opt.id,
          text: opt.text,
          hint: opt.hint,
          isSelected: opt.id === decision.selectedOptionId || opt.id === selectedOptionId,
          alignment: opt.alignment,
          skillRequirements
        };
      })
    : (choices || []).map(choice => ({
        id: choice.id,
        text: choice.text,
        isSelected: choice.isSelected || choice.id === selectedOptionId,
        alignment: 'neutral' as ChoiceAlignment, // Default for simple choices
        skillRequirements: []
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
  const handleOptionSelect = useCallback((optionId: string) => {
    setSelectedOptionId(optionId);
    onSelect(optionId);
  }, [onSelect]);

  // Handle custom input submission
  const handleCustomSubmit = useCallback(() => {
    const trimmedText = customInputText.trim();
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
    ? 'text-red-600' 
    : characterCount >= maxCustomLength * 0.8 
    ? 'text-amber-600' 
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
      className={`choice-selector p-4 rounded-lg ${weightStyling.container} ${className}`}
      role="group"
      aria-labelledby="choices-heading"
    >

      {/* Context Summary */}
      {isDecisionMode && decision.contextSummary && (
        <div 
          data-testid="context-summary"
          className="mb-4 p-3 bg-white/50 rounded border border-gray-200"
        >
          <p className="text-sm text-gray-600 italic">
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
        <div className="mb-4 bg-gray-50 p-4 rounded border">
          <textarea
            id="custom-input"
            ref={inputRef}
            value={customInputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
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
      
      {/* Label for suggested actions */}
      {allOptions.length > 0 && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-600">Or try a suggested action:</span>
        </div>
      )}
      
      {/* Regular choice options */}
      <div 
        className="space-y-2" 
        role="radiogroup" 
        aria-labelledby="choices-heading"
      >
        {allOptions.map((option) => (
          <div key={option.id} className="space-y-1">
            <button
              data-testid={`choice-option-${option.id}`}
              className={`block w-full text-left p-3 border rounded transition-colors ${
                option.isSelected
                  ? 'bg-blue-100 border-blue-500 font-bold'
                  : getAlignmentClasses(option.alignment, isDisabled)
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => handleOptionSelect(option.id)}
              disabled={isDisabled}
              aria-checked={option.isSelected}
              role="radio"
            >
              <div className="flex items-start gap-2">
                {option.isSelected && <span>➤</span>}
                {!option.isSelected && getAlignmentIcon(option.alignment) && (
                  <span className="text-lg leading-none relative top-[3px]">{getAlignmentIcon(option.alignment)}</span>
                )}
                <span className="flex-1">{option.text}</span>
              </div>
            </button>
            {showHints && option.hint && (
              <div className="text-sm text-gray-500 ml-6">{option.hint}</div>
            )}
            {option.skillRequirements && option.skillRequirements.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-6">
                {option.skillRequirements.map((skillReq, index) => (
                  <SkillRequirementBadge
                    key={`${option.id}-skill-${index}`}
                    requirement={skillReq.requirement}
                    skillName={skillReq.skillName}
                    isAvailable={skillReq.isAvailable}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChoiceSelector;
