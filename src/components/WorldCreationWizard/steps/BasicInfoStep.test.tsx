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
  const mockOnNext = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form fields', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    expect(screen.getByTestId('world-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('world-description-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('world-genre-select')).toBeInTheDocument();
    expect(screen.getByTestId('step-cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('step-next-button')).toBeInTheDocument();
  });

  test('validates world name (minimum 3 characters)', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onCancel={mockOnCancel}
      />
    );

    // Try to proceed with short name
    fireEvent.change(screen.getByTestId('world-name-input'), {
      target: { value: 'ab' },
    });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Should show error and not proceed
    expect(screen.getByTestId('name-error')).toHaveTextContent(
      'World name must be at least 3 characters'
    );
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  test('validates description (minimum 10 characters)', () => {
    render(
      <BasicInfoStep
        worldData={{ ...mockWorldData, name: 'Valid Name' }}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onCancel={mockOnCancel}
      />
    );

    // Try to proceed with short description
    fireEvent.change(screen.getByTestId('world-description-textarea'), {
      target: { value: 'Too short' },
    });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Should show error and not proceed
    expect(screen.getByTestId('description-error')).toHaveTextContent(
      'Description must be at least 10 characters'
    );
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  test('updates world data on input change', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onCancel={mockOnCancel}
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

  test('calls onNext when validation passes', () => {
    render(
      <BasicInfoStep
        worldData={{
          name: 'Valid World Name',
          description: 'This is a valid description for our world',
          theme: 'fantasy',
        }}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByTestId('step-next-button'));

    expect(mockOnNext).toHaveBeenCalled();
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
        onNext={mockOnNext}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('name-error')).toHaveTextContent('Name is too short');
    expect(screen.getByTestId('description-error')).toHaveTextContent('Description is required');
  });

  test('calls onCancel when cancel clicked', () => {
    render(
      <BasicInfoStep
        worldData={mockWorldData}
        errors={{}}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByTestId('step-cancel-button'));

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
