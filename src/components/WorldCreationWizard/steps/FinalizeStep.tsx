'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { wizardStyles, WizardFormSection } from '@/components/shared/wizard';

interface FinalizeStepProps {
  worldData: Partial<World>;
  errors: Record<string, string>;
  onComplete: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function FinalizeStep({
  worldData,
  errors,
  onComplete,
  onBack,
  onCancel,
}: FinalizeStepProps) {
  // Logger function that can be easily disabled for production
  const log = (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, data);
    }
  };

  const handleComplete = () => {
    log('[FinalizeStep.tsx - handleComplete] Button clicked, function entered.');
    if (onComplete) {
      log('[FinalizeStep.tsx - handleComplete] Calling onComplete prop.');
      onComplete();
    } else {
      log('[FinalizeStep.tsx - handleComplete] onComplete function is not provided');
      console.error('[FinalizeStep.tsx - handleComplete] onComplete function is not provided');
    }
  };
  
  return (
    <div data-testid="finalize-step">
      <WizardFormSection
        title="Review Your World"
        description="Review your world configuration before creating it. You can go back to make changes or proceed to create your world."
      >

      <div className={`mb-6 pb-6 ${wizardStyles.divider}`}>
        <h3 className={`${wizardStyles.subheading} mb-4`}>Basic Information</h3>
        <div className="mb-2">
          <span className="font-medium mr-2">Name:</span>
          <span data-testid="review-world-name">{worldData.name}</span>
        </div>
        <div className="mb-2">
          <span className="font-medium mr-2">Genre:</span>
          <span data-testid="review-world-genre">{worldData.theme}</span>
        </div>
        <div className="mb-2">
          <span className="font-medium mr-2">Description:</span>
          <p className="mt-1" data-testid="review-world-description">{worldData.description}</p>
        </div>
      </div>

      <div className={`mb-6 pb-6 ${wizardStyles.divider}`} data-testid="review-attributes-section">
        <h3 className={`${wizardStyles.subheading} mb-4`}>Attributes ({worldData.attributes?.length || 0})</h3>
        {worldData.attributes && worldData.attributes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worldData.attributes.map((attr, index) => (
              <div key={index} className={`${wizardStyles.card.base} bg-gray-50`} data-testid={`review-attribute-${index}`}>
                <div className="font-semibold">{attr.name}</div>
                <div className="text-sm">{attr.description}</div>
                <div className="text-sm text-gray-500">
                  Range: {attr.minValue} - {attr.maxValue}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No attributes selected</p>
        )}
      </div>

      <div className={`mb-6 pb-6 ${wizardStyles.divider}`} data-testid="review-skills-section">
        <h3 className={`${wizardStyles.subheading} mb-4`}>Skills ({worldData.skills?.length || 0})</h3>
        {worldData.skills && worldData.skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worldData.skills.map((skill, index) => (
              <div key={index} className={`${wizardStyles.card.base} bg-gray-50`} data-testid={`review-skill-${index}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{skill.name}</span>
                  <span className={`${wizardStyles.badge.base} ${
                    skill.difficulty === 'easy' ? wizardStyles.badge.success :
                    skill.difficulty === 'medium' ? wizardStyles.badge.warning : 
                    wizardStyles.badge.danger
                  }`}>
                    {skill.difficulty}
                  </span>
                </div>
                <div className="text-sm">{skill.description}</div>
                {skill.linkedAttributeId && (
                  <div className="text-sm text-blue-600 mt-1">
                    Linked to: {worldData.attributes?.find(a => a.id === skill.linkedAttributeId)?.name || 'Unknown'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No skills selected</p>
        )}
      </div>
      </WizardFormSection>

      {errors.submit && (
        <div className={wizardStyles.errorContainer} data-testid="submit-error">
          {errors.submit}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel || (() => window.history.back())}
            className={wizardStyles.navigation.cancelButton}
          >
            Cancel
          </button>
          
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={wizardStyles.navigation.secondaryButton}
            >
              Back
            </button>
          )}
        </div>
        
        <button
          type="button"
          data-testid="step-complete-button"
          onClick={() => {
            log('[FinalizeStep.tsx - inline onClick] Button raw click detected.');
            handleComplete();
          }}
          className={wizardStyles.navigation.primaryButton}
        >
          Create World
        </button>
      </div>
    </div>
  );
}

