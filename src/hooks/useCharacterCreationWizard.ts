import { useMemo } from 'react';
import { useWizardState, WizardStep as WizardStepType } from '@/hooks/useWizardState';
import {
  Validator,
  alwaysValid,
  validateFields,
  createValidationRules,
} from '@/lib/utils/wizardValidation';
import { EntityID } from '@/types/common.types';
import { World } from '@/types/world.types';
import { isCharacterNameUnique, validateAttributes, validateSkills, validateBackground } from '@/components/CharacterCreationWizard/utils/validation';

/**
 * Complete character data structure for creation wizard
 */
export interface CharacterCreationData {
  worldId: EntityID;
  name: string;
  description: string;
  portraitPlaceholder: string;
  portrait?: {
    type: 'ai-generated' | 'placeholder' | 'preset' | 'uploaded';
    url: string | null;
    generatedAt?: string;
    prompt?: string;
  };
  attributes: Array<{
    attributeId: EntityID;
    name: string;
    description?: string;
    value: number;
    minValue: number;
    maxValue: number;
  }>;
  skills: Array<{
    skillId: EntityID;
    name: string;
    description?: string;
    level: number;
    minLevel: number;
    maxLevel: number;
    attributeIds?: EntityID[];
    linkedAttributeId?: EntityID;
    isSelected: boolean;
  }>;
  background: {
    history: string;
    personality: string;
    physicalDescription?: string;
    goals: string[];
    motivation: string;
    isKnownFigure?: boolean;
    knownFigureType?: 'historical' | 'fictional' | 'celebrity' | 'mythological' | 'other';
  };
}

const steps: WizardStepType[] = [
  { id: 'basic-info', label: 'Basic Info' },   // Step 0
  { id: 'attributes', label: 'Attributes' },   // Step 1
  { id: 'skills', label: 'Skills' },           // Step 2
  { id: 'background', label: 'Background' },    // Step 3
  { id: 'portrait', label: 'Portrait' }        // Step 4
];

interface UseCharacterCreationWizardProps {
  initialData: CharacterCreationData;
  initialStep?: number;
  worldId: EntityID;
  world: World;
}

/**
 * Custom hook for managing character creation wizard state and validation
 */
export function useCharacterCreationWizard({
  initialData,
  initialStep = 0,
  worldId,
  world
}: UseCharacterCreationWizardProps) {
  // Create step validators
  const stepValidators = useMemo((): Record<number, Validator<CharacterCreationData>> => {
    return {
      0: validateFields<CharacterCreationData>({
        name: [
          createValidationRules.required('Character name is required'),
          createValidationRules.minLength(2, 'Character name must be at least 2 characters'),
          createValidationRules.custom<string>(
            (name) => isCharacterNameUnique(name, worldId),
            'A character with this name already exists in this world'
          ),
        ],
      }),
      1: (data) => {
        const result = validateAttributes(data.attributes, world?.settings.attributePointPool || 0);
        return { ...result, touched: true };
      },
      2: (data) => {
        const result = validateSkills(
          data.skills,
          world?.settings.skillPointPool || 0,
          world?.skills?.map(skill => ({
            id: skill.id,
            minValue: skill.minValue,
            maxValue: skill.maxValue,
          })) || []
        );
        return { ...result, touched: true };
      },
      3: (data) => {
        const result = validateBackground(data.background);
        return { ...result, touched: true };
      },
      4: alwaysValid, // Portrait - optional
    };
  }, [worldId, world]);

  // Wizard state management
  const wizard = useWizardState<CharacterCreationData>({
    initialData,
    initialStep,
    steps,
    validateOnUpdate: false,
    onStepValidation: (stepIndex, data) => {
      const validator = stepValidators[stepIndex];
      return validator ? validator(data) : { valid: true, errors: [], touched: true };
    },
  });

  return {
    wizard,
    steps,
    stepValidators
  };
}
