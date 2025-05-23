'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { analyzeWorldDescription } from '@/lib/ai/worldAnalyzer';
import { AttributeSuggestion, SkillSuggestion } from '../WorldCreationWizard';
import { 
  wizardStyles,
  WizardFormGroup,
  WizardTextArea,
  WizardFormSection
} from '@/components/shared/wizard';

interface DescriptionStepProps {
  worldData: Partial<World>;
  errors: Record<string, string>;
  isProcessing: boolean;
  onUpdate: (updates: Partial<World>) => void;
  setAISuggestions: (suggestions: { attributes: AttributeSuggestion[]; skills: SkillSuggestion[] }) => void;
  setProcessing: (processing: boolean) => void;
  setError: (field: string, message: string) => void;
  onComplete: () => void;
}

export default function DescriptionStep({
  worldData,
  errors,
  isProcessing,
  onUpdate,
  setAISuggestions,
  setProcessing,
  setError,
  onComplete,
}: DescriptionStepProps) {
  const MAX_DESCRIPTION_LENGTH = 3000;
  const MIN_DESCRIPTION_LENGTH = 50;

  const handleGenerateSuggestions = async () => {
    if (!worldData.description || worldData.description.length < MIN_DESCRIPTION_LENGTH) {
      setError('description', `Please provide at least ${MIN_DESCRIPTION_LENGTH} characters to generate suggestions.`);
      return;
    }

    setProcessing(true);
    setError('description', '');
    
    try {
      const suggestions = await analyzeWorldDescription(worldData.description);
      setAISuggestions(suggestions);
      onComplete(); // Move to next step after generating suggestions
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError('ai', 'Failed to generate suggestions. You can continue manually or try again.');
      // Fallback to default suggestions
      setAISuggestions(getDefaultSuggestions());
    } finally {
      setProcessing(false);
    }
  };

  // Removed handleDescriptionChange as it's now handled inline

  const getDefaultSuggestions = (): { attributes: AttributeSuggestion[]; skills: SkillSuggestion[] } => ({
    attributes: [
      { name: 'Strength', description: 'Physical power and endurance', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: true },
      { name: 'Intelligence', description: 'Mental acuity and reasoning', minValue: 1, maxValue: 10, baseValue: 7, category: 'Mental', accepted: true },
      { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: true },
      { name: 'Charisma', description: 'Social influence and charm', minValue: 1, maxValue: 10, baseValue: 4, category: 'Social', accepted: true },
      { name: 'Dexterity', description: 'Hand-eye coordination and precision', minValue: 1, maxValue: 10, baseValue: 5, category: 'Physical', accepted: true },
      { name: 'Constitution', description: 'Health and stamina', minValue: 1, maxValue: 10, baseValue: 6, category: 'Physical', accepted: true },
    ],
    skills: [
      { name: 'Combat', description: 'Ability to fight effectively', difficulty: 'medium', category: 'Combat', linkedAttributeName: 'Strength', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'hard', category: 'Physical', linkedAttributeName: 'Agility', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Perception', description: 'Noticing details and dangers', difficulty: 'easy', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Persuasion', description: 'Convincing others to agree', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Charisma', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Investigation', description: 'Finding clues and solving mysteries', difficulty: 'medium', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Athletics', description: 'Running, jumping, and climbing', difficulty: 'easy', category: 'Physical', linkedAttributeName: 'Strength', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Medicine', description: 'Healing wounds and treating ailments', difficulty: 'hard', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Survival', description: 'Finding food and shelter in the wild', difficulty: 'medium', category: 'Physical', linkedAttributeName: 'Constitution', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Arcana', description: 'Understanding magical theory and practice', difficulty: 'hard', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Deception', description: 'Lying and misleading others', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Charisma', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Intimidation', description: 'Frightening or coercing others', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Strength', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
      { name: 'Performance', description: 'Entertainment and artistic expression', difficulty: 'easy', category: 'Social', linkedAttributeName: 'Charisma', accepted: true, baseValue: 5, minValue: 1, maxValue: 10 },
    ],
  });

  const descriptionLength = worldData.description?.length || 0;

  return (
    <div data-testid="description-step">
      <WizardFormSection
        title="Describe Your World"
        description="Provide a detailed description of your world. Include information about the setting, tone, major themes, and any unique aspects. This will help us suggest appropriate attributes and skills."
      >
        <WizardFormGroup label="Full Description" error={errors.description} required>
          <WizardTextArea
            value={worldData.description || ''}
            onChange={(value) => {
              if (value.length <= MAX_DESCRIPTION_LENGTH) {
                onUpdate({ ...worldData, description: value });
              }
            }}
            placeholder="Describe your world in detail..."
            rows={12}
            error={errors.description}
            disabled={isProcessing}
            testId="world-full-description"
          />
          <div className="text-right text-sm mt-1" data-testid="description-char-count">
            {descriptionLength} / {MAX_DESCRIPTION_LENGTH} characters
          </div>
        </WizardFormGroup>
      </WizardFormSection>

      {errors.ai && (
        <div className="p-4 mb-4 bg-yellow-100 text-yellow-800 rounded" data-testid="ai-warning">
          {errors.ai}
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10" data-testid="processing-overlay">
          <div className="bg-white p-8 rounded text-center shadow">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mx-auto mb-4" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p aria-live="polite">Analyzing your world description...</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleGenerateSuggestions}
          disabled={isProcessing || descriptionLength < MIN_DESCRIPTION_LENGTH}
          className={`${wizardStyles.navigation.primaryButton} ${
            isProcessing || descriptionLength < MIN_DESCRIPTION_LENGTH 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
          data-testid="generate-suggestions-button"
        >
          {isProcessing ? 'Generating...' : 'Generate AI Suggestions'}
        </button>
      </div>

    </div>
  );
}