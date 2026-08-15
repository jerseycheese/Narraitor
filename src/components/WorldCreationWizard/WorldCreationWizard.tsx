'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { World } from '@/types/world.types';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { useWizardState, WizardStep as WizardStepType } from '@/hooks/useWizardState';
import {
  Validator,
  alwaysValid,
  validateFields,
  createValidationRules,
} from '@/lib/utils/wizardValidation';
import { 
  WizardContainer, 
  WizardProgress, 
  WizardNavigation, 
  WizardStep 
} from '@/components/shared/wizard';
import { ConfirmationDialog } from '@/components/ConfirmationDialog/ConfirmationDialog';
import BasicInfoStep from './steps/BasicInfoStep';
import DescriptionStep from './steps/DescriptionStep';
import AttributeReviewStep from './steps/AttributeReviewStep';
import SkillReviewStep from './steps/SkillReviewStep';
import FinalizeStep from './steps/FinalizeStep';
import { AttributeSuggestion, SkillSuggestion, WIZARD_STEPS } from './WizardState';
import { AIGuidanceSource } from '@/lib/constants/worldGuidance';
import { generateWorldImage } from '@/lib/ai/worldImageGenerator';
import { analyzeWorldDescriptionClient } from '@/lib/ai/worldAnalyzerClient';
import { ensureWorldNpcRoster } from '@/lib/services/worldCreationService';
import { useTutorial } from '@/components/TutorialProvider';
import { tourStepToWizardStep } from '@/lib/tutorial/worldCreationTour';

import Logger from '@/lib/utils/logger';
const logger = new Logger('WorldCreationWizard');

// Efficient deep comparison for arrays of objects
const areArraysEqual = <T extends object>(a: T[] = [], b: T[] = []): boolean => {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    const objA = a[i];
    const objB = b[i];
    
    // Compare object keys
    const keysA = Object.keys(objA) as (keyof T)[];
    const keysB = Object.keys(objB) as (keyof T)[];
    
    if (keysA.length !== keysB.length) return false;
    
    // Compare each property
    for (const key of keysA) {
      if (objA[key] !== objB[key]) return false;
    }
  }
  
  return true;
};

export type { AttributeSuggestion, SkillSuggestion };

interface WorldCreationData extends Partial<World> {
  aiSuggestions?: {
    attributes: AttributeSuggestion[];
    skills: SkillSuggestion[];
  };
  aiSuggestionsGenerated?: boolean;
  worldType?: 'original' | 'inspired_by' | 'set_within';
  createdWorldId?: string;
  aiSuggestionMeta?: {
    source: AIGuidanceSource;
    generatedAt?: string;
    descriptionSnapshot?: string;
  };
}

export interface WorldCreationWizardProps {
  onComplete?: (worldId: string) => void;
  onCancel?: () => void;
  initialStep?: number;
  initialData?: Partial<WorldCreationData>;
}

type SuggestionMeta = NonNullable<WorldCreationData['aiSuggestionMeta']>;

const buildSuggestionMeta = (
  description: string | undefined,
  source: AIGuidanceSource
): SuggestionMeta => ({
  source,
  generatedAt: new Date().toISOString(),
  descriptionSnapshot: (description || '').trim(),
});

