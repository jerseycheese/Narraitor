'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import { 
  WizardContainer, 
  WizardProgress, 
  WizardNavigation, 
  WizardStep 
} from '@/components/shared/wizard';
import TemplateStep from './steps/TemplateStep';
import BasicInfoStep from './steps/BasicInfoStep';
import DescriptionStep from './steps/DescriptionStep';
import AttributeReviewStep from './steps/AttributeReviewStep';
import SkillReviewStep from './steps/SkillReviewStep';
import FinalizeStep from './steps/FinalizeStep';
import { WizardState, WIZARD_STEPS } from './WizardState';

export type { AttributeSuggestion, SkillSuggestion } from './WizardState';

export interface WorldCreationWizardProps {
  onComplete?: (worldId: string) => void;
  onCancel?: () => void;
  initialStep?: number;
  initialData?: Partial<WizardState>;
}

export default function WorldCreationWizard({ 
  onComplete, 
  onCancel,
  initialStep = 0,
  initialData
}: WorldCreationWizardProps) {
  const router = useRouter();
  const createWorld = worldStore((state) => state.createWorld);
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: initialStep,
    worldData: initialData?.worldData || {
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 20,
        skillPointPool: 20
      }
    },
    aiSuggestions: initialData?.aiSuggestions,
    selectedTemplateId: initialData?.selectedTemplateId || null,
    errors: {},
    isProcessing: false,
  });

  const canProceedToNext = (): boolean => {
    switch (wizardState.currentStep) {
      case 0:
        return wizardState.selectedTemplateId !== null;
      case 1:
        return !!(wizardState.worldData.name && wizardState.worldData.theme);
      case 2:
        return !!wizardState.worldData.description;
      case 3:
        return (wizardState.worldData.attributes?.length || 0) > 0;
      case 4:
        return (wizardState.worldData.skills?.length || 0) > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    console.log('handleNext called, currentStep:', wizardState.currentStep);
    console.log('canProceedToNext:', canProceedToNext());
    console.log('wizardState:', wizardState);
    if (canProceedToNext() && wizardState.currentStep < WIZARD_STEPS.length - 1) {
      console.log('Moving to next step');
      setWizardState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    } else {
      console.log('Cannot proceed to next step');
    }
  };

  const handleBack = () => {
    if (wizardState.currentStep > 0) {
      setWizardState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/worlds');
    }
  };

  const handleComplete = () => {
    try {
      const worldId = createWorld({
        name: wizardState.worldData.name!,
        description: wizardState.worldData.description!,
        theme: wizardState.worldData.theme!,
        attributes: wizardState.worldData.attributes || [],
        skills: wizardState.worldData.skills || [],
        settings: wizardState.worldData.settings!,
      });
      
      // Save to localStorage as temporary solution
      if (typeof window !== 'undefined') {
        const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
        worlds.push({
          id: worldId,
          name: wizardState.worldData.name,
          theme: wizardState.worldData.theme,
          description: wizardState.worldData.description,
          createdAt: new Date().toISOString(),
          attributes: wizardState.worldData.attributes || [],
          skills: wizardState.worldData.skills || [],
        });
        localStorage.setItem('worlds', JSON.stringify(worlds));
      }
      
      if (onComplete) {
        onComplete(worldId);
      } else {
        router.push('/worlds');
      }
    } catch {
      // Fallback error handling
      const worldId = `world-${Date.now()}`;
      if (typeof window !== 'undefined') {
        const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
        worlds.push({
          id: worldId,
          name: wizardState.worldData.name,
          theme: wizardState.worldData.theme,
          description: wizardState.worldData.description,
          createdAt: new Date().toISOString(),
          attributes: wizardState.worldData.attributes || [],
          skills: wizardState.worldData.skills || [],
        });
        localStorage.setItem('worlds', JSON.stringify(worlds));
      }
      
      if (onComplete) {
        onComplete(worldId);
      } else {
        router.push('/worlds');
      }
    }
  };

  const updateWorldData = (updates: Partial<World>) => {
    setWizardState(prev => ({
      ...prev,
      worldData: { ...prev.worldData, ...updates },
    }));
  };

  const updateWizardState = (updates: Partial<WizardState>) => {
    setWizardState(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const stepProps = {
    worldData: wizardState.worldData,
    errors: wizardState.errors,
    onUpdate: updateWorldData,
  };

  const renderCurrentStep = () => {
    switch (wizardState.currentStep) {
      case 0:
        return (
          <TemplateStep
            selectedTemplateId={wizardState.selectedTemplateId}
            onUpdate={updateWizardState}
            onComplete={handleNext}
            onCancel={handleCancel}
            errors={wizardState.errors}
          />
        );
      case 1:
        return <BasicInfoStep {...stepProps} />;
      case 2:
        return (
          <DescriptionStep
            {...stepProps}
            isProcessing={wizardState.isProcessing}
            setAISuggestions={(suggestions) => 
              setWizardState(prev => ({ ...prev, aiSuggestions: suggestions }))
            }
            setProcessing={(isProcessing) => 
              setWizardState(prev => ({ ...prev, isProcessing }))
            }
            setError={(field, error) => 
              setWizardState(prev => ({ 
                ...prev, 
                errors: { ...prev.errors, [field]: error } 
              }))
            }
            onComplete={handleNext}
          />
        );
      case 3:
        return (
          <AttributeReviewStep
            {...stepProps}
            suggestions={wizardState.aiSuggestions?.attributes || []}
          />
        );
      case 4:
        return (
          <SkillReviewStep
            {...stepProps}
            suggestions={wizardState.aiSuggestions?.skills || []}
          />
        );
      case 5:
        return (
          <FinalizeStep
            {...stepProps}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  const steps = WIZARD_STEPS.map(step => ({
    id: step.id,
    label: step.label
  }));

  const currentError = wizardState.errors.submit;

  return (
    <WizardContainer title="Create New World">
      <div data-testid="wizard-container">
        <WizardProgress 
          steps={steps} 
          currentStep={wizardState.currentStep}
        />
        
        <WizardStep error={currentError}>
          <div data-testid="wizard-content">
            {renderCurrentStep()}
          </div>
        </WizardStep>
        
        {/* Hide main navigation on template step since it has its own navigation */}
        {wizardState.currentStep > 0 && (
          <WizardNavigation
            onCancel={handleCancel}
            onBack={wizardState.currentStep > 0 ? handleBack : undefined}
            onNext={wizardState.currentStep < WIZARD_STEPS.length - 1 ? handleNext : undefined}
            onComplete={wizardState.currentStep === WIZARD_STEPS.length - 1 ? handleComplete : undefined}
            currentStep={wizardState.currentStep}
            totalSteps={WIZARD_STEPS.length}
            completeLabel="Create World"
            disabled={!canProceedToNext()}
            isLoading={wizardState.isProcessing}
          />
        )}
      </div>
    </WizardContainer>
  );
}