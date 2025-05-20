'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import BasicInfoStep from './steps/BasicInfoStep';
import DescriptionStep from './steps/DescriptionStep';
import AttributeReviewStep from './steps/AttributeReviewStep';
import SkillReviewStep from './steps/SkillReviewStep';
import FinalizeStep from './steps/FinalizeStep';

export interface WorldCreationWizardProps {
  onComplete?: (worldId: string) => void;
  onCancel?: () => void;
  initialStep?: number; // Add this for Storybook
  initialData?: Partial<WizardState>; // Add this for Storybook
}

export interface WizardState {
  currentStep: number;
  worldData: Partial<World>;
  aiSuggestions?: {
    attributes: AttributeSuggestion[];
    skills: SkillSuggestion[];
  };
  errors: Record<string, string>;
  isProcessing: boolean;
}

export interface AttributeSuggestion {
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  baseValue: number;
  category?: string;
  accepted: boolean;
}

export interface SkillSuggestion {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  linkedAttributeName?: string;
  accepted: boolean;
}

const WIZARD_STEPS = [
  { id: 'basic-info', label: 'Basic Information' },
  { id: 'description', label: 'World Description' },
  { id: 'attributes', label: 'Review Attributes' },
  { id: 'skills', label: 'Review Skills' },
  { id: 'finalize', label: 'Finalize' },
];

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
    errors: {},
    isProcessing: false,
  });
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Expose wizardState for testing - only after mount and in dev/test
  useEffect(() => {
    if (mounted && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
      (window as unknown as { __testWizardState: unknown }).__testWizardState = {
        getState: () => wizardState,
        setState: (newState: Partial<WizardState>) => {
          setWizardState(prev => ({
            ...prev,
            ...newState
          }));
        }
      };
      
      return () => {
        delete (window as unknown as { __testWizardState?: unknown }).__testWizardState;
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
    } catch (error) {
      console.error('Error creating world:', error);
      setWizardState(prev => ({
        ...prev,
        errors: { submit: error instanceof Error ? error.message : 'Failed to create world' },
      }));
      
      // If worldStore fails, create a simple world
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

  const setAISuggestions = (suggestions: WizardState['aiSuggestions']) => {
    setWizardState(prev => ({
      ...prev,
      aiSuggestions: suggestions,
    }));
  };

  const setProcessing = (isProcessing: boolean) => {
    setWizardState(prev => ({
      ...prev,
      isProcessing,
    }));
  };

  const setError = (field: string, error: string) => {
    setWizardState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }));
  };

  const renderCurrentStep = () => {
    switch (wizardState.currentStep) {
      case 0:
        return (
          <BasicInfoStep
            worldData={wizardState.worldData}
            errors={wizardState.errors}
            onUpdate={updateWorldData}
            onNext={handleNext}
            onCancel={handleCancel}
          />
        );
      case 1:
        return (
          <DescriptionStep
            worldData={wizardState.worldData}
            errors={wizardState.errors}
            isProcessing={wizardState.isProcessing}
            onUpdate={updateWorldData}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
            setAISuggestions={setAISuggestions}
            setProcessing={setProcessing}
            setError={setError}
          />
        );
      case 2:
        return (
          <AttributeReviewStep
            worldData={wizardState.worldData}
            suggestions={wizardState.aiSuggestions?.attributes || []}
            errors={wizardState.errors}
            onUpdate={updateWorldData}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 3:
        return (
          <SkillReviewStep
            worldData={wizardState.worldData}
            suggestions={wizardState.aiSuggestions?.skills || []}
            errors={wizardState.errors}
            onUpdate={updateWorldData}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 4:
        return (
          <FinalizeStep
            worldData={wizardState.worldData}
            errors={wizardState.errors}
            onBack={handleBack}
            onCancel={handleCancel}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container} data-testid="wizard-container">
      <div style={styles.wizard}>
        <div style={styles.header} data-testid="wizard-header">
          <h1 style={styles.title}>Create New World</h1>
          <div style={styles.progress} data-testid="wizard-progress">
            <span>Step {wizardState.currentStep + 1} of {WIZARD_STEPS.length}</span>
          </div>
        </div>

        <div style={styles.steps}>
          {WIZARD_STEPS.map((step, index) => (
            <div
              key={step.id}
              data-testid={`wizard-step-${step.id}`}
              style={{
                ...styles.step,
                ...(index === wizardState.currentStep ? styles.activeStep : {}),
                ...(index < wizardState.currentStep ? styles.completedStep : {}),
              }}
            >
              <div style={styles.stepNumber} data-testid={`wizard-step-number-${index}`}>
                {index + 1}
              </div>
              <span style={styles.stepLabel}>{step.label}</span>
            </div>
          ))}
        </div>

        <div style={styles.content} data-testid="wizard-content">
          {renderCurrentStep()}
        </div>

        {wizardState.errors.submit && (
          <div style={styles.errorMessage} data-testid="wizard-error-submit">
            {wizardState.errors.submit}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '2rem',
  },
  wizard: {
    maxWidth: '48rem',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  header: {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  progress: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  steps: {
    display: 'flex',
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
  },
  step: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    opacity: 0.5,
    transition: 'opacity 0.2s',
  },
  activeStep: {
    opacity: 1,
    fontWeight: 'bold',
  },
  completedStep: {
    opacity: 0.75,
  },
  stepNumber: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: '0.875rem',
  },
  content: {
    padding: '1.5rem',
  },
  errorMessage: {
    padding: '1rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '0.375rem',
    margin: '1rem',
  },
};
