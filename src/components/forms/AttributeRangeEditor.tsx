import React from 'react';
import { WorldAttribute } from '@/types/world.types';
import RangeSlider from '@/components/ui/RangeSlider';

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
  const handleChange = (value: number) => {
    onChange({ baseValue: value });
  };

  return (
    <RangeSlider
      value={attribute.baseValue}
      min={attribute.minValue}
      max={attribute.maxValue}
      onChange={handleChange}
      disabled={disabled}
      showLabel={showLabels}
      labelText="Default Value"
      testId="attribute-range-editor"
    />
  );
};

export default AttributeRangeEditor;
