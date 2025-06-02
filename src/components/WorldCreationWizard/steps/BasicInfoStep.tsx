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

        <WizardFormGroup label="World Inspiration (Optional)" error={combinedErrors.relationship}>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="relationship-none"
                name="relationship"
                value=""
                checked={!worldData.relationship}
                onChange={() => onUpdate({ ...worldData, relationship: undefined, reference: '' })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="relationship-none" className="text-sm font-medium text-gray-700">
                Original World - Create a completely original world
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="relationship-based-on"
                name="relationship"
                value="based_on"
                checked={worldData.relationship === 'based_on'}
                onChange={() => onUpdate({ ...worldData, relationship: 'based_on' })}
                className="text-blue-600 focus:ring-blue-500"
                data-testid="relationship-based-on-radio"
              />
              <label htmlFor="relationship-based-on" className="text-sm font-medium text-gray-700">
                Based On - Original world inspired by a setting or time period
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="relationship-set-in"
                name="relationship"
                value="set_in"
                checked={worldData.relationship === 'set_in'}
                onChange={() => onUpdate({ ...worldData, relationship: 'set_in' })}
                className="text-blue-600 focus:ring-blue-500"
                data-testid="relationship-set-in-radio"
              />
              <label htmlFor="relationship-set-in" className="text-sm font-medium text-gray-700">
                Set In - World exists within an established setting or time period
              </label>
            </div>
          </div>
        </WizardFormGroup>

        {worldData.relationship && (
          <WizardFormGroup label="Setting or Time Period" error={combinedErrors.reference} required>
            <WizardTextField
              value={worldData.reference || ''}
              onChange={(value) => onUpdate({ ...worldData, reference: value })}
              placeholder="e.g., Star Wars, Victorian London, The Clinton Administration, Beatlemania"
              error={combinedErrors.reference}
              testId="world-reference-input"
            />
            <div className="text-sm text-gray-500 mt-1">
              {worldData.relationship === 'set_in' 
                ? 'Enter the fictional universe or historical period your world exists within. Characters will be from this setting.'
                : 'Enter the fictional universe or historical period that inspires your world. Your world will have original characters and locations.'
              }
            </div>
          </WizardFormGroup>
        )}
      </WizardFormSection>
    </div>
  );
}

