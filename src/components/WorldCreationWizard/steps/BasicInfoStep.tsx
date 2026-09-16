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
} from '@/components/shared/wizard';
import Link from 'next/link';
import { useProviderStore } from '@/state/providerStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  const hasConfiguredKey = useProviderStore(
    (s) => Object.keys(s.providers).length > 0
  );

  return (
    <div className="component-basic-info-step" data-testid="basic-info-step">
      {!hasConfiguredKey && (
        <Alert
          variant="info"
          className="component-provider-key-disclosure wizard-byok-disclosure"
          data-testid="provider-key-disclosure"
        >
          <AlertDescription>
            Narraitor runs on your own provider key (Google Gemini, OpenAI, OpenRouter, or a model you host yourself). It&apos;s stored only in your browser, and there&apos;s no account needed.{' '}
            <Link href="/settings/providers">Set up a provider</Link>.
          </AlertDescription>
        </Alert>
      )}

      <WizardFormSection title="World Details">
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
            helpText="Pick how closely this world should follow an existing setting."
          >
            <RadioGroup
              name="world-type"
              value={worldData.relationship || 'original'}
              onValueChange={(val: string) => {
                if (val === 'original') {
                  onUpdate({ ...worldData, relationship: undefined, reference: '' });
                } else {
                  onUpdate({ ...worldData, relationship: val as 'inspired_by' | 'set_within' });
                }
              }}
              className="wizard-radio-group"
            >
              <label className="wizard-radio-option" htmlFor="relationship-none">
                <RadioGroupItem
                  value="original"
                  id="relationship-none"
                  data-testid="relationship-none-radio"
                />
                <div className="wizard-radio-option-text">
                  <span className="wizard-radio-option-title">Original World</span>
                  <p className="wizard-radio-option-desc">
                    Create a completely original world from your imagination
                  </p>
                </div>
              </label>

              <label className="wizard-radio-option" htmlFor="relationship-based-on">
                <RadioGroupItem
                  value="inspired_by"
                  id="relationship-based-on"
                  data-testid="relationship-based-on-radio"
                />
                <div className="wizard-radio-option-text">
                  <span className="wizard-radio-option-title">Inspired By</span>
                  <p className="wizard-radio-option-desc">
                    Create an original world inspired by an existing fictional universe or real setting
                  </p>
                </div>
              </label>

              <label className="wizard-radio-option" htmlFor="relationship-set-in">
                <RadioGroupItem
                  value="set_within"
                  id="relationship-set-in"
                  data-testid="relationship-set-in-radio"
                />
                <div className="wizard-radio-option-text">
                  <span className="wizard-radio-option-title">Set Within</span>
                  <p className="wizard-radio-option-desc">
                    Place your world directly within an existing fictional universe or real setting
                  </p>
                </div>
              </label>
            </RadioGroup>
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
