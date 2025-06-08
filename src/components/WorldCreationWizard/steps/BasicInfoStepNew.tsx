'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { WizardForm } from '@/components/shared/wizard/components/WizardForm';
import {
  WizardFormField,
  WizardInput,
  WizardTextarea,
  WizardSelect,
  WizardFormSection,
} from '@/components/shared/wizard/components/WizardFormComponents';

interface BasicInfoStepProps {
  worldData: Partial<World>;
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

export default function BasicInfoStepNew({
  worldData,
}: BasicInfoStepProps) {
  return (
    <div data-testid="basic-info-step">
      <WizardFormSection
        title="Basic Information"
        description="Let's start with some basic information about your world."
      >
        <WizardForm
          data={worldData}
        >
          <WizardFormField
            name="name"
            label="World Name"
            required
            description="Choose a unique name for your world"
          >
            <WizardInput
              placeholder="Enter your world's name"
              data-testid="world-name-input"
            />
          </WizardFormField>

          <WizardFormField
            name="description"
            label="Brief Description"
            required
            description="Provide a brief description that captures the essence of your world"
          >
            <WizardTextarea
              placeholder="Provide a brief description of your world"
              rows={4}
              data-testid="world-description-textarea"
            />
          </WizardFormField>

          <WizardFormField
            name="theme"
            label="Genre"
            required
            description="Select the primary genre that best describes your world"
          >
            <WizardSelect
              options={GENRE_OPTIONS}
              placeholder="Select a genre"
              data-testid="world-genre-select"
            />
          </WizardFormField>
        </WizardForm>
      </WizardFormSection>
    </div>
  );
}