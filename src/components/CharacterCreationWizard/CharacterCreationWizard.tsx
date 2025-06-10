import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { EntityID } from '@/types/common.types';
import { generateUniqueId } from '@/lib/utils/generateId';
import { useCharacterCreationAutoSave } from '@/hooks/useCharacterCreationAutoSave';
import { useWizardState, WizardStep as WizardStepType } from '@/hooks/useWizardState';
import { useAttributePointPool, useSkillPointPool } from '@/hooks/usePointPoolManager';
import { createWizardValidator, WizardStepValidator } from '@/lib/utils/wizardValidation';
import { 
  WizardContainer, 
  WizardProgress, 
  WizardNavigation, 
  WizardStep
} from '@/components/shared/wizard';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { AttributesStep } from './steps/AttributesStep';
import { SkillsStep } from './steps/SkillsStep';
import { BackgroundStep } from './steps/BackgroundStep';
import { PortraitStep } from './steps/PortraitStep';
import { validateCharacterName, validateAttributes, validateSkills, validateBackground } from './utils/validation';

interface CharacterCreationWizardProps {
  worldId: EntityID;
  initialStep?: number;
}

interface CharacterCreationData {
  worldId: EntityID;
  name: string;
  description: string;
  portraitPlaceholder: string;
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
    level: number;
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
  { id: 'basic-info', label: 'Basic Info' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'skills', label: 'Skills' },
  { id: 'background', label: 'Background' },
  { id: 'portrait', label: 'Portrait' }
];

