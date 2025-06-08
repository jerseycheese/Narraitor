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
        >
          <WizardFormField
            name="name"
            label="World Name"
            required
            description="Choose a unique name for your world"
          >
            <WizardInput
              value={worldData.name || ''}
              onChange={(e) => onUpdate?.({ ...worldData, name: e.target.value })}
              placeholder="Enter your world's name"
              data-testid="world-name-input"
              error={errors.name}
            />
          </WizardFormField>

          <WizardFormField
            name="description"
            label="Brief Description"
            required
            description="Provide a brief description that captures the essence of your world"
          >
            <WizardTextarea
              value={worldData.description || ''}
              onChange={(e) => onUpdate?.({ ...worldData, description: e.target.value })}
              placeholder="Provide a brief description of your world"
              rows={4}
              data-testid="world-description-textarea"
              error={errors.description}
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
              value={worldData.theme || ''}
              onChange={(e) => onUpdate?.({ ...worldData, theme: e.target.value })}
              error={errors.theme}
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
                  checked={!worldData.relationship}
                  onChange={() => onUpdate?.({ ...worldData, relationship: undefined, reference: undefined })}
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
                  checked={worldData.relationship === 'based_on'}
                  onChange={() => onUpdate?.({ ...worldData, relationship: 'based_on' })}
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
                  checked={worldData.relationship === 'set_in'}
                  onChange={() => onUpdate?.({ ...worldData, relationship: 'set_in' })}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300"
                  data-testid="relationship-set-in-radio"
                />
                <span className="text-sm font-medium">Set In</span>
                <span className="text-sm text-gray-500">- Takes place within an existing universe</span>
              </label>
            </div>
            
            {worldData.relationship && (
              <WizardFormField
                name="reference"
                label="Existing Setting"
                description="Enter the fictional universe or real setting where your world exists"
                required
              >
                <WizardInput
                  value={worldData.reference || ''}
                  onChange={(e) => onUpdate?.({ ...worldData, reference: e.target.value })}
                  placeholder="e.g., Middle-earth, Star Wars Universe, Victorian London"
                  data-testid="world-reference-input"
                  error={errors.reference}
                />
              </WizardFormField>
            )}
          </div>
        </WizardForm>
      </WizardFormSection>
    </div>
  );
}