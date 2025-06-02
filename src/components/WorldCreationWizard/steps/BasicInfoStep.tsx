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

        <WizardFormGroup label="Reference (Optional)" error={combinedErrors.reference}>
          <WizardTextField
            value={worldData.reference || ''}
            onChange={(value) => onUpdate({ ...worldData, reference: value })}
            placeholder="e.g., Lord of the Rings, Star Wars, The Office"
            error={combinedErrors.reference}
            testId="world-reference-input"
          />
          <div className="text-sm text-gray-500 mt-1">
            Enter a fictional universe, TV show, movie, or book that your world relates to.
          </div>
        </WizardFormGroup>

        {worldData.reference && (
          <WizardFormGroup label="Relationship to Reference" required>
            <WizardSelect
              value={worldData.relationship || 'based_on'}
              onChange={(value) => onUpdate({ ...worldData, relationship: value as 'set_in' | 'based_on' })}
              options={[
                { value: 'set_in', label: 'Set In - Characters and locations from the original universe' },
                { value: 'based_on', label: 'Based On - Original world inspired by the reference' }
              ]}
              testId="world-relationship-select"
            />
            <div className="text-sm text-gray-500 mt-1">
              {worldData.relationship === 'set_in' 
                ? 'Your world exists within the reference universe. Characters will be from that universe.'
                : 'Your world is inspired by the reference but has original characters and locations.'
              }
            </div>
          </WizardFormGroup>
        )}
      </WizardFormSection>
    </div>
  );
}

