'use client';

import React from 'react';
import { World } from '@/types/world.types';

interface FinalizeStepProps {
  worldData: Partial<World>;
  errors: Record<string, string>;
  onBack: () => void;
  onCancel: () => void;
  onComplete: () => void;
}

export default function FinalizeStep({
  worldData,
  errors,
  onBack,
  onCancel,
  onComplete,
}: FinalizeStepProps) {
  console.log('FinalizeStep rendered with props:', {
    worldData: {
      name: worldData.name,
      theme: worldData.theme,
      attributesCount: worldData.attributes?.length || 0,
      skillsCount: worldData.skills?.length || 0
    },
    hasErrors: Object.keys(errors).length > 0,
    onCompleteProvided: !!onComplete
  });

  const handleComplete = () => {
    console.log('[FinalizeStep.tsx - handleComplete] Button clicked, function entered.');
    if (onComplete) {
      console.log('[FinalizeStep.tsx - handleComplete] Calling onComplete prop.');
      onComplete();
    } else {
      console.error('[FinalizeStep.tsx - handleComplete] onComplete function is not provided');
    }
  };
  
  return (
    <div data-testid="finalize-step">
      <h2 style={styles.stepTitle}>Review Your World</h2>
      <p style={styles.stepDescription}>
        Review your world configuration before creating it. You can go back to make changes or proceed to create your world.
      </p>

      <div style={styles.reviewSection}>
        <h3 style={styles.sectionTitle}>Basic Information</h3>
        <div style={styles.reviewItem}>
          <span style={styles.label}>Name:</span>
          <span style={styles.value} data-testid="review-world-name">{worldData.name}</span>
        </div>
        <div style={styles.reviewItem}>
          <span style={styles.label}>Genre:</span>
          <span style={styles.value} data-testid="review-world-genre">{worldData.theme}</span>
        </div>
        <div style={styles.reviewItem}>
          <span style={styles.label}>Description:</span>
          <p style={styles.description} data-testid="review-world-description">{worldData.description}</p>
        </div>
      </div>

      <div style={styles.reviewSection} data-testid="review-attributes-section">
        <h3 style={styles.sectionTitle}>Attributes ({worldData.attributes?.length || 0})</h3>
        {worldData.attributes && worldData.attributes.length > 0 ? (
          <div style={styles.itemGrid}>
            {worldData.attributes.map((attr, index) => (
              <div key={index} style={styles.itemCard} data-testid={`review-attribute-${index}`}>
                <div style={styles.itemName}>{attr.name}</div>
                <div style={styles.itemDesc}>{attr.description}</div>
                <div style={styles.itemRange}>
                  Range: {attr.minValue} - {attr.maxValue}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.noItems}>No attributes selected</p>
        )}
      </div>

      <div style={styles.reviewSection} data-testid="review-skills-section">
        <h3 style={styles.sectionTitle}>Skills ({worldData.skills?.length || 0})</h3>
        {worldData.skills && worldData.skills.length > 0 ? (
          <div style={styles.itemGrid}>
            {worldData.skills.map((skill, index) => (
              <div key={index} style={styles.itemCard} data-testid={`review-skill-${index}`}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemName}>{skill.name}</span>
                  <span style={{
                    ...styles.difficultyBadge,
                    backgroundColor: 
                      skill.difficulty === 'easy' ? '#10b981' :
                      skill.difficulty === 'medium' ? '#f59e0b' : 
                      '#ef4444'
                  }}>
                    {skill.difficulty}
                  </span>
                </div>
                <div style={styles.itemDesc}>{skill.description}</div>
                {skill.linkedAttributeId && (
                  <div style={styles.itemLink}>
                    Linked to: {worldData.attributes?.find(a => a.id === skill.linkedAttributeId)?.name || 'Unknown'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.noItems}>No skills selected</p>
        )}
      </div>

      {errors.submit && (
        <div style={styles.error} data-testid="submit-error">
          {errors.submit}
        </div>
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
          data-testid="step-complete-button"
          onClick={() => {
            console.log('[FinalizeStep.tsx - inline onClick] Button raw click detected.');
            handleComplete();
          }}
          style={styles.completeButton}
        >
          Create World
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
  reviewSection: {
    marginBottom: '2rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '1rem',
  },
  reviewItem: {
    marginBottom: '0.75rem',
  },
  label: {
    fontWeight: '500',
    color: '#374151',
    marginRight: '0.5rem',
  },
  value: {
    color: '#6b7280',
  },
  description: {
    color: '#6b7280',
    marginTop: '0.25rem',
    lineHeight: '1.5',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
  },
  itemCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  itemName: {
    fontWeight: '600',
    color: '#111827',
  },
  itemDesc: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
  },
  itemRange: {
    fontSize: '0.875rem',
    color: '#9ca3af',
  },
  itemLink: {
    fontSize: '0.875rem',
    color: '#6366f1',
    marginTop: '0.25rem',
  },
  difficultyBadge: {
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    color: 'white',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  noItems: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
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
  completeButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    backgroundColor: '#10b981',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    fontWeight: '500',
  },
};
