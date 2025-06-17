import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ToneSettings,
  ContentRating,
  NarrativeStyle,
  LanguageComplexity,
  CONTENT_RATING_DESCRIPTIONS,
  NARRATIVE_STYLE_DESCRIPTIONS,
  LANGUAGE_COMPLEXITY_DESCRIPTIONS,
  DEFAULT_TONE_SETTINGS
} from '@/types/tone-settings.types';
import { 
  descriptionsToSelectOptions, 
  createFormUpdater, 
  normalizeOptionalString,
  validateToneSettings 
} from '@/lib/utils';

export interface ToneSettingsFormProps {
  toneSettings?: ToneSettings;
  onToneSettingsChange: (toneSettings: ToneSettings) => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export const ToneSettingsForm: React.FC<ToneSettingsFormProps> = ({
  toneSettings = DEFAULT_TONE_SETTINGS,
  onToneSettingsChange,
  onSave,
  showSaveButton = false
}) => {
  // Create form updater utilities
  const formUpdater = createFormUpdater(toneSettings, onToneSettingsChange);
  
  // Convert description objects to select options
  const contentRatingOptions = descriptionsToSelectOptions(CONTENT_RATING_DESCRIPTIONS);
  const narrativeStyleOptions = descriptionsToSelectOptions(NARRATIVE_STYLE_DESCRIPTIONS);
  const languageComplexityOptions = descriptionsToSelectOptions(LANGUAGE_COMPLEXITY_DESCRIPTIONS);

  // Validation state
  const validationResult = validateToneSettings(toneSettings);

  const handleCustomInstructionsChange = (value: string) => {
    formUpdater.updateField('customInstructions', normalizeOptionalString(value));
  };

  return (
    <div className="p-6 bg-white rounded-lg border shadow-sm">
      <div className="mb-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight mb-2">Tone Settings</h3>
        <p className="text-sm text-gray-600">
          Configure the narrative style, content rating, and language complexity for generated content.
        </p>
      </div>
      <div className="space-y-6">
        {/* Content Rating */}
        <div className="space-y-2">
          <Label htmlFor="content-rating">Content Rating</Label>
          <select
            id="content-rating"
            value={toneSettings.contentRating}
            onChange={(e) => formUpdater.updateField('contentRating', e.target.value as ContentRating)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {contentRatingOptions.map((option) => (
              <option key={option.value} value={option.value} title={option.description}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* Narrative Style */}
        <div className="space-y-2">
          <Label htmlFor="narrative-style">Narrative Style</Label>
          <select
            id="narrative-style"
            value={toneSettings.narrativeStyle}
            onChange={(e) => formUpdater.updateField('narrativeStyle', e.target.value as NarrativeStyle)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {narrativeStyleOptions.map((option) => (
              <option key={option.value} value={option.value} title={option.description}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* Language Complexity */}
        <div className="space-y-2">
          <Label htmlFor="language-complexity">Language Complexity</Label>
          <select
            id="language-complexity"
            value={toneSettings.languageComplexity}
            onChange={(e) => formUpdater.updateField('languageComplexity', e.target.value as LanguageComplexity)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {languageComplexityOptions.map((option) => (
              <option key={option.value} value={option.value} title={option.description}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
          <Textarea
            id="custom-instructions"
            placeholder="Enter specific tone or style instructions..."
            value={toneSettings.customInstructions || ''}
            onChange={(e) => handleCustomInstructionsChange(e.target.value)}
            rows={3}
          />
        </div>

        {/* Validation Errors */}
        {!validationResult.valid && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium mb-1">Please fix the following issues:</p>
            <ul className="text-sm text-destructive space-y-1">
              {validationResult.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {showSaveButton && onSave && (
          <div className="flex justify-end">
            <Button 
              onClick={onSave}
              disabled={!validationResult.valid}
            >
              Save Tone Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};