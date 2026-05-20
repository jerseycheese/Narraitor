// src/lib/utils/typeGuards/personalizationGuards.ts

import type { PlayerDecision, ChoiceTypePreference } from '@/types/personalization.types';

export function isChoiceTypePreference(value: unknown): value is ChoiceTypePreference {
  const validChoiceTypes: ChoiceTypePreference[] = [
    'diplomatic', 'aggressive', 'stealthy', 'helpful', 'selfish', 'lawful', 'chaotic', 'neutral'
  ];
  return typeof value === 'string' && validChoiceTypes.includes(value as ChoiceTypePreference);
}

export function isPlayerDecision(obj: unknown): obj is PlayerDecision {
  if (obj === null || obj === undefined || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return 'choiceText' in o &&
    'choiceType' in o &&
    'context' in o &&
    'timestamp' in o &&
    typeof o.choiceText === 'string' &&
    isChoiceTypePreference(o.choiceType) &&
    typeof o.context === 'object' &&
    typeof o.timestamp === 'string';
}

export function isPlayerDecisionArray(obj: unknown): obj is PlayerDecision[] {
  return Array.isArray(obj) && obj.every(item => isPlayerDecision(item));
}
