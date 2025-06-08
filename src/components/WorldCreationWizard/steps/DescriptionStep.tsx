'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { 
  WizardFormGroup,
  WizardTextArea,
  WizardFormSection
} from '@/components/shared/wizard';

interface DescriptionStepProps {
  worldData: Partial<World>;
  errors: Record<string, string>;
  isProcessing: boolean;
  onUpdate: (updates: Partial<World>) => void;
}

export default function DescriptionStep({
  worldData,
  errors,
  isProcessing,
  onUpdate,
}: DescriptionStepProps) {
  const MAX_DESCRIPTION_LENGTH = 3000;

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


    </div>
  );
}
