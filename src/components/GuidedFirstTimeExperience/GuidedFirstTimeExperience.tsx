'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sessionStore } from '@/state/sessionStore';
import { worldStore } from '@/state/worldStore';
import { WizardContainer } from '@/components/shared/wizard/WizardContainer';
import { WizardProgress } from '@/components/shared/wizard/WizardProgress';

interface GuidedStep {
  id: string;
  label: string;
}

const GUIDED_STEPS: GuidedStep[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'concept', label: 'World Concept' },
  { id: 'details', label: 'World Details' },
];

interface WorldConcept {
  name: string;
  theme: string;
  description: string;
}

export function GuidedFirstTimeExperience() {
  const router = useRouter();
  const { setOnboardingCompleted, shouldShowOnboarding } = sessionStore();
  const { createWorld, setCurrentWorld } = worldStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [worldConcept, setWorldConcept] = useState<WorldConcept>({
    name: '',
    theme: '',
    description: '',
  });
  const [isCompleting, setIsCompleting] = useState(false);

  // Don't render if onboarding shouldn't be shown
  if (!shouldShowOnboarding()) {
    return null;
  }

  const handleSkip = () => {
    setOnboardingCompleted(true);
    router.push('/worlds');
  };

  const handleNext = () => {
    if (currentStep < GUIDED_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      // Create the world with smart defaults
      const worldId = createWorld({
        name: worldConcept.name || 'My First World',
        description: worldConcept.description || 'A world of endless possibilities',
        theme: worldConcept.theme || 'fantasy',
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
    } finally {
      setIsCompleting(false);
    }
  };

  const renderWelcomeStep = () => (
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
  );

  const renderConceptStep = () => (
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
            value={worldConcept.description}
            onChange={(e) => setWorldConcept(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>
        
        {worldConcept.description && (
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>AI Suggestions:</strong> Great choice! This concept offers rich storytelling possibilities.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailsStep = () => (
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
            value={worldConcept.name}
            onChange={(e) => setWorldConcept(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        
        <div>
          <label htmlFor="world-theme" className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            id="world-theme"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={worldConcept.theme}
            onChange={(e) => setWorldConcept(prev => ({ ...prev, theme: e.target.value }))}
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
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderConceptStep();
      case 2:
        return renderDetailsStep();
      default:
        return renderWelcomeStep();
    }
  };

  const canProgress = () => {
    switch (currentStep) {
      case 0:
        return true; // Welcome step can always progress
      case 1:
        return worldConcept.description.trim().length > 0;
      case 2:
        return worldConcept.name.trim().length > 0 && worldConcept.theme.length > 0;
      default:
        return false;
    }
  };

  const isLastStep = currentStep === GUIDED_STEPS.length - 1;

  return (
    <WizardContainer title="Get Started with Narraitor">
      <div className="space-y-8">
        <WizardProgress 
          steps={GUIDED_STEPS} 
          currentStep={currentStep}
        />
        
        <div className="text-center text-sm text-gray-500 mb-6">
          Step {currentStep + 1} of {GUIDED_STEPS.length}
        </div>
        
        {renderCurrentStep()}
        
        <div className="flex justify-between items-center pt-6">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Skip
          </button>
          
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-md transition-colors"
              >
                Back
              </button>
            )}
            
            {isLastStep ? (
              <button
                onClick={handleComplete}
                disabled={!canProgress() || isCompleting}
                className="min-h-12 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
              >
                {isCompleting ? 'Creating World...' : 'Try it now'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProgress()}
                className="min-h-12 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </WizardContainer>
  );
}