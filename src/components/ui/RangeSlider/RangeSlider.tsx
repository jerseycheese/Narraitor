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
  
  /**
   * Whether the slider is at a constrained max (visual indicator)
   */
  isConstrained?: boolean;
  
  /**
   * The effective maximum value (for constraints), while max remains the visual max
   */
  effectiveMax?: number;
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
  valueFormatter, // eslint-disable-line @typescript-eslint/no-unused-vars
  testId = "range-slider",
  isConstrained = false,
  effectiveMax,
}) => {
  const [value, setValue] = useState(initialValue);
  
  // Keep internal state in sync with prop value
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Determine if we should use visual scale mapping
  const useVisualScale = min === 8 && max === 18;

  // Map visual scale to actual value range
  const scaleToValue = (scaleValue: number): number => {
    if (useVisualScale) {
      // Map 1-10 scale to 8-18 values (adding 7)
      return scaleValue + 7;
    }
    return scaleValue;
  };

  // Map actual value to visual scale
  const valueToScale = (actualValue: number): number => {
    if (useVisualScale) {
      // Map 8-18 values to 1-10 scale (subtracting 7)
      return actualValue - 7;
    }
    return actualValue;
  };

  // Handle slider changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseInt(e.target.value);
    if (isNaN(sliderValue)) return;
    
    // Convert from scale to actual value
    const actualValue = scaleToValue(sliderValue);
    
    // Ensure value is within bounds - use effectiveMax if provided
    const maxBound = effectiveMax !== undefined ? effectiveMax : max;
    const clampedValue = Math.max(min, Math.min(maxBound, actualValue));
    
    setValue(clampedValue);
    onChange(clampedValue);
  };

  // Find the level description for the current value
  const currentLevelDescription = levelDescriptions.find(level => level.value === value);

  // Get the visual range for the slider - always use original max for consistency
  const getVisualRange = () => {
    if (useVisualScale) {
      return { min: 1, max: 10 };
    }
    // Always use the original max, not effectiveMax, for visual consistency
    return { min, max };
  };

  const visualRange = getVisualRange();

  // Generate notches - one for each value in visual range
  const generateScaleNotches = () => {
    const notches = [];
    const count = visualRange.max - visualRange.min + 1;
    
    for (let i = 0; i < count; i++) {
      notches.push(
        <div
          key={`notch-${i}`}
          className="w-0.5 h-2 bg-gray-400"
        />
      );
    }
    return notches;
  };

  // Generate labels - show visual scale
  const generateScaleLabels = () => {
    const labels = [];
    
    for (let i = visualRange.min; i <= visualRange.max; i++) {
      labels.push(
        <div key={`label-${i}`} className="text-xs text-gray-500">
          {i}
        </div>
      );
    }
    return labels;
  };

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
        {/* Slider container with scale */}
        <div className="space-y-1">
          {/* Scale notches */}
          <div className="flex justify-between items-center h-2">
            {generateScaleNotches()}
          </div>
          
          {/* Slider input */}
          <div>
            <input
              type="range"
              min={visualRange.min}
              max={visualRange.max}
              step={1}
              value={valueToScale(value)}
              onChange={handleChange}
              disabled={disabled}
              className={`w-full m-0 appearance-none bg-transparent cursor-pointer h-6 flex items-center 
                [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full
                [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full
                ${isConstrained && effectiveMax !== undefined && value === effectiveMax 
                  ? '[&::-webkit-slider-runnable-track]:bg-orange-300 [&::-moz-range-track]:bg-orange-300' 
                  : '[&::-webkit-slider-runnable-track]:bg-gray-200 [&::-moz-range-track]:bg-gray-200'
                }
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:mt-[-6px] [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:mt-0
                ${isConstrained && effectiveMax !== undefined && value === effectiveMax
                  ? '[&::-webkit-slider-thumb]:bg-orange-500 [&::-moz-range-thumb]:bg-orange-500'
                  : '[&::-webkit-slider-thumb]:bg-blue-500 [&::-moz-range-thumb]:bg-blue-500'
                }`}
              data-testid={`${testId}-slider`}
            />
          </div>
          
          {/* Scale labels */}
          <div className="flex justify-between items-start">
            {generateScaleLabels()}
          </div>
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