export default function WorldCreationWizard({
  onComplete,
  onCancel,
  initialStep = 0,
  initialData
}: WorldCreationWizardProps) {
  const router = useRouter();
  const createWorld = useWorldStore((state) => state.createWorld);
  const { startTour, setCurrentWizardStep, isTourActive } = useTutorial();
  const worldCreationProgress = useSessionStore(state => state.tutorialProgress.phases.worldCreation);
  
  // Initialize world creation data
  // Note: initialData spread at the end takes precedence over defaults,
  // allowing external components to override any default values
  const initialWorldData: WorldCreationData = useMemo(() => ({
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20
    },
    aiSuggestions: initialData?.aiSuggestions,
    aiSuggestionsGenerated: initialData?.aiSuggestionsGenerated || false,
    worldType: initialData?.worldType || 'original',
    // Spread initialData last to ensure external overrides take precedence
    ...initialData,
  }), [initialData]);

  // Create step validators
  const stepValidators = useMemo((): Record<number, Validator<WorldCreationData>> => {
    return {
      0: validateFields<WorldCreationData>({
        genre: [createValidationRules.required('World genre is required')],
      }),
      1: validateFields<WorldCreationData>({
        description: [
          createValidationRules.required<string | undefined>('World description is required'),
          createValidationRules.minLength(50, 'Description must be at least 50 characters'),
        ],
      }),
      2: alwaysValid, // Attributes step — suggestions are optional
      3: alwaysValid, // Skills step — suggestions are optional
      4: alwaysValid, // Finalize step is always valid
    };
  }, []);

  // Wizard state management
  const wizard = useWizardState<WorldCreationData>({
    initialData: initialWorldData,
    initialStep,
    steps: WIZARD_STEPS,
    onStepValidation: (stepIndex, data) => {
      const validator = stepValidators[stepIndex];
      return validator ? validator(data) : { valid: true, errors: [], touched: true };
    },
  });

  // Sync wizard step with tutorial provider
  React.useEffect(() => {
    setCurrentWizardStep(wizard.state.currentStep);
  }, [wizard.state.currentStep, setCurrentWizardStep]);

  const shouldAutoStartTour = useMemo(() => {
    if (worldCreationProgress.skipped) return false;
    if (!worldCreationProgress.completed) return true;

    const stepIndices = Object.entries(tourStepToWizardStep)
      .filter(([, step]) => step === wizard.state.currentStep)
      .map(([index]) => parseInt(index, 10));

    if (stepIndices.length === 0) return false;
    const maxIndexForWizardStep = Math.max(...stepIndices);

    return worldCreationProgress.lastStep < maxIndexForWizardStep;
  }, [
    worldCreationProgress.completed,
    worldCreationProgress.skipped,
    worldCreationProgress.lastStep,
    wizard.state.currentStep,
  ]);

  // Auto-start tour if needed
  React.useEffect(() => {
    if (shouldAutoStartTour && !isTourActive) {
      // Small delay to ensure components are mounted
      const timer = setTimeout(() => {
        startTour('worldCreation');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoStartTour, isTourActive, startTour, wizard.state.currentStep]);

  // Cancel confirmation dialog state
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  // Dirty state detection - check if user has made meaningful changes
  const isDirty = useMemo(() => {
    const currentData = wizard.state.data;
    const initialData = initialWorldData;
    
    return (
      currentData.name !== initialData.name ||
      currentData.description !== initialData.description ||
      currentData.genre !== initialData.genre ||
      !areArraysEqual(currentData.attributes, initialData.attributes) ||
      !areArraysEqual(currentData.skills, initialData.skills) ||
      currentData.aiSuggestionsGenerated !== initialData.aiSuggestionsGenerated
    );
  }, [wizard.state.data, initialWorldData]);

  const canProceedToNext = useCallback((): boolean => {
    const currentValidation = wizard.state.validation[wizard.state.currentStep];
    return !currentValidation || currentValidation.valid;
  }, [wizard.state.validation, wizard.state.currentStep]);

  const generateAISuggestions = useCallback(async () => {
    const description = wizard.state.data.description;
    if (!description || description.trim().length < 50) {
      wizard.setError('ai', 'Add at least a short paragraph (50+ characters) so the system understands your world.');
      return;
    }

    wizard.setProcessing(true);
    wizard.clearError('ai');

    try {
      const suggestions = await analyzeWorldDescriptionClient(description);
      
      wizard.updateData({ 
        aiSuggestions: suggestions,
        aiSuggestionsGenerated: true,
        aiSuggestionMeta: buildSuggestionMeta(description, 'ai'),
      });
    } catch (error) {
      logger.error('Error generating suggestions:', error);
      
      // Use default suggestions as fallback
      const defaultSuggestions = getDefaultSuggestions();
      wizard.updateData({ 
        aiSuggestions: defaultSuggestions,
        aiSuggestionsGenerated: true,
        aiSuggestionMeta: buildSuggestionMeta(description, 'fallback'),
      });
      wizard.setError(
        'ai',
        'We had trouble reaching the generation service, so we loaded starter suggestions. You can generate again once the service recovers.'
      );
    } finally {
      wizard.setProcessing(false);
    }
  }, [wizard]);

  const clearAISuggestions = useCallback(() => {
    wizard.updateData({
      aiSuggestions: undefined,
      aiSuggestionsGenerated: false,
      aiSuggestionMeta: undefined,
      // Note: Don't clear attributes/skills here - let the step components
      // preserve custom attributes/skills that the user manually created
    });
  }, [wizard]);

  const handleNext = useCallback(async () => {
    // Auto-generate attribute/skill suggestions when leaving the Description step (step 1)
    if (wizard.state.currentStep === 1 && !wizard.state.data.aiSuggestionsGenerated) {
      await generateAISuggestions();
    }

    wizard.goNext();
  }, [wizard, generateAISuggestions]);

  const getDefaultSuggestions = () => ({
    attributes: [
      { name: 'Strength', description: 'Physical power and endurance', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: true },
      { name: 'Intelligence', description: 'Mental acuity and reasoning', minValue: 1, maxValue: 10, baseValue: 7, category: 'Mental', accepted: true },
      { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: true },
    ],
    skills: [
      { name: 'Combat', description: 'Ability to fight effectively', difficulty: 'medium' as const, category: 'Combat', linkedAttributeNames: ['Strength'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'hard' as const, category: 'Physical', linkedAttributeNames: ['Agility'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Perception', description: 'Noticing details and dangers', difficulty: 'easy' as const, category: 'Mental', linkedAttributeNames: ['Intelligence'], accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
    ],
  });

  const handleBack = useCallback(() => {
    wizard.goBack();
  }, [wizard]);

  const handleCancel = useCallback(() => {
    // Check if user has made meaningful changes
    if (isDirty) {
      // Show confirmation dialog
      setShowCancelConfirmation(true);
    } else {
      // Direct cancel for clean state
      if (onCancel) {
        onCancel();
      } else {
        router.push('/worlds');
      }
    }
  }, [isDirty, onCancel, router]);

  const handleConfirmCancel = useCallback(() => {
    setShowCancelConfirmation(false);
    if (onCancel) {
      onCancel();
    } else {
      router.push('/worlds');
    }
  }, [onCancel, router]);

  const handleRejectCancel = useCallback(() => {
    setShowCancelConfirmation(false);
  }, []);

  const finishWizard = useCallback((worldId: string) => {
    if (onComplete) {
      onComplete(worldId);
    } else {
      router.push('/worlds');
    }
  }, [onComplete, router]);

  const handleComplete = useCallback(async () => {
    const data = wizard.state.data;

    // If the world was already created (e.g. returning to finalize), just finish.
    if (data.createdWorldId) {
      finishWizard(data.createdWorldId);
      return;
    }

    try {
      // Create the world first
      const worldId = createWorld({
        name: data.name || 'Untitled World',
        description: data.description!,
        genre: data.genre!,
        attributes: data.attributes || [],
        skills: data.skills || [],
        settings: data.settings!,
        toneSettings: data.toneSettings || DEFAULT_TONE_SETTINGS,
        image: data.image, // Include any image if already generated
        reference: data.reference, // Include reference for character generation
        relationship: data.relationship, // Include relationship for character generation
      });

      // Set the newly created world as the active world
      const { setCurrentWorld } = useWorldStore.getState();
      setCurrentWorld(worldId);

      // Store the world ID in wizard state
      wizard.updateData({ createdWorldId: worldId });

      // Generate world image asynchronously after creation (only if no image was already generated)
      if (!data.image?.url) {
        const runWorldImageGeneration = async () => {
          try {
            const world = useWorldStore.getState().worlds[worldId];

            if (world) {
              const image = await generateWorldImage(world);
              useWorldStore.getState().updateWorld(worldId, { image });
            }
          } catch (error) {
            logger.error('[WorldCreationWizard] Failed to generate world image:', error);
          }
        };
        
        // Start image generation in the background
        runWorldImageGeneration();
      }

      void ensureWorldNpcRoster(worldId);

      finishWizard(worldId);
    } catch (error) {
      // Fallback error handling — log so failures are observable
      logger.error('[WorldCreationWizard] handleComplete failed, using fallback world id:', error);
      const worldId = `world-${Date.now()}`;
      wizard.updateData({ createdWorldId: worldId });
      finishWizard(worldId);
    }
  }, [wizard, createWorld, finishWizard]);

  const updateWorldData = useCallback((updates: Partial<World>) => {
    wizard.updateData(updates);
  }, [wizard]);

  const stepProps = {
    worldData: wizard.state.data,
    errors: wizard.state.errors || {},
    onUpdate: updateWorldData,
  };

  const renderCurrentStep = () => {
    switch (wizard.state.currentStep) {
      case 0:
        return (
          <div>
            <BasicInfoStep {...stepProps} />
          </div>
        );
      case 1:
        return (
          <div>
            <DescriptionStep
              {...stepProps}
              isProcessing={wizard.state.isProcessing || false}
              aiSuggestions={wizard.state.data.aiSuggestions}
              suggestionMeta={wizard.state.data.aiSuggestionMeta}
              canGenerateSuggestions
              onGenerateSuggestions={generateAISuggestions}
            />
          </div>
        );
      case 2:
        return (
          <div>
            <AttributeReviewStep
              {...stepProps}
              suggestions={wizard.state.data.aiSuggestions?.attributes || []}
              onClearSuggestions={clearAISuggestions}
            />
          </div>
        );
      case 3:
        return (
          <div>
            <SkillReviewStep
              {...stepProps}
              suggestions={wizard.state.data.aiSuggestions?.skills || []}
              onClearSuggestions={clearAISuggestions}
            />
          </div>
        );
      case 4:
        return (
          <div>
            <FinalizeStep
              {...stepProps}
              onComplete={handleComplete}
              onBack={handleBack}
              onCancel={handleCancel}
              onUpdateWorldData={updateWorldData}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const steps: WizardStepType[] = WIZARD_STEPS.map(step => ({
    id: step.id,
    label: step.label
  }));

  const currentValidation = wizard.state.validation[wizard.state.currentStep];
  const currentError = currentValidation?.touched && !currentValidation?.valid ? currentValidation.errors.join(', ') : undefined;

  return (
    <WizardContainer title="Create New World">
      <div className="component-world-creation-wizard" data-testid="wizard-container">
        <WizardProgress 
          steps={steps} 
          currentStep={wizard.state.currentStep}
        />
        
        <WizardStep error={currentError}>
          <div data-testid="wizard-content">
            {renderCurrentStep()}
          </div>
        </WizardStep>
        
        {/* Hide main navigation on the finalize step (4) since it has its own navigation */}
        {wizard.state.currentStep < WIZARD_STEPS.length - 1 && (
          <WizardNavigation
            onCancel={handleCancel}
            onBack={wizard.canGoBack ? handleBack : undefined}
            onNext={wizard.canGoNext && canProceedToNext() ? handleNext : undefined}
            onComplete={wizard.isLastStep ? handleComplete : undefined}
            currentStep={wizard.state.currentStep}
            totalSteps={WIZARD_STEPS.length}
            completeLabel="Create World"
            disabled={!canProceedToNext()}
            isLoading={wizard.state.isProcessing || false}
          />
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCancelConfirmation}
        onClose={handleRejectCancel}
        onConfirm={handleConfirmCancel}
        title="Cancel World Creation?"
        message="Your progress will be lost. Are you sure you want to cancel?"
        variant="warning"
        confirmText="Yes, Cancel"
        cancelText="Continue Editing"
      />
    </WizardContainer>
  );
}
