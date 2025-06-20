'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldStore } from '@/state/worldStore';
import { WizardContainer } from '@/components/shared/wizard/WizardContainer';
import { WizardProgress } from '@/components/shared/wizard/WizardProgress';
import { useWizardState } from '@/components/shared/wizard/hooks/useWizardState';
import { validators, validateField } from '@/components/shared/wizard/utils/validation';
import { THEMES } from '@/lib/constants/themes';
import { generateUniqueId } from '@/lib/utils/generateId';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { analyzeWorldDescriptionClient } from '@/lib/ai/worldAnalyzerClient';
import { WorldAnalysisResult } from '@/lib/ai/worldAnalyzer';
import { getResponsivePlaceholder, RESPONSIVE_PLACEHOLDERS } from '@/lib/utils/responsivePlaceholder';

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

// Helper function to convert AI suggestions to world entities
function convertSuggestionsToWorldEntities(worldId: string, suggestions: WorldAnalysisResult): { attributes: WorldAttribute[], skills: WorldSkill[] } {
  // Create world attributes from suggestions
  const attributes: WorldAttribute[] = suggestions.attributes.map(attr => ({
    id: generateUniqueId('attribute'),
    name: attr.name,
    description: attr.description,
    worldId,
    baseValue: attr.baseValue,
    minValue: attr.minValue,
    maxValue: attr.maxValue
  }));

  // Helper to find attribute ID by name
  const findAttributeId = (name: string) => attributes.find(a => a.name === name)?.id;

  // Create world skills from suggestions
  const skills: WorldSkill[] = suggestions.skills.map(skill => ({
    id: generateUniqueId('skill'),
    name: skill.name,
    description: skill.description,
    worldId,
    difficulty: skill.difficulty,
    category: skill.category,
    // Convert linkedAttributeNames to attributeIds
    attributeIds: skill.linkedAttributeNames?.map((attrName: string) => findAttributeId(attrName)).filter((id): id is string => id !== undefined) || [],
    baseValue: skill.baseValue,
    minValue: skill.minValue,
    maxValue: skill.maxValue
  }));

  return { attributes, skills };
}

export function GuidedFirstTimeExperience() {
  const router = useRouter();
  const { setOnboardingCompleted, shouldShowOnboarding } = useSessionStore();
  const { createWorld, setCurrentWorld } = useWorldStore();

  // Validation function for wizard steps
  const validateStep = useCallback((step: number, data: OnboardingData) => {
    switch (step) {
      case 0: // Welcome step - always valid
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
        const themeError = validateField(data.theme, [
          (value) => validators.required(value, 'Theme'),
        ]);
        const errors = [themeError].filter(Boolean) as string[];
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
      // Generate a world name if none provided
      let worldName = data.name;
      if (!worldName?.trim()) {
        // Use a simple fallback name generation based on theme
        const themeNames = {
          fantasy: ['Mystical Realm', 'Enchanted Lands', 'Arcane Kingdom'],
          'sci-fi': ['Stellar Colony', 'Cosmic Frontier', 'Galactic Outpost'],
          modern: ['Metropolitan Hub', 'Urban Center', 'City State'],
          historical: ['Ancient Dominion', 'Classical Empire', 'Heritage Lands'],
          horror: ['Dark Sanctuary', 'Shadow Realm', 'Haunted Territory'],
          mystery: ['Enigma District', 'Puzzle Grounds', 'Secret Haven'],
          western: ['Frontier Town', 'Desert Settlement', 'Wild Territory'],
          cyberpunk: ['Neon City', 'Cyber District', 'Digital Metropolis'],
          other: ['New World', 'Uncharted Territory', 'Unknown Realm']
        };
        const themeKey = data.theme as keyof typeof themeNames || 'other';
        const nameOptions = themeNames[themeKey] || themeNames.other;
        worldName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
      }

      // First create the world to get the worldId
      const worldId = createWorld({
        name: worldName,
        description: data.description || 'A world of endless possibilities',
        theme: data.theme || 'fantasy',
        attributes: [], // Will be populated with AI suggestions or defaults below
        skills: [], // Will be populated with AI suggestions or defaults below
        settings: {
          maxAttributes: 6,
          maxSkills: 12, // Increased to match our 12 default skills
          attributePointPool: 27,
          skillPointPool: 40,
        },
      });

      // Use the existing AI analyzer which will generate smart suggestions based on the 
      // world description or fall back to comprehensive defaults if AI is unavailable
      const suggestions = await analyzeWorldDescriptionClient(data.description || 'A world of endless possibilities');
      
      // Convert AI suggestions to world entities
      const { attributes, skills } = convertSuggestionsToWorldEntities(worldId, suggestions);
      
      // Update the world with the generated attributes and skills
      const { updateWorld } = useWorldStore.getState();
      updateWorld(worldId, { attributes, skills });

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
        <p className="text-lg text-gray-600 mb-6">
          Create a world and start a story
        </p>
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Let&apos;s guide you through creating your first world in just 3 steps.
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
          Create an RPG in any fictional universe or original setting
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
            placeholder="E.g., The world of Harry Potter, Star Wars galaxy, Middle-earth from LOTR, The Office workplace, or your own original fantasy realm..."
            value={wizard.state.data.description}
            onChange={(e) => wizard.handlers.updateData({ description: e.target.value })}
          />
          {wizard.stepValidation?.errors.length > 0 && (
            <p className="text-sm text-red-600 mt-1">{wizard.stepValidation.errors[0]}</p>
          )}
        </div>
        
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
            World Name (optional)
          </label>
          <input
            id="world-name"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={getResponsivePlaceholder(RESPONSIVE_PLACEHOLDERS.worldName)}
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
            {THEMES.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
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
    <WizardContainer title="Get Started">
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