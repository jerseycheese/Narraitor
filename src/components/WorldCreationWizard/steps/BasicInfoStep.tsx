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
      </WizardFormSection>
    </div>
  );
}

