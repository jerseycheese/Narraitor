'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldStore } from '@/state/worldStore';
import { WizardContainer } from '@/components/shared/wizard/WizardContainer';
import { useWizardFlow } from '@/components/shared/wizard/hooks/useWizardFlow';
import {
  validators,
  validateField,
} from '@/components/shared/wizard/utils/validation';
import { GENRES } from '@/lib/constants/genres';
import type { GenreValue } from '@/types/genre.types';
import {
  WorldTypeSelector,
  WorldTypeData,
  convertToGenerationParams,
  validateWorldTypeData,
} from '@/components/shared/WorldTypeSelector';
import { worldCreationService } from '@/lib/services/worldCreationService';
import { ConfirmationDialog } from '@/components/ConfirmationDialog/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import Logger from '@/lib/utils/logger';
const logger = new Logger('GuidedFirstTimeExperience');

const GUIDED_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'concept', label: 'World Concept' },
  { id: 'details', label: 'World Details' },
];

interface OnboardingData {
  name: string;
  genre: GenreValue | '';
  worldTypeData: WorldTypeData;
  description?: string;
}

export function GuidedFirstTimeExperience() {
  const router = useRouter();
  const updateTutorialProgress = useSessionStore(
    (state) => state.updateTutorialProgress
  );
  const completeTutorialPhase = useSessionStore(
    (state) => state.completeTutorialPhase
  );
  const { setCurrentWorld } = useWorldStore();

  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    pendingData: WorldTypeData | null;
  }>({ isOpen: false, pendingData: null });

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
        const genreValidators = isGenreOptional
          ? []
          : [(value: string) => validators.required(value, 'Genre')];
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
  const handleComplete = useCallback(
    async (data: OnboardingData) => {
      try {
        // Get existing world names to avoid duplicates
        const { worlds } = useWorldStore.getState();
        const existingNames = Object.values(worlds).map((world) => world.name);

        // Use the AI world generator to create a complete world from the concept
        const { generateWorld } = await import(
          '@/lib/generators/worldGenerator'
        );

        // Use the abstracted conversion function
        const { reference, relationship, additionalContext } =
          convertToGenerationParams(data.worldTypeData);

        const generatedWorldData = await generateWorld({
          method: 'ai',
          reference,
          relationship,
          existingNames,
          suggestedName: data.name?.trim() || undefined,
          genre: data.genre || undefined,
          additionalContext,
        });

        const { worldId } =
          await worldCreationService.createWorldFromGeneration({
            generatedData: generatedWorldData,
            customizations: {
              name: data.name,
              genre: data.genre || undefined,
              description: data.description,
            },
          });

        setCurrentWorld(worldId);

        // Mark onboarding as completed
        completeTutorialPhase('intro');

        // Navigate to character creation to continue the flow
        router.push(`/characters/create?worldId=${worldId}`);
      } catch (error) {
        logger.error('Error completing onboarding:', error);
        throw error; // Re-throw to let wizard handle it
      }
    },
    [setCurrentWorld, completeTutorialPhase, router]
  );

  // Handle skip
  const handleSkip = useCallback(() => {
    updateTutorialProgress('intro', { skipped: true });
    router.push('/worlds');
  }, [updateTutorialProgress, router]);

  // Initialize wizard state
  const wizard = useWizardFlow({
    steps: GUIDED_STEPS,
    initialData: {
      name: '',
      genre: 'fantasy',
      worldTypeData: {
        worldType: 'original',
        worldReference: '',
        additionalDetails: '',
      },
    },
    onComplete: handleComplete,
    onCancel: handleSkip,
    validateStep,
    persistKey: 'narraitor-onboarding',
  });

  // Memoized render functions for performance
  const renderWelcomeStep = useMemo(
    () => (
      <div
        className="component-guided-first-time-welcome"
        data-testid="guided-experience-container"
      >
        <div className="component-guided-first-time-welcome-lede">
          <p>Create a world and start a story</p>
        </div>

        {/* How it Works */}
        <section className="component-guided-first-time-steps">
          <div
            className="component-guided-first-time-steps-list"
            role="list"
            aria-label="Steps to get started"
          >
            <div
              className="component-guided-first-time-step-item"
              role="listitem"
            >
              <div
                className="component-guided-first-time-step-num"
                aria-hidden="true"
              >
                1
              </div>
              <h4 className="component-guided-first-time-step-heading">
                Build a world
              </h4>
              <p className="component-guided-first-time-step-copy">
                Describe a setting and its rules, or generate one to start from.
              </p>
            </div>
            <div
              className="component-guided-first-time-step-item"
              role="listitem"
            >
              <div
                className="component-guided-first-time-step-num"
                aria-hidden="true"
              >
                2
              </div>
              <h4 className="component-guided-first-time-step-heading">
                Create a character
              </h4>
              <p className="component-guided-first-time-step-copy">
                Shape who you play, with real skills the story leans on.
              </p>
            </div>
            <div
              className="component-guided-first-time-step-item"
              role="listitem"
            >
              <div
                className="component-guided-first-time-step-num"
                aria-hidden="true"
              >
                3
              </div>
              <h4 className="component-guided-first-time-step-heading">
                Play the story
              </h4>
              <p className="component-guided-first-time-step-copy">
                Make choices and watch the story bend around them.
              </p>
            </div>
          </div>
        </section>
      </div>
    ),
    []
  );

  const renderConceptStep = useMemo(
    () => (
      <div className="component-guided-first-time-concept">
        <div className="component-guided-first-time-step-header">
          <h2 className="component-guided-first-time-step-title">
            World Concept
          </h2>
          <p className="component-guided-first-time-step-description">
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

            if (shouldAutoDetectGenre && wizard.state.data.genre) {
              setConfirmationState({
                isOpen: true,
                pendingData: worldTypeData,
              });
            } else {
              wizard.handlers.updateData({
                worldTypeData,
                ...(shouldAutoDetectGenre && { genre: '' }),
              });
            }
          }}
        />

        {/* Validation Errors */}
        {wizard.stepValidation?.errors.length > 0 && (
          <div>
            {wizard.stepValidation.errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
      </div>
    ),
    [
      wizard.state.data.worldTypeData,
      wizard.state.data.genre,
      wizard.stepValidation,
      wizard.handlers,
    ]
  );

  const renderDetailsStep = useMemo(() => {
    const isSetWithin =
      wizard.state.data.worldTypeData.worldType === 'set_within';
    const isInspiredBy =
      wizard.state.data.worldTypeData.worldType === 'inspired_by';
    const isGenreOptional = isSetWithin || isInspiredBy;

    return (
      <div className="component-guided-first-time-details">
        <div className="component-guided-first-time-step-header">
          <h2 className="component-guided-first-time-step-title">
            World Details
          </h2>
          <p className="component-guided-first-time-step-description">
            {isGenreOptional
              ? 'Give your world a name and optionally override the genre'
              : 'Give your world a name and genre'}
          </p>
        </div>

        <div>
          <div>
            <Label htmlFor="world-name">World Name (optional)</Label>
            <Input
              id="world-name"
              type="text"
              placeholder="E.g., Neo-Tokyo..."
              value={wizard.state.data.name}
              onChange={(e) =>
                wizard.handlers.updateData({ name: e.target.value })
              }
            />
          </div>

          {isGenreOptional ? (
            <div>
              <Label htmlFor="world-genre">
                Genre{' '}
                <span>(optional - will be inferred from your reference)</span>
              </Label>
              <select
                id="world-genre"
                value={wizard.state.data.genre}
                onChange={(e) =>
                  wizard.handlers.updateData({
                    genre: e.target.value as GenreValue,
                  })
                }
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
              <Label htmlFor="world-genre">
                Genre <span>*</span>
              </Label>
              <select
                id="world-genre"
                value={wizard.state.data.genre}
                onChange={(e) =>
                  wizard.handlers.updateData({
                    genre: e.target.value as GenreValue | '',
                  })
                }
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
            <div>
              {wizard.stepValidation.errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }, [
    wizard.state.data.name,
    wizard.state.data.genre,
    wizard.state.data.worldTypeData.worldType,
    wizard.stepValidation,
    wizard.handlers,
  ]);

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
  }, [
    wizard.currentStep,
    renderWelcomeStep,
    renderConceptStep,
    renderDetailsStep,
  ]);

  const handleConfirmGenreChange = useCallback(() => {
    if (confirmationState.pendingData) {
      wizard.handlers.updateData({
        worldTypeData: confirmationState.pendingData,
        genre: '',
      });
      setConfirmationState({ isOpen: false, pendingData: null });
    }
  }, [confirmationState.pendingData, wizard.handlers]);

  return (
    <WizardContainer
      title="First time?"
      className="component-guided-first-time"
    >
      <div className="component-guided-first-time-wrapper">
        <div className="component-guided-first-time-step">
          {renderCurrentStep()}
        </div>

        <div className="component-guided-first-time-nav">
          <div className="component-guided-first-time-nav-row">
            {!wizard.isFirstStep && (
              <Button onClick={wizard.handlers.handleBack} variant="outline">
                Back
              </Button>
            )}

            {wizard.isLastStep ? (
              <Button
                onClick={wizard.handlers.handleComplete}
                disabled={
                  !wizard.stepValidation?.valid || wizard.state.isProcessing
                }
                variant="success"
              >
                {wizard.state.isProcessing
                  ? 'Creating world...'
                  : 'Create world'}
              </Button>
            ) : (
              <Button
                onClick={wizard.handlers.handleNext}
                disabled={!wizard.stepValidation?.valid}
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Skip option */}
        <div className="component-guided-first-time-skip">
          <Button onClick={wizard.handlers.handleCancel} variant="link">
            Skip for now
          </Button>
        </div>

        {wizard.currentError && (
          <div className="component-guided-first-time-error">
            <p>{wizard.currentError}</p>
          </div>
        )}

        <ConfirmationDialog
          isOpen={confirmationState.isOpen}
          onClose={() =>
            setConfirmationState({ isOpen: false, pendingData: null })
          }
          onConfirm={handleConfirmGenreChange}
          title="Clear Genre?"
          message="Changing the world type will clear your selected genre, as it will be inferred from the reference. Do you want to continue?"
          variant="warning"
          confirmText="Yes, change type"
        />
      </div>
    </WizardContainer>
  );
}
