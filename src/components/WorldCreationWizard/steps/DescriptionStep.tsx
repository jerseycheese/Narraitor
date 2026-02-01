'use client';

import React from 'react';
import { World } from '@/types/world.types';
import {
  WizardFormGroup,
  WizardTextArea,
  WizardFormSection,
} from '@/components/shared/wizard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getWorldGuidance, type AIGuidanceSource } from '@/lib/constants/worldGuidance';
import { type GenreValue } from '@/lib/constants/genres';
import type { AttributeSuggestion, SkillSuggestion } from '@/types/ai-suggestions.types';

interface AISuggestionState {
  attributes: AttributeSuggestion[];
  skills: SkillSuggestion[];
}

interface DescriptionStepProps {
  worldData: Partial<World>;
  errors: Record<string, string>;
  isProcessing: boolean;
  aiSuggestions?: AISuggestionState;
  suggestionMeta?: {
    source: AIGuidanceSource;
    generatedAt?: string;
    descriptionSnapshot?: string;
  };
  canGenerateSuggestions?: boolean;
  onUpdate: (updates: Partial<World>) => void;
  onGenerateSuggestions: () => Promise<void>;
}

const SUGGESTION_SOURCE_LABELS: Record<AIGuidanceSource, string> = {
  ai: 'Generated from your description',
  fallback: 'Using fallback starter suggestions',
  template: 'Copied from the selected template',
  initial: 'Loaded from saved data',
};

export default function DescriptionStep({
  worldData,
  errors,
  isProcessing,
  aiSuggestions,
  suggestionMeta,
  canGenerateSuggestions = true,
  onUpdate,
  onGenerateSuggestions,
}: DescriptionStepProps) {
  const MAX_DESCRIPTION_LENGTH = 3000;
  const description = worldData.description || '';
  const descriptionLength = description.length;
  const genre = worldData.genre as GenreValue | undefined;
  const guidance = getWorldGuidance(genre);

  const hasAISuggestions = Boolean(
    (aiSuggestions?.attributes?.length || 0) > 0 ||
    (aiSuggestions?.skills?.length || 0) > 0
  );

  const descriptionOutdated = Boolean(
    suggestionMeta?.descriptionSnapshot &&
    suggestionMeta.descriptionSnapshot.trim() !== description.trim()
  );

  const meetsAIMinimumLength = descriptionLength >= 50;
  const canTriggerGeneration = canGenerateSuggestions && meetsAIMinimumLength && !isProcessing;

  const handleDescriptionChange = (value: string) => {
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      onUpdate({ ...worldData, description: value });
    }
  };

  const renderSuggestionPreview = () => {
    if (!hasAISuggestions) {
      return (
        <div
          className="rounded-lg border border-dashed border-info/20 bg-info/10 p-4 text-sm text-info-text"
          data-testid="ai-suggestion-empty"
        >
          {canGenerateSuggestions ? (
            meetsAIMinimumLength
              ? 'Generate suggestions to see examples tailored to your description.'
              : 'Add at least 50 characters so we can understand your world before generating suggestions.'
          ) : 'Suggestions are pre-filled from your chosen template.'}
        </div>
      );
    }

    const attributeList = (aiSuggestions?.attributes || []).slice(0, 3);
    const skillList = (aiSuggestions?.skills || []).slice(0, 3);

    return (
      <div className="grid gap-4 md:grid-cols-2" data-testid="ai-suggestion-preview">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900">Attributes to explore</h4>
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            {attributeList.length > 0 ? (
              attributeList.map((attribute, index) => (
                <li key={`${attribute.name}-${index}`}>
                  <span className="font-medium">{attribute.name}</span>
                  {attribute.description ? (
                    <span className="block text-xs text-gray-600">{attribute.description}</span>
                  ) : null}
                </li>
              ))
            ) : (
              <li>No attribute suggestions yet.</li>
            )}
          </ul>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900">Skill ideas</h4>
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            {skillList.length > 0 ? (
              skillList.map((skill, index) => (
                <li key={`${skill.name}-${index}`}>
                  <span className="font-medium">{skill.name}</span>
                  {skill.description ? (
                    <span className="block text-xs text-gray-600">{skill.description}</span>
                  ) : null}
                </li>
              ))
            ) : (
              <li>No skill suggestions yet.</li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div data-testid="description-step">
      <WizardFormSection
        title="Describe Your World"
        description="Provide a detailed description of your world. Include information about the setting, tone, major themes, and any unique aspects. This will help us suggest appropriate attributes and skills."
      >
        <WizardFormGroup
          label="Full Description"
          error={errors.description}
          required
          helpText={guidance.descriptionPrompt}
        >
          <WizardTextArea
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Describe your world in detail..."
            rows={12}
            error={errors.description}
            disabled={isProcessing}
            testId="world-full-description"
            dataTutorial="world-description"
          />
          <div className="mt-1 text-right text-sm" data-testid="description-char-count">
            {descriptionLength} / {MAX_DESCRIPTION_LENGTH} characters
          </div>
        </WizardFormGroup>
      </WizardFormSection>

      <WizardFormSection
        title="Attribute & Skill Suggestions"
        description="Suggested attributes and skills based on your world description."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => {
                void onGenerateSuggestions();
              }}
              disabled={!canTriggerGeneration}
              data-testid="generate-ai-suggestions"
              data-tutorial="ai-suggestions-actions"
            >
              {isProcessing
                ? 'Analyzing description...'
                : hasAISuggestions
                  ? 'Regenerate suggestions'
                  : 'Generate suggestions'}
            </Button>
            <span className="text-xs text-gray-600">
              {hasAISuggestions && suggestionMeta?.source
                ? SUGGESTION_SOURCE_LABELS[suggestionMeta.source]
                : meetsAIMinimumLength
                  ? 'Suggestions need a detailed description to stay accurate.'
                  : 'Once the description reaches 50+ characters, suggestions can help with ideas.'}
            </span>
          </div>

          {errors.ai && (
            <Alert variant="warning" data-testid="ai-warning" aria-live="polite">
              <AlertDescription>{errors.ai}</AlertDescription>
            </Alert>
          )}

          {descriptionOutdated && (
            <Alert variant="warning" data-testid="ai-description-outdated" aria-live="polite">
              <AlertDescription>
                Your description has changed since the last generation. Regenerate suggestions to keep them aligned.
              </AlertDescription>
            </Alert>
          )}

          <div data-tutorial="ai-suggestions-preview">
            {renderSuggestionPreview()}
          </div>
        </div>
      </WizardFormSection>

      {isProcessing && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50" data-testid="processing-overlay">
          <div className="rounded bg-white p-8 text-center shadow">
            <div className="mx-auto mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p aria-live="polite">Analyzing your world description...</p>
          </div>
        </div>
      )}
    </div>
  );
}
