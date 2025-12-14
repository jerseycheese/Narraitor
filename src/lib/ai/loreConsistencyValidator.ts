import { GoogleGenAI } from '@google/genai';
import { logger } from '@/lib/utils/logger';
import type {
  LoreValidationContext,
  LoreValidationResult,
} from '@/types/lore.types';
import { LoreValidationResultSchema } from '@/types/lore.types';

/**
 * Validates AI-generated narrative content against established lore for contradictions.
 *
 * Uses Gemini Flash for semantic contradiction detection across:
 * - Character consistency (personality, background, appearance)
 * - World rule adherence (magic, technology, social structures)
 * - Historical event accuracy (timeline, participants)
 * - Location consistency (geography, features)
 *
 * Follows fail-open architecture: if validation fails, narrative is accepted anyway.
 *
 * @param content - The generated narrative text to validate
 * @param context - Lore context (characters, rules, events, locations)
 * @returns Validation result with contradictions list and severity
 */
export async function validateLoreConsistency(
  content: string,
  context: LoreValidationContext
): Promise<LoreValidationResult> {
  const startTime = Date.now();

  try {
    logger.debug('LoreConsistencyValidator', 'Validating narrative content', {
      contentLength: content.length,
      characterCount: context.characters.length,
      ruleCount: context.worldRules.length,
      eventCount: context.historicalEvents.length,
      locationCount: context.locations.length,
    });

    // Build the validation prompt
    const prompt = buildValidationPrompt(content, context);

    // Call Gemini Flash for validation
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('LoreConsistencyValidator', 'GEMINI_API_KEY not found, accepting narrative');
      return createSkippedValidation();
    }

    const genAI = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.0-flash-exp';

    const result = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent evaluation
          maxOutputTokens: 800, // Increased from 300 to handle multiple contradictions
        },
      },
    });

    const responseText = result.text;
    logger.debug('LoreConsistencyValidator', 'Raw validation response', {
      responseText: responseText.substring(0, 200),
    });

    // Parse the JSON response with Zod validation
    const validation = parseValidationResponse(responseText);

    const duration = Date.now() - startTime;
    logger.info('LoreConsistencyValidator', 'Validation complete', {
      isConsistent: validation.isConsistent,
      severity: validation.severity,
      contradictionCount: validation.contradictions.length,
      duration,
    });

    return {
      ...validation,
      processingTime: duration,
      validated: true,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('LoreConsistencyValidator', 'Validation failed, accepting narrative', {
      error,
      duration,
    });

    // Fail open: if validation fails, accept the narrative
    return createSkippedValidation();
  }
}

/**
 * Build the validation prompt for the LLM
 */
function buildValidationPrompt(content: string, context: LoreValidationContext): string {
  // Format character context
  const characterSection = context.characters.length > 0
    ? `\nCHARACTERS:\n${context.characters.map(c => `
- ${c.name}
  Background: ${c.background}
  Personality: ${c.personality}${c.physicalDescription ? `\n  Appearance: ${c.physicalDescription}` : ''}`).join('\n')}`
    : '';

  // Format world rules
  const rulesSection = context.worldRules.length > 0
    ? `\nWORLD RULES:\n${context.worldRules.map(r => `- ${r.rule}: ${r.description} [${r.importance}]`).join('\n')}`
    : '';

  // Format historical events
  const eventsSection = context.historicalEvents.length > 0
    ? `\nHISTORICAL EVENTS:\n${context.historicalEvents.map(e => `- ${e.description} (${e.timestamp})`).join('\n')}`
    : '';

  // Format locations
  const locationsSection = context.locations.length > 0
    ? `\nLOCATIONS:\n${context.locations.map(l => `- ${l.name} (${l.type}): ${l.description}`).join('\n')}`
    : '';

  // Include recent narrative context if available
  const recentSection = context.recentNarrative
    ? `\nRECENT NARRATIVE CONTEXT:\n${context.recentNarrative}\n`
    : '';

  return `You are a narrative consistency validator. Analyze the following generated narrative for semantic contradictions with established lore.

ESTABLISHED LORE:${characterSection}${rulesSection}${eventsSection}${locationsSection}${recentSection}

NARRATIVE TO VALIDATE:
${content}

VALIDATION TASK:
Check for semantic contradictions between the narrative and established lore. Consider:
1. Character consistency (personality, background, appearance, motivations)
2. World rule adherence (magic systems, technology levels, social structures)
3. Historical event accuracy (timeline, participants, locations)
4. Location consistency (geography, features, accessibility)

IMPORTANT GUIDELINES:
- Allow reasonable character development and growth
- Give benefit of doubt to ambiguous phrasing
- Focus on clear, semantic contradictions, not minor details
- Consider context and narrative coherence
- Truncate narrative excerpts to 100 characters maximum

Respond ONLY with valid JSON in this exact format:
{
  "isConsistent": true or false,
  "contradictions": [
    {
      "category": "character|world-rule|historical-event|location",
      "severity": "minor|moderate|major|breaking",
      "description": "Clear explanation of the contradiction",
      "conflictingLore": "The established lore fact",
      "narrativeExcerpt": "The contradicting part (max 100 chars)"
    }
  ],
  "severity": "none|minor|moderate|major|breaking",
  "confidence": "low|medium|high"
}`;
}

/**
 * Parse the LLM's validation response with Zod schema validation
 * Throws on parse/schema errors to ensure validated:false is set by caller
 */
function parseValidationResponse(responseText: string): Omit<LoreValidationResult, 'processingTime' | 'validated'> {
  // Extract JSON from the response (handle cases where LLM adds extra text)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logger.warn('LoreConsistencyValidator', 'No JSON found in response', {
      responseText: responseText.substring(0, 200),
    });
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate with Zod schema - defensive parsing
  const validationResult = LoreValidationResultSchema.safeParse(parsed);

  if (!validationResult.success) {
    logger.warn('LoreConsistencyValidator', 'Schema validation failed', {
      errors: validationResult.error.errors,
      rawResponse: responseText.substring(0, 200),
    });

    // Don't trust responses that fail schema validation - throw to trigger fail-open
    throw new Error(`Schema validation failed: ${validationResult.error.message}`);
  }

  return validationResult.data;
}

/**
 * Create a validation result for skipped validation
 */
function createSkippedValidation(): LoreValidationResult {
  return {
    isConsistent: true,
    contradictions: [],
    severity: 'none',
    confidence: 'low',
    processingTime: 0,
    validated: false,
  };
}
