import React, { useState, useEffect } from 'react';

/**
 * Level description interface for displaying additional context with range values
 */
export interface LevelDescription {
  value: number;
  label: string;
  description?: string;
}

/**
 * Props for the RangeSlider component
 */
export interface RangeSliderProps {
  /**
   * Current value of the slider
   */
  value: number;
  
  /**
   * Minimum allowed value
   */
  min: number;
  
  /**
   * Maximum allowed value
   */
  max: number;
  
  /**
   * Callback when the value changes
   */
  onChange: (value: number) => void;
  
  /**
   * Whether the slider is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether to show the header label
   */
  showLabel?: boolean;
  
  /**
   * Custom label for the header (defaults to "Default Value")
   */
  labelText?: string;
  
  /**
   * Level descriptions for displaying additional context with range values
   */
  levelDescriptions?: LevelDescription[];
  
  /**
   * Whether to show the level description below the slider
   */
  showLevelDescription?: boolean;
  
  /**
   * Custom formatter for the displayed value
   */
  valueFormatter?: (value: number) => string;
  
  /**
   * Test ID for the component
   */
  testId?: string;
}

/**
 * A reusable range slider component with customizable min/max values,
 * level descriptions, and styling.
 */
const RangeSlider: React.FC<RangeSliderProps> = ({
  value: initialValue,
  min,
  max,
  onChange,
  disabled = false,
  showLabel = true,
  labelText = "Default Value",
  levelDescriptions = [],
  showLevelDescription = false,
  valueFormatter,
  testId = "range-slider",
}) => {
  const [value, setValue] = useState(initialValue);
  
  // Keep internal state in sync with prop value
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Handle slider changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value);
    
    // Clamp value to min/max range
    if (isNaN(newValue)) newValue = min;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;

    setValue(newValue);
    onChange(newValue);
  };

  // Find the level description for the current value
  const currentLevelDescription = levelDescriptions.find(level => level.value === value);
  
  // Format value display text
  const formattedValue = valueFormatter 
    ? valueFormatter(value)
    : currentLevelDescription
      ? `${value} - ${currentLevelDescription.label}`
      : `${value}`;

  return (
    <div className="py-2" data-testid={testId}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>{labelText}</span>
          {showLevelDescription && currentLevelDescription && (
            <span className="font-medium text-blue-600" data-testid={`${testId}-level-label`}>
              {currentLevelDescription.label}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <div className="text-center mb-2">
          <span 
            className="inline-block px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium" 
            data-testid={`${testId}-value`}
          >
            {formattedValue}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full m-0 appearance-none bg-transparent cursor-pointer h-6 flex items-center [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-gray-200 [&::-webkit-slider-runnable-track]:rounded-full [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-gray-200 [&::-moz-range-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:mt-[-6px] [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:mt-0"
          data-testid={`${testId}-slider`}
        />
        
        {/* Min/Max labels */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          {levelDescriptions.length > 0 && (
            <>
              <span data-testid={`${testId}-min-label`}>
                {min} - {levelDescriptions[0]?.label || min}
              </span>
              <span data-testid={`${testId}-max-label`}>
                {max} - {levelDescriptions[levelDescriptions.length - 1]?.label || max}
              </span>
            </>
          )}
          {levelDescriptions.length === 0 && (
            <>
              <span>{min}</span>
              <span>{max}</span>
            </>
          )}
        </div>
        
        {/* Level description */}
        {showLevelDescription && currentLevelDescription && currentLevelDescription.description && (
          <div className="mt-2 text-sm text-gray-600" data-testid={`${testId}-description`}>
            <span className="font-medium">{currentLevelDescription.label}:</span> {currentLevelDescription.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default RangeSlider;