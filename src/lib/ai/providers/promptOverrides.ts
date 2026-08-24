import { getContentRatingGuidance } from '../safety/contentRatingGuidance';
import type { ContentRating } from '../safety/contentRatingGuidance';
import type { ProviderDescriptor } from './types';

export function buildProviderSystemPrompt(
  descriptor: ProviderDescriptor,
  rating: ContentRating | null
): string {
  return [
    descriptor.customSafetyPromptOverride ?? getContentRatingGuidance(rating),
    descriptor.customSystemPromptOverride,
  ]
    .filter((part): part is string => Boolean(part))
    .join('\n\n');
}

export function applyGeminiPromptOverrides(
  prompt: string,
  descriptor: ProviderDescriptor
): string {
  const instructions = [
    descriptor.customSafetyPromptOverride &&
      `Safety guidance:\n${descriptor.customSafetyPromptOverride}`,
    descriptor.customSystemPromptOverride &&
      `Additional system instructions:\n${descriptor.customSystemPromptOverride}`,
  ]
    .filter((part): part is string => Boolean(part))
    .join('\n\n');

  return instructions ? `${instructions}\n\n${prompt}` : prompt;
}
