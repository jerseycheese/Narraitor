import React from 'react';
import StatusBadge from '../StatusBadge';
import { DecisionRequirement } from '@/types/narrative.types';

export interface SkillRequirementBadgeProps {
  requirement: DecisionRequirement;
  skillName?: string;
  isAvailable: boolean;
  className?: string;
  testId?: string;
}

const SkillRequirementBadge: React.FC<SkillRequirementBadgeProps> = ({
  requirement,
  skillName,
  isAvailable,
  className = '',
  testId = 'skill-requirement-badge',
}) => {
  const displayName = skillName || 'Unknown Skill';
  const displayValue = requirement.value;
  const operatorSuffix = requirement.operator === 'gte' ? '+' : '';
  
  const label = `[${displayName} ${displayValue}${operatorSuffix}]`;
  const state = isAvailable ? 'available' : 'unavailable';

  return (
    <StatusBadge
      variant="skill-requirement"
      state={state}
      label={label}
      className={className}
      testId={testId}
    />
  );
};

export default SkillRequirementBadge;