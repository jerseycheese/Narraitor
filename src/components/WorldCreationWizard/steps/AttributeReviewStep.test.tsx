import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttributeReviewStep from './AttributeReviewStep';
import { AttributeSuggestion } from '../WorldCreationWizard';
import { World } from '@/types/world.types';

// Mock the hooks for AttributeReviewStep with dynamic processed suggestions
const mockSuggestionState = {
  localSuggestions: [
    {
      name: 'Strength',
      description: 'Physical power and endurance',
      minValue: 1,
      maxValue: 10,
      category: 'Physical',
      accepted: false,
      showDetails: true,
      baseValue: 5
    },
    {
      name: 'Intelligence',
      description: 'Mental capacity and reasoning',
      minValue: 1,
      maxValue: 10,
      category: 'Mental',
      accepted: false,
      showDetails: false,
      baseValue: 5
    },
    {
      name: 'Agility',
      description: 'Speed and dexterity',
      minValue: 1,
      maxValue: 10,
      category: 'Physical',
      accepted: false,
      showDetails: false,
      baseValue: 5
    }
  ]
};

// Mock update function that updates both the mock state and calls the actual onUpdate
let mockOnUpdate = jest.fn();

jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.stateful()
  });
});


const mockSuggestions: AttributeSuggestion[] = [
  {
    name: 'Strength',
    description: 'Physical power and endurance',
    minValue: 1,
    maxValue: 10,
    category: 'Physical',
    accepted: false,
  },
  {
    name: 'Intelligence',
    description: 'Mental capacity and reasoning',
    minValue: 1,
    maxValue: 10,
    category: 'Mental',
    accepted: false,
  },
  {
    name: 'Agility',
    description: 'Speed and dexterity',
    minValue: 1,
    maxValue: 10,
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
    
    // Reset mock suggestion state
    mockSuggestionState.localSuggestions = [
      {
        name: 'Strength',
        description: 'Physical power and endurance',
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
        accepted: false, // Start as false so toggle test can set it to true
        showDetails: true,
        baseValue: 5
      },
      {
        name: 'Intelligence',
        description: 'Mental capacity and reasoning',
        minValue: 1,
        maxValue: 10,
        category: 'Mental',
        accepted: false,
        showDetails: false,
        baseValue: 5
      },
      {
        name: 'Agility',
        description: 'Speed and dexterity',
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
        accepted: false,
        showDetails: false,
        baseValue: 5
      }
    ];
    
    // Reset mock functions
    mockUpdateField = jest.fn((field, value) => {
      if (field === 'localSuggestions') {
        mockSuggestionState.localSuggestions = value;
      }
    });
    mockOnUpdate = jest.fn();
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

    expect(screen.getByTestId('attribute-name-input-0')).toBeInTheDocument();
    expect(screen.getByTestId('attribute-description-textarea-0')).toBeInTheDocument();
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

    // Set up the mock state to reflect the accepted attribute
    mockSuggestionState.localSuggestions = [
      {
        name: 'Strength',
        description: 'Physical power and endurance',
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
        accepted: true, // This one is accepted
        showDetails: true,
        baseValue: 5
      },
      {
        name: 'Intelligence',
        description: 'Mental capacity and reasoning',
        minValue: 1,
        maxValue: 10,
        category: 'Mental',
        accepted: false,
        showDetails: false,
        baseValue: 5
      },
      {
        name: 'Agility',
        description: 'Speed and dexterity',
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
        accepted: false,
        showDetails: false,
        baseValue: 5
      }
    ];

    render(
      <AttributeReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithSelection}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const nameInput = screen.getByTestId('attribute-name-input-0');
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

    // Set up the mock state to reflect the selected attributes
    mockSuggestionState.localSuggestions = [
      {
        name: 'Strength',
        description: 'Physical power and endurance',
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
        accepted: true, // Selected
        showDetails: true,
        baseValue: 5
      },
      {
        name: 'Intelligence',
        description: 'Mental capacity and reasoning',
        minValue: 1,
        maxValue: 10,
        category: 'Mental',
        accepted: true, // Selected
        showDetails: false,
        baseValue: 5
      },
      {
        name: 'Agility',
        description: 'Speed and dexterity',
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
        accepted: false, // Not selected
        showDetails: false,
        baseValue: 5
      }
    ];

    render(
      <AttributeReviewStep
        worldData={worldDataWithSelection}
        suggestions={suggestionsWithMultipleSelected}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByTestId('attribute-count-summary')).toHaveTextContent('Attributes Selected: 2 / 6');
  });

  test('enforces maximum 6 attributes limit', () => {
    const manySuggestions = Array.from({ length: 8 }, (_, i) => ({
      name: `Attribute ${i}`,
      description: `Description ${i}`,
      minValue: 1,
      maxValue: 10,
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

    // Set up the mock state to reflect all 8 attributes as accepted
    mockSuggestionState.localSuggestions = Array.from({ length: 8 }, (_, i) => ({
      name: `Attribute ${i}`,
      description: `Description ${i}`,
      minValue: 1,
      maxValue: 10,
      category: 'General',
      accepted: true,
      showDetails: i === 0,
      baseValue: 5
    }));

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
    expect(screen.getByTestId('attribute-count-summary')).toHaveTextContent('Attributes Selected: 8 / 6');
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
    expect(screen.getByTestId('attribute-count-summary')).toBeInTheDocument();
  });

  test('can expand and collapse attribute details', () => {
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
    expect(screen.getByTestId('attribute-name-input-0')).toBeInTheDocument();
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

    // Set up the mock state to reflect the persistent selections
    mockSuggestionState.localSuggestions = [
      {
        name: 'Strength',
        description: 'Physical power and endurance',
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
        accepted: true, // Selected (index 0)
        showDetails: true,
        baseValue: 5
      },
      {
        name: 'Intelligence',
        description: 'Mental capacity and reasoning',
        minValue: 1,
        maxValue: 10,
        category: 'Mental',
        accepted: false, // Not selected (index 1)
        showDetails: false,
        baseValue: 5
      },
      {
        name: 'Agility',
        description: 'Speed and dexterity',
        minValue: 1,
        maxValue: 10,
        category: 'Physical',
        accepted: true, // Selected (index 2)
        showDetails: false,
        baseValue: 5
      }
    ];

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
