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
  compact?: boolean;
}

const SkillRangeEditor: React.FC<SkillRangeEditorProps> = ({
  skill,
  onChange,
  disabled = false,
  showLabels = true,
  showLevelDescriptions = false,
  compact = false,
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
    <div className={`${compact ? 'py-1' : 'py-2'}`} data-testid="skill-range-editor">
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
        <input
          type="range"
          min={minValue}
          max={maxValue}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          data-testid="skill-range-slider"
        />
        
        {/* Value display bubble */}
        <div
          className="absolute -top-7 flex items-center justify-center w-8 h-8 text-sm text-white bg-blue-500 rounded-full pointer-events-none transform -translate-x-1/2"
          style={{ left: `${position}%` }}
          data-testid="current-value"
        >
          {value}
        </div>
        
        {/* Tick marks */}
        <div className="relative h-0">
          {SKILL_LEVEL_DESCRIPTIONS.map((level) => (
            <div 
              key={level.value}
              className="absolute w-0.5 h-2 bg-gray-400 -mt-2"
              style={{ 
                left: `${((level.value - minValue) / (maxValue - minValue)) * 100}%`,
                transform: 'translateX(-50%)'
              }}
              data-testid={`tick-mark-${level.value}`}
            />
          ))}
        </div>
        
        {/* Min/Max labels */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{minValue}</span>
          {SKILL_LEVEL_DESCRIPTIONS.slice(1, -1).map(level => (
            <span 
              key={level.value}
              className="text-gray-400"
              data-testid={`level-tick-${level.value}`}
            >
              {level.value}
            </span>
          ))}
          <span>{maxValue}</span>
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