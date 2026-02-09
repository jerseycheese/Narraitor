import React, { useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import RangeSlider from '@/components/ui/RangeSlider';
import { wizardStyles } from '@/components/shared/wizard';

export interface PointPoolConfig {
  total: number;
  min?: number;
  max?: number;
  label?: string;
}

export interface PointAllocation {
  id: string;
  name: string;
  value: number;
  minValue: number;
  maxValue: number;
  description?: string;
}

export interface PointPoolManagerProps {
  allocations: PointAllocation[];
  poolConfig: PointPoolConfig;
  onChange: (id: string, newValue: number) => void;
  className?: string;
  showLabels?: boolean;
  disabled?: boolean;
}

export const PointPoolManager: React.FC<PointPoolManagerProps> = ({
  allocations,
  poolConfig,
  onChange,
  className = '',
}) => {
  const { remaining } = useMemo(() => {
    const totalSpent = allocations.reduce(
      (sum, allocation) => sum + allocation.value,
      0
    );
    return {
      spent: totalSpent,
      remaining: poolConfig.total - totalSpent,
    };
  }, [allocations, poolConfig.total]);

  const calculateMaxValue = (allocation: PointAllocation) => {
    return Math.min(allocation.maxValue, allocation.value + remaining);
  };

  const handleSliderChange = (
    allocation: PointAllocation,
    newValue: number
  ) => {
    const maxPossible = calculateMaxValue(allocation);

    const clampedValue = Math.max(
      allocation.minValue,
      Math.min(maxPossible, newValue)
    );

    if (clampedValue !== allocation.value) {
      onChange(allocation.id, clampedValue);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Point Pool Summary */}
      <div className={wizardStyles.card.base}>
        <h3 className={wizardStyles.subheading}>
          {poolConfig.label || 'Point Pool'}
        </h3>
        <div>
          <div>
            <span>Total: {poolConfig.total}</span>
            <span>
              Remaining: {remaining}
            </span>
          </div>
          <div>
            {remaining === 0 && (
              <span>
                <CheckCircle aria-hidden="true" />
                All points allocated!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Allocations */}
      <div>
        {allocations.map((allocation, index) => {
          const safeKey = allocation.id || allocation.name || String(index);
          return (
            <div key={safeKey} className={wizardStyles.card.base}>
              <div>
                <span>{allocation.name}</span>
                <span>{allocation.value}</span>
              </div>

              {allocation.description && <p>{allocation.description}</p>}

              <div>
                {calculateMaxValue(allocation) < allocation.maxValue && (
                  <div>
                    <span>Limited by available points</span>
                  </div>
                )}
                <RangeSlider
                  key={`slider-${allocation.id || allocation.name || index}`}
                  value={allocation.value}
                  onChange={(value) => handleSliderChange(allocation, value)}
                  min={allocation.minValue}
                  max={allocation.maxValue}
                  effectiveMax={calculateMaxValue(allocation)}
                  showLabel={false}
                  testId={`allocation-slider-${allocation.id}`}
                  isConstrained={
                    calculateMaxValue(allocation) < allocation.maxValue
                  }
                />
                {/* Visual indicator when at max due to points */}
                {allocation.value === calculateMaxValue(allocation) &&
                  calculateMaxValue(allocation) < allocation.maxValue && (
                    <div>
                      {/* Using a simple dot indicator via CSS */}
                      <span aria-hidden="true" />
                      <span>No points left. Reduce others to increase.</span>
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Message */}
      {remaining < 0 && (
        <div className={wizardStyles.errorContainer}>
          <p className={wizardStyles.form.error}>
            You&apos;ve allocated {Math.abs(remaining)} more points than
            available. Please reduce some allocations.
          </p>
        </div>
      )}
    </div>
  );
};
