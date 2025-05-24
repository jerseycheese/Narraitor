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
    createOwnWorld: initialData?.createOwnWorld || false,
    errors: {},
    isProcessing: false,
  });

  const canProceedToNext = (): boolean => {
    switch (wizardState.currentStep) {
      case 0:
        return wizardState.selectedTemplateId !== null || wizardState.createOwnWorld === true;
      case 1:
        return !!(wizardState.worldData.name && wizardState.worldData.theme);
      case 2:
        return !!wizardState.worldData.description;
      case 3:
        // Attributes are optional when creating own world
        return wizardState.createOwnWorld === true || (wizardState.worldData.attributes?.length || 0) > 0;
      case 4:
        // Skills are optional when creating own world
        return wizardState.createOwnWorld === true || (wizardState.worldData.skills?.length || 0) > 0;
      default:
        return true;
    }
  };

  const handleNext = async (createOwnWorld?: boolean) => {
    console.log('handleNext called, currentStep:', wizardState.currentStep);
    console.log('createOwnWorld param:', createOwnWorld);
    console.log('canProceedToNext:', canProceedToNext());
    console.log('wizardState:', wizardState);
    
    // For step 0, check if we can proceed (either template selected or createOwnWorld is true)
    const canProceed = wizardState.currentStep === 0 
      ? (wizardState.selectedTemplateId !== null || createOwnWorld === true)
      : canProceedToNext();
    
    console.log('canProceed (with createOwnWorld check):', canProceed);
    
    if (canProceed && wizardState.currentStep < WIZARD_STEPS.length - 1) {
      console.log('Moving to next step');
      
      // Special handling for step 2 (Description step) when creating own world
      if (wizardState.currentStep === 2 && wizardState.createOwnWorld && !wizardState.aiSuggestions) {
        console.log('Auto-generating AI suggestions for own world');
        await generateAISuggestions();
      }
      
      setWizardState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        createOwnWorld: createOwnWorld || prev.createOwnWorld,
      }));
    } else {
      console.log('Cannot proceed to next step');
    }
  };

  const generateAISuggestions = async () => {
    if (!wizardState.worldData.description) return;
    
    try {
      setWizardState(prev => ({ ...prev, isProcessing: true }));
      const { analyzeWorldDescription } = await import('@/lib/ai/worldAnalyzer');
      const suggestions = await analyzeWorldDescription(wizardState.worldData.description);
      setWizardState(prev => ({ 
        ...prev, 
        aiSuggestions: suggestions,
        isProcessing: false 
      }));
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Use default suggestions as fallback
      setWizardState(prev => ({ 
        ...prev, 
        aiSuggestions: getDefaultSuggestions(),
        isProcessing: false 
      }));
    }
  };

  const getDefaultSuggestions = () => ({
    attributes: [
      { name: 'Strength', description: 'Physical power and endurance', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: true },
      { name: 'Intelligence', description: 'Mental acuity and reasoning', minValue: 1, maxValue: 10, baseValue: 7, category: 'Mental', accepted: true },
      { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: true },
    ],
    skills: [
      { name: 'Combat', description: 'Ability to fight effectively', difficulty: 'medium' as const, category: 'Combat', linkedAttributeName: 'Strength', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'hard' as const, category: 'Physical', linkedAttributeName: 'Agility', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Perception', description: 'Noticing details and dangers', difficulty: 'easy' as const, category: 'Mental', linkedAttributeName: 'Intelligence', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
    ],
  });

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
            onBack={handleBack}
            onCancel={handleCancel}
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
        
        {/* Hide main navigation on template step (0) and finalize step (5) since they have their own navigation */}
        {wizardState.currentStep > 0 && wizardState.currentStep < WIZARD_STEPS.length - 1 && (
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