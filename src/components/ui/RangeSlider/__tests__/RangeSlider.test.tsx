import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RangeSlider, { LevelDescription } from '../RangeSlider';

describe('RangeSlider', () => {
  const mockOnChange = jest.fn();
  
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Example level descriptions for testing
  const levelDescriptions: LevelDescription[] = [
    { value: 1, label: 'Novice', description: 'Beginner understanding' },
    { value: 2, label: 'Apprentice', description: 'Basic proficiency' },
    { value: 3, label: 'Competent', description: 'Solid performance' },
    { value: 4, label: 'Expert', description: 'Advanced mastery' },
    { value: 5, label: 'Master', description: 'Complete mastery' },
  ];

  test('renders with correct default value', () => {
    render(
      <RangeSlider 
        value={5} 
        min={1} 
        max={10} 
        onChange={mockOnChange} 
      />
    );

    // Check that the range slider shows the default value
    const rangeInput = screen.getByRole('slider');
    expect(rangeInput).toHaveValue('5');
    
    // Check numeric display
    const valueDisplay = screen.getByTestId('range-slider-value');
    expect(valueDisplay).toHaveTextContent('5');
  });

  test('updates when slider is moved', () => {
    render(
      <RangeSlider 
        value={5} 
        min={1} 
        max={10} 
        onChange={mockOnChange} 
      />
    );

    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '7' } });

    expect(mockOnChange).toHaveBeenCalledWith(7);
  });

  test('prevents values outside the allowed range', () => {
    render(
      <RangeSlider 
        value={5} 
        min={1} 
        max={10} 
        onChange={mockOnChange} 
      />
    );

    // Try to set a value too low
    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '0' } });

    // Should be clamped to min value
    expect(mockOnChange).toHaveBeenCalledWith(1);

    // Try to set a value too high
    fireEvent.change(rangeInput, { target: { value: '11' } });

    // Should be clamped to max value
    expect(mockOnChange).toHaveBeenCalledWith(10);
  });

  test('displays min and max values', () => {
    render(
      <RangeSlider 
        value={5} 
        min={1} 
        max={10} 
        onChange={mockOnChange} 
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('renders in disabled state when specified', () => {
    render(
      <RangeSlider 
        value={5} 
        min={1} 
        max={10} 
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const rangeInput = screen.getByRole('slider');
    expect(rangeInput).toBeDisabled();
  });

  test('shows visual indicator for current value', () => {
    render(
      <RangeSlider 
        value={5} 
        min={1} 
        max={10} 
        onChange={mockOnChange} 
      />
    );

    const currentValueIndicator = screen.getByTestId('range-slider-value');
    expect(currentValueIndicator).toBeInTheDocument();
    expect(currentValueIndicator).toHaveTextContent('5');
  });

  test('hides labels when showLabel is false', () => {
    render(
      <RangeSlider 
        value={5} 
        min={1} 
        max={10} 
        onChange={mockOnChange}
        showLabel={false}
      />
    );

    expect(screen.queryByText('Default Value')).not.toBeInTheDocument();
  });

  test('uses custom label text when provided', () => {
    render(
      <RangeSlider 
        value={5} 
        min={1} 
        max={10} 
        onChange={mockOnChange}
        labelText="Custom Label"
      />
    );

    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  test('displays level descriptions when provided', () => {
    render(
      <RangeSlider 
        value={3} 
        min={1} 
        max={5} 
        onChange={mockOnChange}
        levelDescriptions={levelDescriptions}
        showLevelDescription={true}
      />
    );

    // Should show the level label
    expect(screen.getByTestId('range-slider-level-label')).toHaveTextContent('Competent');
    
    // Should show the level description
    expect(screen.getByTestId('range-slider-description')).toHaveTextContent('Competent: Solid performance');
    
    // Should show min and max level labels
    expect(screen.getByTestId('range-slider-min-label')).toHaveTextContent('1 - Novice');
    expect(screen.getByTestId('range-slider-max-label')).toHaveTextContent('5 - Master');
  });

  test('updates when value prop changes', () => {
    const { rerender } = render(
      <RangeSlider 
        value={3} 
        min={1} 
        max={5} 
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByTestId('range-slider-value')).toHaveTextContent('3');
    
    // Update with new value
    rerender(
      <RangeSlider 
        value={4} 
        min={1} 
        max={5} 
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByTestId('range-slider-value')).toHaveTextContent('4');
  });

  test('uses custom value formatter when provided', () => {
    render(
      <RangeSlider 
        value={50} 
        min={0} 
        max={100} 
        onChange={mockOnChange}
        valueFormatter={(value) => `${value}%`}
      />
    );

    expect(screen.getByTestId('range-slider-value')).toHaveTextContent('50%');
  });

  test('uses custom testId when provided', () => {
    render(
      <RangeSlider 
        value={5} 
        min={1} 
        max={10} 
        onChange={mockOnChange}
        testId="custom-slider"
      />
    );

    expect(screen.getByTestId('custom-slider')).toBeInTheDocument();
    expect(screen.getByTestId('custom-slider-value')).toBeInTheDocument();
    expect(screen.getByTestId('custom-slider-slider')).toBeInTheDocument();
  });
});