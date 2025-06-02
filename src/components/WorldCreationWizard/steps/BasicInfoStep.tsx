'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { 
  WizardFormGroup,
  WizardTextField,
  WizardTextArea,
  WizardSelect,
  WizardFormSection
} from '@/components/shared/wizard';

interface BasicInfoStepProps {
  worldData: Partial<World>;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<World>) => void;
}

const GENRE_OPTIONS = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sci-fi', label: 'Science Fiction' },
  { value: 'modern', label: 'Modern' },
  { value: 'historical', label: 'Historical' },
  { value: 'post-apocalyptic', label: 'Post-Apocalyptic' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'western', label: 'Western' },
  { value: 'other', label: 'Other' },
];

export default function BasicInfoStep({
  worldData,
  errors,
  onUpdate,
}: BasicInfoStepProps) {
  const combinedErrors = { ...errors };

  return (
    <div data-testid="basic-info-step">
      <WizardFormSection
        title="Basic Information"
        description="Let's start with some basic information about your world."
      >
        <WizardFormGroup label="World Name" error={combinedErrors.name} required>
          <WizardTextField
            value={worldData.name || ''}
            onChange={(value) => onUpdate({ ...worldData, name: value })}
            placeholder="Enter your world's name"
            error={combinedErrors.name}
            testId="world-name-input"
          />
        </WizardFormGroup>

        <WizardFormGroup label="Brief Description" error={combinedErrors.description} required>
          <WizardTextArea
            value={worldData.description || ''}
            onChange={(value) => onUpdate({ ...worldData, description: value })}
            placeholder="Provide a brief description of your world"
            rows={4}
            error={combinedErrors.description}
            testId="world-description-textarea"
          />
        </WizardFormGroup>

        <WizardFormGroup label="Genre" required>
          <WizardSelect
            value={worldData.theme || 'fantasy'}
            onChange={(value) => onUpdate({ ...worldData, theme: value })}
            options={GENRE_OPTIONS}
            testId="world-genre-select"
          />
        </WizardFormGroup>

        <WizardFormGroup label="World Type" error={combinedErrors.relationship}>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                id="relationship-none"
                name="relationship"
                value=""
                checked={!worldData.relationship}
                onChange={() => onUpdate({ ...worldData, relationship: undefined, reference: '' })}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <label htmlFor="relationship-none" className="text-sm font-medium text-gray-900">
                  Original World
                </label>
                <p className="text-sm text-gray-600">
                  Create a completely original world from your imagination
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                id="relationship-based-on"
                name="relationship"
                value="based_on"
                checked={worldData.relationship === 'based_on'}
                onChange={() => onUpdate({ ...worldData, relationship: 'based_on' })}
                className="mt-1 text-blue-600 focus:ring-blue-500"
                data-testid="relationship-based-on-radio"
              />
              <div>
                <label htmlFor="relationship-based-on" className="text-sm font-medium text-gray-900">
                  Inspired By
                </label>
                <p className="text-sm text-gray-600">
                  Create an original world inspired by an existing fictional universe or real setting
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                id="relationship-set-in"
                name="relationship"
                value="set_in"
                checked={worldData.relationship === 'set_in'}
                onChange={() => onUpdate({ ...worldData, relationship: 'set_in' })}
                className="mt-1 text-blue-600 focus:ring-blue-500"
                data-testid="relationship-set-in-radio"
              />
              <div>
                <label htmlFor="relationship-set-in" className="text-sm font-medium text-gray-900">
                  Set Within
                </label>
                <p className="text-sm text-gray-600">
                  Place your world directly within an existing fictional universe or real setting
                </p>
              </div>
            </div>
          </div>
        </WizardFormGroup>

        {worldData.relationship && (
          <WizardFormGroup label="Existing Setting" error={combinedErrors.reference} required>
            <WizardTextField
              value={worldData.reference || ''}
              onChange={(value) => onUpdate({ ...worldData, reference: value })}
              placeholder="e.g., Star Wars, Victorian London, Ancient Rome, 1960s New York"
              error={combinedErrors.reference}
              testId="world-reference-input"
            />
            <div className="text-sm text-gray-500 mt-1">
              {worldData.relationship === 'set_in' 
                ? 'Enter the fictional universe or real setting where your world exists. Characters and locations will come from this setting.'
                : 'Enter the fictional universe or real setting that will inspire your world. Your world will have original characters and locations with similar themes.'
              }
            </div>
          </WizardFormGroup>
        )}
      </WizardFormSection>
    </div>
  );
}

