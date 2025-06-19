import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldAttributesForm from '@/components/forms/WorldAttributesForm';
import { WorldAttribute } from '@/types/world.types';

describe.skip('WorldAttributesForm - MVP Level Tests (Legacy - Interface Changed to Modal)', () => {
  const mockAttributes: WorldAttribute[] = [
    {
      id: 'attr-1',
      worldId: 'world-123',
      name: 'Strength',
      description: 'Physical power',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
    },
    {
      id: 'attr-2',
      worldId: 'world-123',
      name: 'Intelligence',
      description: 'Mental acuity',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
      category: 'Mental',
    },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test displaying existing attributes
  test('displays all existing attributes', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    // Check if all attributes are displayed
    expect(screen.getByDisplayValue('Strength')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Intelligence')).toBeInTheDocument();
  });

  // Test adding a new attribute
  test('allows adding a new attribute', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    const addButton = screen.getByText('Add Attribute');
    fireEvent.click(addButton);

    // Should call onChange with new attribute added
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...mockAttributes,
        expect.objectContaining({
          name: 'New Attribute',
          worldId: 'world-123',
        }),
      ])
    );
  });

  // Test removing an attribute
  test('allows removing an attribute', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    // Find first remove button
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    // Should call onChange with attribute removed
    expect(mockOnChange).toHaveBeenCalledWith([mockAttributes[1]]);
  });

  // Test updating an attribute name
  test('allows updating attribute properties', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    const strengthInput = screen.getByDisplayValue('Strength');
    fireEvent.change(strengthInput, { target: { value: 'Physical Strength' } });

    expect(mockOnChange).toHaveBeenCalledWith([
      { ...mockAttributes[0], name: 'Physical Strength' },
      mockAttributes[1],
    ]);
  });

  // Test empty state
  test('displays empty state when no attributes exist', () => {
    render(
      <WorldAttributesForm 
        attributes={[]} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    expect(screen.getByText(/No attributes defined yet/i)).toBeInTheDocument();
  });

  // Test section heading
  test('displays correct section heading', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    expect(screen.getByText('Attributes')).toBeInTheDocument();
  });
});

describe('WorldAttributesForm - MaxAttributes Limit Tests', () => {
  const mockAttributes: WorldAttribute[] = [
    {
      id: 'attr-1',
      worldId: 'world-123',
      name: 'Strength',
      description: 'Physical power',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
    },
    {
      id: 'attr-2',
      worldId: 'world-123',
      name: 'Intelligence',
      description: 'Mental acuity',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
    },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('disables Add Attribute button when limit is reached', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        maxAttributes={2}
        onChange={mockOnChange} 
      />
    );

    const addButton = screen.getByRole('button', { name: /cannot add more attributes/i });
    expect(addButton).toBeDisabled();
  });

  test('enables Add Attribute button when under limit', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        maxAttributes={5}
        onChange={mockOnChange} 
      />
    );

    const addButton = screen.getByRole('button', { name: /add new attribute/i });
    expect(addButton).not.toBeDisabled();
  });

  test('shows limit reached message when at maximum', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        maxAttributes={2}
        onChange={mockOnChange} 
      />
    );

    expect(screen.getByText('Maximum 2 attributes reached')).toBeInTheDocument();
  });

  test('does not show limit message when under maximum', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        maxAttributes={5}
        onChange={mockOnChange} 
      />
    );

    expect(screen.queryByText(/maximum.*reached/i)).not.toBeInTheDocument();
  });

  test('has correct aria-label when limit is reached', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        maxAttributes={2}
        onChange={mockOnChange} 
      />
    );

    const addButton = screen.getByRole('button', { name: /cannot add more attributes/i });
    expect(addButton).toHaveAttribute('aria-label', 'Cannot add more attributes. Maximum of 2 reached.');
  });

  test('has correct aria-label when under limit', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        maxAttributes={5}
        onChange={mockOnChange} 
      />
    );

    const addButton = screen.getByRole('button', { name: /add new attribute/i });
    expect(addButton).toHaveAttribute('aria-label', 'Add new attribute');
  });

  test('allows adding attribute when exactly one under limit', () => {
    const oneAttribute = [mockAttributes[0]];
    
    render(
      <WorldAttributesForm 
        attributes={oneAttribute} 
        worldId="world-123" 
        maxAttributes={2}
        onChange={mockOnChange} 
      />
    );

    const addButton = screen.getByRole('button', { name: /add new attribute/i });
    expect(addButton).not.toBeDisabled();
    expect(screen.queryByText(/maximum.*reached/i)).not.toBeInTheDocument();
  });
});
