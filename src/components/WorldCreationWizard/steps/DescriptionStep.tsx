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

    try {
      // Call AI analyzer
      const suggestions = await analyzeWorldDescription(description);
      setAISuggestions(suggestions);
      onNext();
    } catch {
      // Handle AI failure with fallback
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
      <h2 style={styles.stepTitle}>Describe Your World</h2>
      <p style={styles.stepDescription}>
        Provide a detailed description of your world. Include information about the setting, tone, 
        major themes, and any unique aspects. This will help us suggest appropriate attributes and skills.
      </p>

      <div style={styles.formGroup}>
        <label htmlFor="worldFullDescription" style={styles.label}>
          Full Description <span style={styles.required}>*</span>
        </label>
        <textarea
          id="worldFullDescription"
          data-testid="world-full-description"
          value={worldData.description || ''}
          onChange={handleDescriptionChange}
          placeholder="Describe your world in detail..."
          rows={12}
          style={styles.textarea}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          disabled={isProcessing}
        />
        <div style={styles.charCount} data-testid="description-char-count">
          {descriptionLength} / {MAX_DESCRIPTION_LENGTH} characters
        </div>
        {errors.description && (
          <span id="description-error" data-testid="description-error" style={styles.error}>
            {errors.description}
          </span>
        )}
      </div>

      {errors.ai && (
        <div style={styles.warning} data-testid="ai-warning">
          {errors.ai}
        </div>
      )}

      {isProcessing && (
        <div style={styles.processingOverlay} data-testid="processing-overlay">
          <div style={styles.processingContent}>
            <div style={styles.spinner}></div>
            <p>Analyzing your world description...</p>
          </div>
        </div>
      )}

      <div style={styles.actions}>
        <button
          type="button"
          data-testid="step-back-button"
          onClick={onBack}
          style={styles.backButton}
          disabled={isProcessing}
        >
          Back
        </button>
        <button
          type="button"
          data-testid="step-cancel-button"
          onClick={onCancel}
          style={styles.cancelButton}
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="step-next-button"
          onClick={validateAndNext}
          style={styles.nextButton}
          disabled={isProcessing}
        >
          {isProcessing ? 'Analyzing...' : 'Next'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  stepTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  stepDescription: {
    color: '#6b7280',
    marginBottom: '1.5rem',
    lineHeight: '1.5',
  },
  formGroup: {
    marginBottom: '1.5rem',
    position: 'relative',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  required: {
    color: '#ef4444',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    resize: 'vertical',
    transition: 'border-color 0.15s',
    minHeight: '200px',
  },
  charCount: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.5rem',
    textAlign: 'right',
  },
  error: {
    display: 'block',
    fontSize: '0.875rem',
    color: '#ef4444',
    marginTop: '0.25rem',
  },
  warning: {
    padding: '0.75rem 1rem',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  processingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  processingContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  },
  spinner: {
    width: '3rem',
    height: '3rem',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    margin: '0 auto 1rem',
    animation: 'spin 1s linear infinite',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
    gap: '1rem',
  },
  backButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
    color: '#374151',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
    color: '#374151',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    marginLeft: 'auto',
  },
  nextButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
};
