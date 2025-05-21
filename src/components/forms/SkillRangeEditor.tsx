import React, { useState, useEffect } from 'react';
import { WorldSkill } from '@/types/world.types';
import { 
  SKILL_LEVEL_DESCRIPTIONS, 
  SKILL_MIN_VALUE, 
  SKILL_MAX_VALUE,
  getSkillLevelDescription
} from '@/lib/constants/skillLevelDescriptions';

interface SkillRangeEditorProps {
  skill: WorldSkill;
  onChange: (updates: Partial<WorldSkill>) => void;
  disabled?: boolean;
  showLabels?: boolean;
  showLevelDescriptions?: boolean;
}

const SkillRangeEditor: React.FC<SkillRangeEditorProps> = ({
  skill,
  onChange,
  disabled = false,
  showLabels = true,
  showLevelDescriptions = false,
}) => {
  // Enforce the 1-5 scale for skills
  const minValue = SKILL_MIN_VALUE;
  const maxValue = SKILL_MAX_VALUE;
  
  // If the skill's baseValue is outside our fixed range, adjust it
  const initialValue = skill.baseValue < minValue 
    ? minValue 
    : skill.baseValue > maxValue 
      ? maxValue 
      : skill.baseValue;
  
  const [value, setValue] = useState(initialValue);

  // Sync with prop value when it changes
  useEffect(() => {
    // Ensure the value is within our defined range (1-5)
    const adjustedValue = skill.baseValue < minValue 
      ? minValue 
      : skill.baseValue > maxValue 
        ? maxValue 
        : skill.baseValue;
        
    setValue(adjustedValue);
  }, [skill.baseValue, minValue, maxValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse value and ensure it's within range
    let newValue = parseInt(e.target.value);
    
    // Clamp value to min/max range
    if (isNaN(newValue)) newValue = minValue;
    if (newValue < minValue) newValue = minValue;
    if (newValue > maxValue) newValue = maxValue;

    setValue(newValue);
    onChange({ baseValue: newValue });
  };

  // Calculate the position of the value bubble
  const position = ((value - minValue) / (maxValue - minValue)) * 100;
  
  // Get the current level description
  const currentLevel = getSkillLevelDescription(value);

  return (
    <div className="py-2" data-testid="skill-range-editor">
      {showLabels && (
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>Default Value</span>
          {showLevelDescriptions && currentLevel && (
            <span className="font-medium text-blue-600" data-testid="skill-level-label">
              {currentLevel.label}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <div className="flex items-center space-x-2">
          <span className="min-w-6 text-center" data-testid="current-value">{value}</span>
          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className="flex-grow"
            data-testid="skill-range-slider"
          />
        </div>
        
        {/* Level labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {SKILL_LEVEL_DESCRIPTIONS.map(level => (
            <div 
              key={level.value}
              className="flex flex-col items-center"
              data-testid={`level-label-${level.value}`}
            >
              <span>{level.value}</span>
              <span className={value === level.value ? "font-medium text-blue-600" : ""}>{level.label}</span>
            </div>
          ))}
        </div>
        
        {/* Level descriptions */}
        {showLevelDescriptions && currentLevel && (
          <div className="mt-2 text-sm text-gray-600" data-testid="skill-level-description">
            <span className="font-medium">{currentLevel.label}:</span> {currentLevel.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillRangeEditor;