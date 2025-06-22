import React from 'react';
import { Badge } from '../badge';
import { DecisionRequirement } from '@/types/narrative.types';

// DEPRECATED: Use Badge from @/components/ui/badge directly instead
// This component will be removed in a future version

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
  
  const label = `${displayName} ${displayValue}${operatorSuffix}`;
  const variant = isAvailable ? 'available' : 'unavailable';

  return (
    <Badge
      variant={variant}
      className={className}
      data-testid={testId}
    >
      {label}
    </Badge>
  );
};

export default SkillRequirementBadge;