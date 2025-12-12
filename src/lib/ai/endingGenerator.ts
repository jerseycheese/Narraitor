// src/lib/ai/endingGenerator.ts

import { createDefaultGeminiClient } from './defaultGeminiClient';
import { buildEndingContext } from './contextManager';
import { endingTemplate, prepareEndingTemplateVariables } from '../promptTemplates/templates/endingTemplates';
import { logger } from '../utils/logger';
import type {
  EndingGenerationRequest,
  EndingGenerationResult,
  EndingTone,
  NarrativeSegment
} from '../../types/narrative.types';
import type { JournalEntry } from '../../types/journal.types';

class EndingGenerator {
  private maxRetries = 2;
  private retryDelay = 1000;

  async generateEnding(request: EndingGenerationRequest): Promise<EndingGenerationResult> {
    try {
      logger.debug('Generating story ending', { request });

      // Build context for ending generation
      const context = await buildEndingContext(request);
      
      // Prepare template variables
      const recentNarrative = this.extractRecentNarrative(context.narrativeSegments);
      const journalSummary = this.extractJournalSummary(context.journalEntries);
      
      // Transform character to match template expectations
      const characterForTemplate = {
        name: context.character.name,
        class: 'Adventurer', // Default class since it's not in the interface
        level: 1, // Default level since it's not in the character interface
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
        request.desiredTone
      );

      // Render the template with variables
      const renderedPrompt = this.renderTemplate(endingTemplate.content, templateVariables);

      // Add custom prompt if provided
      let finalPrompt = request.customPrompt
        ? `${renderedPrompt}\n\nAdditional instruction: ${request.customPrompt}`
        : renderedPrompt;

      // Add JSON-only instruction to ensure clean response
      finalPrompt += '\n\nIMPORTANT: Return ONLY valid JSON with no additional text, markdown formatting, or commentary. The response must be parseable JSON.';

      // Generate with retries
      let lastError: Error | null = null;
      for (let i = 0; i <= this.maxRetries; i++) {
        try {
          const client = createDefaultGeminiClient();
          const response = await client.generateContent(finalPrompt);
          const result = this.parseResponse(response.content);
          
          // Calculate play time if session data available
          if (context.sessionStartTime) {
            result.playTime = Math.floor((Date.now() - context.sessionStartTime.getTime()) / 1000);
          }

          // Token usage tracking could be added here if needed

          logger.debug('Story ending generated successfully', { 
            tone: result.tone,
            achievementCount: result.achievements.length 
          });

          return result;
        } catch (error) {
          lastError = error as Error;
          logger.warn(`Ending generation attempt ${i + 1} failed`, { error });
          
          if (i < this.maxRetries) {
            await this.delay(this.retryDelay * (i + 1));
          }
        }
      }

      throw new Error(`Failed to create ending after ${this.maxRetries + 1} attempts: ${lastError?.message}`);
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

  private extractRecentNarrative(segments: NarrativeSegment[]): string[] {
    // Get the last 5-10 segments for context
    const recentSegments = segments
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return recentSegments.map(segment => {
      const prefix = segment.type === 'dialogue' ? 'Dialogue: ' : '';
      return prefix + segment.content;
    });
  }

  private extractJournalSummary(entries?: JournalEntry[]): string[] {
    if (!entries || entries.length === 0) return [];

    // Get important journal entries (use significance instead of importance)
    const importantEntries = entries
      .filter(entry => entry.significance === 'major' || entry.type === 'achievement')
      .slice(0, 5);

    return importantEntries.map(entry => entry.content);
  }


  private renderTemplate(template: string, variables: Record<string, string | number>): string {
    // Simple template rendering (replace with proper template engine if needed)
    let rendered = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    // Handle conditionals
    rendered = rendered.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (_, variable, content) => {
      return variables[variable] ? content : '';
    });

    return rendered;
  }

  private parseResponse(response: string): EndingGenerationResult {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      cleanResponse = cleanResponse.replace(/^```json\s*/i, '').replace(/\s*```$/, '');

      // Try to parse the entire response as JSON first
      try {
        const parsed = JSON.parse(cleanResponse);
        return this.validateAndCleanParsedResult(parsed);
      } catch {
        // If that fails, try to extract JSON with more precise regex
        // Match from first { to last } with proper nesting
        const jsonMatch = this.extractJsonFromText(cleanResponse);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch);
          return this.validateAndCleanParsedResult(parsed);
        }
      }

      throw new Error('No valid JSON found in response');
    } catch (error) {
      logger.error('Failed to parse ending response', {
        error,
        response: response.substring(0, 200) + '...' // Log only first 200 chars
      });

      // Fallback: try to extract content from response
      return this.extractFromPlainText(response);
    }
  }

  private extractJsonFromText(text: string): string | null {
    // Find the first { and last } to handle nested objects properly
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    return text.substring(firstBrace, lastBrace + 1);
  }

  private validateAndCleanParsedResult(parsed: unknown): EndingGenerationResult {
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Parsed result is not an object');
    }

    const data = parsed as Record<string, unknown>;

    // Validate required fields
    if (!data.epilogue || !data.characterLegacy || !data.worldImpact) {
      throw new Error('Missing required fields in response');
    }

    // Validate and clean the tone value
    const validTones: EndingTone[] = ['triumphant', 'mysterious', 'tragic', 'hopeful'];
    let cleanTone: EndingTone = 'hopeful'; // default

    if (data.tone && typeof data.tone === 'string') {
      const toneString = data.tone.toLowerCase().trim();
      // Check if the tone contains any of the valid tones
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

  private extractFromPlainText(response: string): EndingGenerationResult {
    // Basic extraction if JSON parsing fails
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const endingGenerator = new EndingGenerator();
