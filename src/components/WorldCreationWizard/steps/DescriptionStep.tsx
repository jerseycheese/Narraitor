'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { analyzeWorldDescription } from '@/lib/ai/worldAnalyzer';
import { AttributeSuggestion, SkillSuggestion } from '../WorldCreationWizard';

interface DescriptionStepProps {
  worldData: Partial<World>;
  errors: Record<string, string>;
  isProcessing: boolean;
  onUpdate: (updates: Partial<World>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
  setAISuggestions: (suggestions: { attributes: AttributeSuggestion[]; skills: SkillSuggestion[] }) => void;
  setProcessing: (processing: boolean) => void;
  setError: (field: string, message: string) => void;
}

export default function DescriptionStep({
  worldData,
  errors,
  isProcessing,
  onUpdate,
  onNext,
  onBack,
  onCancel,
  setAISuggestions,
  setProcessing,
  setError,
}: DescriptionStepProps) {
  const MAX_DESCRIPTION_LENGTH = 3000;
  const MIN_DESCRIPTION_LENGTH = 50;

  const validateAndNext = async () => {
    const description = worldData.description || '';
    
    // Validation
    if (description.length < MIN_DESCRIPTION_LENGTH) {
      setError('description', 'Please provide a more detailed description (at least 50 characters)');
      return;
    }
    
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError('description', 'Description must be less than 3000 characters');
      return;
    }

    // Clear any previous errors
    setError('description', '');

    // Start AI processing
    setProcessing(true);
    console.log('Starting AI analysis...');
    console.log('API key exists:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);

    try {
      // Call AI analyzer
      const suggestions = await analyzeWorldDescription(description);
      console.log('AI suggestions received:', suggestions);
      setAISuggestions(suggestions);
      onNext();
    } catch (error) {
      // Handle AI failure with fallback
      console.error('AI analysis error:', error);
      setError('ai', 'AI suggestions unavailable. Providing default options.');
      
      // Provide default suggestions
      const defaultSuggestions = getDefaultSuggestions();
      setAISuggestions(defaultSuggestions);
      onNext(); // Still proceed to the next step even if AI fails
    } finally {
      setProcessing(false);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const description = e.target.value;
    if (description.length <= MAX_DESCRIPTION_LENGTH) {
      onUpdate({ ...worldData, description });
    }
  };

  const getDefaultSuggestions = (): { attributes: AttributeSuggestion[]; skills: SkillSuggestion[] } => ({
    attributes: [
      { name: 'Strength', description: 'Physical power and endurance', minValue: 1, maxValue: 10, category: 'Physical', accepted: false },
      { name: 'Intelligence', description: 'Mental acuity and reasoning', minValue: 1, maxValue: 10, category: 'Mental', accepted: false },
      { name: 'Agility', description: 'Speed and dexterity', minValue: 1, maxValue: 10, category: 'Physical', accepted: false },
      { name: 'Charisma', description: 'Social influence and charm', minValue: 1, maxValue: 10, category: 'Social', accepted: false },
      { name: 'Dexterity', description: 'Hand-eye coordination and precision', minValue: 1, maxValue: 10, category: 'Physical', accepted: false },
      { name: 'Constitution', description: 'Health and stamina', minValue: 1, maxValue: 10, category: 'Physical', accepted: false },
    ],
    skills: [
      { name: 'Combat', description: 'Ability to fight effectively', difficulty: 'medium', category: 'Combat', linkedAttributeName: 'Strength', accepted: false },
      { name: 'Stealth', description: 'Moving unseen and unheard', difficulty: 'hard', category: 'Physical', linkedAttributeName: 'Agility', accepted: false },
      { name: 'Perception', description: 'Noticing details and dangers', difficulty: 'easy', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false },
      { name: 'Persuasion', description: 'Convincing others to agree', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Charisma', accepted: false },
      { name: 'Investigation', description: 'Finding clues and solving mysteries', difficulty: 'medium', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false },
      { name: 'Athletics', description: 'Running, jumping, and climbing', difficulty: 'easy', category: 'Physical', linkedAttributeName: 'Strength', accepted: false },
      { name: 'Medicine', description: 'Healing wounds and treating ailments', difficulty: 'hard', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false },
      { name: 'Survival', description: 'Finding food and shelter in the wild', difficulty: 'medium', category: 'Physical', linkedAttributeName: 'Constitution', accepted: false },
      { name: 'Arcana', description: 'Understanding magical theory and practice', difficulty: 'hard', category: 'Mental', linkedAttributeName: 'Intelligence', accepted: false },
      { name: 'Deception', description: 'Lying and misleading others', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Charisma', accepted: false },
      { name: 'Intimidation', description: 'Frightening or coercing others', difficulty: 'medium', category: 'Social', linkedAttributeName: 'Strength', accepted: false },
      { name: 'Performance', description: 'Entertainment and artistic expression', difficulty: 'easy', category: 'Social', linkedAttributeName: 'Charisma', accepted: false },
    ],
  });

  const descriptionLength = worldData.description?.length || 0;

  return (
    <div data-testid="description-step">
      <h2 className="text-xl font-bold mb-4">Describe Your World</h2>
      <p className="mb-4">
        Provide a detailed description of your world. Include information about the setting, tone, 
        major themes, and any unique aspects. This will help us suggest appropriate attributes and skills.
      </p>

      <div className="mb-4 relative">
        <label htmlFor="worldFullDescription" className="block mb-1">
          Full Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="worldFullDescription"
          data-testid="world-full-description"
          value={worldData.description || ''}
          onChange={handleDescriptionChange}
          placeholder="Describe your world in detail..."
          rows={12}
          className="w-full p-2 border rounded min-h-[200px]"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          disabled={isProcessing}
        />
        <div className="text-right text-sm mt-1" data-testid="description-char-count">
          {descriptionLength} / {MAX_DESCRIPTION_LENGTH} characters
        </div>
        {errors.description && (
          <span id="description-error" data-testid="description-error" className="text-red-500">
            {errors.description}
          </span>
        )}
      </div>

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

      <div className="flex justify-between mt-6">
        <button
          type="button"
          data-testid="step-back-button"
          onClick={onBack}
          className="px-4 py-2 border rounded"
          disabled={isProcessing}
        >
          Back
        </button>
        <button
          type="button"
          data-testid="step-cancel-button"
          onClick={onCancel}
          className="px-4 py-2 border rounded"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="step-next-button"
          onClick={validateAndNext}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={isProcessing}
        >
          {isProcessing ? 'Analyzing...' : 'Next'}
        </button>
      </div>
    </div>
  );
}

