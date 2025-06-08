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
    expect(screen.getByDisplayValue('fantasy')).toBeInTheDocument();
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

  test('displays error messages when provided', () => {
    const errors = {
      name: 'Name is required',
      description: 'Description is required',
      theme: 'Theme is required',
      reference: 'Reference is required'
    };

    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, relationship: 'based_on' }}
        errors={errors}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Reference is required')).toBeInTheDocument();
  });

  test('calls onUpdate when relationship is changed', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Click based_on radio
    const basedOnRadio = screen.getByTestId('relationship-based-on-radio');
    fireEvent.click(basedOnRadio);
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      relationship: 'based_on'
    });
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

  test('calls onUpdate when input values change', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
      />
    );

    // Change world name
    fireEvent.change(screen.getByTestId('world-name-input'), {
      target: { value: 'New World Name' },
    });
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      name: 'New World Name',
    });

    // Change description
    fireEvent.change(screen.getByTestId('world-description-textarea'), {
      target: { value: 'New description' },
    });
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      description: 'New description',
    });

    // Change theme
    fireEvent.change(screen.getByTestId('world-genre-select'), {
      target: { value: 'sci-fi' },
    });
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      theme: 'sci-fi',
    });
  });

  test('updates reference field when relationship exists', () => {
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