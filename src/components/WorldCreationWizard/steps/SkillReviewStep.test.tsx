import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillReviewStep from './SkillReviewStep';
import { SkillSuggestion, WorldCreationData } from '../WizardState';

const skill = (name: string, accepted: boolean, linked: string[]): SkillSuggestion => ({
  name,
  description: `${name} description`,
  difficulty: 'medium',
  category: 'General',
  linkedAttributeNames: linked,
  accepted,
  baseValue: 3,
  minValue: 1,
  maxValue: 5,
});

const baseData = (skills: SkillSuggestion[]): WorldCreationData => ({
  name: 'Test World',
  genre: 'fantasy',
  attributes: [
    {
      id: 'attr-1',
      worldId: '',
      name: 'Strength',
      description: 'Physical power',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
    },
  ],
  aiSuggestions: { attributes: [], skills },
});

let latest: WorldCreationData;

/** Holds worldData the way the wizard does, so the step re-renders from its own updates. */
const Harness = ({
  initial,
  errors = {},
}: {
  initial: WorldCreationData;
  errors?: Record<string, string>;
}) => {
  const [data, setData] = useState(initial);
  latest = data;
  return (
    <SkillReviewStep
      worldData={data}
      errors={errors}
      onUpdate={(updates) => setData((prev) => ({ ...prev, ...updates }))}
    />
  );
};

describe('SkillReviewStep', () => {
  it('saves accepted suggestions linked to attribute ids', () => {
    render(
      <Harness initial={baseData([skill('Combat', true, ['Strength']), skill('Stealth', false, [])])} />
    );

    expect(screen.getByText('Review Skills')).toBeInTheDocument();
    expect(screen.getByTestId('skill-toggle-1')).toHaveTextContent('Excluded');
    expect(latest.skills).toEqual([
      expect.objectContaining({ name: 'Combat', attributeIds: ['attr-1'] }),
    ]);
  });

  it('toggles skill selection when clicked', () => {
    render(<Harness initial={baseData([skill('Combat', true, [])])} />);

    fireEvent.click(screen.getByTestId('skill-toggle-0'));

    expect(screen.getByTestId('skill-toggle-0')).toHaveTextContent('Excluded');
    expect(latest.skills).toEqual([]);
  });

  it('displays validation errors and handles no suggestions', () => {
    render(
      <Harness
        initial={baseData([])}
        errors={{ skills: 'At least one skill must be selected' }}
      />
    );

    expect(screen.getByText('At least one skill must be selected')).toBeInTheDocument();
    expect(screen.getByText('No skill suggestions available')).toBeInTheDocument();
  });
});
