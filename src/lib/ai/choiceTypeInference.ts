import type { AIClient } from './types';
import { createDefaultGeminiClient } from './defaultGeminiClient';
import type { ChoiceTypePreference } from '@/types/personalization.types';
import { safeTrim } from '@/lib/utils';
import { extractFencedJson, extractJsonObject, stripMarkdownFences } from './parseJSON';
import Logger from '@/lib/utils/logger';

const logger = new Logger('ChoiceTypeInference');

const VALID_CHOICE_TYPES: ReadonlySet<ChoiceTypePreference> = new Set([
  'diplomatic',
  'aggressive',
  'stealthy',
  'helpful',
  'selfish',
  'neutral',
]);

/**
 * Categorizes player choice text into a ChoiceTypePreference using AI.
 * Falls back to 'neutral' when AI analysis fails, times out, or produces invalid output.
 */
export async function inferChoiceTypeFromText(
  choiceText: string,
  aiClient: AIClient = createDefaultGeminiClient()
): Promise<ChoiceTypePreference> {
  const trimmed = safeTrim(choiceText);
  if (!trimmed) {
    return 'neutral';
  }

  try {
    const prompt = buildPrompt(trimmed);
    const response = await aiClient.generateContent(prompt);

    if (!response?.content) {
      return 'neutral';
    }

    return parseInferenceResponse(response.content);
  } catch (error) {
    logger.warn('Choice type inference failed - falling back to neutral', error);
    return 'neutral';
  }
}

function buildPrompt(choiceText: string): string {
  return `You are an RPG narrative analyzer. Categorize the player's choice into exactly one of the following categories:
- diplomatic: Seeking peaceful resolution, negotiating, de-escalating, talking it out, or persuading.
- aggressive: Direct confrontation, combat, threats, intimidation, violence, or force.
- stealthy: Sneaking, deceiving, covert action, subterfuge, hiding, or evading notice.
- helpful: Altruistic assistance, aiding others, generosity, self-sacrifice, or cooperation.
- selfish: Prioritizing personal gain, self-preservation, greed, betrayal, or refusing to help.
- neutral: Observational, passive, routine, ambiguous, or balanced choices.

PLAYER CHOICE:
"${choiceText}"

Respond with ONLY a JSON block in this exact format:
\`\`\`json
{
  "choiceType": "diplomatic"
}
\`\`\`

The choiceType MUST be one of: diplomatic, aggressive, stealthy, helpful, selfish, neutral.`;
}

function parseInferenceResponse(content: string): ChoiceTypePreference {
  const fenced = extractFencedJson(content);
  const jsonStr = fenced ?? extractJsonObject(stripMarkdownFences(content));
  if (!jsonStr) {
    return 'neutral';
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return 'neutral';
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return 'neutral';
  }

  const rawType = (parsed as { choiceType?: unknown }).choiceType;
  if (typeof rawType === 'string') {
    const normalized = rawType.toLowerCase().trim() as ChoiceTypePreference;
    if (VALID_CHOICE_TYPES.has(normalized)) {
      return normalized;
    }
  }

  return 'neutral';
}
