import { useMemo } from 'react';
import { useWizardState, WizardStep as WizardStepType } from '@/hooks/useWizardState';
import { createWizardValidator, WizardStepValidator } from '@/lib/utils/wizardValidation';
import { EntityID } from '@/types/common.types';
import { World } from '@/types/world.types';
import { validateCharacterName, validateAttributes, validateSkills, validateBackground } from '@/components/CharacterCreationWizard/utils/validation';

/**
 * Complete character data structure for creation wizard
 */
export interface CharacterCreationData {
  worldId: EntityID;
  name: string;
  description: string;
  portraitPlaceholder: string;
  selectedTemplateId?: EntityID | null;  // Track which template was selected
  portrait?: {
    type: 'ai-generated' | 'placeholder';
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
  { id: 'template-selection', label: 'Template' },   // NEW Step 0
  { id: 'basic-info', label: 'Basic Info' },         // Now Step 1
  { id: 'attributes', label: 'Attributes' },         // Now Step 2
  { id: 'skills', label: 'Skills' },                 // Now Step 3
  { id: 'background', label: 'Background' },         // Now Step 4
  { id: 'portrait', label: 'Portrait' }              // Now Step 5
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
  const stepValidators = useMemo((): Record<number, WizardStepValidator<CharacterCreationData>> => {
    return {
      0: createWizardValidator<CharacterCreationData>().build(), // Template selection - always valid (optional)
      1: createWizardValidator<CharacterCreationData>()          // Basic Info (was step 0)
        .field('name')
        .required('Character name is required')
        .minLength(2, 'Character name must be at least 2 characters')
        .custom((name) => {
          const result = validateCharacterName(name, worldId);
          return result.valid;
        }, 'A character with this name already exists in this world')
        .build(),
      2: createWizardValidator<CharacterCreationData>()          // Attributes (was step 1)
        .customValidation((data) => {
          const result = validateAttributes(data.attributes, world?.settings.attributePointPool || 0);
          return { ...result, touched: true };
        })
        .build(),
      3: createWizardValidator<CharacterCreationData>()          // Skills (was step 2)
        .customValidation((data) => {
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
        })
        .build(),
      4: createWizardValidator<CharacterCreationData>()         // Background (was step 3)
        .customValidation((data) => {
          const result = validateBackground(data.background);
          return { ...result, touched: true };
        })
        .build(),
      5: createWizardValidator<CharacterCreationData>().build(), // Portrait (was step 4) - optional
    };
  }, [worldId, world]);

  // Wizard state management
  const wizard = useWizardState<CharacterCreationData>({
    initialData,
    initialStep,
    steps,
    onStepValidation: (stepIndex, data) => {
      const validator = stepValidators[stepIndex];
      return validator ? validator.validate(data) : { valid: true, errors: [], touched: true };
    },
  });

  return {
    wizard,
    steps,
    stepValidators
  };
}
