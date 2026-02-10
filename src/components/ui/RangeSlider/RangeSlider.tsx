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

  /**
   * Accessible label for screen readers
   */
  ariaLabel?: string;

  /**
   * Accessible labelled-by reference
   */
  ariaLabelledBy?: string;
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
  labelText = 'Default Value',
  levelDescriptions = [],
  showLevelDescription = false,
  testId = 'range-slider',
  isConstrained = false,
  effectiveMax,
  ariaLabel,
  ariaLabelledBy,
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
  const currentLevelDescription = levelDescriptions.find(
    (level) => level.value === value
  );

  // Get the visual range for the slider - always use original max for consistency
  const getVisualRange = () => {
    if (useVisualScale) {
      return { min: 1, max: 10 };
    }
    // Always use the original max, not effectiveMax, for visual consistency
    return { min, max };
  };

  const visualRange = getVisualRange();

  // Generate notches with absolute positioning
  const generateScaleNotches = () => {
    const notches = [];

    for (let i = visualRange.min; i <= visualRange.max; i++) {
      const percentage =
        ((i - visualRange.min) / (visualRange.max - visualRange.min)) * 100;

      notches.push(
        <div
          key={`notch-${i}`}
          style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
        />
      );
    }
    return notches;
  };

  // Generate labels with absolute positioning
  const generateScaleLabels = () => {
    const labels = [];

    for (let i = visualRange.min; i <= visualRange.max; i++) {
      const percentage =
        ((i - visualRange.min) / (visualRange.max - visualRange.min)) * 100;

      labels.push(
        <div
          key={`label-${i}`}
          style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
        >
          {i}
        </div>
      );
    }
    return labels;
  };

  return (
    <div data-testid={testId}>
      {showLabel && (
        <div>
          <span>{labelText}</span>
          {showLevelDescription && currentLevelDescription && (
            <span data-testid={`${testId}-level-label`}>
              {currentLevelDescription.label}
            </span>
          )}
        </div>
      )}

      <div>
        {/* Slider container with scale */}
        <div>
          {/* Scale notches */}
          <div>{generateScaleNotches()}</div>

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
              className={[
                'appearance-none',
                'accent-primary',
                isConstrained &&
                effectiveMax !== undefined &&
                value === effectiveMax
                  ? 'accent-amber-500'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-testid={`${testId}-slider`}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
            />
          </div>

          {/* Scale labels */}
          <div>{generateScaleLabels()}</div>
        </div>

        {/* Level description */}
        {showLevelDescription &&
          currentLevelDescription &&
          currentLevelDescription.description && (
            <div data-testid={`${testId}-description`}>
              <span>{currentLevelDescription.label}:</span>{' '}
              {currentLevelDescription.description}
            </div>
          )}
      </div>
    </div>
  );
};

export default RangeSlider;
