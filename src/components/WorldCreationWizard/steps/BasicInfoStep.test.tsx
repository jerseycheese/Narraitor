import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BasicInfoStep from './BasicInfoStep';
import { World } from '@/types/world.types';

describe('BasicInfoStep', () => {
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
    expect(screen.getByTestId('relationship-based-on-radio')).toBeInTheDocument();
    expect(screen.getByTestId('relationship-set-in-radio')).toBeInTheDocument();
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

    expect(options).toHaveLength(9); // Including "Select an option" placeholder
    expect(options[0]).toHaveValue(''); // Placeholder
    expect(options[1]).toHaveValue('fantasy');
    expect(options[2]).toHaveValue('sci-fi');
    expect(options[3]).toHaveValue('modern');
    expect(options[4]).toHaveValue('historical');
    expect(options[5]).toHaveValue('post-apocalyptic');
    expect(options[6]).toHaveValue('cyberpunk');
    expect(options[7]).toHaveValue('western');
    expect(options[8]).toHaveValue('other');
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

  test('shows setting field when relationship is selected', () => {
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, relationship: 'based_on' }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByTestId('world-reference-input')).toBeInTheDocument();
  });

  test('hides setting field when no relationship selected', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.queryByTestId('world-reference-input')).not.toBeInTheDocument();
  });

  test('updates relationship when radio button is selected', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Select "based_on" relationship
    fireEvent.click(screen.getByTestId('relationship-based-on-radio'));
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      relationship: 'based_on',
    });
  });

  test('no relationship is selected by default', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const originalRadio = screen.getByRole('radio', { name: /Original World/ });
    expect(originalRadio).toBeChecked();
  });

  test('displays helpful description when setting field is shown', () => {
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, relationship: 'set_in' }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText(/Enter the fictional universe or historical period your world exists within/)).toBeInTheDocument();
  });

  test('updates setting field when relationship is selected', () => {
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, relationship: 'based_on' }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Add setting name
    fireEvent.change(screen.getByTestId('world-reference-input'), {
      target: { value: 'Victorian London' },
    });
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      relationship: 'based_on',
      reference: 'Victorian London',
    });
  });
});