import React from 'react';
import { render, screen } from '@testing-library/react';
import SkillRequirementBadge from '../SkillRequirementBadge';
import { DecisionRequirement } from '@/types/narrative.types';

describe('SkillRequirementBadge', () => {
  const mockRequirement: DecisionRequirement = {
    type: 'skill',
    targetId: 'intimidation',
    operator: 'gte',
    value: 6
  };

  it('displays skill requirement in correct format', () => {
    render(
      <SkillRequirementBadge 
        requirement={mockRequirement}
        skillName="Intimidation"
        isAvailable={true}
      />
    );
    expect(screen.getByText('[Intimidation 6+]')).toBeInTheDocument();
  });

  it('shows available state with green styling', () => {
    render(
      <SkillRequirementBadge 
        requirement={mockRequirement}
        skillName="Intimidation"
        isAvailable={true}
      />
    );
    const badge = screen.getByText('[Intimidation 6+]');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('shows unavailable state with gray styling', () => {
    render(
      <SkillRequirementBadge 
        requirement={mockRequirement}
        skillName="Intimidation"
        isAvailable={false}
      />
    );
    const badge = screen.getByText('[Intimidation 6+]');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-500');
  });

  it('handles unknown skill name', () => {
    render(
      <SkillRequirementBadge 
        requirement={mockRequirement}
        skillName={undefined}
        isAvailable={true}
      />
    );
    expect(screen.getByText('[Unknown Skill 6+]')).toBeInTheDocument();
  });
});