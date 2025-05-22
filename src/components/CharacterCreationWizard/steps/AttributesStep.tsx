import React from 'react';
import { RangeSlider } from '@/components/ui/RangeSlider';

interface AttributesStepProps {
  data: any;
  onUpdate: (updates: any) => void;
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: any;
}

export const AttributesStep: React.FC<AttributesStepProps> = ({
  data,
  onUpdate,
  onValidation,
}) => {
  const handleAttributeChange = (attributeId: string, value: number) => {
    const updatedAttributes = data.characterData.attributes.map(attr =>
      attr.attributeId === attributeId ? { ...attr, value } : attr
    );
    onUpdate({ attributes: updatedAttributes });
  };

  const validation = data.validation[1];
  const showErrors = validation?.touched && !validation?.valid;

  return (
    <div className="space-y-6">
      {/* Point pool display */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Attribute Points</h3>
        <div className="flex justify-between text-sm">
          <span>Total: {data.pointPools.attributes.total}</span>
          <span>Spent: {data.pointPools.attributes.spent}</span>
          <span className={data.pointPools.attributes.remaining === 0 ? 'text-green-600' : 'text-orange-600'}>
            Remaining: {data.pointPools.attributes.remaining}
          </span>
        </div>
      </div>

      {/* Attributes list */}
      <div className="space-y-4">
        {data.characterData.attributes.map((attribute) => (
          <div key={attribute.attributeId} className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-medium">{attribute.name}</label>
              <span className="text-lg font-bold">{attribute.value}</span>
            </div>
            <RangeSlider
              value={attribute.value}
              onChange={(value) => handleAttributeChange(attribute.attributeId, value)}
              min={attribute.minValue}
              max={attribute.maxValue}
              step={1}
            />
          </div>
        ))}
      </div>

      {/* Validation errors */}
      {showErrors && (
        <div className="bg-red-50 p-4 rounded">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded">
        <p className="text-sm text-blue-800">
          Allocate your attribute points by adjusting the sliders. You must spend exactly 
          {' '}{data.pointPools.attributes.total} points across all attributes.
        </p>
      </div>
    </div>
  );
};