import React from 'react';
import {
  wizardStyles,
  WizardFormSection
} from '@/components/shared/wizard';
import { PointPoolManager, PointAllocation } from '@/components/shared/PointPoolManager';
import { World } from '@/types/world.types';
import { validateAttributes } from '../utils/validation';

interface CharacterWizardAttribute {
  attributeId: string;
  name: string;
  value: number;
  minValue: number;
  maxValue: number;
  description?: string;
}

interface AttributesStepData {
  characterData: {
    attributes: CharacterWizardAttribute[];
  };
  pointPools: {
    attributes: {
      total: number;
      spent: number;
      remaining: number;
    };
  };
  validation: Record<number, {
    valid: boolean;
    touched: boolean;
    errors: string[];
  }>;
}

interface AttributesStepProps {
  data: AttributesStepData;
  onUpdate: (updates: Record<string, unknown>) => void;
  onValidation: (valid: boolean, errors: string[]) => void;
  worldConfig: World;
}

export const AttributesStep: React.FC<AttributesStepProps> = ({
  data,
  onUpdate,
  onValidation,
}) => {
  // Convert attributes to PointAllocation format
  const allocations: PointAllocation[] = data.characterData.attributes.map((attr) => ({
    id: attr.attributeId,
    name: attr.name,
    value: attr.value,
    minValue: attr.minValue,
    maxValue: attr.maxValue,
    description: attr.description,
  }));

  const handleAttributeChange = (attributeId: string, value: number) => {
    const updatedAttributes = data.characterData.attributes.map((attr) =>
      attr.attributeId === attributeId ? { ...attr, value } : attr
    );
    onUpdate({ attributes: updatedAttributes });
    const result = validateAttributes(
      updatedAttributes,
      data.pointPools.attributes.total
    );
    onValidation(result.valid, result.errors);
  };

  const validation = data.validation[1];
  const showErrors = validation?.touched && !validation?.valid;

  // Calculate if all points are allocated
  const totalSpent = data.characterData.attributes.reduce((sum, attr) => sum + attr.value, 0);
  const remaining = data.pointPools.attributes.total - totalSpent;

  return (
    <div className="component-attributes-step">
      <WizardFormSection
        title="Allocate Attribute Points"
        description={`Distribute ${data.pointPools.attributes.total} points across your character's attributes. Each attribute affects different aspects of gameplay.`}
        dataTutorial="attribute-allocation"
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
            You have {remaining} attribute points left to spend. Add them to strengthen your character, or continue as you are.
          </p>
        </div>
      )}
      </WizardFormSection>
    </div>
  );
};
