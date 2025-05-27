import React from 'react';
import { World } from '@/types/world.types';

interface CharacterAttribute {
  id: string;
  characterId: string;
  name: string;
  baseValue: number;
  modifiedValue: number;
  category?: string;
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
      attr.id === attrId ? { ...attr, modifiedValue: value } : attr
    );
    onAttributesChange(newAttributes);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Attributes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attributes.map((attr) => {
          const worldAttr = world.attributes.find(wa => wa.id === attr.id);
          const minValue = worldAttr?.minValue || 1;
          const maxValue = worldAttr?.maxValue || 10;
          
          return (
            <div key={attr.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {attr.name}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={minValue}
                  max={maxValue}
                  value={attr.modifiedValue}
                  onChange={(e) => handleAttributeChange(attr.id, parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">{attr.modifiedValue}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};