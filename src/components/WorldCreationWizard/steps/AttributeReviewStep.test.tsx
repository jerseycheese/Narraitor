import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttributeReviewStep from './AttributeReviewStep';
import { AttributeSuggestion, WorldCreationData } from '../WizardState';

const suggestion = (name: string, accepted = true): AttributeSuggestion => ({
  name,
  description: `${name} description`,
  minValue: 1,
  maxValue: 10,
  baseValue: 5,
  category: 'Physical',
  accepted,
});

const baseData = (attributes: AttributeSuggestion[]): WorldCreationData => ({
  name: 'Test World',
  genre: 'fantasy',
  settings: { maxAttributes: 6, maxSkills: 12, attributePointPool: 20, skillPointPool: 20 },
  aiSuggestions: { attributes, skills: [] },
  aiSuggestionMeta: { source: 'ai' },
});

let latest: WorldCreationData;

/** Holds worldData the way the wizard does, so the step re-renders from its own updates. */
const Harness = ({
  initial,
  errors = {},
  onClearSuggestions,
}: {
  initial: WorldCreationData;
  errors?: Record<string, string>;
  onClearSuggestions?: () => void;
}) => {
  const [data, setData] = useState(initial);
  latest = data;
  return (
    <AttributeReviewStep
      worldData={data}
      errors={errors}
      onUpdate={(updates) => setData((prev) => ({ ...prev, ...updates }))}
      onClearSuggestions={onClearSuggestions}
    />
  );
};

describe('AttributeReviewStep', () => {
  test('renders suggestions and saves the accepted ones', () => {
    render(<Harness initial={baseData([suggestion('Strength'), suggestion('Agility', false)])} />);

    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByTestId('attribute-toggle-1')).toHaveTextContent('Excluded');
    expect(latest.attributes?.map((a) => a.name)).toEqual(['Strength']);
    expect(screen.getByText(/attributes selected: 1 \/ 6/i)).toBeInTheDocument();
  });

  test('toggling updates the saved attributes', () => {
    render(<Harness initial={baseData([suggestion('Strength'), suggestion('Agility', false)])} />);

    fireEvent.click(screen.getByTestId('attribute-toggle-1'));

    expect(screen.getByTestId('attribute-toggle-1')).toHaveTextContent('Selected');
    expect(latest.attributes?.map((a) => a.name)).toEqual(['Strength', 'Agility']);
  });

  test('renaming a suggestion keeps its id', () => {
    render(<Harness initial={baseData([suggestion('Strength')])} />);
    const originalId = latest.attributes?.[0].id;

    fireEvent.change(screen.getByDisplayValue('Strength'), {
      target: { value: 'Physical Strength' },
    });

    expect(latest.attributes?.[0]).toMatchObject({ id: originalId, name: 'Physical Strength' });
  });

  test('updates the starting value through the number input', () => {
    render(<Harness initial={baseData([suggestion('Strength')])} />);

    fireEvent.change(screen.getByTestId('attribute-base-value-input-0'), {
      target: { value: '8' },
    });

    expect(latest.attributes?.[0]).toMatchObject({ name: 'Strength', baseValue: 8 });
  });

  test('displays errors when provided', () => {
    render(
      <Harness
        initial={baseData([suggestion('Strength')])}
        errors={{ attributes: 'Please select at least one attribute' }}
      />
    );

    expect(screen.getByText('Please select at least one attribute')).toBeInTheDocument();
  });

  test('clear confirmation says it clears attributes and skills', () => {
    const onClear = jest.fn();
    render(<Harness initial={baseData([suggestion('Strength')])} onClearSuggestions={onClear} />);

    fireEvent.click(screen.getByTestId('clear-ai-suggestions-button'));
    expect(screen.getByText(/every suggested attribute and skill/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Suggestions' }));

    expect(onClear).toHaveBeenCalled();
  });
});
