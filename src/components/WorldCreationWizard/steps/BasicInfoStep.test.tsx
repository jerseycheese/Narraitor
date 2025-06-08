import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    expect(screen.getByTestId('relationship-original-radio')).toBeInTheDocument();
    expect(screen.getByTestId('relationship-based-on-radio')).toBeInTheDocument();
    expect(screen.getByTestId('relationship-set-in-radio')).toBeInTheDocument();
  });

  test('renders with initial world data', () => {
    const worldDataWithValues = {
      name: 'Test World',
      description: 'A test world description',
      theme: 'fantasy'
    };
    
    render(
      <BasicInfoStep
        worldData={worldDataWithValues}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Check that values are displayed
    expect(screen.getByDisplayValue('Test World')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test world description')).toBeInTheDocument();
    
    // Check that the select has the fantasy option available (value is controlled by react-hook-form)
    const genreSelect = screen.getByTestId('world-genre-select');
    expect(genreSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fantasy' })).toBeInTheDocument();
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
    expect(genreSelect).toBeInTheDocument();
    
    // Check that some expected genre options exist
    expect(screen.getByRole('option', { name: 'Fantasy' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Science Fiction' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Modern' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Historical' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Post-Apocalyptic' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cyberpunk' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Western' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
  });

  test('shows reference field when relationship is selected', () => {
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, relationship: 'based_on' }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByTestId('world-reference-input')).toBeInTheDocument();
  });

  test('hides reference field when no relationship is selected', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.queryByTestId('world-reference-input')).not.toBeInTheDocument();
  });

  test('original world is selected by default', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const originalRadio = screen.getByTestId('relationship-original-radio');
    expect(originalRadio).toBeChecked();
  });

  test('renders form section with proper title and description', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText("Let's start with some basic information about your world.")).toBeInTheDocument();
  });

  test('renders form fields with proper labels and descriptions', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Check field labels
    expect(screen.getByText('World Name')).toBeInTheDocument();
    expect(screen.getByText('Brief Description')).toBeInTheDocument();
    expect(screen.getByText('Genre')).toBeInTheDocument();

    // Check field descriptions
    expect(screen.getByText('Choose a unique name for your world')).toBeInTheDocument();
    expect(screen.getByText('Provide a brief description that captures the essence of your world')).toBeInTheDocument();
    expect(screen.getByText('Select the primary genre that best describes your world')).toBeInTheDocument();
  });

  test('marks required fields with asterisk', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Check for asterisks indicating required fields
    const asterisks = screen.getAllByText('*');
    expect(asterisks.length).toBeGreaterThanOrEqual(3); // At least the three main fields are required
  });

  test('renders proper input placeholders', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByPlaceholderText("Enter your world's name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Provide a brief description of your world')).toBeInTheDocument();
    expect(screen.getByText('Select a genre')).toBeInTheDocument(); // Select placeholder text
  });

  test('shows relationship-based reference field when based_on is selected', () => {
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, relationship: 'based_on' }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const basedOnRadio = screen.getByTestId('relationship-based-on-radio');
    expect(basedOnRadio).toBeChecked();
    expect(screen.getByTestId('world-reference-input')).toBeInTheDocument();
  });

  test('shows relationship-based reference field when set_in is selected', () => {
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, relationship: 'set_in' }}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    const setInRadio = screen.getByTestId('relationship-set-in-radio');
    expect(setInRadio).toBeChecked();
    expect(screen.getByTestId('world-reference-input')).toBeInTheDocument();
  });

  test('calls onUpdate when form values change', async () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Type in the name field
    const nameInput = screen.getByTestId('world-name-input');
    fireEvent.change(nameInput, { target: { value: 'Test World' } });

    // Wait for the form to update and call onUpdate
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  test('form updates when relationship radio buttons are clicked', async () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Click the 'based_on' radio button
    const basedOnRadio = screen.getByTestId('relationship-based-on-radio');
    fireEvent.click(basedOnRadio);

    // The reference field should appear
    await waitFor(() => {
      expect(screen.getByTestId('world-reference-input')).toBeInTheDocument();
    });

    // The radio should be checked
    expect(basedOnRadio).toBeChecked();
  });
});