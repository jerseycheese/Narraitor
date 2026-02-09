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
    <div >
      {showHeader && (
        <div >
          <h3 >Tone Settings</h3>
          <p >
            Configure the narrative style, content rating, and language complexity for generated content.
          </p>
        </div>
      )}
      <div >
        {/* Tone Settings Grid */}
        <div >
          {/* Content Rating */}
          <div >
            <Label htmlFor="content-rating">Content Rating</Label>
            <p id="content-rating-description" >Set the age-appropriate content level for generated narratives</p>
            <Select
              id="content-rating"
              value={toneSettings.contentRating}
              onChange={(e) => formUpdater.updateField('contentRating', e.target.value as ContentRating)}
              aria-describedby="content-rating-description"
              data-tutorial="tone-content-rating"
            >
              {contentRatingOptions.map((option) => (
                <option key={option.value} value={option.value} title={option.description}>
                  {option.label} - {option.description}
                </option>
              ))}
            </Select>
          </div>

          {/* Narrative Style */}
          <div >
            <Label htmlFor="narrative-style">Narrative Style</Label>
            <p id="narrative-style-description" >Choose how the story will be told and presented</p>
            <Select
              id="narrative-style"
              value={toneSettings.narrativeStyle}
              onChange={(e) => formUpdater.updateField('narrativeStyle', e.target.value as NarrativeStyle)}
              aria-describedby="narrative-style-description"
              data-tutorial="tone-narrative-style"
            >
              {narrativeStyleOptions.map((option) => (
                <option key={option.value} value={option.value} title={option.description}>
                  {option.label} - {option.description}
                </option>
              ))}
            </Select>
          </div>

          {/* Language Complexity */}
          <div >
            <Label htmlFor="language-complexity">Language Complexity</Label>
            <p id="language-complexity-description" >Set the vocabulary and sentence complexity level</p>
            <Select
              id="language-complexity"
              value={toneSettings.languageComplexity}
              onChange={(e) => formUpdater.updateField('languageComplexity', e.target.value as LanguageComplexity)}
              aria-describedby="language-complexity-description"
              data-tutorial="tone-language-complexity"
            >
              {languageComplexityOptions.map((option) => (
                <option key={option.value} value={option.value} title={option.description}>
                  {option.label} - {option.description}
                </option>
              ))}
            </Select>
          </div>

          {/* Custom Instructions */}
          <div >
            <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
            <p id="custom-instructions-description" >Add specific guidance for tone, style, or narrative elements</p>
            <Textarea
              id="custom-instructions"
              placeholder="Enter specific tone or style instructions..."
              value={toneSettings.customInstructions || ''}
              onChange={(e) => handleCustomInstructionsChange(e.target.value)}
              
              aria-describedby="custom-instructions-description"
              data-tutorial="tone-custom-instructions"
            />
          </div>
        </div>

        {/* Validation Errors */}
        {!validationResult.valid && (
          <ErrorBlock errors={validationResult.errors} />
        )}

        {showSaveButton && onSave && (
          <div >
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
