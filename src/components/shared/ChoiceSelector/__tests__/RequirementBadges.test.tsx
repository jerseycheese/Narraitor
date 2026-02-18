import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkillRequirementBadges } from '../RequirementBadges';

describe('SkillRequirementBadges', () => {
  it('renders exactly one badge per choice', () => {
    const requirements = [
      { skillName: 'Hacking', requirement: { targetId: 'skill-hacking' } },
      { skillName: 'Streetwise', requirement: { targetId: 'skill-streetwise' } },
    ];

    render(
      <SkillRequirementBadges requirements={requirements} optionId="option-1" />
    );

    const badges = screen.getAllByText(/hacking|streetwise/i);
    expect(badges).toHaveLength(1);
    expect(screen.getByText('Hacking')).toBeInTheDocument();
  });

  it('falls back to generic label when no named skill is available', () => {
    const requirements = [{ requirement: { targetId: 'skill-hacking' } }];

    render(
      <SkillRequirementBadges requirements={requirements} optionId="option-1" />
    );

    expect(screen.getByText('Skill')).toBeInTheDocument();
  });
});
