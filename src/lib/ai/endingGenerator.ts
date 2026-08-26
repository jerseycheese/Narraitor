// src/lib/ai/endingGenerator.ts

import { createDefaultGeminiClient } from './defaultGeminiClient';
import { buildEndingContext } from './contextManager';
import { stripMarkdownFences, extractJsonObject } from './parseJSON';
import { endingTemplate, prepareEndingTemplateVariables } from '../promptTemplates/templates/endingTemplates';
import { logger } from '../utils/logger';
import type {
  EndingGenerationRequest,
  EndingGenerationResult,
  EndingTone,
  NarrativeSegment
} from '../../types/narrative.types';
import type { JournalEntry } from '../../types/journal.types';
import type { ProviderCredential } from './providers/types';

function extractRecentNarrative(segments: NarrativeSegment[]): string[] {
  const recentSegments = segments
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-10);

  return recentSegments.map(segment => {
    const prefix = segment.type === 'dialogue' ? 'Dialogue: ' : '';
    return prefix + segment.content;
  });
}

function extractJournalSummary(entries?: JournalEntry[]): string[] {
  if (!entries || entries.length === 0) return [];

  // Rank critical moments above the rest so the story's defining beats survive the
  // top-5 cut. Achievements are peers of 'major' (as the original filter treated
  // them), so a minor-significance achievement still ranks with majors rather than
  // sinking below them.
  const importanceRank = (entry: JournalEntry): number => {
    if (entry.significance === 'critical') return 0;
    if (entry.significance === 'major' || entry.type === 'achievement') return 1;
    return 2;
  };

  const importantEntries = entries
    .filter(entry =>
      entry.significance === 'critical' ||
      entry.significance === 'major' ||
      entry.type === 'achievement'
    )
    .sort((a, b) => importanceRank(a) - importanceRank(b))
    .slice(0, 5);

  return importantEntries.map(entry => entry.content);
}

function renderTemplate(template: string, variables: Record<string, string | number>): string {
  let rendered = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, String(value));
  });

  rendered = rendered.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (_, variable, content) => {
    return variables[variable] ? content : '';
  });

  return rendered;
}

function validateAndCleanParsedResult(parsed: unknown): EndingGenerationResult {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Parsed result is not an object');
  }

  const data = parsed as Record<string, unknown>;

  if (!data.epilogue || !data.characterLegacy || !data.worldImpact) {
    throw new Error('Missing required fields in response');
  }

  const validTones: EndingTone[] = ['triumphant', 'mysterious', 'tragic', 'hopeful'];
  let cleanTone: EndingTone = 'hopeful';

  if (data.tone && typeof data.tone === 'string') {
    const toneString = data.tone.toLowerCase().trim();
    const foundTone = validTones.find(tone => toneString.includes(tone));
    if (foundTone) {
      cleanTone = foundTone;
    }
  }

  return {
    epilogue: String(data.epilogue),
    characterLegacy: String(data.characterLegacy),
    worldImpact: String(data.worldImpact),
    tone: cleanTone,
    achievements: Array.isArray(data.achievements) ? data.achievements.map(String) : [],
    playTime: typeof data.playTime === 'number' ? data.playTime : undefined
  };
}

function extractFromPlainText(response: string): EndingGenerationResult {
  const sections = response.split(/\n\n+/);

  return {
    epilogue: sections[0] || 'The story comes to an end...',
    characterLegacy: sections[1] || 'A hero remembered...',
    worldImpact: sections[2] || 'The world was forever changed...',
    tone: 'hopeful',
    achievements: [],
    playTime: undefined
  };
}

function parseResponse(response: string): EndingGenerationResult {
  try {
    const cleanResponse = stripMarkdownFences(response);

    try {
      const parsed = JSON.parse(cleanResponse);
      return validateAndCleanParsedResult(parsed);
    } catch {
      const jsonMatch = extractJsonObject(cleanResponse);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch);
        return validateAndCleanParsedResult(parsed);
      }
    }

    throw new Error('No valid JSON found in response');
  } catch (error) {
    logger.error('Failed to parse ending response', {
      error,
      response: response.substring(0, 200) + '...'
    });

    return extractFromPlainText(response);
  }
}

export async function generateEnding(
  request: EndingGenerationRequest,
  apiKey?: ProviderCredential | null,
  model?: string | null
): Promise<EndingGenerationResult> {
  try {
    logger.debug('Generating story ending', { request });

    const context = await buildEndingContext(request);

    const recentNarrative = extractRecentNarrative(context.narrativeSegments);
    const journalSummary = extractJournalSummary(context.journalEntries);

    const characterForTemplate = {
      name: context.character.name,
      class: 'Adventurer',
      level: 1,
      background: context.character.background.history,
      personality: context.character.background.personality,
      goals: context.character.background.goals.join(', ')
    };

    const templateVariables = prepareEndingTemplateVariables(
      context.world,
      characterForTemplate,
      request.endingType,
      recentNarrative,
      journalSummary,
      request.customPrompt,
      request.desiredTone,
      request.worldClock
    );

    const renderedPrompt = renderTemplate(endingTemplate.content, templateVariables);

    let finalPrompt = request.customPrompt
      ? `${renderedPrompt}\n\nAdditional instruction: ${request.customPrompt}`
      : renderedPrompt;

    finalPrompt += '\n\nIMPORTANT: Return ONLY valid JSON with no additional text, markdown formatting, or commentary. The response must be parseable JSON.';

    // Retryable API errors are already retried inside GeminiClient
    // (config.maxRetries with backoff) — an outer loop here multiplied the
    // attempts. Parse failures throw straight to the caller, matching how
    // narrativeGenerator and choiceGenerator handle them.
    const client = createDefaultGeminiClient(apiKey, model);
    const response = await client.generateContent(finalPrompt);
    const result = parseResponse(response.content);

    if (context.sessionStartTime) {
      result.playTime = Math.floor((Date.now() - context.sessionStartTime.getTime()) / 1000);
    }

    logger.debug('Story ending generated successfully', {
      tone: result.tone,
      achievementCount: result.achievements.length
    });

    return result;
  } catch (error) {
    logger.error('Failed to create ending', {
      error,
      requestType: request.endingType,
      tone: request.desiredTone,
      characterId: request.characterId,
      worldId: request.worldId
    });
    throw new Error('Failed to create ending: ' + (error as Error).message);
  }
}
