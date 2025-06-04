'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sessionStore } from '@/state/sessionStore';
import { WorldSelectionStep } from './steps/WorldSelectionStep';
import { CharacterSelectionStep } from './steps/CharacterSelectionStep';
import { GameReadyStep } from './steps/GameReadyStep';

export interface GameStartWizardProps {
  initialWorldId?: string;
  initialCharacterId?: string;
  onCancel?: () => void;
}

type WizardStep = 'world' | 'character' | 'ready';

export function GameStartWizard({
  initialWorldId,
  initialCharacterId,
  onCancel
}: GameStartWizardProps) {
  const router = useRouter();
  const { initializeSession } = sessionStore();

  // Determine initial step based on props
  const getInitialStep = (): WizardStep => {
    if (initialWorldId && initialCharacterId) return 'ready';
    if (initialWorldId) return 'character';
    return 'world';
  };

  const [currentStep, setCurrentStep] = useState<WizardStep>(getInitialStep());
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(initialWorldId || null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(initialCharacterId || null);
  const [isStarting, setIsStarting] = useState(false);

  const handleWorldSelect = (worldId: string) => {
    setSelectedWorldId(worldId);
    setCurrentStep('character');
  };

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setCurrentStep('ready');
  };

  const handleStartGame = async () => {
    if (!selectedWorldId || !selectedCharacterId) return;

    setIsStarting(true);
    initializeSession(selectedWorldId, selectedCharacterId, () => {
      router.push('/play');
    });
  };

  const handleBack = () => {
    if (currentStep === 'character') {
      setCurrentStep('world');
      setSelectedCharacterId(null);
    } else if (currentStep === 'ready') {
      setCurrentStep('character');
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'world': return 1;
      case 'character': return 2;
      case 'ready': return 3;
      default: return 1;
    }
  };

  const getStepLabel = () => {
    switch (currentStep) {
      case 'world': return 'Select World';
      case 'character': return 'Select Character';
      case 'ready': return 'Ready to Play';
      default: return '';
    }
  };

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
            Step {getStepNumber()} of 3: {getStepLabel()}
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(getStepNumber() / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {currentStep === 'world' && (
          <WorldSelectionStep 
            onNext={handleWorldSelect}
          />
        )}
        
        {currentStep === 'character' && selectedWorldId && (
          <CharacterSelectionStep 
            worldId={selectedWorldId}
            onNext={handleCharacterSelect}
            onBack={handleBack}
          />
        )}
        
        {currentStep === 'ready' && selectedWorldId && selectedCharacterId && (
          <GameReadyStep
            worldId={selectedWorldId}
            characterId={selectedCharacterId}
            onStart={handleStartGame}
            onBack={handleBack}
            isStarting={isStarting}
          />
        )}
      </div>
    </div>
  );
}
