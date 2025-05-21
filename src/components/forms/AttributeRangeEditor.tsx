import React, { useState, useEffect } from 'react';
import { WorldAttribute } from '@/types/world.types';

interface AttributeRangeEditorProps {
  attribute: WorldAttribute;
  onChange: (updates: Partial<WorldAttribute>) => void;
  disabled?: boolean;
  showLabels?: boolean;
}

const AttributeRangeEditor: React.FC<AttributeRangeEditorProps> = ({
  attribute,
  onChange,
  disabled = false,
  showLabels = true,
}) => {
  const [value, setValue] = useState(attribute.baseValue);

  // Sync with prop value when it changes
  useEffect(() => {
    setValue(attribute.baseValue);
  }, [attribute.baseValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse value and ensure it's within range
    let newValue = parseInt(e.target.value);
    
    // Clamp value to min/max range
    if (isNaN(newValue)) newValue = attribute.minValue;
    if (newValue < attribute.minValue) newValue = attribute.minValue;
    if (newValue > attribute.maxValue) newValue = attribute.maxValue;

    setValue(newValue);
    onChange({ baseValue: newValue });
  };

  // Calculate the position of the value bubble
  const position = ((value - attribute.minValue) / (attribute.maxValue - attribute.minValue)) * 100;

  return (
    <div className="py-2" data-testid="attribute-range-editor">
      {showLabels && (
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>Default Value</span>
        </div>
      )}
      
      <div className="relative">
        <input
          type="range"
          min={attribute.minValue}
          max={attribute.maxValue}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        
        {/* Value display bubble */}
        <div
          className="absolute -top-7 flex items-center justify-center w-8 h-8 text-sm text-white bg-blue-500 rounded-full pointer-events-none transform -translate-x-1/2"
          style={{ left: `${position}%` }}
          data-testid="current-value"
        >
          {value}
        </div>
        
        {/* Min/Max labels */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{attribute.minValue}</span>
          <span>{attribute.maxValue}</span>
        </div>
      </div>
    </div>
  );
};

export default AttributeRangeEditor;