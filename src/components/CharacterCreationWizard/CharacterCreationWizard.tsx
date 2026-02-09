import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { EntityID } from '@/types/common.types';
import { useCharacterCreationAutoSave } from '@/hooks/useCharacterCreationAutoSave';
import { useCharacterCreationWizard, CharacterCreationData } from '@/hooks/useCharacterCreationWizard';
import { useCharacterPointPools } from '@/hooks/useCharacterPointPools';
import { finalizeCharacterCreation } from '@/lib/utils/characterFinalization';
import {
  WizardContainer,
  WizardProgress,
  WizardNavigation,
  WizardStep
} from '@/components/shared/wizard';
import { RecoveryNotification } from '@/components/shared/RecoveryNotification';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { TemplateSelectionStep } from './steps/TemplateSelectionStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { AttributesStep } from './steps/AttributesStep';
import { SkillsStep } from './steps/SkillsStep';
import { BackgroundStep } from './steps/BackgroundStep';
import { PortraitStep } from './steps/PortraitStep';
import { normalizeSkillBounds } from './utils/skillAllocation';
import { useTutorial } from '@/components/TutorialProvider';

/**
 * Props for the CharacterCreationWizard component
 */
interface CharacterCreationWizardProps {
  /** The ID of the world for which to create a character */
  worldId: EntityID;
  /** Initial step index (0-based) to start the wizard on */
  initialStep?: number;
}

export const CharacterCreationWizard: React.FC<CharacterCreationWizardProps> = ({ worldId, initialStep = 0 }) => {
  const router = useRouter();
  const { worlds } = useWorldStore();
  const world = worlds[worldId];

  const {
    setCurrentWizardStep,
    pauseTour,
    resumeTour,
    currentTour,
    isTourActive,
  } = useTutorial();
  const pausedForRecoveryRef = useRef(false);

  // Auto-save integration
  const { data, setData, clearAutoSave, hasRecoveryData, recoveryPreview, hasCurrentData, saveStatus } = useCharacterCreationAutoSave(worldId);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  React.useEffect(() => {
    if (hasRecoveryData) {
      setShowRecoveryDialog(true);
    }
  }, [hasRecoveryData]);

  React.useEffect(() => {
    if (currentTour !== 'characterCreationWizard' || !isTourActive) {
      return;
    }

    if (showRecoveryDialog && !pausedForRecoveryRef.current) {
      pauseTour('end-of-page');
      pausedForRecoveryRef.current = true;
      return;
    }

    if (!showRecoveryDialog && pausedForRecoveryRef.current) {
      resumeTour();
      pausedForRecoveryRef.current = false;
    }
  }, [currentTour, isTourActive, pauseTour, resumeTour, showRecoveryDialog]);

  // Initialize character data from auto-save or defaults
  const initialCharacterData: CharacterCreationData = useMemo(() => {
    if (data?.characterData) {
      const existingSkills = (
        (data.characterData as Partial<CharacterCreationData>)?.skills ?? []
      ) as CharacterCreationData['skills'];

      const skillsWithBounds = normalizeSkillBounds(existingSkills, world);

      return {
        ...(data.characterData as CharacterCreationData),
        skills: skillsWithBounds,
        worldId,
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
      skills: normalizeSkillBounds(
        world?.skills.map(skill => ({
          skillId: skill.id,
          name: skill.name,
          description: skill.description,
          level: skill.minValue,
          minLevel: skill.minValue,
          maxLevel: skill.maxValue,
          attributeIds: skill.attributeIds || [],
          linkedAttributeId: skill.attributeIds?.[0],
          isSelected: false,
        })) || [],
        world
      ),
      background: {
        history: '',
        personality: '',
        goals: [],
        motivation: '',
      },
    };
  }, [data, worldId, world]);

  // Wizard state management
  const { wizard, steps, stepValidators } = useCharacterCreationWizard({
    initialData: initialCharacterData,
    initialStep: data?.currentStep || initialStep,
    worldId,
    world
  });

  // Sync wizard step with tutorial provider
  React.useEffect(() => {
    setCurrentWizardStep(wizard.state.currentStep);
  }, [wizard.state.currentStep, setCurrentWizardStep]);

  // Point pool managers
  const { attributePool, skillPool } = useCharacterPointPools({
    world,
    characterData: wizard.state.data
  });

  // Auto-save helper
  const saveWizardState = () => {
    const newData = {
      characterData: wizard.state.data,
      currentStep: wizard.state.currentStep,
      worldId: wizard.state.data.worldId,
      validation: wizard.state.validation,
      pointPools: {
        attributes: attributePool.pool,
        skills: skillPool,
      },
    };
    setData(newData);
  };

  // Navigation handlers
  const handleNext = () => {
    saveWizardState();
    wizard.goNext();
  };

  const handleBack = () => {
    saveWizardState();
    wizard.goBack();
  };

  const handleCancel = () => {
    router.push('/characters');
  };

  const handleRecoveryChoice = (choice: 'recover' | 'dismiss') => {
    if (choice === 'dismiss') {
      clearAutoSave();
    }
    setShowRecoveryDialog(false);
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

    // Finalize character creation
    finalizeCharacterCreation(wizard.state.data, world);

    // Clear auto-save
    clearAutoSave();

    // Navigate to game session
    router.push(`/worlds/${worldId}/play`);
  };

  if (!world) {
    return (
      <div>
        <p>World not found</p>
        <button
          onClick={() => router.push('/worlds')}
          
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
        skills: skillPool 
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
        return (
          <div data-tutorial="template-selector">
            <TemplateSelectionStep {...props} />
          </div>
        );
      case 1:
        return (
          <div data-tutorial="basic-info">
            <BasicInfoStep {...props} />
          </div>
        );
      case 2:
        return (
          <div data-tutorial="attribute-allocation">
            <AttributesStep {...props} />
          </div>
        );
      case 3:
        return (
          <div data-tutorial="skill-selection">
            <SkillsStep {...props} />
          </div>
        );
      case 4:
        return (
          <div data-tutorial="background-editor">
            <BackgroundStep {...props} />
          </div>
        );
      case 5:
        return (
          <div data-tutorial="portrait-generator">
            <PortraitStep {...props} />
          </div>
        );
      default:
        return null;
    }
  };

  const currentValidation = wizard.state.validation[wizard.state.currentStep];
  const hasErrors = currentValidation?.touched && !currentValidation?.valid;
  const error = hasErrors ? currentValidation.errors.join(',') : undefined;

  return (
    <>
      <WizardContainer title={`Create Character in${world.name}`} className="component-character-creation-wizard">
        <div>
          {/* Auto-save status indicator */}
          <div>
            <SaveIndicator
              status={saveStatus}
              lastSaveTime={data?.lastSaved}
              compact={true}
            />
          </div>

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

      {/* Auto-save recovery dialog */}
      <RecoveryNotification
        isVisible={showRecoveryDialog}
        lastSaved={data?.lastSaved}
        recoveryData={recoveryPreview}
        hasCurrentData={hasCurrentData}
        onRecover={() => handleRecoveryChoice('recover')}
        onDismiss={() => handleRecoveryChoice('dismiss')}
      />
    </>
  );
};
