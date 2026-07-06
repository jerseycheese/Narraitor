'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { ToneSettingsForm } from '@/components/forms/ToneSettingsForm';
import {
  WizardFormGroup,
  WizardTextField,
  WizardSelect,
  WizardFormSection,
  wizardStyles
} from '@/components/shared/wizard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GENRES, type GenreValue } from '@/lib/constants/genres';
import { getWorldGuidance } from '@/lib/constants/worldGuidance';

interface BasicInfoStepProps {
  worldData: Partial<World>;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<World>) => void;
}

// Use centralized genre constants
const GENRE_OPTIONS = GENRES;

export default function BasicInfoStep({
  worldData,
  errors,
  onUpdate,
}: BasicInfoStepProps) {
  const combinedErrors = { ...errors };
  const guidance = getWorldGuidance(worldData.genre as GenreValue | undefined);

  return (
    <div data-testid="basic-info-step">
      {/* Main step header */}
      <div>
        <h2 className={wizardStyles.step.title}>Basic Information</h2>
        <p className={wizardStyles.step.description}>Let&apos;s start with some basic information about your world and configure how stories will be told.</p>
      </div>

      <WizardFormSection
        title="World Details"
        description="Essential information about your world."
      >
        <WizardFormGroup
          label="World Name (optional)"
          error={combinedErrors.name}
          helpText={guidance.nameExamples.length ? `Examples: ${guidance.nameExamples.slice(0, 3).join(', ')}` : 'Choose a genre below to see name examples'}
        >
          <WizardTextField
            value={worldData.name || ''}
            onChange={(value) => onUpdate({ ...worldData, name: value })}
            placeholder="Enter your world's name"
            error={combinedErrors.name}
            testId="world-name-input"
            dataTutorial="world-name"
          />
        </WizardFormGroup>

        <WizardFormGroup
          label="Genre"
          required
          helpText={guidance.tagline}
        >
          <WizardSelect
            value={worldData.genre || ''}
            onChange={(value) => onUpdate({ ...worldData, genre: value as GenreValue })}
            options={GENRE_OPTIONS}
            placeholder="Choose a genre..."
            testId="world-genre-select"
            dataTutorial="genre-picker"
          />
        </WizardFormGroup>

        <div data-tutorial="world-type">
          <WizardFormGroup
            label="World Type"
            error={combinedErrors.relationship}
            helpText="Pick how closely this world should track an existing setting. The choice controls whether your world invents new canon or leans on established material."
          >
            <div className="wizard-radio-group">
              <div className="wizard-radio-option">
                <Input
                  type="radio"
                  id="relationship-none"
                  name="relationship"
                  value=""
                  checked={!worldData.relationship}
                  onChange={() => onUpdate({ ...worldData, relationship: undefined, reference: '' })}
                />
                <div className="wizard-radio-option-text">
                  <Label htmlFor="relationship-none">Original World</Label>
                  <p className="wizard-radio-option-desc">
                    Create a completely original world from your imagination
                  </p>
                </div>
              </div>

              <div className="wizard-radio-option">
                <Input
                  type="radio"
                  id="relationship-based-on"
                  name="relationship"
                  value="based_on"
                  checked={worldData.relationship === 'inspired_by'}
                  onChange={() => onUpdate({ ...worldData, relationship: 'inspired_by' })}
                  data-testid="relationship-based-on-radio"
                />
                <div className="wizard-radio-option-text">
                  <Label htmlFor="relationship-based-on">Inspired By</Label>
                  <p className="wizard-radio-option-desc">
                    Create an original world inspired by an existing fictional universe or real setting
                  </p>
                </div>
              </div>

              <div className="wizard-radio-option">
                <Input
                  type="radio"
                  id="relationship-set-in"
                  name="relationship"
                  value="set_in"
                  checked={worldData.relationship === 'set_within'}
                  onChange={() => onUpdate({ ...worldData, relationship: 'set_within' })}
                  data-testid="relationship-set-in-radio"
                />
                <div className="wizard-radio-option-text">
                  <Label htmlFor="relationship-set-in">Set Within</Label>
                  <p className="wizard-radio-option-desc">
                    Place your world directly within an existing fictional universe or real setting
                  </p>
                </div>
              </div>
            </div>
          </WizardFormGroup>
        </div>

        {worldData.relationship && (
          <WizardFormGroup
            label="Existing Setting"
            error={combinedErrors.reference}
            required
            helpText="Name the fictional universe (e.g., Star Wars, Forgotten Realms), era (e.g., Victorian London, Ancient Rome), or reference material. This helps produce examples that match the tone and canon."
          >
            <WizardTextField
              value={worldData.reference || ''}
              onChange={(value) => onUpdate({ ...worldData, reference: value })}
              placeholder="e.g., Star Wars, Victorian London, Ancient Rome, 1960s New York"
              error={combinedErrors.reference}
              testId="world-reference-input"
              dataTutorial="world-reference"
            />
            <div>
              {worldData.relationship === 'set_within'
                ? 'Enter the fictional universe or real setting where your world exists. Characters and locations will come from this setting.'
                : 'Enter the fictional universe or real setting that will inspire your world. Your world will have original characters and locations with similar themes.'
              }
            </div>
          </WizardFormGroup>
        )}
      </WizardFormSection>

      <WizardFormSection
        title="Narrative Settings"
        description="Configure how stories will be told in your world."
      >
        <ToneSettingsForm
          toneSettings={worldData.toneSettings || DEFAULT_TONE_SETTINGS}
          onToneSettingsChange={(toneSettings) => onUpdate({ ...worldData, toneSettings })}
          showSaveButton={false}
          showHeader={false}
        />
      </WizardFormSection>
    </div>
  );
}
