import { GoogleGenAI } from '@google/genai';
import { logger } from '@/lib/utils/logger';
import { getAIConfig, resolveEffectiveGeminiKey } from './config';
import { extractJsonObject } from './parseJSON';

/**
 * Event Significance Validation Result
 */
export interface SignificanceValidationResult {
  isSignificant: boolean;
  reason: string;
}

/**
 * Context for event significance validation
 */
export interface ValidationContext {
  recentNarrative?: string;
  location?: string;
  characterName?: string;
}

/**
 * Validates whether a major event is truly significant enough to warrant checkpoint creation.
 *
 * Uses a lightweight LLM (Gemini Flash) to evaluate semantic significance rather than
 * relying on fragile string matching. This catches non-consequential events like:
 * - Incremental progress ("moving closer", "descending further")
 * - Passive observation ("noticing a sound", "feeling uneasy")
 * - Atmospheric descriptions without plot impact
 *
 * @param majorEvent - The event description to validate
 * @param context - Optional context to help evaluate significance
 * @returns Validation result with isSignificant flag and explanation
 */
export async function validateEventSignificance(
  majorEvent: string,
  context: ValidationContext = {},
  apiKey?: string | null,
  modelOverride?: string | null
): Promise<SignificanceValidationResult> {
  const startTime = Date.now();

  try {
    logger.debug('EventSignificanceValidator', 'Validating major event', {
      majorEvent,
      context,
    });

    // Build the validation prompt
    const prompt = buildValidationPrompt(majorEvent, context);

    // Call Gemini Flash for validation with the player's own key. A player on
    // another provider resolves to no Gemini key at all, and skipping the check
    // is the right answer there — see resolveEffectiveGeminiKey.
    const effectiveKey = resolveEffectiveGeminiKey(apiKey);
    if (!effectiveKey) {
      logger.warn('EventSignificanceValidator', 'GEMINI_API_KEY not found, defaulting to accepting event');
      return {
        isSignificant: true,
        reason: 'Validation skipped: API key not configured',
      };
    }

    const genAI = new GoogleGenAI({ apiKey: effectiveKey });
    const model = modelOverride ?? getAIConfig().modelName;

    const result = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        // These live directly on `config`; the SDK ignores anything it doesn't
        // recognise, so a nested `generationConfig` reaches the model as nothing.
        temperature: 0.1, // Low temperature for consistent classification
        maxOutputTokens: 200, // Short response needed
        // Thinking tokens count against maxOutputTokens, and 200 of them would
        // be spent deliberating instead of answering. This is a yes/no call.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const responseText = result.text ?? '';
    logger.debug('EventSignificanceValidator', 'Raw validation response', {
      responseText,
    });

    // Parse the JSON response
    const validation = parseValidationResponse(responseText);

    const duration = Date.now() - startTime;
    logger.info('EventSignificanceValidator', 'Validation complete', {
      majorEvent,
      isSignificant: validation.isSignificant,
      reason: validation.reason,
      duration,
    });

    return validation;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('EventSignificanceValidator', 'Validation failed, defaulting to accepting event', {
      error,
      majorEvent,
      duration,
    });

    // Fail open: if validation fails, accept the event rather than blocking it
    return {
      isSignificant: true,
      reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Build the validation prompt for the LLM
 */
function buildValidationPrompt(majorEvent: string, context: ValidationContext): string {
  const contextInfo = [];
  if (context.location) contextInfo.push(`Location: ${context.location}`);
  if (context.characterName) contextInfo.push(`Character: ${context.characterName}`);
  if (context.recentNarrative) contextInfo.push(`Recent narrative: ${context.recentNarrative}`);

  const contextSection = contextInfo.length > 0
    ? `\n\nContext:\n${contextInfo.join('\n')}`
    : '';

  return `You are evaluating whether a narrative event is significant enough to create a story checkpoint.

Event to evaluate: "${majorEvent}"${contextSection}

A checkpoint should ONLY be created for CONSEQUENTIAL, PLOT-ADVANCING events that involve:
- Discovery (finding something new/important)
- Decision with consequences (making a choice that changes things)
- Interaction (engaging with characters/objects meaningfully)
- Arrival at significant location (reaching destination, not moving toward it)
- Revelation (learning critical information)
- Transformation (character/world state changes)

DO NOT create checkpoints for:
- Incremental progress ("moving closer", "descending further", "continuing")
- Passive observation ("noticing", "sensing", "perceiving" without discovery)
- Routine movement (walking, stepping, approaching without arrival)
- Atmospheric descriptions (feelings of unease, growing tension)
- Observation without discovery (examining, looking, searching without finding)

Respond ONLY with valid JSON in this exact format:
{
  "isSignificant": true or false,
  "reason": "brief explanation of why this is or isn't significant"
}`;
}

/**
 * Parse the LLM's validation response
 */
function parseValidationResponse(responseText: string): SignificanceValidationResult {
  try {
    // Extract JSON from the response (handle cases where LLM adds extra text)
    const json = extractJsonObject(responseText);
    if (!json) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(json);

    if (typeof parsed.isSignificant !== 'boolean') {
      throw new Error('Invalid response: isSignificant must be boolean');
    }

    if (typeof parsed.reason !== 'string') {
      throw new Error('Invalid response: reason must be string');
    }

    return {
      isSignificant: parsed.isSignificant,
      reason: parsed.reason,
    };
  } catch (error) {
    logger.warn('EventSignificanceValidator', 'Failed to parse validation response', {
      responseText,
      error,
    });

    // If we can't parse the response, default to accepting the event
    return {
      isSignificant: true,
      reason: 'Parse error: Could not parse validation response',
    };
  }
}
