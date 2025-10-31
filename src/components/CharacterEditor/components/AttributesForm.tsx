import React, { useCallback } from 'react';
import { World } from '@/types/world.types';
import RangeSlider from '@/components/ui/RangeSlider';
import { Label } from '@/components/ui/label';
import { useAttributePointPool } from '@/hooks/usePointPoolManager';
import { PointPoolDisplay } from './PointPoolDisplay';

interface CharacterAttribute {
  attributeId: string;
  value: number;
}

interface AttributesFormProps {
  attributes: CharacterAttribute[];
  world: World;
  onAttributesChange: (attributes: CharacterAttribute[]) => void;
}

export const AttributesForm: React.FC<AttributesFormProps> = ({
  attributes,
  world,
  onAttributesChange,
}) => {
  const {
    pool,
    items: managedAttributes,
    canIncrease,
    setValue,
  } = useAttributePointPool({
    totalPoints: world.settings.attributePointPool,
    items: attributes.map(attr => {
      const worldAttr = world.attributes.find(wa => wa.id === attr.attributeId);
      return {
        id: attr.attributeId,
        value: attr.value,
        minValue: worldAttr?.minValue || 1,
        maxValue: worldAttr?.maxValue || 10,
      };
    }),
  });

  const handleValueChange = useCallback((attrId: string, newValue: number) => {
    setValue(attrId, newValue);

    // Update parent with new values
    const newAttributes = managedAttributes.map(attr => ({
      attributeId: attr.id,
      value: attr.id === attrId ? newValue : attr.value,
    }));
    onAttributesChange(newAttributes);
  }, [setValue, managedAttributes, onAttributesChange]);

  return (
    <div className="component-attributes-form bg-background rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Attributes</h2>
        <PointPoolDisplay pool={pool} label="Attribute Points" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {managedAttributes.map((attr, index) => {
          const worldAttr = world.attributes.find(wa => wa.id === attr.id);
          const cannotIncrease = !canIncrease(attr.id);

          // Calculate effective max based on pool constraints
          const currentValue = attr.value;
          const effectiveMax = cannotIncrease
            ? currentValue  // Can't increase beyond current value if pool exhausted
            : attr.maxValue; // Can increase up to max if pool has points

          const uniqueKey = attr.id || `attr-${index}`;

          return (
            <div key={uniqueKey} className="bg-muted rounded-lg p-4 border">
              <Label className="block text-sm font-medium mb-1">
                {worldAttr?.name || `Attribute ${index + 1}`}
              </Label>
              {worldAttr?.description && (
                <p className="text-xs text-muted-foreground mb-2">
                  {worldAttr.description}
                </p>
              )}
              {cannotIncrease && currentValue < attr.maxValue && (
                <p className="text-xs text-amber-500 mb-2 font-medium">
                  No points remaining. Reduce other attributes to increase this one.
                </p>
              )}
              <RangeSlider
                value={attr.value}
                min={attr.minValue}
                max={attr.maxValue}
                effectiveMax={effectiveMax}
                isConstrained={cannotIncrease}
                onChange={newValue => handleValueChange(attr.id, newValue)}
                disabled={false}
                showLabel={false}
                testId={`attribute-${attr.id}`}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Range: {attr.minValue} - {attr.maxValue}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
