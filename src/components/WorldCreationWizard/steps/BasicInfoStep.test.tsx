import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BasicInfoStep from './BasicInfoStep';
import { World } from '@/types/world.types';

describe.skip('BasicInfoStep', () => {
  const mockWorldData: Partial<World> = {
    name: '',
    description: '',
    theme: 'fantasy',
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form fields', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    expect(screen.getByTestId('world-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('world-description-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('world-genre-select')).toBeInTheDocument();
  });

  test('displays error for world name when provided', () => {
    // Since BasicInfoStep no longer handles validation directly,
    // we test that errors passed in are displayed correctly
    const errors = { name: 'World name must be at least 3 characters' };
    
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, name: 'ab' }}
        errors={errors}
        onUpdate={mockOnUpdate}
      />
    );

    // Should display the error
    expect(screen.getByTestId('name-error')).toHaveTextContent(
      'World name must be at least 3 characters'
    );
  });

  test('displays error for description when provided', () => {
    // Since BasicInfoStep no longer handles validation directly,
    // we test that errors passed in are displayed correctly
    const errors = { description: 'Description must be at least 10 characters' };
    
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, name: 'Valid Name', description: 'Too short' }}
        errors={errors}
        onUpdate={mockOnUpdate}
      />
    );

    // Should display the error
    expect(screen.getByTestId('description-error')).toHaveTextContent(
      'Description must be at least 10 characters'
    );
  });

  test('updates world data on input change', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Change name
    fireEvent.change(screen.getByTestId('world-name-input'), {
      target: { value: 'My New World' },
    });
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      name: 'My New World',
    });

    // Change description
    fireEvent.change(screen.getByTestId('world-description-textarea'), {
      target: { value: 'A detailed description of my world' },
    });
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      description: 'A detailed description of my world',
    });

    // Change genre
    fireEvent.change(screen.getByTestId('world-genre-select'), {
      target: { value: 'sci-fi' },
    });
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      theme: 'sci-fi',
    });
  });

  test('renders with valid data', () => {
    render(
      <BasicInfoStep
        worldData={{
          name: 'Valid World Name',
          description: 'This is a valid description for our world',
          theme: 'fantasy',
        }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByTestId('world-name-input')).toHaveValue('Valid World Name');
    expect(screen.getByTestId('world-description-textarea')).toHaveValue('This is a valid description for our world');
    expect(screen.getByTestId('world-genre-select')).toHaveValue('fantasy');
  });

  test('displays error messages for invalid inputs', () => {
    const errors = {
      name: 'Name is too short',
      description: 'Description is required',
    };

    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={errors}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByTestId('name-error')).toHaveTextContent('Name is too short');
    expect(screen.getByTestId('description-error')).toHaveTextContent('Description is required');
  });

  test('allows entering all basic info fields', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Test all inputs are functional
    const nameInput = screen.getByTestId('world-name-input');
    const descriptionTextarea = screen.getByTestId('world-description-textarea');
    const genreSelect = screen.getByTestId('world-genre-select');

    expect(nameInput).toBeEnabled();
    expect(descriptionTextarea).toBeEnabled();
    expect(genreSelect).toBeEnabled();
  });

  test('displays all genre options', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const genreSelect = screen.getByTestId('world-genre-select');
    const options = genreSelect.querySelectorAll('option');

    expect(options).toHaveLength(8);
    expect(options[0]).toHaveValue('fantasy');
    expect(options[1]).toHaveValue('sci-fi');
    expect(options[2]).toHaveValue('modern');
    expect(options[3]).toHaveValue('historical');
    expect(options[4]).toHaveValue('post-apocalyptic');
    expect(options[5]).toHaveValue('cyberpunk');
    expect(options[6]).toHaveValue('western');
    expect(options[7]).toHaveValue('other');
  });

  test('preserves field values when re-rendered', () => {
    const { rerender } = render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Update values
    fireEvent.change(screen.getByTestId('world-name-input'), {
      target: { value: 'Test World' },
    });

    // Re-render with updated data
    rerender(
      <BasicInfoStep
        worldData={{ ...mockWorldData, name: 'Test World' }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Value should be preserved
    expect(screen.getByTestId('world-name-input')).toHaveValue('Test World');
  });
});