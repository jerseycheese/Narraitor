'use client';

import React, { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/state/sessionStore';
import { useWizardState, WizardStep as WizardStepType } from '@/hooks/useWizardState';
import { createWizardValidator, WizardStepValidator } from '@/lib/utils/wizardValidation';
import { WorldSelectionStep } from './steps/WorldSelectionStep';
import { CharacterSelectionStep } from './steps/CharacterSelectionStep';
import { GameReadyStep } from './steps/GameReadyStep';

export interface GameStartWizardProps {
  initialWorldId?: string;
  initialCharacterId?: string;
  onCancel?: () => void;
}

interface GameStartData {
  selectedWorldId: string | null;
  selectedCharacterId: string | null;
  isStarting: boolean;
}

const gameStartSteps: WizardStepType[] = [
  { id: 'world', label: 'Select World' },
  { id: 'character', label: 'Select Character' },
  { id: 'ready', label: 'Ready to Play' }
];

export function GameStartWizard({
  initialWorldId,
  initialCharacterId,
  onCancel
}: GameStartWizardProps) {
  const router = useRouter();
  const { initializeSession } = useSessionStore();

  // Determine initial step based on props
  const getInitialStep = (): number => {
    if (initialWorldId && initialCharacterId) return 2; // ready
    if (initialWorldId) return 1; // character
    return 0; // world
  };

  // Initialize game start data
  const initialGameData: GameStartData = useMemo(() => ({
    selectedWorldId: initialWorldId || null,
    selectedCharacterId: initialCharacterId || null,
    isStarting: false,
  }), [initialWorldId, initialCharacterId]);

  // Create step validators
  const stepValidators = useMemo((): Record<number, WizardStepValidator<GameStartData>> => {
    return {
      0: createWizardValidator<GameStartData>()
        .customValidation((data) => ({
          valid: !!data.selectedWorldId,
          errors: data.selectedWorldId ? [] : ['Please select a world'],
          touched: true,
        }))
        .build(),
      1: createWizardValidator<GameStartData>()
        .customValidation((data) => ({
          valid: !!data.selectedCharacterId,
          errors: data.selectedCharacterId ? [] : ['Please select a character'],
          touched: true,
        }))
        .build(),
      2: createWizardValidator<GameStartData>().build(), // Ready step is always valid
    };
  }, []);

  // Wizard state management
  const wizard = useWizardState<GameStartData>({
    initialData: initialGameData,
    initialStep: getInitialStep(),
    steps: gameStartSteps,
    onStepValidation: (stepIndex, data) => {
      const validator = stepValidators[stepIndex];
      return validator ? validator.validate(data) : { valid: true, errors: [], touched: true };
    },
  });

  const handleWorldSelect = useCallback((worldId: string) => {
    wizard.updateData({ selectedWorldId: worldId });
    wizard.goNext();
  }, [wizard]);

  const handleCharacterSelect = useCallback((characterId: string) => {
    wizard.updateData({ selectedCharacterId: characterId });
    wizard.goNext();
  }, [wizard]);

  const handleStartGame = useCallback(async () => {
    const data = wizard.state.data;
    if (!data.selectedWorldId || !data.selectedCharacterId) return;

    wizard.updateData({ isStarting: true });
    initializeSession(data.selectedWorldId, data.selectedCharacterId, () => {
      router.push('/play');
    });
  }, [wizard, initializeSession, router]);

  const handleBack = useCallback(() => {
    // Clear relevant data when going back
    if (wizard.state.currentStep === 1) {
      // Going back from character selection to world selection, clear character selection
      wizard.updateData({ selectedCharacterId: null });
    } else if (wizard.state.currentStep === 2) {
      // Going back from game ready to character selection, no need to clear anything
      // The character selection should remain
    }
    wizard.goBack();
  }, [wizard]);

  const currentStepConfig = gameStartSteps[wizard.state.currentStep] || gameStartSteps[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Start Your Adventure</h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Cancel"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Step {wizard.state.currentStep + 1} of {gameStartSteps.length}: {currentStepConfig.label}
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((wizard.state.currentStep + 1) / gameStartSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {wizard.state.currentStep === 0 && (
          <WorldSelectionStep 
            onNext={handleWorldSelect}
          />
        )}
        
        {wizard.state.currentStep === 1 && wizard.state.data.selectedWorldId && (
          <CharacterSelectionStep 
            worldId={wizard.state.data.selectedWorldId}
            onNext={handleCharacterSelect}
            onBack={handleBack}
          />
        )}
        
        {wizard.state.currentStep === 2 && wizard.state.data.selectedWorldId && wizard.state.data.selectedCharacterId && (
          <GameReadyStep
            worldId={wizard.state.data.selectedWorldId}
            characterId={wizard.state.data.selectedCharacterId}
            onStart={handleStartGame}
            onBack={handleBack}
            isStarting={wizard.state.data.isStarting}
          />
        )}
      </div>
    </div>
  );
}
