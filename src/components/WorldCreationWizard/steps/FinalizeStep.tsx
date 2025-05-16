'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { wizardClasses } from '../WizardClassNames';

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
  // Logger function that can be easily disabled for production
  const log = (message: string, data?: any) => {
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
      log('[FinalizeStep.tsx - handleComplete] onComplete function is not provided', null, true);
    }
  };
  
  return (
    <div data-testid="finalize-step">
      <h2 className={wizardClasses.heading}>Review Your World</h2>
      <p className={wizardClasses.description}>
        Review your world configuration before creating it. You can go back to make changes or proceed to create your world.
      </p>

      <div className="mb-6 pb-6 border-b">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
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

      <div className="mb-6 pb-6 border-b" data-testid="review-attributes-section">
        <h3 className="text-lg font-semibold mb-4">Attributes ({worldData.attributes?.length || 0})</h3>
        {worldData.attributes && worldData.attributes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worldData.attributes.map((attr, index) => (
              <div key={index} className="border rounded p-3 bg-gray-50" data-testid={`review-attribute-${index}`}>
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

      <div className="mb-6 pb-6 border-b" data-testid="review-skills-section">
        <h3 className="text-lg font-semibold mb-4">Skills ({worldData.skills?.length || 0})</h3>
        {worldData.skills && worldData.skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worldData.skills.map((skill, index) => (
              <div key={index} className="border rounded p-3 bg-gray-50" data-testid={`review-skill-${index}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{skill.name}</span>
                  <span className={`px-2 py-1 rounded text-xs text-white uppercase ${
                    skill.difficulty === 'easy' ? 'bg-green-500' :
                    skill.difficulty === 'medium' ? 'bg-yellow-500' : 
                    'bg-red-500'
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

      {errors.submit && (
        <div className="p-4 bg-red-100 text-red-600 rounded mb-4" data-testid="submit-error">
          {errors.submit}
        </div>
      )}

      <div className={wizardClasses.buttonGroup}>
        <button
          type="button"
          data-testid="step-back-button"
          onClick={onBack}
          className={wizardClasses.button}
        >
          Back
        </button>
        <button
          type="button"
          data-testid="step-cancel-button"
          onClick={onCancel}
          className={wizardClasses.button}
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="step-complete-button"
          onClick={() => {
            log('[FinalizeStep.tsx - inline onClick] Button raw click detected.');
            handleComplete();
          }}
          className="px-4 py-2 bg-green-500 text-white rounded font-medium"
        >
          Create World
        </button>
      </div>
    </div>
  );
}

