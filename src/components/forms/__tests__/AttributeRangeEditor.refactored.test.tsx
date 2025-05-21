import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttributeRangeEditor from '../AttributeRangeEditor.refactored';
import { WorldAttribute } from '@/types/world.types';

// Mock the RangeSlider component to isolate testing
jest.mock('@/components/ui/RangeSlider', () => {
  return jest.fn(({ value, min, max, onChange, disabled, showLabel, testId }) => (
    <div data-testid={testId || 'range-slider'}>
      <span data-testid="mocked-value">{value}</span>
      <span data-testid="mocked-min">{min}</span>
      <span data-testid="mocked-max">{max}</span>
      <span data-testid="mocked-disabled">{disabled ? 'true' : 'false'}</span>
      <span data-testid="mocked-showLabel">{showLabel ? 'true' : 'false'}</span>
      <input 
        type="range" 
        value={value} 
        min={min} 
        max={max} 
        disabled={disabled}
        onChange={e => onChange(parseInt(e.target.value))}
        data-testid="mocked-slider"
      />
    </div>
  ));
});

describe('Refactored AttributeRangeEditor', () => {
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

  test('renders RangeSlider with correct props', () => {
    render(
      <AttributeRangeEditor 
        attribute={mockAttribute} 
        onChange={mockOnChange} 
      />
    );

    // Verify props passed to RangeSlider
    expect(screen.getByTestId('mocked-value')).toHaveTextContent('5');
    expect(screen.getByTestId('mocked-min')).toHaveTextContent('1');
    expect(screen.getByTestId('mocked-max')).toHaveTextContent('10');
    expect(screen.getByTestId('mocked-disabled')).toHaveTextContent('false');
    expect(screen.getByTestId('mocked-showLabel')).toHaveTextContent('true');
  });

  test('calls onChange with correct value when slider changes', () => {
    render(
      <AttributeRangeEditor 
        attribute={mockAttribute} 
        onChange={mockOnChange} 
      />
    );

    const slider = screen.getByTestId('mocked-slider');
    fireEvent.change(slider, { target: { value: '7' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      baseValue: 7
    });
  });

  test('passes disabled prop to RangeSlider', () => {
    render(
      <AttributeRangeEditor 
        attribute={mockAttribute} 
        onChange={mockOnChange}
        disabled={true}
      />
    );

    expect(screen.getByTestId('mocked-disabled')).toHaveTextContent('true');
  });

  test('passes showLabels prop to RangeSlider', () => {
    render(
      <AttributeRangeEditor 
        attribute={mockAttribute} 
        onChange={mockOnChange}
        showLabels={false}
      />
    );

    expect(screen.getByTestId('mocked-showLabel')).toHaveTextContent('false');
  });
});