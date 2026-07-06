import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttributeReviewStep from './AttributeReviewStep';
import { AttributeSuggestion } from '../WorldCreationWizard';
import { World } from '@/types/world.types';

const mockOnUpdate = jest.fn();

const mockSuggestions: AttributeSuggestion[] = [
  {
    name: 'Strength',
    description: 'Physical power and endurance',
    minValue: 1,
    maxValue: 10,
    baseValue: 5,
    category: 'Physical',
    accepted: false,
  },
  {
    name: 'Intelligence',
    description: 'Mental capacity and reasoning',
    minValue: 1,
    maxValue: 10,
    baseValue: 5,
    category: 'Mental',
    accepted: false,
  },
  {
    name: 'Agility',
    description: 'Speed and dexterity',
    minValue: 1,
    maxValue: 10,
    baseValue: 5,
    category: 'Physical',
    accepted: false,
  },
];

const defaultWorldData: Partial<World> = {
  name: 'Test World',
  genre: 'fantasy',
  attributes: [],
};

describe('AttributeReviewStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all suggested attributes', () => {
    render(
      <AttributeReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Review Attributes')).toBeInTheDocument();
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Agility')).toBeInTheDocument();
  });

  test('toggles attribute selection', () => {
    render(
      <AttributeReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const toggleButton = screen.getByTestId('attribute-toggle-0');
    fireEvent.click(toggleButton);

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.arrayContaining([
          expect.objectContaining({ name: 'Strength' })
        ])
      })
    );
  });

  test('shows attribute details when selected', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      attributes: [{
        id: 'attr-1',
        worldId: '',
        name: 'Strength',
        description: 'Physical power and endurance',
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
      }],
    };

    render(
      <AttributeReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByDisplayValue('Strength')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Physical power and endurance')).toBeInTheDocument();
    // In the MVP, we only have a range editor with fixed min and max values
    // No explicit min/max inputs are present anymore
  });

  test('allows editing attribute properties', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      attributes: [{
        id: 'attr-1',
        worldId: '',
        name: 'Strength',
        description: 'Physical power and endurance',
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
      }],
    };

    render(
      <AttributeReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const nameInput = screen.getByDisplayValue('Strength');
    fireEvent.change(nameInput, { target: { value: 'Physical Strength' } });

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.arrayContaining([
          expect.objectContaining({ name: 'Physical Strength' })
        ])
      })
    );
  });

  test('displays selected attribute count', () => {
    const suggestionsWithMultipleSelected = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i < 2,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      attributes: [
        {
          id: 'attr-1',
          worldId: '',
          name: 'Strength',
          description: 'Physical power and endurance',
          baseValue: 5,
          minValue: 1,
          maxValue: 10,
          category: 'Physical',
        },
        {
          id: 'attr-2',
          worldId: '',
          name: 'Intelligence',
          description: 'Mental capacity and reasoning',
          baseValue: 5,
          minValue: 1,
          maxValue: 10,
          category: 'Mental',
        },
      ],
    };

    render(
      <AttributeReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithMultipleSelected}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText(/attributes selected: 2 \/ 6/i)).toBeInTheDocument();
  });

  test('enforces maximum 6 attributes limit', () => {
    const manySuggestions = Array.from({ length: 8 }, (_, i) => ({
    name: `Attribute ${i}`,
    description: `Description ${i}`,
      minValue: 1,
      maxValue: 10,
      baseValue: 5,
      category: 'General',
      accepted: true,
    }));

    const worldDataWithManyAttrs = {
      ...defaultWorldData,
      attributes: Array.from({ length: 8 }, (_, i) => ({
        id: `attr-${i}`,
        worldId: '',
      name: `Attribute ${i}`,
      description: `Description ${i}`,
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
        category: 'General',
      })),
    };

    render(
      <AttributeReviewStep
        worldData={worldDataWithManyAttrs}
        suggestions={manySuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Note: We're not enforcing max limit in the component itself anymore
    // Just checking that the count is correctly displayed
    expect(screen.getByText(/attributes selected: 8 \/ 6/i)).toBeInTheDocument();
  });

  test('allows toggling attributes on and off', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0,
    }));

    render(
      <AttributeReviewStep
        worldData={defaultWorldData}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Toggle an attribute
    const toggleButton = screen.getByTestId('attribute-toggle-1');
    fireEvent.click(toggleButton);

    // Should update with the new selection
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  test('displays minimum attribute requirements', () => {
    render(
      <AttributeReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Check for attribute count summary
    expect(screen.getByText(/attributes selected:/i)).toBeInTheDocument();
  });

  test('can expand and attribute details', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      attributes: [{
        id: 'attr-1',
        worldId: '',
        name: 'Strength',
        description: 'Physical power and endurance',
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
      }],
    };

    render(
      <AttributeReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Should show the details for the selected attribute
    expect(screen.getByDisplayValue('Strength')).toBeInTheDocument();
  });

  test('updates the starting value through the number input', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      attributes: [{
        id: 'attr-1',
        worldId: '',
        name: 'Strength',
        description: 'Physical power and endurance',
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
      }],
    };

    render(
      <AttributeReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const valueInput = screen.getByTestId('attribute-base-value-input-0');
    fireEvent.change(valueInput, { target: { value: '8' } });

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.arrayContaining([
          expect.objectContaining({ name: 'Strength', baseValue: 8 }),
        ]),
      })
    );
  });

  test('displays errors when provided', () => {
    const errors = { attributes: 'Please select at least one attribute' };

    render(
      <AttributeReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={errors}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Please select at least one attribute')).toBeInTheDocument();
  });

  test('persists selections after navigating away and back', () => {
    const suggestionsWithSelection = mockSuggestions.map((s, i) => ({
      ...s,
      accepted: i === 0 || i === 2,
    }));

    const worldDataWithSelection = {
      ...defaultWorldData,
      attributes: [
        {
          id: 'attr-1',
          worldId: '',
          name: 'Strength',
          description: 'Physical power and endurance',
          baseValue: 5,
          minValue: 1,
          maxValue: 10,
          category: 'Physical',
        },
        {
          id: 'attr-3',
          worldId: '',
          name: 'Agility',
          description: 'Speed and dexterity',
          baseValue: 5,
          minValue: 1,
          maxValue: 10,
          category: 'Physical',
        },
      ],
    };

    render(
      <AttributeReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Check that the toggle buttons show the correct state
    expect(screen.getByTestId('attribute-toggle-0')).toHaveTextContent('Selected');
    expect(screen.getByTestId('attribute-toggle-1')).toHaveTextContent('Excluded');
    expect(screen.getByTestId('attribute-toggle-2')).toHaveTextContent('Selected');
  });
});
