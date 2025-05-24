import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { EntityID } from '@/types/common.types';
import { useCharacterCreationAutoSave } from '@/hooks/useCharacterCreationAutoSave';
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
import { validateCharacterName, validateAttributes, validateSkills, validateBackground } from './utils/validation';

interface CharacterCreationWizardProps {
  worldId: EntityID;
  initialStep?: number;
}

interface CharacterCreationState {
  currentStep: number;
  worldId: EntityID;
  characterData: {
    name: string;
    description: string;
    portraitPlaceholder: string;
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
      goals: string[];
      motivation: string;
    };
  };
  validation: {
    [stepNumber: number]: {
      valid: boolean;
      errors: string[];
      touched: boolean;
    };
  };
  pointPools: {
    attributes: {
      total: number;
      spent: number;
      remaining: number;
    };
    skills: {
      total: number;
      spent: number;
      remaining: number;
    };
  };
}

const steps = [
  { id: 'basic-info', label: 'Basic Info' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'skills', label: 'Skills' },
  { id: 'background', label: 'Background' }
];

export const CharacterCreationWizard: React.FC<CharacterCreationWizardProps> = ({ worldId, initialStep = 0 }) => {
  const router = useRouter();
  const { worlds } = worldStore();
  const { createCharacter } = characterStore();
  const world = worlds[worldId];
  
  
  const { data, setData, handleFieldBlur, clearAutoSave } = useCharacterCreationAutoSave(worldId);
  
  // Initialize state from auto-save or defaults
  const [state, setState] = useState<CharacterCreationState>(() => {
    if (data) return data;
    
    // Initialize with world attributes and skills
    return {
      currentStep: initialStep,
      worldId,
      characterData: {
        name: '',
        description: '',
        portraitPlaceholder: '',
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
      },
      validation: {},
      pointPools: {
        attributes: {
          total: world?.settings.attributePointPool || 0,
          spent: world?.attributes?.reduce((sum, attr) => sum + (attr.minValue || 0), 0) || 0,
          remaining: (world?.settings.attributePointPool || 0) - (world?.attributes?.reduce((sum, attr) => sum + (attr.minValue || 0), 0) || 0),
        },
        skills: {
          total: world?.settings.skillPointPool || 0,
          spent: 0,
          remaining: world?.settings.skillPointPool || 0,
        },
      },
    };
  });

  // Update auto-save data when state changes
  useEffect(() => {
    setData(state);
  }, [state, setData]);

  const validateStep = useCallback((step: number): { valid: boolean; errors: string[] } => {
    switch (step) {
      case 0:
        return validateCharacterName(state.characterData.name, worldId);
      case 1:
        return validateAttributes(state.characterData.attributes, state.pointPools.attributes.total);
      case 2:
        return validateSkills(state.characterData.skills);
      case 3:
        return validateBackground(state.characterData.background);
      default:
        return { valid: true, errors: [] };
    }
  }, [state, worldId]);

  const handleNext = useCallback(() => {
    const validation = validateStep(state.currentStep);
    
    setState(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        [state.currentStep]: { ...validation, touched: true },
      },
    }));
    
    if (!validation.valid) {
      return;
    }
    
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }));
  }, [state.currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1,
    }));
  }, []);

  const handleCancel = useCallback(() => {
    router.push('/characters');
  }, [router]);

  const handleUpdate = useCallback((updates: Partial<CharacterCreationState['characterData']>) => {
    setState(prev => {
      const newState = {
        ...prev,
        characterData: {
          ...prev.characterData,
          ...updates,
        },
      };

      // Update point pools if attributes changed
      if (updates.attributes) {
        const spent = updates.attributes.reduce((sum, attr) => sum + attr.value, 0);
        newState.pointPools = {
          ...prev.pointPools,
          attributes: {
            ...prev.pointPools.attributes,
            spent,
            remaining: prev.pointPools.attributes.total - spent,
          },
        };
      }

      // Update skill points if skills changed
      if (updates.skills) {
        const selectedSkills = updates.skills.filter(s => s.isSelected);
        const spent = selectedSkills.reduce((sum, skill) => sum + skill.level, 0);
        newState.pointPools = {
          ...prev.pointPools,
          skills: {
            ...prev.pointPools.skills,
            spent,
            remaining: prev.pointPools.skills.total - spent,
          },
        };
      }

      // Revalidate current step after updates
      let validation: { valid: boolean; errors: string[] } = { valid: true, errors: [] };
      switch (prev.currentStep) {
        case 0:
          validation = validateCharacterName(newState.characterData.name, worldId);
          break;
        case 1:
          validation = validateAttributes(newState.characterData.attributes, newState.pointPools.attributes.total);
          break;
        case 2:
          validation = validateSkills(newState.characterData.skills);
          break;
        case 3:
          validation = validateBackground(newState.characterData.background);
          break;
      }
      
      newState.validation = {
        ...prev.validation,
        [prev.currentStep]: { 
          ...validation, 
          touched: prev.validation[prev.currentStep]?.touched || false 
        },
      };

      return newState;
    });
  }, [worldId]);

  const handleValidation = useCallback((valid: boolean, errors: string[]) => {
    setState(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        [prev.currentStep]: { valid, errors, touched: true },
      },
    }));
  }, []);

  const handleCreate = useCallback(() => {
    // Validate all steps
    for (let i = 0; i < 4; i++) {
      const validation = validateStep(i);
      if (!validation.valid) {
        setState(prev => ({
          ...prev,
          currentStep: i,
          validation: {
            ...prev.validation,
            [i]: { ...validation, touched: true },
          },
        }));
        return;
      }
    }

    // Create character
    const characterId = createCharacter({
      name: state.characterData.name,
      worldId,
      level: 1,
      attributes: state.characterData.attributes.map(attr => ({
        id: attr.attributeId,
        characterId: '', // Will be set by store
        name: attr.name,
        baseValue: attr.value,
        modifiedValue: attr.value,
      })),
      skills: state.characterData.skills
        .filter(skill => skill.isSelected)
        .map(skill => ({
          id: skill.skillId,
          characterId: '', // Will be set by store
          name: skill.name,
          level: skill.level,
        })),
      background: {
        history: state.characterData.background.history,
        personality: state.characterData.background.personality,
        motivation: state.characterData.background.motivation,
      },
      isPlayer: true,
      status: {
        hp: 100,
        mp: 50,
        stamina: 100,
      },
    });

    // Clear auto-save
    clearAutoSave();

    // Navigate to character detail
    router.push(`/characters/${characterId}`);
  }, [state, worldId, createCharacter, clearAutoSave, router, validateStep]);

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
    const props = {
      data: state,
      onUpdate: handleUpdate,
      onValidation: handleValidation,
      worldConfig: world,
    };

    switch (state.currentStep) {
      case 0:
        return <BasicInfoStep {...props} />;
      case 1:
        return <AttributesStep {...props} />;
      case 2:
        return <SkillsStep {...props} />;
      case 3:
        return <BackgroundStep {...props} />;
      default:
        return null;
    }
  };

  const currentValidation = state.validation[state.currentStep];
  const hasErrors = currentValidation?.touched && !currentValidation?.valid;
  const error = hasErrors ? currentValidation.errors.join(', ') : undefined;

  return (
    <WizardContainer title={`Create Character in ${world.name}`}>
      <div onBlur={handleFieldBlur}>
        <WizardProgress 
          steps={steps} 
          currentStep={state.currentStep} 
        />
        
        <WizardStep error={error}>
          {renderStep()}
        </WizardStep>
        
        <WizardNavigation
          onCancel={handleCancel}
          onBack={state.currentStep > 0 ? handleBack : undefined}
          onNext={state.currentStep < steps.length - 1 ? handleNext : undefined}
          onComplete={state.currentStep === steps.length - 1 ? handleCreate : undefined}
          currentStep={state.currentStep}
          totalSteps={steps.length}
          completeLabel="Create Character"
          disabled={hasErrors}
        />
      </div>
    </WizardContainer>
  );
};