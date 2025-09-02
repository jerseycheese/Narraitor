import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { ErrorBlock } from '@/components/shared';
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
  validateToneSettings 
} from '@/lib/utils';
import { createFormUpdater } from '@/lib/utils/formHelpers';

export interface ToneSettingsFormProps {
  toneSettings?: ToneSettings;
  onToneSettingsChange: (toneSettings: ToneSettings) => void;
  onSave?: () => void;
  showSaveButton?: boolean;
  showHeader?: boolean;
}

export const ToneSettingsForm: React.FC<ToneSettingsFormProps> = ({
  toneSettings = DEFAULT_TONE_SETTINGS,
  onToneSettingsChange,
  onSave,
  showSaveButton = false,
  showHeader = true
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
    formUpdater.updateField('customInstructions', value === '' ? undefined : value);
  };

  return (
    <div className="p-6 bg-white rounded-lg border shadow-sm">
      {showHeader && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight mb-2">Tone Settings</h3>
          <p className="text-sm text-gray-700">
            Configure the narrative style, content rating, and language complexity for generated content.
          </p>
        </div>
      )}
      <div className="space-y-6">
        {/* Content Rating */}
        <div className="space-y-2">
          <Label htmlFor="content-rating">Content Rating</Label>
          <Select
            id="content-rating"
            value={toneSettings.contentRating}
            onChange={(e) => formUpdater.updateField('contentRating', e.target.value as ContentRating)}
          >
            {contentRatingOptions.map((option) => (
              <option key={option.value} value={option.value} title={option.description}>
                {option.label} - {option.description}
              </option>
            ))}
          </Select>
        </div>

        {/* Narrative Style */}
        <div className="space-y-2">
          <Label htmlFor="narrative-style">Narrative Style</Label>
          <Select
            id="narrative-style"
            value={toneSettings.narrativeStyle}
            onChange={(e) => formUpdater.updateField('narrativeStyle', e.target.value as NarrativeStyle)}
          >
            {narrativeStyleOptions.map((option) => (
              <option key={option.value} value={option.value} title={option.description}>
                {option.label} - {option.description}
              </option>
            ))}
          </Select>
        </div>

        {/* Language Complexity */}
        <div className="space-y-2">
          <Label htmlFor="language-complexity">Language Complexity</Label>
          <Select
            id="language-complexity"
            value={toneSettings.languageComplexity}
            onChange={(e) => formUpdater.updateField('languageComplexity', e.target.value as LanguageComplexity)}
          >
            {languageComplexityOptions.map((option) => (
              <option key={option.value} value={option.value} title={option.description}>
                {option.label} - {option.description}
              </option>
            ))}
          </Select>
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
          <ErrorBlock errors={validationResult.errors} />
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