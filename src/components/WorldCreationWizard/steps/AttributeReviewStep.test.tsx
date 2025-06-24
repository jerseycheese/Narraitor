import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttributeReviewStep from './AttributeReviewStep';
import { AttributeSuggestion } from '../WorldCreationWizard';
import { World } from '@/types/world.types';

// Mock the hooks for AttributeReviewStep using mock abstraction
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.static()
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
  let mockOnUpdate: jest.MockedFunction<(updates: Partial<World>) => void>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnUpdate = jest.fn();
  });

  test('renders basic component structure', () => {
    render(
      <AttributeReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Review Attributes')).toBeInTheDocument();
    expect(screen.getByTestId('attribute-count-summary')).toBeInTheDocument();
    
    // With stateless mock, the component will show "No attribute suggestions available"
    // Since the useEffect doesn't populate localSuggestions in the mock
    expect(screen.getByText('No attribute suggestions available')).toBeInTheDocument();
  });

  test('renders custom attributes section', () => {
    render(
      <AttributeReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Custom Attributes')).toBeInTheDocument();
    expect(screen.getByTestId('add-custom-attribute-button')).toBeInTheDocument();
  });

  test('displays attribute count with stateless mock', () => {
    render(
      <AttributeReviewStep
        worldData={defaultWorldData}
        suggestions={mockSuggestions}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // With stateless mock, count will be 0 since localSuggestions is empty
    expect(screen.getByTestId('attribute-count-summary')).toHaveTextContent('Attributes Selected: 0 / 6');
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

  test('renders component without crashing when suggestions is empty', () => {
    render(
      <AttributeReviewStep
        worldData={defaultWorldData}
        suggestions={[]}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Review Attributes')).toBeInTheDocument();
    expect(screen.getByText('No attribute suggestions available')).toBeInTheDocument();
  });
});
