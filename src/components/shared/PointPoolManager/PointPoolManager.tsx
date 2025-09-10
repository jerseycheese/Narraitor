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
          : 'bg-gray-100'
      } transition-colors duration-300`}>
        <h3 className={wizardStyles.subheading}>
          {poolConfig.label || 'Point Pool'}
        </h3>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1 min-w-[120px]">
            <span className="text-sm text-gray-700">
              Total: {poolConfig.total}
            </span>
            <span className={`text-base font-bold ${
              remaining === 0 
                ? 'text-green-500' 
                : remaining < 0
                ? 'text-red-500'
                : 'text-amber-500'
            }`}>
              Remaining: {remaining}
            </span>
          </div>
          <div className="min-h-[28px] flex items-center">
            {remaining === 0 && (
              <span className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <CheckCircle className="w-5 h-5" aria-hidden="true" />
                All points allocated!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Allocations */}
      <div className="space-y-6">
        {allocations.map((allocation, index) => {
          const safeKey = allocation.id || allocation.name || String(index);
          return (
          <div 
            key={safeKey}
            className={wizardStyles.card.base}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-lg">{allocation.name}</span>
              <span className="text-2xl font-bold text-blue-700">
                {allocation.value}
              </span>
            </div>
            
            {allocation.description && (
              <p className="text-sm text-gray-700 mb-4">
                {allocation.description}
              </p>
            )}
            
            <div className="space-y-2">
              {calculateMaxValue(allocation) < allocation.maxValue && (
                <div className="flex justify-end">
                  <span className="text-xs text-amber-500 font-medium animate-pulse">
                    Limited by available points
                  </span>
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
                isConstrained={calculateMaxValue(allocation) < allocation.maxValue}
              />
              {/* Visual indicator when at max due to points */}
              {allocation.value === calculateMaxValue(allocation) && calculateMaxValue(allocation) < allocation.maxValue && (
                <div className="flex items-center gap-2 text-xs text-amber-500 mt-1">
                  {/* Using a simple dot indicator via CSS */}
                  <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
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
            You&apos;ve allocated {Math.abs(remaining)} more points than available. Please reduce some allocations.
          </p>
        </div>
      )}
    </div>
  );
};
