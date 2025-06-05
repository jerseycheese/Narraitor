// src/lib/ai/endingGenerator.ts

import { geminiClient } from './geminiClient';
import { contextManager } from './contextManager';
import { promptTemplateManager } from '../promptTemplates/promptTemplateManager';
import { endingTemplate, prepareEndingTemplateVariables } from '../promptTemplates/templates/endingTemplates';
import { logger } from '../utils/logger';
import type {
  EndingGenerationRequest,
  EndingGenerationResult,
  EndingTone,
  NarrativeSegment
} from '../../types/narrative.types';
import type { Character } from '../../types/character.types';
import type { World } from '../../types/world.types';
import type { JournalEntry } from '../../types/journal.types';

export interface EndingContext {
  world: World;
  character: Character;
  narrativeSegments: NarrativeSegment[];
  journalEntries?: JournalEntry[];
  sessionStartTime?: Date;
}

class EndingGenerator {
  private maxRetries = 2;
  private retryDelay = 1000;

  async generateEnding(request: EndingGenerationRequest): Promise<EndingGenerationResult> {
    try {
      logger.debug('Generating story ending', { request });

      // Build context for ending generation
      const context = await contextManager.buildEndingContext(request);
      
      // Prepare template variables
      const recentNarrative = this.extractRecentNarrative(context.narrativeSegments);
      const journalSummary = this.extractJournalSummary(context.journalEntries);
      
      // Transform character to match template expectations
      const characterForTemplate = {
        name: context.character.name,
        class: 'Adventurer', // Default class since it's not in the interface
        level: 1, // Default level since it's not in the interface
        background: context.character.background.history,
        personality: context.character.background.personality,
        goals: context.character.background.goals.join(', ')
      };

      const templateVariables = prepareEndingTemplateVariables(
        context.world,
        characterForTemplate,
        request.endingType,
        request.desiredTone || this.determineAutoTone(context),
        recentNarrative,
        journalSummary,
        request.customPrompt
      );

      // Register the ending template if not already registered
      if (!promptTemplateManager.getTemplate('ending')) {
        promptTemplateManager.addTemplate(endingTemplate);
      }
      
      // Get the prompt template
      const promptTemplate = promptTemplateManager.getTemplate('ending');
      if (!promptTemplate) {
        throw new Error('Ending template not found');
      }
      
      const renderedPrompt = this.renderTemplate(promptTemplate.content, templateVariables);

      // Add custom prompt if provided
      const finalPrompt = request.customPrompt 
        ? `${renderedPrompt}\n\nAdditional instruction: ${request.customPrompt}`
        : renderedPrompt;

      // Generate with retries
      let lastError: Error | null = null;
      for (let i = 0; i <= this.maxRetries; i++) {
        try {
          const response = await geminiClient.generateContent(finalPrompt);
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

      throw new Error(`Failed to generate ending after ${this.maxRetries + 1} attempts: ${lastError?.message}`);
    } catch (error) {
      logger.error('Failed to generate ending', { error });
      throw new Error('Failed to generate ending: ' + (error as Error).message);
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

  private determineAutoTone(context: EndingContext): EndingTone {
    // Analyze recent narrative to determine appropriate tone
    const recentMoods = context.narrativeSegments
      .slice(0, 5)
      .map(seg => seg.metadata.mood)
      .filter(Boolean);

    if (recentMoods.includes('action') || recentMoods.includes('tense')) {
      return 'triumphant';
    }
    if (recentMoods.includes('emotional')) {
      return 'bittersweet';
    }
    if (recentMoods.includes('mysterious')) {
      return 'mysterious';
    }
    
    return 'hopeful'; // Default tone
  }

  private renderTemplate(template: string, variables: Record<string, string | number>): string {
    // Simple template rendering (replace with proper template engine if needed)
    let rendered = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    // Handle conditionals
    rendered = rendered.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
      return variables[variable] ? content : '';
    });

    return rendered;
  }

  private parseResponse(response: string): EndingGenerationResult {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!parsed.epilogue || !parsed.characterLegacy || !parsed.worldImpact) {
          throw new Error('Missing required fields in response');
        }

        return {
          epilogue: parsed.epilogue,
          characterLegacy: parsed.characterLegacy,
          worldImpact: parsed.worldImpact,
          tone: parsed.tone || 'hopeful',
          achievements: parsed.achievements || [],
          playTime: parsed.playTime
        };
      }

      throw new Error('No valid JSON found in response');
    } catch (error) {
      logger.error('Failed to parse ending response', { error, response });
      
      // Fallback: try to extract content from response
      return this.extractFromPlainText(response);
    }
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