'use client';

import React, { useState, useEffect } from 'react';
import { World, WorldSkill } from '@/types/world.types';
import { SkillSuggestion } from '../WorldCreationWizard';
import { generateUniqueId } from '@/lib/utils/generateId';

interface SkillReviewStepProps {
  worldData: Partial<World>;
  suggestions: SkillSuggestion[];
  errors: Record<string, string>;
  onUpdate: (updates: Partial<World>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function SkillReviewStep({
  worldData,
  suggestions,
  errors,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}: SkillReviewStepProps) {
  // Initialize state based on existing selections
  const [localSuggestions, setLocalSuggestions] = useState(() => {
    // If we have existing skills in worldData, match them to suggestions
    if (worldData.skills && worldData.skills.length > 0) {
      return suggestions.map(suggestion => {
        const existingSkill = worldData.skills?.find(skill => skill.name === suggestion.name);
        return {
          ...suggestion,
          accepted: !!existingSkill
        };
      });
    }
    return [...suggestions];
  });

  // Update local state when suggestions prop changes
  useEffect(() => {
    if (suggestions.length > 0) {
      setLocalSuggestions(suggestions.map(suggestion => {
        const existingSkill = worldData.skills?.find(skill => skill.name === suggestion.name);
        return {
          ...suggestion,
          accepted: !!existingSkill
        };
      }));
    }
  }, [suggestions, worldData.skills]);

  const handleToggleSkill = (index: number) => {
    const updatedSuggestions = [...localSuggestions];
    updatedSuggestions[index].accepted = !updatedSuggestions[index].accepted;
    setLocalSuggestions(updatedSuggestions);
    
    // Update the worldData with accepted skills
    const acceptedSkills: WorldSkill[] = updatedSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '', // Will be set when world is created
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        // Map linkedAttributeName to an actual attribute ID if needed
        linkedAttributeId: s.linkedAttributeName ? 
          worldData.attributes?.find(attr => attr.name === s.linkedAttributeName)?.id : 
          undefined,
      }));
    
    onUpdate({ ...worldData, skills: acceptedSkills });
  };

  const handleModifySkill = (index: number, field: keyof SkillSuggestion, value: string) => {
    const updatedSuggestions = [...localSuggestions];
    updatedSuggestions[index] = { ...updatedSuggestions[index], [field]: value };
    setLocalSuggestions(updatedSuggestions);
    
    // Re-calculate accepted skills
    const acceptedSkills: WorldSkill[] = updatedSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '',
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        linkedAttributeId: s.linkedAttributeName ? 
          worldData.attributes?.find(attr => attr.name === s.linkedAttributeName)?.id : 
          undefined,
      }));
    
    onUpdate({ ...worldData, skills: acceptedSkills });
  };

  const validateAndNext = () => {
    const acceptedCount = localSuggestions.filter(s => s.accepted).length;
    
    // Check if more than 12 skills are selected
    if (acceptedCount > 12) {
      // Don't proceed if validation fails
      return;
    }
    
    // Update the world data with accepted skills
    const acceptedSkills: WorldSkill[] = localSuggestions
      .filter(s => s.accepted)
      .map(s => ({
        id: generateUniqueId('skill'),
        worldId: '',
        name: s.name,
        description: s.description,
        difficulty: s.difficulty,
        category: s.category,
        linkedAttributeId: s.linkedAttributeName ?
          worldData.attributes?.find(attr => attr.name === s.linkedAttributeName)?.id :
          undefined,
      }));
    
    onUpdate({ ...worldData, skills: acceptedSkills });
    
    onNext();
  };

  const acceptedCount = localSuggestions.filter(s => s.accepted).length;

  return (
    <div data-testid="skill-review-step">
      <h2 style={styles.stepTitle}>Review Skills</h2>
      <p style={styles.stepDescription}>
        Based on your description, we&apos;ve suggested these skills. You can accept, modify, or reject each one. Select up to 12 skills for your world.
      </p>

      <div style={styles.skillList}>
        {localSuggestions.map((suggestion, index) => (
          <div key={index} style={styles.skillCard} data-testid={`skill-card-${index}`}>
            <div style={styles.skillHeader}>
              <input
                type="checkbox"
                id={`skill-${index}`}
                data-testid={`skill-checkbox-${index}`}
                checked={suggestion.accepted}
                onChange={() => handleToggleSkill(index)}
                style={styles.checkbox}
              />
              <label htmlFor={`skill-${index}`} style={styles.skillTitle}>
                {suggestion.name}
              </label>
              <span style={{
                ...styles.difficultyBadge,
                backgroundColor: 
                  suggestion.difficulty === 'easy' ? '#10b981' :
                  suggestion.difficulty === 'medium' ? '#f59e0b' : 
                  '#ef4444'
              }}>
                {suggestion.difficulty}
              </span>
            </div>
            
            {suggestion.accepted && (
              <div style={styles.skillDetails}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name</label>
                  <input
                    type="text"
                    data-testid={`skill-name-input-${index}`}
                    value={suggestion.name}
                    onChange={(e) => handleModifySkill(index, 'name', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    data-testid={`skill-description-textarea-${index}`}
                    value={suggestion.description}
                    onChange={(e) => handleModifySkill(index, 'description', e.target.value)}
                    rows={2}
                    style={styles.textarea}
                  />
                </div>
                
                <div style={styles.selectGroup}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Learning Curve</label>
                    <select
                      data-testid={`skill-difficulty-select-${index}`}
                      value={suggestion.difficulty}
                      onChange={(e) => handleModifySkill(index, 'difficulty', e.target.value)}
                      style={styles.select}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Linked Attribute</label>
                    <select
                      data-testid={`skill-attribute-select-${index}`}
                      value={suggestion.linkedAttributeName || ''}
                      onChange={(e) => handleModifySkill(index, 'linkedAttributeName', e.target.value)}
                      style={styles.select}
                    >
                      <option value="">None</option>
                      {worldData.attributes?.map((attr) => (
                        <option key={attr.id} value={attr.name}>
                          {attr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.summary} data-testid="skill-count-summary">
        Selected skills: {acceptedCount} / 12
      </div>

      {errors.skills && (
        <div style={styles.error}>{errors.skills}</div>
      )}

      <div style={styles.actions}>
        <button
          type="button"
          data-testid="step-back-button"
          onClick={onBack}
          style={styles.backButton}
        >
          Back
        </button>
        <button
          type="button"
          data-testid="step-cancel-button"
          onClick={onCancel}
          style={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="step-next-button"
          onClick={validateAndNext}
          style={styles.nextButton}
        >
          Next
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
  },
  skillList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  skillCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    padding: '1rem',
    transition: 'border-color 0.15s',
  },
  skillHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkbox: {
    width: '1.25rem',
    height: '1.25rem',
    cursor: 'pointer',
  },
  skillTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    flex: 1,
  },
  difficultyBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    color: 'white',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  skillDetails: {
    marginTop: '1rem',
    paddingLeft: '1.75rem',
  },
  formGroup: {
    marginBottom: '0.75rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.25rem',
  },
  input: {
    width: '100%',
    padding: '0.375rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
  },
  textarea: {
    width: '100%',
    padding: '0.375rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    resize: 'vertical',
  },
  selectGroup: {
    display: 'flex',
    gap: '1rem',
  },
  select: {
    width: '100%',
    padding: '0.375rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    backgroundColor: 'white',
  },
  summary: {
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  error: {
    fontSize: '0.875rem',
    color: '#ef4444',
    marginTop: '0.5rem',
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
