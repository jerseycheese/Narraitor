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
  const handleContentRatingChange = (value: ContentRating) => {
    onToneSettingsChange({
      ...toneSettings,
      contentRating: value
    });
  };

  const handleNarrativeStyleChange = (value: NarrativeStyle) => {
    onToneSettingsChange({
      ...toneSettings,
      narrativeStyle: value
    });
  };

  const handleLanguageComplexityChange = (value: LanguageComplexity) => {
    onToneSettingsChange({
      ...toneSettings,
      languageComplexity: value
    });
  };

  const handleCustomInstructionsChange = (value: string) => {
    onToneSettingsChange({
      ...toneSettings,
      customInstructions: value || undefined
    });
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
            onValueChange={handleContentRatingChange}
          >
            <SelectTrigger id="content-rating">
              <SelectValue placeholder="Select content rating" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONTENT_RATING_DESCRIPTIONS).map(([rating, description]) => (
                <SelectItem key={rating} value={rating}>
                  <div className="flex flex-col">
                    <span className="font-medium">{rating}</span>
                    <span className="text-sm text-muted-foreground">{description}</span>
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
            onValueChange={handleNarrativeStyleChange}
          >
            <SelectTrigger id="narrative-style">
              <SelectValue placeholder="Select narrative style" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(NARRATIVE_STYLE_DESCRIPTIONS).map(([style, description]) => (
                <SelectItem key={style} value={style}>
                  <div className="flex flex-col">
                    <span className="font-medium capitalize">{style.replace('-', ' ')}</span>
                    <span className="text-sm text-muted-foreground">{description}</span>
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
            onValueChange={handleLanguageComplexityChange}
          >
            <SelectTrigger id="language-complexity">
              <SelectValue placeholder="Select language complexity" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGE_COMPLEXITY_DESCRIPTIONS).map(([complexity, description]) => (
                <SelectItem key={complexity} value={complexity}>
                  <div className="flex flex-col">
                    <span className="font-medium capitalize">{complexity}</span>
                    <span className="text-sm text-muted-foreground">{description}</span>
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

        {showSaveButton && onSave && (
          <div className="flex justify-end">
            <Button onClick={onSave}>Save Tone Settings</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};