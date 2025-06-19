'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { sessionStore } from '@/state/sessionStore';
import { worldStore } from '@/state/worldStore';
import { WizardContainer } from '@/components/shared/wizard/WizardContainer';
import { WizardProgress } from '@/components/shared/wizard/WizardProgress';
import { useWizardState } from '@/components/shared/wizard/hooks/useWizardState';
import { validators, validateField } from '@/components/shared/wizard/utils/validation';

const GUIDED_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'concept', label: 'World Concept' },
  { id: 'details', label: 'World Details' },
];

interface OnboardingData {
  name: string;
  theme: string;
  description: string;
}

export function GuidedFirstTimeExperience() {
  const router = useRouter();
  const { setOnboardingCompleted, shouldShowOnboarding } = sessionStore();
  const { createWorld, setCurrentWorld } = worldStore();

  // Validation function for wizard steps
  const validateStep = useCallback((step: number, data: OnboardingData) => {
    switch (step) {
      case 0: // Welcome step
        return { valid: true, errors: [], touched: true };
      case 1: // Concept step
        const conceptError = validateField(data.description, [
          (value) => validators.required(value, 'World concept'),
        ]);
        return {
          valid: !conceptError,
          errors: conceptError ? [conceptError] : [],
          touched: true,
        };
      case 2: // Details step
        const nameError = validateField(data.name, [
          (value) => validators.required(value, 'World name'),
        ]);
        const themeError = validateField(data.theme, [
          (value) => validators.required(value, 'Theme'),
        ]);
        const errors = [nameError, themeError].filter(Boolean) as string[];
        return {
          valid: errors.length === 0,
          errors,
          touched: true,
        };
      default:
        return { valid: true, errors: [], touched: true };
    }
  }, []);

  // Complete onboarding and create world
  const handleComplete = useCallback(async (data: OnboardingData) => {
    try {
      // Create the world with smart defaults
      const worldId = createWorld({
        name: data.name || 'My First World',
        description: data.description || 'A world of endless possibilities',
        theme: data.theme || 'fantasy',
        attributes: [], // Smart defaults will be applied
        skills: [], // Smart defaults will be applied
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 40,
        },
      });

      // Set as current world
      setCurrentWorld(worldId);
      
      // Mark onboarding as completed
      setOnboardingCompleted(true);
      
      // Navigate to character creation to continue the flow
      router.push(`/characters/create?worldId=${worldId}`);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error; // Re-throw to let wizard handle it
    }
  }, [createWorld, setCurrentWorld, setOnboardingCompleted, router]);

  // Handle skip
  const handleSkip = useCallback(() => {
    setOnboardingCompleted(true);
    router.push('/worlds');
  }, [setOnboardingCompleted, router]);

  // Initialize wizard state
  const wizard = useWizardState({
    steps: GUIDED_STEPS,
    initialData: { name: '', theme: '', description: '' },
    onComplete: handleComplete,
    onCancel: handleSkip,
    validateStep,
    persistKey: 'narraitor-onboarding',
  });

  // Memoized render functions for performance
  const renderWelcomeStep = useMemo(() => (
    <div className="text-center space-y-6" data-testid="guided-experience-container">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Narraitor
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Create your own world and start your adventure within 2 minutes
        </p>
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            We&apos;ll guide you through creating your first world in just 3 simple steps. 
            Each step takes less than 30 seconds to complete.
          </p>
        </div>
      </div>
    </div>
  ), []);

  const renderConceptStep = useMemo(() => (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          World Concept
        </h2>
        <p className="text-gray-600">
          What kind of world do you want to explore?
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="world-concept" className="block text-sm font-medium text-gray-700 mb-2">
            World Concept
          </label>
          <textarea
            id="world-concept"
            name="world-concept"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="E.g., A magical forest realm, Cyberpunk city, Medieval kingdom..."
            value={wizard.state.data.description}
            onChange={(e) => wizard.handlers.updateData({ description: e.target.value })}
          />
          {wizard.stepValidation?.errors.length > 0 && (
            <p className="text-sm text-red-600 mt-1">{wizard.stepValidation.errors[0]}</p>
          )}
        </div>
        
        {wizard.state.data.description && (
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>AI Suggestions:</strong> Great choice! This concept offers rich storytelling possibilities.
            </p>
          </div>
        )}
      </div>
    </div>
  ), [wizard.state.data.description, wizard.stepValidation, wizard.handlers]);

  const renderDetailsStep = useMemo(() => (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          World Details
        </h2>
        <p className="text-gray-600">
          Give your world a name and theme
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="world-name" className="block text-sm font-medium text-gray-700 mb-2">
            World Name
          </label>
          <input
            id="world-name"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your world's name"
            value={wizard.state.data.name}
            onChange={(e) => wizard.handlers.updateData({ name: e.target.value })}
          />
        </div>
        
        <div>
          <label htmlFor="world-theme" className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            id="world-theme"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={wizard.state.data.theme}
            onChange={(e) => wizard.handlers.updateData({ theme: e.target.value })}
          >
            <option value="">Select a theme</option>
            <option value="fantasy">Fantasy</option>
            <option value="sci-fi">Sci-Fi</option>
            <option value="modern">Modern</option>
            <option value="historical">Historical</option>
            <option value="post-apocalyptic">Post-Apocalyptic</option>
            <option value="cyberpunk">Cyberpunk</option>
          </select>
        </div>
        
        {wizard.stepValidation?.errors.length > 0 && (
          <div className="text-sm text-red-600">
            {wizard.stepValidation.errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  ), [wizard.state.data.name, wizard.state.data.theme, wizard.stepValidation, wizard.handlers]);

  // Render current step
  const renderCurrentStep = useCallback(() => {
    switch (wizard.currentStep) {
      case 0:
        return renderWelcomeStep;
      case 1:
        return renderConceptStep;
      case 2:
        return renderDetailsStep;
      default:
        return renderWelcomeStep;
    }
  }, [wizard.currentStep, renderWelcomeStep, renderConceptStep, renderDetailsStep]);

  // Don't render if onboarding shouldn't be shown
  if (!shouldShowOnboarding()) {
    return null;
  }

  return (
    <WizardContainer title="Get Started with Narraitor">
      <div className="space-y-8">
        <WizardProgress 
          steps={GUIDED_STEPS} 
          currentStep={wizard.currentStep}
        />
        
        <div className="text-center text-sm text-gray-500 mb-6">
          Step {wizard.currentStep + 1} of {GUIDED_STEPS.length}
        </div>
        
        {renderCurrentStep()}
        
        <div className="flex justify-between items-center pt-6">
          <button
            onClick={wizard.handlers.handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Skip
          </button>
          
          <div className="flex gap-3">
            {!wizard.isFirstStep && (
              <button
                onClick={wizard.handlers.handleBack}
                className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-md transition-colors"
              >
                Back
              </button>
            )}
            
            {wizard.isLastStep ? (
              <button
                onClick={wizard.handlers.handleComplete}
                disabled={!wizard.stepValidation?.valid || wizard.state.isProcessing}
                className="min-h-12 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
              >
                {wizard.state.isProcessing ? 'Creating World...' : 'Try it now'}
              </button>
            ) : (
              <button
                onClick={wizard.handlers.handleNext}
                disabled={!wizard.stepValidation?.valid}
                className="min-h-12 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
        
        {wizard.currentError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{wizard.currentError}</p>
          </div>
        )}
      </div>
    </WizardContainer>
  );
}