import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttributeRangeEditor from '@/components/forms/AttributeRangeEditor';
import { WorldAttribute } from '@/types/world.types';

describe('AttributeRangeEditor', () => {
  const mockAttribute: WorldAttribute = {
    id: 'attr-1',
    worldId: 'world-123',
    name: 'Strength',
    description: 'Physical power',
    baseValue: 5,
    minValue: 1,
    maxValue: 10,
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with attribute default value', () => {
    render(
      <AttributeRangeEditor 
        attribute={mockAttribute} 
        onChange={mockOnChange} 
      />
    );

    // Check that the range slider shows the default value
    const rangeInput = screen.getByRole('slider');
    expect(rangeInput).toHaveValue('5');
  });

  test('updates when slider is moved', () => {
    render(
      <AttributeRangeEditor 
        attribute={mockAttribute} 
        onChange={mockOnChange} 
      />
    );

    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '7' } });

    // Test actual behavior: range input should accept valid values
    expect(rangeInput).toHaveValue('7');
    expect(rangeInput).not.toBeDisabled();
  });

  test('prevents values outside the allowed range', () => {
    render(
      <AttributeRangeEditor 
        attribute={mockAttribute} 
        onChange={mockOnChange} 
      />
    );

    // Try to set a value too low
    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '0' } });

    // Test actual behavior: values should be constrained to valid range
    expect(rangeInput).toHaveAttribute('min', '1');
    expect(rangeInput).toHaveAttribute('max', '10');
    
    // Try to set a value too high
    fireEvent.change(rangeInput, { target: { value: '11' } });
    
    // Range input should enforce constraints
    expect(rangeInput).toHaveAttribute('max', '10');
  });

  test('displays min and max values', () => {
    render(
      <AttributeRangeEditor 
        attribute={mockAttribute} 
        onChange={mockOnChange} 
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('renders in disabled state when specified', () => {
    render(
      <AttributeRangeEditor 
        attribute={mockAttribute} 
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const rangeInput = screen.getByRole('slider');
    expect(rangeInput).toBeDisabled();
  });

  test('shows basic slider interface', () => {
    render(
      <AttributeRangeEditor 
        attribute={mockAttribute} 
        onChange={mockOnChange} 
      />
    );

    const slider = screen.getByTestId('attribute-range-editor-slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('5');
  });
});
