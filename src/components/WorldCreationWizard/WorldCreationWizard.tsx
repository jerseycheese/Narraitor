'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { useWizardState, WizardStep as WizardStepType } from '@/hooks/useWizardState';
import { createWizardValidator, WizardStepValidator } from '@/lib/utils/wizardValidation';
import { 
  WizardContainer, 
  WizardProgress, 
  WizardNavigation, 
  WizardStep 
} from '@/components/shared/wizard';
import { ConfirmationDialog } from '@/components/ConfirmationDialog/ConfirmationDialog';
import TemplateStep from './steps/TemplateStep';
import BasicInfoStep from './steps/BasicInfoStep';
import DescriptionStep from './steps/DescriptionStep';
import AttributeReviewStep from './steps/AttributeReviewStep';
import SkillReviewStep from './steps/SkillReviewStep';
import FinalizeStep from './steps/FinalizeStep';
import QuickStartStep from './steps/QuickStartStep';
import { AttributeSuggestion, SkillSuggestion, WIZARD_STEPS } from './WizardState';
import { AIGuidanceSource } from '@/lib/constants/worldGuidance';
import { getTimestamp } from '@/lib/utils';
import { WorldImageGenerator } from '@/lib/ai/worldImageGenerator';
import { analyzeWorldDescriptionClient } from '@/lib/ai/worldAnalyzerClient';
import { Button } from '@/components/ui/button';
import { truncate } from '@/lib/utils';
import { ensureWorldNpcRoster } from '@/lib/services/worldCreationService';

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
  selectedTemplateId?: string | null;
  createOwnWorld?: boolean;
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
    selectedTemplateId: initialData?.selectedTemplateId || null,
    createOwnWorld: initialData?.createOwnWorld || false,
    worldType: initialData?.worldType || 'original',
    // Spread initialData last to ensure external overrides take precedence
    ...initialData,
  }), [initialData]);

  // Create step validators
  const stepValidators = useMemo((): Record<number, WizardStepValidator<WorldCreationData>> => {
    return {
      0: createWizardValidator<WorldCreationData>()
        .customValidation((data) => {
          const isValid = data.selectedTemplateId !== null || data.createOwnWorld === true;
          return {
            valid: isValid,
            errors: isValid ? [] : ['Please select a template or choose to create your own world'],
            touched: true,
          };
        })
        .build(),
      1: createWizardValidator<WorldCreationData>()
        .field('genre')
        .required('World genre is required')
        .build(),
      2: createWizardValidator<WorldCreationData>()
        .field('description')
        .required('World description is required')
        .minLength(50, 'Description must be at least 50 characters')
        .build(),
      3: createWizardValidator<WorldCreationData>()
        .customValidation((data) => {
          if (data.createOwnWorld) {
            return { valid: true, errors: [], touched: true };
          }
          const hasAttributes = (data.attributes?.length || 0) > 0;
          return {
            valid: hasAttributes,
            errors: hasAttributes ? [] : ['At least one attribute is required'],
            touched: true,
          };
        })
        .build(),
      4: createWizardValidator<WorldCreationData>()
        .customValidation((data) => {
          if (data.createOwnWorld) {
            return { valid: true, errors: [], touched: true };
          }
          const hasSkills = (data.skills?.length || 0) > 0;
          return {
            valid: hasSkills,
            errors: hasSkills ? [] : ['At least one skill is required'],
            touched: true,
          };
        })
        .build(),
      5: createWizardValidator<WorldCreationData>().build(), // Finalize step is always valid
      6: createWizardValidator<WorldCreationData>().build(), // Quick start step is always valid
    };
  }, []);

  // Wizard state management
  const wizard = useWizardState<WorldCreationData>({
    initialData: initialWorldData,
    initialStep,
    steps: WIZARD_STEPS,
    onStepValidation: (stepIndex, data) => {
      const validator = stepValidators[stepIndex];
      return validator ? validator.validate(data) : { valid: true, errors: [], touched: true };
    },
  });

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
      console.log('No description provided for AI analysis');
      wizard.setError('ai', 'Add at least a short paragraph (50+ characters) so the AI understands your world.');
      return;
    }
    
    console.log('Starting AI suggestion generation for description:', truncate(description, 100));
    wizard.setProcessing(true);
    wizard.clearError('ai');

    try {
      console.log('Calling analyzeWorldDescriptionClient...');
      const suggestions = await analyzeWorldDescriptionClient(description);
      console.log('AI suggestions received:', {
        attributeCount: suggestions.attributes.length,
        skillCount: suggestions.skills.length,
        firstAttribute: suggestions.attributes[0]?.name
      });
      
      wizard.updateData({ 
        aiSuggestions: suggestions,
        aiSuggestionsGenerated: true,
        aiSuggestionMeta: buildSuggestionMeta(description, 'ai'),
      });
      console.log('AI suggestions successfully applied to wizard state');
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      console.log('Falling back to default suggestions due to error');
      
      // Use default suggestions as fallback
      const defaultSuggestions = getDefaultSuggestions();
      wizard.updateData({ 
        aiSuggestions: defaultSuggestions,
        aiSuggestionsGenerated: true,
        aiSuggestionMeta: buildSuggestionMeta(description, 'fallback'),
      });
      wizard.setError(
        'ai',
        'We had trouble reaching the AI service, so we loaded starter suggestions. You can generate again once the service recovers.'
      );

      console.log('Default suggestions applied as fallback');
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

  const handleNext = useCallback(async (createOwnWorld?: boolean) => {
    // Handle special case for step 0 where createOwnWorld might be passed
    if (wizard.state.currentStep === 0 && createOwnWorld !== undefined) {
      wizard.updateData({ createOwnWorld });
    }
    
    // Special handling for step 2 (Description step) when creating own world
    if (wizard.state.currentStep === 2 && wizard.state.data.createOwnWorld && !wizard.state.data.aiSuggestionsGenerated) {
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

  const handleComplete = useCallback(async () => {
    const data = wizard.state.data;
    
    // If we already have a created world, just proceed to quick start
    if (data.createdWorldId) {
      wizard.goNext(); // Move to quick start step
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
      console.log('[WorldCreationWizard] Set newly created world as active:', worldId);

      // Store the world ID in wizard state
      wizard.updateData({ createdWorldId: worldId });

      // Generate character templates asynchronously after creation
      const generateTemplates = async () => {
        try {
          const { generateCharacterTemplates } = useWorldStore.getState();
          await generateCharacterTemplates(worldId);
          console.log('[WorldCreationWizard] Generated character templates for world:', worldId);
        } catch (error) {
          console.error('[WorldCreationWizard] Failed to generate character templates:', error);
          // Don't block world creation if template generation fails
        }
      };

      // Start template generation in the background
      generateTemplates();

      // Generate world image asynchronously after creation (only if no image was already generated)
      if (!data.image?.url) {
        const generateWorldImage = async () => {
          try {
            const imageGenerator = new WorldImageGenerator();

            // Get the created world from store
            const world = useWorldStore.getState().worlds[worldId];
            
            if (world) {
              const image = await imageGenerator.generateWorldImage(world);
              // Update the world with the generated image
              useWorldStore.getState().updateWorld(worldId, { image });
            }
          } catch (error) {
            console.error('[WorldCreationWizard] Failed to generate world image:', error);
            // Don't block world creation if image generation fails
          }
        };
        
        // Start image generation in the background
        generateWorldImage();
      }
      
      // Save to localStorage as temporary solution
      if (typeof window !== 'undefined') {
        const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
        worlds.push({
          id: worldId,
          name: data.name,
          genre: data.genre,
          description: data.description,
          createdAt: getTimestamp(),
          attributes: data.attributes || [],
          skills: data.skills || [],
          image: data.image,
        });
        localStorage.setItem('worlds', JSON.stringify(worlds));
      }

      void ensureWorldNpcRoster(worldId);

      // Move to quick start step instead of completing
      wizard.goNext();
    } catch {
      // Fallback error handling
      const worldId = `world-${Date.now()}`;
      if (typeof window !== 'undefined') {
        const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
        worlds.push({
          id: worldId,
          name: data.name,
          genre: data.genre,
          description: data.description,
          createdAt: getTimestamp(),
          attributes: data.attributes || [],
          skills: data.skills || [],
          image: data.image,
        });
        localStorage.setItem('worlds', JSON.stringify(worlds));
      }
      
      // Store the world ID and move to quick start
      wizard.updateData({ createdWorldId: worldId });
      wizard.goNext();
    }
  }, [wizard, createWorld]);

  const updateWorldData = useCallback((updates: Partial<World>) => {
    wizard.updateData(updates);
  }, [wizard]);

  const updateWizardState = useCallback((updates: Partial<WorldCreationData>) => {
    wizard.updateData(updates);
  }, [wizard]);

  const stepProps = {
    worldData: wizard.state.data,
    errors: wizard.state.errors || {},
    onUpdate: updateWorldData,
  };

  const handleQuickStartComplete = useCallback(() => {
    const worldId = wizard.state.data.createdWorldId;
    if (onComplete && worldId) {
      onComplete(worldId);
    } else {
      router.push('/worlds');
    }
  }, [wizard.state.data.createdWorldId, onComplete, router]);

  const handleCustomizeCharacter = useCallback(() => {
    const worldId = wizard.state.data.createdWorldId;
    if (worldId) {
      router.push(`/characters/create?worldId=${worldId}`);
    }
  }, [wizard.state.data.createdWorldId, router]);

  const renderCurrentStep = () => {
    switch (wizard.state.currentStep) {
      case 0:
        return (
          <TemplateStep
            selectedTemplateId={wizard.state.data.selectedTemplateId}
            onUpdate={updateWizardState}
            onComplete={handleNext}
            onCancel={handleCancel}
            errors={wizard.state.errors || {}}
          />
        );
      case 1:
        return <BasicInfoStep {...stepProps} />;
      case 2:
        return (
          <DescriptionStep
            {...stepProps}
            isProcessing={wizard.state.isProcessing || false}
            aiSuggestions={wizard.state.data.aiSuggestions}
            suggestionMeta={wizard.state.data.aiSuggestionMeta}
            canGenerateSuggestions
            onGenerateSuggestions={generateAISuggestions}
          />
        );
      case 3:
        return (
          <AttributeReviewStep
            {...stepProps}
            suggestions={wizard.state.data.aiSuggestions?.attributes || []}
            onClearSuggestions={clearAISuggestions}
          />
        );
      case 4:
        return (
          <SkillReviewStep
            {...stepProps}
            suggestions={wizard.state.data.aiSuggestions?.skills || []}
            onClearSuggestions={clearAISuggestions}
          />
        );
      case 5:
        return (
          <FinalizeStep
            {...stepProps}
            onComplete={handleComplete}
            onBack={handleBack}
            onCancel={handleCancel}
            onUpdateWorldData={updateWorldData}
          />
        );
      case 6:
        // Quick Start Step
        const createdWorld = wizard.state.data.createdWorldId 
          ? useWorldStore.getState().worlds[wizard.state.data.createdWorldId]
          : null;
        
        if (!createdWorld) {
          // Fallback if world not found
          return (
            <div className="text-center py-12">
              <p className="text-destructive">Error: World not found. Please try creating the world again.</p>
              <Button onClick={handleBack} variant="link" className="mt-4 p-0 h-auto">
                Go Back
              </Button>
            </div>
          );
        }
        
        return (
          <QuickStartStep
            world={createdWorld}
            onBack={handleBack}
            onComplete={handleQuickStartComplete}
            onCustomizeCharacter={handleCustomizeCharacter}
          />
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
        
        {/* Hide main navigation on template step (0), finalize step (5), and quick start step (6) since they have their own navigation */}
        {wizard.state.currentStep > 0 && wizard.state.currentStep < WIZARD_STEPS.length - 2 && (
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
