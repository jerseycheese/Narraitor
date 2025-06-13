import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <Card>
      <CardHeader>
        <CardTitle>Tone Settings</CardTitle>
        <CardDescription>
          Configure the narrative style, content rating, and language complexity for generated content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Rating */}
        <div className="space-y-2">
          <Label htmlFor="content-rating">Content Rating</Label>
          <Select
            value={toneSettings.contentRating}
            onValueChange={(value) => formUpdater.updateField('contentRating', value as ContentRating)}
          >
            <SelectTrigger id="content-rating">
              <SelectValue placeholder="Select content rating" />
            </SelectTrigger>
            <SelectContent>
              {contentRatingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Narrative Style */}
        <div className="space-y-2">
          <Label htmlFor="narrative-style">Narrative Style</Label>
          <Select
            value={toneSettings.narrativeStyle}
            onValueChange={(value) => formUpdater.updateField('narrativeStyle', value as NarrativeStyle)}
          >
            <SelectTrigger id="narrative-style">
              <SelectValue placeholder="Select narrative style" />
            </SelectTrigger>
            <SelectContent>
              {narrativeStyleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language Complexity */}
        <div className="space-y-2">
          <Label htmlFor="language-complexity">Language Complexity</Label>
          <Select
            value={toneSettings.languageComplexity}
            onValueChange={(value) => formUpdater.updateField('languageComplexity', value as LanguageComplexity)}
          >
            <SelectTrigger id="language-complexity">
              <SelectValue placeholder="Select language complexity" />
            </SelectTrigger>
            <SelectContent>
              {languageComplexityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
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
      </CardContent>
    </Card>
  );
};