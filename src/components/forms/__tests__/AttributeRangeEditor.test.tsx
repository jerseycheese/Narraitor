import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttributeRangeEditor from '@/components/forms/AttributeRangeEditor';
import { WorldAttribute } from '@/types/world.types';

// Test wrapper to track value changes
const TestWrapper = ({ initialAttribute, disabled = false }: { 
  initialAttribute: WorldAttribute; 
  disabled?: boolean; 
}) => {
  const [attribute, setAttribute] = useState(initialAttribute);
  
  const handleChange = (updates: Partial<WorldAttribute>) => {
    setAttribute(prev => ({ ...prev, ...updates }));
  };

  return (
    <div>
      <AttributeRangeEditor 
        attribute={attribute} 
        onChange={handleChange}
        disabled={disabled}
      />
      <div data-testid="current-value">Current: {attribute.baseValue}</div>
    </div>
  );
};

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

  test('displays attribute information and current value', () => {
    render(<TestWrapper initialAttribute={mockAttribute} />);

    // Should show the current value in the slider
    const rangeInput = screen.getByRole('slider');
    expect(rangeInput).toHaveValue('5');
    
    // Should display min and max values for user reference
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    
    // Should show current value
    expect(screen.getByTestId('current-value')).toHaveTextContent('Current: 5');
  });

  test('exposes an accessible name naming the attribute', () => {
    render(<TestWrapper initialAttribute={mockAttribute} />);

    expect(
      screen.getByRole('slider', { name: 'Strength value' })
    ).toBeInTheDocument();
  });

  test('allows user to change value within valid range', () => {
    render(<TestWrapper initialAttribute={mockAttribute} />);

    const rangeInput = screen.getByRole('slider');
    
    // User moves slider to 7
    fireEvent.change(rangeInput, { target: { value: '7' } });
    
    // Value should update in the component
    expect(screen.getByTestId('current-value')).toHaveTextContent('Current: 7');
    expect(rangeInput).toHaveValue('7');
  });

  test('constrains values to valid range', () => {
    render(<TestWrapper initialAttribute={mockAttribute} />);

    const rangeInput = screen.getByRole('slider');
    
    // Try to set value below minimum
    fireEvent.change(rangeInput, { target: { value: '0' } });
    expect(screen.getByTestId('current-value')).toHaveTextContent('Current: 1');
    
    // Try to set value above maximum  
    fireEvent.change(rangeInput, { target: { value: '15' } });
    expect(screen.getByTestId('current-value')).toHaveTextContent('Current: 10');
  });

  test('cannot be modified when disabled', () => {
    render(<TestWrapper initialAttribute={mockAttribute} disabled={true} />);

    const rangeInput = screen.getByRole('slider');
    expect(rangeInput).toBeDisabled();
    
    // Value should remain unchanged
    expect(screen.getByTestId('current-value')).toHaveTextContent('Current: 5');
  });

  test('works with different attribute ranges', () => {
    const wideRangeAttribute: WorldAttribute = {
      ...mockAttribute,
      baseValue: 50,
      minValue: 0,
      maxValue: 100,
    };
    
    render(<TestWrapper initialAttribute={wideRangeAttribute} />);

    const rangeInput = screen.getByRole('slider');
    expect(rangeInput).toHaveValue('50');
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    
    // Test movement in larger range
    fireEvent.change(rangeInput, { target: { value: '75' } });
    expect(screen.getByTestId('current-value')).toHaveTextContent('Current: 75');
  });
});
