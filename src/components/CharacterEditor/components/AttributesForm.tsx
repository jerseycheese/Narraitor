import React from 'react';
import { World } from '@/types/world.types';
import RangeSlider from '@/components/ui/RangeSlider';
import { Label } from '@/components/ui/label';

interface CharacterAttribute {
  attributeId: string;  // ← Actual structure from store
  value: number;        // ← Actual structure from store
}

interface AttributesFormProps {
  attributes: CharacterAttribute[];
  world: World;
  onAttributesChange: (attributes: CharacterAttribute[]) => void;
}

export const AttributesForm: React.FC<AttributesFormProps> = ({
  attributes,
  world,
  onAttributesChange
}) => {
  const handleAttributeChange = (attrId: string, value: number) => {
    const newAttributes = attributes.map(attr =>
      attr.attributeId === attrId ? { ...attr, value } : attr
    );
    onAttributesChange(newAttributes);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Attributes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attributes.map((attr, index) => {
          const worldAttr = world.attributes.find(wa => wa.id === attr.attributeId);
          const minValue = worldAttr?.minValue || 1;
          const maxValue = worldAttr?.maxValue || 10;
          
          
          // Ensure we have a unique key 
          const uniqueKey = attr.attributeId || `attr-${index}`;
          
          return (
            <div key={uniqueKey}>
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                {worldAttr?.name || `Attribute ${index + 1}`}
              </Label>
              {worldAttr?.description && (
                <p className="text-xs text-gray-500 mb-2">{worldAttr.description}</p>
              )}
              <RangeSlider
                value={attr.value}
                min={minValue}
                max={maxValue}
                onChange={(value) => handleAttributeChange(attr.attributeId, value)}
                showLabel={false}
                testId={`attribute-${attr.attributeId}`}
              />
              <div className="text-xs text-gray-400 mt-1">
                Range: {minValue} - {maxValue}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
