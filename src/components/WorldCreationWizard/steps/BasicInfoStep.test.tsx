import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BasicInfoStep from './BasicInfoStep';
import { World } from '@/types/world.types';

describe('BasicInfoStep', () => {
  const mockWorldData: Partial<World> = {
    name: '',
    description: '',
    genre: 'fantasy',
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all required form fields', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByPlaceholderText(/enter your world's name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/provide a brief description/i)).toBeInTheDocument();
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
    expect(screen.getByText('World name must be at least 3 characters')).toBeInTheDocument();
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
    expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
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
    fireEvent.change(screen.getByPlaceholderText(/enter your world's name/i), {
      target: { value: 'My New World' },
    });
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      name: 'My New World',
    });

    // Change description
    fireEvent.change(screen.getByPlaceholderText(/provide a brief description/i), {
      target: { value: 'A detailed description of my world' },
    });
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      description: 'A detailed description of my world',
    });

    // Change genre - find by test id since multiple genre selects exist
    const worldGenreSelect = screen.getByTestId('world-genre-select');
    fireEvent.change(worldGenreSelect, {
      target: { value: 'sci-fi' },
    });
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      genre: 'sci-fi',
    });
  });

  test('renders with valid data', () => {
    render(
      <BasicInfoStep
        worldData={{
          name: 'Valid World Name',
          description: 'This is a valid description for our world',
          genre: 'fantasy',
        }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByDisplayValue('Valid World Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a valid description for our world')).toBeInTheDocument();
    // Check that genre select has the correct value by finding the option that's selected
    const genreSelect = screen.getByTestId('world-genre-select');
    expect(genreSelect).toHaveValue('fantasy');
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

    expect(screen.getByText('Name is too short')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
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
    const nameInput = screen.getByPlaceholderText(/enter your world's name/i);
    const descriptionTextarea = screen.getByPlaceholderText(/provide a brief description/i);
    const genreSelect = screen.getByTestId('world-genre-select');

    expect(nameInput).toBeEnabled();
    expect(descriptionTextarea).toBeEnabled();
    expect(genreSelect).toBeEnabled();
  });

  test('genre dropdown has options', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const genreSelect = screen.getByTestId('world-genre-select');
    const options = genreSelect.querySelectorAll('option');

    // Just verify dropdown has multiple options available
    expect(options.length).toBeGreaterThan(1);
  });

  test('preserves field values when re-rendered', () => {
    const { rerender } = render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Update values - use placeholder text to target the right input
    const nameInput = screen.getByPlaceholderText(/enter your world's name/i);
    fireEvent.change(nameInput, {
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
    expect(screen.getByDisplayValue('Test World')).toBeInTheDocument();
  });

});
