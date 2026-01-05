// src/lib/utils/typeGuards/personalizationGuards.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PlayerDecision, ChoiceTypePreference } from '@/types/personalization.types';

export function isChoiceTypePreference(value: unknown): value is ChoiceTypePreference {
  const validChoiceTypes: ChoiceTypePreference[] = [
    'diplomatic', 'aggressive', 'stealthy', 'helpful', 'selfish', 'lawful', 'chaotic', 'neutral'
  ];
  return typeof value === 'string' && validChoiceTypes.includes(value as ChoiceTypePreference);
}

export function isPlayerDecision(obj: unknown): obj is PlayerDecision {
  return obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'choiceText' in obj &&
    'choiceType' in obj &&
    'context' in obj &&
    'timestamp' in obj &&
    typeof (obj as any).choiceText === 'string' &&
    isChoiceTypePreference((obj as any).choiceType) &&
    typeof (obj as any).context === 'object' &&
    typeof (obj as any).timestamp === 'string';
}

export function isPlayerDecisionArray(obj: unknown): obj is PlayerDecision[] {
  return Array.isArray(obj) && obj.every(item => isPlayerDecision(item));
}