export const CharacterCreationWizard: React.FC<CharacterCreationWizardProps> = ({ worldId, initialStep = 0 }) => {
  const router = useRouter();
  const { worlds } = useWorldStore();
  const { createCharacter } = useCharacterStore();
  const world = worlds[worldId];
  
  const { data, setData, handleFieldBlur, clearAutoSave } = useCharacterCreationAutoSave(worldId);
  
  // Initialize character data from auto-save or defaults
  const initialCharacterData: CharacterCreationData = useMemo(() => {
    if (data?.characterData) {
      return {
        ...(data.characterData as CharacterCreationData),
        worldId, // Ensure worldId is correct
      };
    }
    
    return {
      worldId,
      name: '',
      description: '',
      portraitPlaceholder: '',
      portrait: {
        type: 'placeholder',
        url: null
      },
      attributes: world?.attributes.map(attr => ({
        attributeId: attr.id,
        name: attr.name,
        description: attr.description,
        value: attr.minValue,
        minValue: attr.minValue,
        maxValue: attr.maxValue,
      })) || [],
      skills: world?.skills.map(skill => ({
        skillId: skill.id,
        name: skill.name,
        description: skill.description,
        level: skill.minValue,
        linkedAttributeId: skill.linkedAttributeId,
        isSelected: false,
      })) || [],
      background: {
        history: '',
        personality: '',
        goals: [],
        motivation: '',
      },
    };
  }, [data, worldId, world]);

  // Create step validators
  const stepValidators = useMemo((): Record<number, WizardStepValidator<CharacterCreationData>> => {
    return {
      0: createWizardValidator<CharacterCreationData>()
        .field('name')
        .required('Character name is required')
        .minLength(2, 'Character name must be at least 2 characters')
        .custom((name) => {
          const result = validateCharacterName(name, worldId);
          return result.valid;
        }, 'A character with this name already exists in this world')
        .build(),
      1: createWizardValidator<CharacterCreationData>()
        .customValidation((data) => {
          const result = validateAttributes(data.attributes, world?.settings.attributePointPool || 0);
          return { ...result, touched: true };
        })
        .build(),
      2: createWizardValidator<CharacterCreationData>()
        .customValidation((data) => {
          const result = validateSkills(data.skills);
          return { ...result, touched: true };
        })
        .build(),
      3: createWizardValidator<CharacterCreationData>()
        .customValidation((data) => {
          const result = validateBackground(data.background);
          return { ...result, touched: true };
        })
        .build(),
      4: createWizardValidator<CharacterCreationData>().build(), // Portrait is optional
    };
  }, [worldId, world]);

  // Wizard state management
  const wizard = useWizardState<CharacterCreationData>({
    initialData: initialCharacterData,
    initialStep: data?.currentStep || initialStep,
    steps,
    onStepValidation: (stepIndex, data) => {
      const validator = stepValidators[stepIndex];
      return validator ? validator.validate(data) : { valid: true, errors: [], touched: true };
    },
  });

  // Point pool managers
  const attributePool = useAttributePointPool({
    totalPoints: world?.settings.attributePointPool || 0,
    items: wizard.state.data.attributes.map(attr => ({
      id: attr.attributeId,
      value: attr.value,
      minValue: attr.minValue,
      maxValue: attr.maxValue,
    })),
  });

  const skillPool = useSkillPointPool({
    totalPoints: world?.settings.skillPointPool || 0,
    skills: wizard.state.data.skills.map(skill => {
      const worldSkill = world?.skills.find(ws => ws.id === skill.skillId);
      return {
        id: skill.skillId,
        value: skill.level,
        minValue: worldSkill?.minValue || 1,
        maxValue: worldSkill?.maxValue || 10,
        isSelected: skill.isSelected,
      };
    }),
  });

  // Navigation handlers
  const handleNext = () => {
    // Manual save before navigation (avoid useEffect with setData)
    const newData = { 
      characterData: wizard.state.data,
      currentStep: wizard.state.currentStep,
      worldId: wizard.state.data.worldId,
      validation: wizard.state.validation,
      pointPools: {
        attributes: attributePool.pool,
        skills: skillPool.pool,
      },
    };
    setData(newData);
    wizard.goNext();
  };

  const handleBack = () => {
    // Manual save before navigation (avoid useEffect with setData)
    const newData = { 
      characterData: wizard.state.data,
      currentStep: wizard.state.currentStep,
      worldId: wizard.state.data.worldId,
      validation: wizard.state.validation,
      pointPools: {
        attributes: attributePool.pool,
        skills: skillPool.pool,
      },
    };
    setData(newData);
    wizard.goBack();
  };

  const handleCancel = () => {
    router.push('/characters');
  };

  const handleUpdate = (updates: Partial<CharacterCreationData>) => {
    wizard.updateData(updates);
  };

  const handleValidation = (valid: boolean, errors: string[]) => {
    wizard.setValidation(wizard.state.currentStep, { valid, errors, touched: true });
  };

  const handleCreate = () => {
    // Validate all steps
    for (let i = 0; i < steps.length; i++) {
      const validator = stepValidators[i];
      if (validator) {
        const validation = validator.validate(wizard.state.data);
        if (!validation.valid) {
          wizard.goToStep(i);
          wizard.setValidation(i, validation);
          return;
        }
      }
    }

    // Create character
    const data = wizard.state.data;
    const characterId = createCharacter({
      name: data.name,
      description: data.background.history,
      worldId,
      level: 1,
      attributes: data.attributes.map(attr => {
        const worldAttr = world?.attributes.find(wa => wa.id === attr.attributeId);
        return {
          id: generateUniqueId('attr'),
          characterId: '', // Will be set by store
          worldAttributeId: attr.attributeId, // Store reference to world attribute ID
          name: worldAttr?.name || 'Unknown',
          baseValue: attr.value,
          modifiedValue: attr.value,
          category: worldAttr?.category
        };
      }),
      skills: data.skills
        .filter(skill => skill.isSelected)
        .map(skill => {
          const worldSkill = world?.skills.find(ws => ws.id === skill.skillId);
          return {
            id: generateUniqueId('skill'),
            characterId: '', // Will be set by store
            worldSkillId: skill.skillId, // Store reference to world skill ID
            name: worldSkill?.name || 'Unknown',
            level: skill.level,
            category: worldSkill?.category
          };
        }),
      background: {
        history: data.background.history,
        personality: data.background.personality,
        goals: data.background.motivation ? [data.background.motivation] : [],
        fears: [],
        physicalDescription: data.background.physicalDescription || '',
        relationships: [],
      },
      portrait: data.portrait || {
        type: 'placeholder',
        url: null
      },
      isPlayer: true,
      status: {
        health: 100,
        maxHealth: 100,
        conditions: [],
      },
      inventory: {
        characterId: '', // Will be set by the store
        items: [],
        capacity: 20,
        categories: []
      },
    });

    // Set as current character
    useCharacterStore.getState().setCurrentCharacter(characterId);
    
    // Verify the character was set as current
    const currentCharacterId = useCharacterStore.getState().currentCharacterId;
    
    if (currentCharacterId !== characterId) {
      console.error('[CharacterCreationWizard] Failed to set current character!', {
        expectedId: characterId,
        actualId: currentCharacterId,
        charactersInStore: Object.keys(useCharacterStore.getState().characters)
      });
    }
    // Clear auto-save
    clearAutoSave();

    // Navigate to game session with the world
    router.push(`/world/${worldId}/play`);
  };

  if (!world) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">World not found</p>
        <button
          onClick={() => router.push('/worlds')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Worlds
        </button>
      </div>
    );
  }

  const renderStep = () => {
    // Create legacy data structure for existing step components
    const legacyData = {
      characterData: wizard.state.data as Record<string, unknown> & CharacterCreationData,
      worldId: wizard.state.data.worldId,
      pointPools: { 
        attributes: attributePool.pool, 
        skills: skillPool.pool 
      },
      validation: wizard.state.validation
    };

    const props = {
      data: legacyData,
      onUpdate: handleUpdate,
      onValidation: handleValidation,
      worldConfig: world,
    };

    switch (wizard.state.currentStep) {
      case 0:
        return <BasicInfoStep {...props} />;
      case 1:
        return <AttributesStep {...props} />;
      case 2:
        return <SkillsStep {...props} />;
      case 3:
        return <BackgroundStep {...props} />;
      case 4:
        return <PortraitStep {...props} />;
      default:
        return null;
    }
  };

  const currentValidation = wizard.state.validation[wizard.state.currentStep];
  const hasErrors = currentValidation?.touched && !currentValidation?.valid;
  const error = hasErrors ? currentValidation.errors.join(', ') : undefined;

  return (
    <WizardContainer title={`Create Character in ${world.name}`}>
      <div onBlur={handleFieldBlur}>
        <WizardProgress 
          steps={steps} 
          currentStep={wizard.state.currentStep} 
        />
        
        <WizardStep error={error}>
          {renderStep()}
        </WizardStep>
        
        <WizardNavigation
          onCancel={handleCancel}
          onBack={wizard.canGoBack ? handleBack : undefined}
          onNext={wizard.canGoNext ? handleNext : undefined}
          onComplete={wizard.isLastStep ? handleCreate : undefined}
          currentStep={wizard.state.currentStep}
          totalSteps={steps.length}
          completeLabel="Create Character"
          disabled={hasErrors}
        />
      </div>
    </WizardContainer>
  );
};
