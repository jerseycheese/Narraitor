'use client';

import React, { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { World } from '@/types/world.types';
import { useWizardState, WizardStep as WizardStepType } from '@/hooks/useWizardState';
import { createWizardValidator, WizardStepValidator } from '@/lib/utils/wizardValidation';
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
import { AttributeSuggestion, SkillSuggestion, WIZARD_STEPS } from './WizardState';
import { createAIClient } from '@/lib/ai';
import { WorldImageGenerator } from '@/lib/ai/worldImageGenerator';

export type { AttributeSuggestion, SkillSuggestion };

interface WorldCreationData extends Partial<World> {
  aiSuggestions?: {
    attributes: AttributeSuggestion[];
    skills: SkillSuggestion[];
  };
  selectedTemplateId?: string | null;
  createOwnWorld?: boolean;
}

export interface WorldCreationWizardProps {
  onComplete?: (worldId: string) => void;
  onCancel?: () => void;
  initialStep?: number;
  initialData?: Partial<WorldCreationData>;
}

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
    selectedTemplateId: initialData?.selectedTemplateId || null,
    createOwnWorld: initialData?.createOwnWorld || false,
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
        .field('name')
        .required('World name is required')
        .field('theme')
        .required('World theme is required')
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

  const canProceedToNext = useCallback((): boolean => {
    const currentValidation = wizard.state.validation[wizard.state.currentStep];
    return !currentValidation || currentValidation.valid;
  }, [wizard.state.validation, wizard.state.currentStep]);

  const generateAISuggestions = useCallback(async () => {
    if (!wizard.state.data.description) return;
    
    try {
      wizard.setProcessing(true);
      const { analyzeWorldDescriptionClient } = await import('@/lib/ai/worldAnalyzerClient');
      const suggestions = await analyzeWorldDescriptionClient(wizard.state.data.description);
      wizard.updateData({ aiSuggestions: suggestions });
      wizard.setProcessing(false);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Use default suggestions as fallback
      wizard.updateData({ aiSuggestions: getDefaultSuggestions() });
      wizard.setProcessing(false);
    }
  }, [wizard]);

  const handleNext = useCallback(async (createOwnWorld?: boolean) => {
    // Handle special case for step 0 where createOwnWorld might be passed
    if (wizard.state.currentStep === 0 && createOwnWorld !== undefined) {
      wizard.updateData({ createOwnWorld });
    }
    
    // Special handling for step 2 (Description step) when creating own world
    if (wizard.state.currentStep === 2 && wizard.state.data.createOwnWorld && !wizard.state.data.aiSuggestions) {
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
      { name: 'Combat', description: 'Ability to fight effectively', difficulty: 'medium' as const, category: 'Combat', linkedAttributeName: 'Strength', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'hard' as const, category: 'Physical', linkedAttributeName: 'Agility', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Perception', description: 'Noticing details and dangers', difficulty: 'easy' as const, category: 'Mental', linkedAttributeName: 'Intelligence', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
    ],
  });

  const handleBack = useCallback(() => {
    wizard.goBack();
  }, [wizard]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/worlds');
    }
  }, [onCancel, router]);

  const handleComplete = useCallback(async () => {
    const data = wizard.state.data;
    try {
      // Create the world first
      const worldId = createWorld({
        name: data.name!,
        description: data.description!,
        theme: data.theme!,
        attributes: data.attributes || [],
        skills: data.skills || [],
        settings: data.settings!,
        image: data.image, // Include any image if already generated
      });
      
      // Set the newly created world as the active world
      const { setCurrentWorld } = useWorldStore.getState();
      setCurrentWorld(worldId);
      console.log('[WorldCreationWizard] Set newly created world as active:', worldId);
      
      // Generate world image asynchronously after creation (only if no image was already generated)
      if (!data.image?.url) {
        const generateWorldImage = async () => {
          try {
            const aiClient = createAIClient();
            const imageGenerator = new WorldImageGenerator(aiClient);
            
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
          theme: data.theme,
          description: data.description,
          createdAt: new Date().toISOString(),
          attributes: data.attributes || [],
          skills: data.skills || [],
          image: data.image,
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
          name: data.name,
          theme: data.theme,
          description: data.description,
          createdAt: new Date().toISOString(),
          attributes: data.attributes || [],
          skills: data.skills || [],
          image: data.image,
        });
        localStorage.setItem('worlds', JSON.stringify(worlds));
      }
      
      if (onComplete) {
        onComplete(worldId);
      } else {
        router.push('/worlds');
      }
    }
  }, [wizard.state.data, createWorld, onComplete, router]);

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
          />
        );
      case 3:
        return (
          <AttributeReviewStep
            {...stepProps}
            suggestions={wizard.state.data.aiSuggestions?.attributes || []}
          />
        );
      case 4:
        return (
          <SkillReviewStep
            {...stepProps}
            suggestions={wizard.state.data.aiSuggestions?.skills || []}
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
      <div data-testid="wizard-container">
        <WizardProgress 
          steps={steps} 
          currentStep={wizard.state.currentStep}
        />
        
        <WizardStep error={currentError}>
          <div data-testid="wizard-content">
            {renderCurrentStep()}
          </div>
        </WizardStep>
        
        {/* Hide main navigation on template step (0) and finalize step (5) since they have their own navigation */}
        {wizard.state.currentStep > 0 && wizard.state.currentStep < WIZARD_STEPS.length - 1 && (
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
    </WizardContainer>
  );
}
