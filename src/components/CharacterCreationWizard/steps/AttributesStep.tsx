import React from 'react';
import { 
  wizardStyles, 
  WizardFormSection
} from '@/components/shared/wizard';
import { PointPoolManager, PointAllocation } from '@/components/shared/PointPoolManager';

interface AttributesStepProps {
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onUpdate: (updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const AttributesStep: React.FC<AttributesStepProps> = ({
  data,
  onUpdate,
}) => {
  // Convert attributes to PointAllocation format
  const allocations: PointAllocation[] = data.characterData.attributes.map((attr: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: attr.attributeId,
    name: attr.name,
    value: attr.value,
    minValue: attr.minValue,
    maxValue: attr.maxValue,
    description: attr.description,
  }));

  const handleAttributeChange = (attributeId: string, value: number) => {
    const updatedAttributes = data.characterData.attributes.map((attr: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      attr.attributeId === attributeId ? { ...attr, value } : attr
    );
    onUpdate({ attributes: updatedAttributes });
  };

  const validation = data.validation[2];
  const showErrors = validation?.touched && !validation?.valid;
  
  // Calculate if all points are allocated
  const totalSpent = data.characterData.attributes.reduce((sum: number, attr: any) => sum + attr.value, 0); // eslint-disable-line @typescript-eslint/no-explicit-any
  const remaining = data.pointPools.attributes.total - totalSpent;

  return (
    <div className="component-attributes-step">
      <WizardFormSection
        title="Allocate Attribute Points"
        description={`Distribute ${data.pointPools.attributes.total} points across your character's attributes. Each attribute affects different aspects of gameplay.`}
      >
      <PointPoolManager
        allocations={allocations}
        poolConfig={{
          total: data.pointPools.attributes.total,
          label: 'Attribute Points'
        }}
        onChange={handleAttributeChange}
      />

      {/* Validation errors */}
      {showErrors && (
        <div className={wizardStyles.errorContainer}>
          {validation.errors.map((error: string, index: number) => (
            <p key={index} className={wizardStyles.form.error}>
              {error}
            </p>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div className={wizardStyles.card.base}>
          <p>
            You have {remaining} unspent attribute points. Spending them will increase your character&apos;s level and overall capabilities. You can continue with the current allocation or spend more points.
          </p>
        </div>
      )}
      </WizardFormSection>
    </div>
  );
};
