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

  it('shows skill name alone when met is true', () => {
    render(
      <SkillRequirementBadges
        requirements={[{ skillName: 'Stealth', met: true }]}
        optionId="option-1"
      />
    );

    expect(screen.getByText('Stealth')).toBeInTheDocument();
    expect(screen.queryByText(/RISKY/i)).not.toBeInTheDocument();
    expect(screen.getByText('Stealth').closest('[data-met]')).toHaveAttribute(
      'data-met',
      'true'
    );
  });

  it('appends RISKY and sets data-met=false when any requirement in a multi-skill choice is unmet', () => {
    render(
      <SkillRequirementBadges
        requirements={[
          { skillName: 'Stealth', met: true },
          { skillName: 'Hacking', met: false },
        ]}
        optionId="option-1"
      />
    );

    expect(screen.getByText('Stealth · RISKY')).toBeInTheDocument();
    expect(screen.getByText('Stealth · RISKY').closest('[data-met]')).toHaveAttribute(
      'data-met',
      'false'
    );
  });
});

