'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
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
  const [mounted, setMounted] = useState(false);
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
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Expose wizardState for testing
  useEffect(() => {
    if (mounted && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
      const testWindow = window as Window & {
        __testWizardState?: {
          getState: () => WizardState;
          setState: (newState: Partial<WizardState>) => void;
        };
      };
      
      testWindow.__testWizardState = {
        getState: () => wizardState,
        setState: (newState: Partial<WizardState>) => {
          setWizardState(prev => ({ ...prev, ...newState }));
        }
      };
      
      return () => {
        delete testWindow.__testWizardState;
      };
    }
  }, [wizardState, mounted]);

  const handleNext = () => {
    if (wizardState.currentStep < WIZARD_STEPS.length - 1) {
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        errors: {},
      }));
    }
  };

  const handleBack = () => {
    if (wizardState.currentStep > 0) {
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
        errors: {},
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
    onNext: handleNext,
    onBack: handleBack,
    onCancel: handleCancel,
  };

  const renderCurrentStep = () => {
    switch (wizardState.currentStep) {
      case 0:
        return (
          <TemplateStep
            selectedTemplateId={wizardState.selectedTemplateId}
            onUpdate={updateWizardState}
            onNext={handleNext}
            onBack={handleBack}
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

  return (
    <div className="min-h-screen p-4" data-testid="wizard-container">
      <div className="max-w-3xl mx-auto bg-white rounded shadow">
        <div className="p-4 border-b" data-testid="wizard-header">
          <h1 className="text-2xl font-bold">Create New World</h1>
          <div className="text-sm text-gray-500" data-testid="wizard-progress">
            <span>Step {wizardState.currentStep + 1} of {WIZARD_STEPS.length}</span>
          </div>
        </div>

        <div className="flex p-4 border-b">
          {WIZARD_STEPS.map((step, index) => (
            <div
              key={step.id}
              data-testid={`wizard-step-${step.id}`}
              className="flex-1 flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center" data-testid={`wizard-step-number-${index}`}>
                {index + 1}
              </div>
              <span className="text-sm">{step.label}</span>
            </div>
          ))}
        </div>

        <div className="p-4" data-testid="wizard-content">
          {renderCurrentStep()}
        </div>

        {wizardState.errors.submit && (
          <div className="p-4 m-4 bg-red-100 text-red-600 rounded" data-testid="wizard-error-submit">
            {wizardState.errors.submit}
          </div>
        )}
      </div>
    </div>
  );
}
