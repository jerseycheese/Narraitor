# Refactoring Plan for Range Editors

This document outlines the plan for refactoring the AttributeRangeEditor and SkillRangeEditor components to use the new reusable RangeSlider component.

## Overview

The current implementation has duplicate code between AttributeRangeEditor and SkillRangeEditor. We've created a new reusable RangeSlider component that can replace the functionality in both components while maintaining all styling and behavior.

## Steps

### 1. Refactor AttributeRangeEditor

```tsx
// src/components/forms/AttributeRangeEditor.tsx
import React, { useEffect } from 'react';
import { WorldAttribute } from '@/types/world.types';
import RangeSlider from '@/components/ui/RangeSlider';

interface AttributeRangeEditorProps {
  attribute: WorldAttribute;
  onChange: (updates: Partial<WorldAttribute>) => void;
  disabled?: boolean;
  showLabels?: boolean;
}

const AttributeRangeEditor: React.FC<AttributeRangeEditorProps> = ({
  attribute,
  onChange,
  disabled = false,
  showLabels = true,
}) => {
  const handleChange = (value: number) => {
    onChange({ baseValue: value });
  };

  return (
    <RangeSlider
      value={attribute.baseValue}
      min={attribute.minValue}
      max={attribute.maxValue}
      onChange={handleChange}
      disabled={disabled}
      showLabel={showLabels}
      testId="attribute-range-editor"
    />
  );
};

export default AttributeRangeEditor;
```

### 2. Refactor SkillRangeEditor

```tsx
// src/components/forms/SkillRangeEditor.tsx
import React from 'react';
import { WorldSkill } from '@/types/world.types';
import RangeSlider, { LevelDescription } from '@/components/ui/RangeSlider';
import { 
  SKILL_LEVEL_DESCRIPTIONS, 
  SKILL_MIN_VALUE, 
  SKILL_MAX_VALUE,
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
  const initialValue = Math.min(Math.max(skill.baseValue, minValue), maxValue);
  
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
      levelDescriptions={levelDescriptions}
      showLevelDescription={showLevelDescriptions}
      valueFormatter={valueFormatter}
      testId="skill-range-editor"
    />
  );
};

export default SkillRangeEditor;
```

### 3. Update Tests

Both component tests will need to be updated to reflect the new implementation. However, much of the testing logic will be moved to the RangeSlider component's tests, which we've already created.

#### AttributeRangeEditor Tests

The tests should be updated to verify:
- The RangeSlider is rendered with the correct props
- The onChange callback correctly updates the attribute's baseValue
- Props like disabled and showLabels are properly passed through

#### SkillRangeEditor Tests

The tests should be updated to verify:
- The RangeSlider is rendered with the correct props
- Values are clamped to the SKILL_MIN_VALUE and SKILL_MAX_VALUE
- Level descriptions are correctly passed to the RangeSlider
- The custom value formatter properly formats the value with level label

### 4. Update Stories

The Storybook stories for both components should be updated to reflect the new implementation, but should maintain the same appearance and functionality.

### 5. Verify Behavior

After refactoring, verify that:
- All tests pass
- All Storybook stories display correctly
- The components have the same appearance and behavior in the application

## Benefits

This refactoring will:
- Reduce duplicate code
- Centralize range slider styling and behavior
- Make it easier to update the range slider UI in the future
- Provide a reusable component for other parts of the application
- Maintain all existing functionality and appearance