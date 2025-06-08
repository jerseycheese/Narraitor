'use client';

import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
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
  errors?: Record<string, string>;
  onUpdate?: (updates: Partial<World>) => void;
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

// Wrapper component to handle form watching
function BasicInfoFormContent({ worldData, onUpdate }: { worldData: Partial<World>, onUpdate?: (updates: Partial<World>) => void }) {
  const form = useFormContext();
  const watchedValues = form.watch();

  useEffect(() => {
    // When form values change, call onUpdate
    if (onUpdate && watchedValues) {
      onUpdate(watchedValues);
    }
  }, [watchedValues, onUpdate]);

  return (
    <>
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

      {/* World Relationship Section */}
      <div className="space-y-4 mt-6">
        <div>
          <h4 className="text-lg font-medium mb-2">World Type</h4>
          <p className="text-gray-600 text-sm mb-4">
            Choose whether this is an original world or based on an existing setting.
          </p>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="relationship"
              value=""
              checked={!watchedValues.relationship}
              onChange={() => {
                form.setValue('relationship', undefined);
                form.setValue('reference', undefined);
              }}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
              data-testid="relationship-original-radio"
            />
            <span className="text-sm font-medium">Original World</span>
            <span className="text-sm text-gray-500">- A completely original setting</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="relationship"
              value="based_on"
              checked={watchedValues.relationship === 'based_on'}
              onChange={() => form.setValue('relationship', 'based_on')}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
              data-testid="relationship-based-on-radio"
            />
            <span className="text-sm font-medium">Based On</span>
            <span className="text-sm text-gray-500">- Inspired by an existing world or setting</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="relationship"
              value="set_in"
              checked={watchedValues.relationship === 'set_in'}
              onChange={() => form.setValue('relationship', 'set_in')}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
              data-testid="relationship-set-in-radio"
            />
            <span className="text-sm font-medium">Set In</span>
            <span className="text-sm text-gray-500">- Takes place within an existing universe</span>
          </label>
        </div>
        
        {watchedValues.relationship && (
          <WizardFormField
            name="reference"
            label="Existing Setting"
            description="Enter the fictional universe or real setting where your world exists"
            required
          >
            <WizardInput
              placeholder="e.g., Middle-earth, Star Wars Universe, Victorian London"
              data-testid="world-reference-input"
            />
          </WizardFormField>
        )}
      </div>
    </>
  );
}

export default function BasicInfoStep({
  worldData,
  errors = {},
  onUpdate,
}: BasicInfoStepProps) {
  return (
    <div data-testid="basic-info-step">
      <WizardFormSection
        title="Basic Information"
        description="Let's start with some basic information about your world."
      >
        <WizardForm
          data={worldData}
          defaultValues={worldData}
        >
          <BasicInfoFormContent worldData={worldData} onUpdate={onUpdate} />
        </WizardForm>
      </WizardFormSection>
    </div>
  );
}