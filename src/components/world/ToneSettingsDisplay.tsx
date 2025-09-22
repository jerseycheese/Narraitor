'use client';

import React from 'react';
import { DataField } from '@/components/shared/DataField';
import { ToneSettings } from '@/types/tone-settings.types';
import {
  CONTENT_RATING_DESCRIPTIONS,
  NARRATIVE_STYLE_DESCRIPTIONS,
  LANGUAGE_COMPLEXITY_DESCRIPTIONS
} from '@/types/tone-settings.types';

interface ToneSettingsDisplayProps {
  toneSettings?: ToneSettings;
}

export function ToneSettingsDisplay({ toneSettings }: ToneSettingsDisplayProps) {
  if (!toneSettings) {
    return null;
  }

  const getContentRatingDisplay = () => {
    const rating = toneSettings.contentRating;
    const description = CONTENT_RATING_DESCRIPTIONS[rating];
    return `${rating} - ${description}`;
  };

  const getNarrativeStyleDisplay = () => {
    const style = toneSettings.narrativeStyle;
    const description = NARRATIVE_STYLE_DESCRIPTIONS[style];
    return `${style.charAt(0).toUpperCase() + style.slice(1)} - ${description}`;
  };

  const getLanguageComplexityDisplay = () => {
    const complexity = toneSettings.languageComplexity;
    const description = LANGUAGE_COMPLEXITY_DESCRIPTIONS[complexity];
    return `${complexity.charAt(0).toUpperCase() + complexity.slice(1)} - ${description}`;
  };

  return (
    <section className="bg-background rounded-lg border p-6 mb-6 shadow-sm" aria-labelledby="tone-settings-heading">
      <h2 id="tone-settings-heading" className="text-2xl font-semibold mb-4">
        Narrative tone settings
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        These settings guide how AI-generated content will be written for this world.
      </p>

      <div className="space-y-4">
        <DataField
          label="Content Rating"
          value={getContentRatingDisplay()}
          variant="stacked"
        />
        <DataField
          label="Narrative Style"
          value={getNarrativeStyleDisplay()}
          variant="stacked"
        />
        <DataField
          label="Language Complexity"
          value={getLanguageComplexityDisplay()}
          variant="stacked"
        />
        {toneSettings.customInstructions && (
          <DataField
            label="Custom Instructions"
            value={toneSettings.customInstructions}
            variant="stacked"
          />
        )}
      </div>
    </section>
  );
}