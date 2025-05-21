import React from 'react';
import { WorldSkill } from '@/types/world.types';
import RangeSlider, { LevelDescription } from '@/components/ui/RangeSlider';
import { 
  SKILL_LEVEL_DESCRIPTIONS, 
  MIN_SKILL_VALUE as SKILL_MIN_VALUE, 
  MAX_SKILL_VALUE as SKILL_MAX_VALUE
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
  
  const handleChange = (value: number) => {
    onChange({ baseValue: value });
  };

  // Convert skill level descriptions to the format needed by RangeSlider
  const levelDescriptions: LevelDescription[] = SKILL_LEVEL_DESCRIPTIONS.map(level => ({
    value: level.value,
    label: level.label,
    description: level.description
  }));
  
  // Custom formatter to display value with level
  const valueFormatter = (value: number): string => {
    const level = levelDescriptions.find(level => level.value === value);
    return level ? `${value} - ${level.label}` : `${value}`;
  };

  return (
    <RangeSlider
      value={initialValue}
      min={minValue}
      max={maxValue}
      onChange={handleChange}
      disabled={disabled}
      showLabel={showLabels}
      labelText="Default Value"
      levelDescriptions={levelDescriptions}
      showLevelDescription={showLevelDescriptions}
      valueFormatter={valueFormatter}
      testId="skill-range-editor"
    />
  );
};

export default SkillRangeEditor;