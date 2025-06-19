import React, { useMemo } from 'react';
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
    const totalSpent = allocations.reduce((sum, allocation) => sum + allocation.value, 0);
    return {
      spent: totalSpent,
      remaining: poolConfig.total - totalSpent,
    };
  }, [allocations, poolConfig.total]);

  const calculateMaxValue = (allocation: PointAllocation) => {
    return Math.min(allocation.maxValue, allocation.value + remaining);
  };

  const handleSliderChange = (allocation: PointAllocation, newValue: number) => {
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
    <div className={`space-y-4 ${className}`}>
      {/* Point Pool Summary */}
      <div className={`${wizardStyles.card.base} ${
        remaining === 0 
          ? 'bg-green-50 border-green-300' 
          : 'bg-gray-50'
      } transition-colors duration-300`}>
        <h3 className={wizardStyles.subheading}>
          {poolConfig.label || 'Point Pool'}
        </h3>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1 min-w-[120px]">
            <span className="text-sm text-gray-600">
              Total: {poolConfig.total}
            </span>
            <span className={`text-base font-bold ${
              remaining === 0 
                ? 'text-green-600' 
                : remaining < 0
                ? 'text-red-600'
                : 'text-orange-600'
            }`}>
              Remaining: {remaining}
            </span>
          </div>
          <div className="min-h-[28px] flex items-center">
            {remaining === 0 && (
              <span className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                All points allocated!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Allocations */}
      <div className="space-y-6">
        {allocations.map((allocation) => (
          <div 
            key={allocation.id}
            className={wizardStyles.card.base}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-lg">{allocation.name}</span>
              <span className="text-2xl font-bold text-blue-600">
                {allocation.value}
              </span>
            </div>
            
            {allocation.description && (
              <p className="text-sm text-gray-600 mb-4">
                {allocation.description}
              </p>
            )}
            
            <div className="space-y-2">
              {calculateMaxValue(allocation) < allocation.maxValue && (
                <div className="flex justify-end">
                  <span className="text-xs text-orange-600 font-medium animate-pulse">
                    Limited by available points
                  </span>
                </div>
              )}
              <RangeSlider
                key={`slider-${allocation.id}`}
                value={allocation.value}
                onChange={(value) => handleSliderChange(allocation, value)}
                min={allocation.minValue}
                max={allocation.maxValue}
                effectiveMax={calculateMaxValue(allocation)}
                showLabel={false}
                testId={`allocation-slider-${allocation.id}`}
                isConstrained={calculateMaxValue(allocation) < allocation.maxValue}
              />
              {/* Visual indicator when at max due to points */}
              {allocation.value === calculateMaxValue(allocation) && calculateMaxValue(allocation) < allocation.maxValue && (
                <div className="flex items-center gap-2 text-xs text-orange-600 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>No points left. Reduce others to increase.</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Validation Message */}
      {remaining < 0 && (
        <div className={wizardStyles.errorContainer}>
          <p className={wizardStyles.form.error}>
            You&apos;ve allocated {Math.abs(remaining)} more points than available. Please reduce some allocations.
          </p>
        </div>
      )}
    </div>
  );
};
