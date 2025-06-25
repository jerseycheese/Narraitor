import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DescriptionStep from './DescriptionStep';
import { World } from '@/types/world.types';

// Mock the hooks for DescriptionStep using mock abstraction
jest.mock('@/hooks', () => {
  const { createHookMockModule, mockHookPresets } = require('@/lib/test-utils/mockHooks');
  return createHookMockModule({
    formState: mockHookPresets.formState.static(),
    asyncState: mockHookPresets.asyncState.idle(),
    errorState: mockHookPresets.errorState.clean()
  });
});

describe('DescriptionStep', () => {
  const mockWorldData: Partial<World> = {
    name: 'Test World',
    description: '',
    genre: 'fantasy',
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders description textarea', () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByTestId('description-step')).toBeInTheDocument();
    expect(screen.getByTestId('world-full-description')).toBeInTheDocument();
  });

  test('displays character count', () => {
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: 'Test description' }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByTestId('description-char-count')).toHaveTextContent('16 / 3000 characters');
  });

  test('displays validation error when provided', () => {
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: 'Too short' }}
        errors={{ description: 'Description is too short' }}
        isProcessing={false}
        onUpdate={mockOnUpdate}
      />
    );

    // Test actual behavior: component should display validation error
    expect(screen.getByText('Description is too short')).toBeInTheDocument();
  });


  test('shows processing state during AI analysis', async () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={true}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByTestId('processing-overlay')).toBeInTheDocument();
    expect(screen.getByText('Analyzing your world description...')).toBeInTheDocument();
  });

  test('enforces maximum description length correctly', () => {
    const maxLengthDescription = 'a'.repeat(3000);
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: maxLengthDescription }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
      />
    );

    const textarea = screen.getByTestId('world-full-description');
    expect(textarea).toHaveValue(maxLengthDescription);
    expect(screen.getByTestId('description-char-count')).toHaveTextContent('3000 / 3000 characters');
    
    // Test that trying to add more characters doesn't work
    fireEvent.change(textarea, { target: { value: maxLengthDescription + 'x' } });
    
    // Should not call onUpdate if over limit (component prevents this)
    expect(mockOnUpdate).not.toHaveBeenCalledWith({
      ...mockWorldData,
      description: maxLengthDescription + 'x'
    });
  });

  test('updates description on change', () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
      />
    );

    const textarea = screen.getByTestId('world-full-description');
    fireEvent.change(textarea, { target: { value: 'New description' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      description: 'New description',
    });
  });

  test('disables textarea during processing', () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={true}
        onUpdate={mockOnUpdate}
      />
    );

    // Test actual behavior: textarea should be disabled during processing
    expect(screen.getByTestId('world-full-description')).toBeDisabled();
  });

  test('displays AI error when present', () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{ ai: 'AI service is unavailable' }}
        isProcessing={false}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByTestId('ai-warning')).toHaveTextContent('AI service is unavailable');
  });
});
