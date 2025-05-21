import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldAttributesForm from '@/components/forms/WorldAttributesForm';
import { WorldAttribute } from '@/types/world.types';

describe('WorldAttributesForm - Range Selection', () => {
  const mockAttributes: WorldAttribute[] = [
    {
      id: 'attr-1',
      worldId: 'world-123',
      name: 'Strength',
      description: 'Physical power',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
    },
    {
      id: 'attr-2',
      worldId: 'world-123',
      name: 'Intelligence',
      description: 'Mental acuity',
      baseValue: 7,
      minValue: 1,
      maxValue: 10,
      category: 'Mental',
    },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays range controls for each attribute', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    // Check if range sliders are present for each attribute
    const rangeInputs = screen.getAllByRole('slider');
    expect(rangeInputs.length).toBe(mockAttributes.length);
  });

  test('shows current values for each attribute', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    // Check if the current values are displayed
    const valueDisplays = screen.getAllByTestId('attribute-range-editor-value');
    expect(valueDisplays[0]).toHaveTextContent('5');
    expect(valueDisplays[1]).toHaveTextContent('7');
  });

  test('updates attribute base value when range is changed', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    // Get the first attribute's range slider
    const rangeInputs = screen.getAllByRole('slider');
    fireEvent.change(rangeInputs[0], { target: { value: '8' } });

    // Should call onChange with updated baseValue
    expect(mockOnChange).toHaveBeenCalledWith([
      { ...mockAttributes[0], baseValue: 8 },
      mockAttributes[1],
    ]);
  });

  test('ensures new attributes have correct range values', () => {
    render(
      <WorldAttributesForm 
        attributes={[]} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    // Add a new attribute
    const addButton = screen.getByText('Add Attribute');
    fireEvent.click(addButton);

    // New attribute should have minValue 1, maxValue 10, and a default baseValue
    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({
        minValue: 1,
        maxValue: 10,
        baseValue: expect.any(Number)
      })
    ]);

    // The baseValue should be within the min-max range
    const newAttribute = mockOnChange.mock.calls[0][0][0];
    expect(newAttribute.baseValue).toBeGreaterThanOrEqual(1);
    expect(newAttribute.baseValue).toBeLessThanOrEqual(10);
  });

  test('displays appropriate range constraints (1-10 for MVP)', () => {
    render(
      <WorldAttributesForm 
        attributes={mockAttributes} 
        worldId="world-123" 
        onChange={mockOnChange} 
      />
    );

    // Check min-max values are displayed
    const minValues = screen.getAllByText('1');
    expect(minValues.length).toBeGreaterThanOrEqual(mockAttributes.length);

    const maxValues = screen.getAllByText('10');
    expect(maxValues.length).toBeGreaterThanOrEqual(mockAttributes.length);
  });
});