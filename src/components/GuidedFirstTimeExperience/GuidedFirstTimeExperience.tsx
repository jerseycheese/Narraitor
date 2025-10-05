'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldStore } from '@/state/worldStore';
import { WizardContainer } from '@/components/shared/wizard/WizardContainer';
import { useWizardState } from '@/components/shared/wizard/hooks/useWizardState';
import { validators, validateField } from '@/components/shared/wizard/utils/validation';
import { GENRES } from '@/lib/constants/genres';
import { generateUniqueId } from '@/lib/utils/generateId';
import { getTimestamp } from '@/lib/utils';
import { WorldTypeSelector, WorldTypeData, convertToGenerationParams, validateWorldTypeData } from '@/components/shared/WorldTypeSelector';
import { Globe, Users, Play } from 'lucide-react';

const GUIDED_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'concept', label: 'World Concept' },
  { id: 'details', label: 'World Details' },
];

interface OnboardingData {
  name: string;
  genre: string;
  worldTypeData: WorldTypeData;
}


export function GuidedFirstTimeExperience() {
  const router = useRouter();
  const setOnboardingCompleted = useSessionStore(state => state.setOnboardingCompleted);
  const shouldShowOnboarding = useSessionStore(state => state.shouldShowOnboarding);
  const { createWorld, setCurrentWorld } = useWorldStore();

  // Validation function for wizard steps
  const validateStep = useCallback((step: number, data: OnboardingData) => {
    switch (step) {
      case 0: // Welcome step - always valid
        return { valid: true, errors: [], touched: true };
      case 1: // Concept step
        const conceptErrors = validateWorldTypeData(data.worldTypeData);
        return {
          valid: conceptErrors.length === 0,
          errors: conceptErrors,
          touched: true,
        };
      case 2: // Details step
        // For "Set Within" and "Inspired By" worlds, genre is optional since it can be inferred from the universe
        const isSetWithin = data.worldTypeData.worldType === 'set_within';
        const isInspiredBy = data.worldTypeData.worldType === 'inspired_by';
        const isGenreOptional = isSetWithin || isInspiredBy;
        const genreValidators = isGenreOptional ? [] : [(value: string) => validators.required(value, 'Genre')];
        const genreError = validateField(data.genre, genreValidators);
        const errors = [genreError].filter(Boolean) as string[];
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
      // Get existing world names to avoid duplicates
      const { worlds } = useWorldStore.getState();
      const existingNames = Object.values(worlds).map(world => world.name);

      // Use the AI world generator to create a complete world from the concept
      const { generateWorld } = await import('@/lib/generators/worldGenerator');
      
      // Use the abstracted conversion function
      const { reference, relationship, additionalContext } = convertToGenerationParams(data.worldTypeData);

      const generatedWorldData = await generateWorld({
        method: 'ai',
        reference,
        relationship,
        existingNames,
        suggestedName: data.name?.trim() || undefined,
        genre: data.genre || undefined,
        additionalContext
      });

      // Create the world first without attributes and skills
      const worldId = createWorld({
        name: generatedWorldData.name,
        description: generatedWorldData.description,
        genre: data.genre || generatedWorldData.genre,
        attributes: [], // Will be populated below
        skills: [], // Will be populated below
        settings: generatedWorldData.settings,
        reference, // Include reference for character generation
        relationship, // Include relationship for character generation
      });

      // Now update the world with the AI-generated attributes and skills that include the worldId
      const { updateWorld } = useWorldStore.getState();
      updateWorld(worldId, {
        attributes: generatedWorldData.attributes.map(attr => ({
          ...attr,
          id: generateUniqueId('attribute'),
          worldId
        })),
        skills: generatedWorldData.skills.map(skill => ({
          ...skill,
          id: generateUniqueId('skill'),
          worldId,
          attributeIds: []
        }))
      });

      // Generate world image in the background
      try {
        const imageResponse = await fetch('/api/generate-world-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            world: {
              id: worldId,
              name: generatedWorldData.name,
              description: generatedWorldData.description,
              genre: generatedWorldData.genre
            }
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          // Update the world with the generated image
          const { updateWorld } = useWorldStore.getState();
          updateWorld(worldId, { 
            image: {
              type: imageData.aiGenerated ? 'ai-generated' : 'placeholder',
              url: imageData.imageUrl,
              generatedAt: getTimestamp(),
              prompt: imageData.prompt
            }
          });
        }
      } catch (imageError) {
        console.error('Failed to generate world image:', imageError);
        // Don't fail the onboarding if image generation fails
      }

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
    initialData: { 
      name: '', 
      genre: 'fantasy', 
      worldTypeData: { 
        worldType: 'original', 
        worldReference: '', 
        additionalDetails: '' 
      } 
    },
    onComplete: handleComplete,
    onCancel: handleSkip,
    validateStep,
    persistKey: 'narraitor-onboarding',
  });

  // Memoized render functions for performance
  const renderWelcomeStep = useMemo(() => (
    <div className="text-center space-y-6" data-testid="guided-experience-container">
      <div className="max-w-md mx-auto">
        <p className="text-lg text-gray-700 mb-6">
          Create a world and start a story
        </p>
      </div>
      
      {/* How it Works */}
      <section className="max-w-2xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list" aria-label="Steps to get started">
          <div className="bg-background rounded-lg border p-6 shadow-sm relative overflow-hidden" role="listitem">
            {/* Background Icon */}
            <Globe className="absolute inset-0 w-4/5 h-4/5 text-primary opacity-[0.07] m-auto" aria-hidden="true" />
            <div className="relative z-10">
              <div className="text-3xl font-bold text-primary mb-3" aria-hidden="true">1</div>
              <h4 className="text-lg font-semibold mb-2">Build Your World</h4>
              <p className="text-sm text-muted-foreground">
                Create or generate unique worlds with custom rules and settings
              </p>
            </div>
          </div>
          <div className="bg-background rounded-lg border p-6 shadow-sm relative overflow-hidden" role="listitem">
            {/* Background Icon */}
            <Users className="absolute inset-0 w-4/5 h-4/5 text-primary opacity-[0.07] m-auto" aria-hidden="true" />
            <div className="relative z-10">
              <div className="text-3xl font-bold text-primary mb-3" aria-hidden="true">2</div>
              <h4 className="text-lg font-semibold mb-2">Create Characters</h4>
              <p className="text-sm text-muted-foreground">
                Design or generate playable characters that fit your world
              </p>
            </div>
          </div>
          <div className="bg-background rounded-lg border p-6 shadow-sm relative overflow-hidden" role="listitem">
            {/* Background Icon */}
            <Play className="absolute inset-0 w-4/5 h-4/5 text-primary opacity-[0.07] m-auto" aria-hidden="true" />
            <div className="relative z-10">
              <div className="text-3xl font-bold text-primary mb-3" aria-hidden="true">3</div>
              <h4 className="text-lg font-semibold mb-2">Start Playing</h4>
              <p className="text-sm text-muted-foreground">
                Make choices and shape your story
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  ), []);

  const renderConceptStep = useMemo(() => (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          World Concept
        </h2>
        <p className="text-gray-700">
          Create an RPG in any fictional universe or original setting
        </p>
      </div>
      
      <WorldTypeSelector
        value={wizard.state.data.worldTypeData}
        onChange={(worldTypeData) => {
          // Auto-set genre to empty for "Set Within" and "Inspired By" types (auto-detect)
          const isSetWithin = worldTypeData.worldType === 'set_within';
          const isInspiredBy = worldTypeData.worldType === 'inspired_by';
          const shouldAutoDetectGenre = isSetWithin || isInspiredBy;
          
          wizard.handlers.updateData({ 
            worldTypeData,
            ...(shouldAutoDetectGenre && { genre: '' })
          });
        }}
        size="medium"
      />

      {/* Validation Errors */}
      {wizard.stepValidation?.errors.length > 0 && (
        <div className="space-y-1">
          {wizard.stepValidation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-500">{error}</p>
          ))}
        </div>
      )}
    </div>
  ), [wizard.state.data.worldTypeData, wizard.stepValidation, wizard.handlers]);

  const renderDetailsStep = useMemo(() => {
    const isSetWithin = wizard.state.data.worldTypeData.worldType === 'set_within';
    const isInspiredBy = wizard.state.data.worldTypeData.worldType === 'inspired_by';
    const isGenreOptional = isSetWithin || isInspiredBy;
    
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            World Details
          </h2>
          <p className="text-gray-700">
            {isGenreOptional 
              ? "Give your world a name and optionally override the genre"
              : "Give your world a name and genre"
            }
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
              placeholder="E.g., Neo-Tokyo..."
              value={wizard.state.data.name}
              onChange={(e) => wizard.handlers.updateData({ name: e.target.value })}
            />
          </div>
          
          {isGenreOptional ? (
            <div>
              <label htmlFor="world-genre" className="block text-sm font-medium text-gray-700 mb-2">
                Genre <span className="text-gray-500 text-xs">(optional - will be inferred from your reference)</span>
              </label>
              <select
                id="world-genre"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={wizard.state.data.genre}
                onChange={(e) => wizard.handlers.updateData({ genre: e.target.value })}
              >
                <option value="">Auto-detect</option>
                {GENRES.map((genre) => (
                  <option key={genre.value} value={genre.value}>
                    {genre.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="world-genre" className="block text-sm font-medium text-gray-700 mb-2">
                Genre <span className="text-red-500">*</span>
              </label>
              <select
                id="world-genre"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={wizard.state.data.genre}
                onChange={(e) => wizard.handlers.updateData({ genre: e.target.value })}
              >
                <option value="">Select a genre</option>
                {GENRES.map((genre) => (
                  <option key={genre.value} value={genre.value}>
                    {genre.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {wizard.stepValidation?.errors.length > 0 && (
            <div className="text-sm text-red-500">
              {wizard.stepValidation.errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }, [wizard.state.data.name, wizard.state.data.genre, wizard.state.data.worldTypeData.worldType, wizard.stepValidation, wizard.handlers]);

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
    <WizardContainer title="First time?">
      <div className="space-y-8">
        
        {renderCurrentStep()}
        
        <div className="flex justify-center items-center pt-6">
          <div className="flex gap-3">
            {!wizard.isFirstStep && (
              <button
                onClick={wizard.handlers.handleBack}
                className="px-4 py-2 border border-gray-300 hover:border-gray-500 text-gray-700 font-medium rounded-md transition-colors"
              >
                Back
              </button>
            )}
            
            {wizard.isLastStep ? (
              <button
                onClick={wizard.handlers.handleComplete}
                disabled={!wizard.stepValidation?.valid || wizard.state.isProcessing}
                className="min-h-12 px-6 py-2 bg-green-500 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
              >
                {wizard.state.isProcessing ? 'Creating world...' : 'Create world'}
              </button>
            ) : (
              <button
                onClick={wizard.handlers.handleNext}
                disabled={!wizard.stepValidation?.valid}
                className="min-h-12 px-6 py-2 bg-blue-500 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
        
        {/* Skip option */}
        <div className="text-center">
          <button
            onClick={wizard.handlers.handleCancel}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip for now
          </button>
        </div>
        
        {wizard.currentError && (
          <div className="bg-red-200 border border-red-500 rounded-md p-3">
            <p className="text-sm text-red-500">{wizard.currentError}</p>
          </div>
        )}
      </div>
    </WizardContainer>
  );
}
